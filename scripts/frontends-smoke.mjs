import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const DEBUG_PORT = 9230
const USER_DATA_DIR = path.join(os.tmpdir(), `agona-frontend-smoke-${Date.now()}`)
const ROOT_DIR = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const IS_WINDOWS = process.platform === 'win32'
const NPM_COMMAND = IS_WINDOWS ? 'npm.cmd' : 'npm'
const BROWSER_CANDIDATES = [
  process.env.BROWSER_BIN,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Unexpected response from ${url}: ${text.slice(0, 200)}`)
  }
}

function resolveBrowserPath() {
  const browserPath = BROWSER_CANDIDATES.find((candidate) => candidate && fs.existsSync(candidate))
  if (!browserPath) {
    throw new Error(
      'No supported browser binary found. Set BROWSER_BIN to Edge or Chrome to run smoke tests.',
    )
  }
  return browserPath
}

function spawnCommand(command, args, options = {}) {
  return spawn(command, args, {
    stdio: 'ignore',
    windowsHide: true,
    ...options,
  })
}

async function isEndpointReachable(url) {
  try {
    const response = await fetch(url)
    return response.ok
  } catch {
    return false
  }
}

async function waitForEndpoint(url, label, timeoutMs = 90000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await isEndpointReachable(url)) {
      return
    }
    await sleep(1000)
  }
  throw new Error(`${label} did not become ready at ${url} within ${timeoutMs / 1000}s.`)
}

function killProcessTree(pid) {
  if (!pid) {
    return Promise.resolve()
  }

  if (!IS_WINDOWS) {
    try {
      process.kill(-pid, 'SIGTERM')
    } catch {
      try {
        process.kill(pid, 'SIGTERM')
      } catch {}
    }
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    killer.on('exit', () => resolve())
    killer.on('error', () => resolve())
  })
}

function getTempLogPath(name) {
  return path.join(os.tmpdir(), `agona-${name}-${Date.now()}.log`)
}

async function ensureServiceRunning({
  label,
  url,
  cwd,
  args,
  env = {},
}) {
  if (await isEndpointReachable(url)) {
    return { started: false, cleanup: async () => {} }
  }

  const logPath = getTempLogPath(label.toLowerCase().replace(/\s+/g, '-'))
  const logStream = fs.createWriteStream(logPath, { flags: 'a' })
  const child = spawnCommand(NPM_COMMAND, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout?.pipe(logStream)
  child.stderr?.pipe(logStream)

  try {
    await waitForEndpoint(url, label)
  } catch (error) {
    await killProcessTree(child.pid)
    logStream.end()
    throw new Error(`${error.message} See log: ${logPath}`)
  }

  return {
    started: true,
    cleanup: async () => {
      await killProcessTree(child.pid)
      logStream.end()
      try {
        fs.rmSync(logPath, { force: true })
      } catch {}
    },
  }
}

class BrowserSession {
  constructor(ws, sessionId) {
    this.ws = ws
    this.sessionId = sessionId
    this.nextId = 1
    this.pending = new Map()
    this.loadResolvers = []
    this.consoleErrors = []
    this.exceptions = []
    this.httpErrors = []
    this.networkFailures = []
    this.dialogs = []

    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)

      if (message.id) {
        const entry = this.pending.get(message.id)
        if (!entry) {
          return
        }

        this.pending.delete(message.id)
        if (message.error) {
          entry.reject(new Error(message.error.message || 'CDP error'))
        } else {
          entry.resolve(message.result || {})
        }
        return
      }

      if (message.sessionId !== this.sessionId) {
        return
      }

      if (message.method === 'Page.loadEventFired') {
        while (this.loadResolvers.length) {
          this.loadResolvers.shift()()
        }
      }

      if (message.method === 'Runtime.consoleAPICalled') {
        if (message.params.type === 'error' || message.params.type === 'assert') {
          const text = (message.params.args || [])
            .map((arg) => arg.value ?? arg.description ?? arg.type)
            .join(' ')
          this.consoleErrors.push(text)
        }
      }

      if (message.method === 'Runtime.exceptionThrown') {
        this.exceptions.push(message.params.exceptionDetails?.text || 'Runtime exception')
      }

      if (message.method === 'Network.responseReceived') {
        const status = message.params.response?.status
        const url = message.params.response?.url || ''
        if (status >= 400 && !url.includes('/@vite') && !url.includes('favicon')) {
          this.httpErrors.push({ status, url })
        }
      }

      if (message.method === 'Network.loadingFailed') {
        const errorText = message.params.errorText || ''
        if (!errorText.includes('ERR_ABORTED')) {
          this.networkFailures.push(errorText)
        }
      }

      if (message.method === 'Page.javascriptDialogOpening') {
        this.dialogs.push(message.params.message)
        this.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {})
      }
    })
  }

  send(method, params = {}) {
    const id = this.nextId++
    this.ws.send(JSON.stringify({ id, method, params, sessionId: this.sessionId }))
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error(`Timeout waiting for ${method}`))
        }
      }, 15000)
    })
  }

  waitForLoad(timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for load event')), timeoutMs)
      this.loadResolvers.push(() => {
        clearTimeout(timer)
        resolve()
      })
    })
  }

  async navigate(url) {
    const load = this.waitForLoad()
    await this.send('Page.navigate', { url })
    await load
    await sleep(700)
  }

  async evaluate(expression, returnByValue = true) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue,
    })
    return returnByValue ? result.result?.value : result.result
  }

  async waitFor(conditionExpr, timeoutMs = 10000) {
    const started = Date.now()
    while (Date.now() - started < timeoutMs) {
      if (await this.evaluate(`Boolean(${conditionExpr})`)) {
        return true
      }
      await sleep(200)
    }
    throw new Error(`Condition not met: ${conditionExpr}`)
  }

  async setViewport(width, height, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
      screenWidth: width,
      screenHeight: height,
    })
  }

  async setInput(selector, value) {
    const ok = await this.evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      if (!el) return false
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')
      descriptor.set.call(el, ${JSON.stringify(value)})
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    })()`)
    if (!ok) {
      throw new Error(`Missing input ${selector}`)
    }
  }

  async click(selector) {
    const ok = await this.evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      if (!el) return false
      el.click()
      return true
    })()`)
    if (!ok) {
      throw new Error(`Missing click target ${selector}`)
    }
    await sleep(300)
  }

  async clickByText(tagName, text) {
    const ok = await this.evaluate(`(() => {
      const items = Array.from(document.querySelectorAll(${JSON.stringify(tagName)}))
      const target = items.find((item) => (item.textContent || '').trim().includes(${JSON.stringify(text)}))
      if (!target) return false
      target.click()
      return true
    })()`)
    if (!ok) {
      throw new Error(`Missing ${tagName} with text ${text}`)
    }
    await sleep(300)
  }

  resetErrors() {
    this.consoleErrors.length = 0
    this.exceptions.length = 0
    this.httpErrors.length = 0
    this.networkFailures.length = 0
    this.dialogs.length = 0
  }

  snapshotErrors() {
    return {
      consoleErrors: [...this.consoleErrors],
      exceptions: [...this.exceptions],
      httpErrors: [...this.httpErrors],
      networkFailures: [...this.networkFailures],
      dialogs: [...this.dialogs],
    }
  }
}

async function startBrowser() {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true })
  const browserPath = resolveBrowserPath()

  const edgeProcess = spawn(
    browserPath,
    [
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--headless=new',
      '--disable-gpu',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  let version = null
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      version = await fetchJson(`http://127.0.0.1:${DEBUG_PORT}/json/version`)
      break
    } catch {
      await sleep(250)
    }
  }

  if (!version?.webSocketDebuggerUrl) {
    edgeProcess.kill()
    throw new Error('Unable to connect to Edge remote debugging endpoint.')
  }

  const ws = new WebSocket(version.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  let nextId = 1
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (!message.id) {
      return
    }

    const entry = pending.get(message.id)
    if (!entry) {
      return
    }

    pending.delete(message.id)
    if (message.error) {
      entry.reject(new Error(message.error.message || 'Browser CDP error'))
    } else {
      entry.resolve(message.result || {})
    }
  })

  const browserSend = (method, params = {}) => {
    const id = nextId++
    ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id)
          reject(new Error(`Timeout waiting for ${method}`))
        }
      }, 15000)
    })
  }

  const { targetId } = await browserSend('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await browserSend('Target.attachToTarget', { targetId, flatten: true })
  const session = new BrowserSession(ws, sessionId)

  await session.send('Page.enable')
  await session.send('Runtime.enable')
  await session.send('Network.enable')
  await session.send('DOM.enable')

  return {
    session,
    close: async () => {
      try {
        ws.close()
      } catch {}
      try {
        edgeProcess.kill()
      } catch {}
      try {
        fs.rmSync(USER_DATA_DIR, { recursive: true, force: true })
      } catch {}
    },
  }
}

async function getAdminToken() {
  const email = process.env.ADMIN_DEFAULT_EMAIL || 'you@example.com'
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'yourpassword'
  const json = await fetchJson('http://localhost:5000/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return json?.data?.token || null
}

async function findLandmarkId(token, name) {
  const json = await fetchJson('http://localhost:5000/api/admin/landmarks', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
  const items = json?.data?.items || json?.data || []
  return items.find((item) => item.name === name)?.id || null
}

async function deleteLandmark(token, id) {
  if (!token || !id) {
    return
  }

  await fetch(`http://localhost:5000/api/admin/landmarks/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
}

async function ensureEndpoint(url, label) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`${label} returned ${response.status}`)
    }
  } catch (error) {
    throw new Error(`${label} is not reachable at ${url}. ${error.message}`)
  }
}

async function runPublicSmoke(session, results) {
  const record = async (name, fn) => {
    session.resetErrors()
    try {
      const details = await fn()
      results.push({ name, status: 'passed', details, errors: session.snapshotErrors() })
    } catch (error) {
      results.push({ name, status: 'failed', error: error.message, errors: session.snapshotErrors() })
    }
  }

  await record('public-routes-and-nav', async () => {
    await session.setViewport(1440, 900, false)
    await session.navigate('http://127.0.0.1:5174/')
    await session.waitFor(`document.body.innerText.includes('Agona Nyakrom')`)
    await session.click('a[href="/news"]')
    await session.waitFor(`location.pathname === '/news'`)
    await session.click('a[href^="/news/"]')
    await session.waitFor(`location.pathname.startsWith('/news/')`)
    await session.evaluate('history.back()')
    await session.waitFor(`location.pathname === '/news'`)
    return { pathname: await session.evaluate('location.pathname') }
  })

  await record('public-dropdown-mobile-contact', async () => {
    await session.setViewport(1440, 900, false)
    await session.navigate('http://127.0.0.1:5174/')
    await session.click('button[aria-controls^="desktop-menu-about-nyakrom"]')
    await session.click('[role="menu"] a[href="/about/leadership-governance"]')
    await session.waitFor(`location.pathname === '/about/leadership-governance'`)
    await session.setViewport(390, 844, true)
    await session.navigate('http://127.0.0.1:5174/')
    await session.click('button[aria-controls="mobile-navigation-dialog"]')
    await session.click('button[aria-controls="mobile-panel-about-nyakrom"]')
    await session.click('#mobile-panel-about-nyakrom a[href="/about/history"]')
    await session.waitFor(`location.pathname === '/about/history'`)
    await session.setViewport(1440, 900, false)
    await session.navigate('http://127.0.0.1:5174/')
    await session.click('a[href="/contact"]')
    await session.waitFor(`location.pathname === '/contact'`)
    return { pathname: await session.evaluate('location.pathname') }
  })
}

async function runAdminSmoke(session, results) {
  const record = async (name, fn) => {
    session.resetErrors()
    try {
      const details = await fn()
      results.push({ name, status: 'passed', details, errors: session.snapshotErrors() })
    } catch (error) {
      results.push({ name, status: 'failed', error: error.message, errors: session.snapshotErrors() })
    }
  }

  const email = process.env.ADMIN_DEFAULT_EMAIL || 'you@example.com'
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'yourpassword'
  const draftName = `Smoke Test Landmark ${Date.now()}`
  const updatedName = `${draftName} Updated`
  let token = null
  let landmarkId = null

  try {
    await record('admin-login-navigation-create-edit-logout', async () => {
      await session.setViewport(1440, 900, false)
      await session.navigate('http://127.0.0.1:5173/dashboard')
      await session.waitFor(`location.pathname === '/login'`)
      await session.setInput('input[name="emailOrUsername"]', email)
      await session.setInput('input[name="password"]', password)
      await session.click('button[type="submit"]')
      await session.waitFor(`location.pathname === '/dashboard'`, 15000)
      token = await session.evaluate(`localStorage.getItem('authToken') || ''`)
      if (!token) {
        throw new Error('Missing auth token after login')
      }
      await session.click('a[href="/admin/news"]')
      await session.waitFor(`location.pathname === '/admin/news'`)
      await session.click('button[aria-expanded]')
      await session.click('a[href="/admin/landmarks"]')
      await session.waitFor(`location.pathname === '/admin/landmarks'`)
      await session.navigate('http://127.0.0.1:5173/admin/landmarks/create')
      await session.waitFor(`document.querySelector('input[name="name"]') && document.body.innerText.includes('Upload')`)
      await session.setInput('input[name="name"]', draftName)
      await session.evaluate(`(() => {
        const textarea = document.querySelector('textarea')
        if (!textarea) return false
        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(textarea), 'value')
        descriptor.set.call(textarea, 'Landmark smoke content')
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        textarea.dispatchEvent(new Event('change', { bubbles: true }))
        return true
      })()`)
      await session.clickByText('button', 'Save as Draft')
      await session.waitFor(`location.pathname === '/admin/landmarks'`, 15000)
      landmarkId = await findLandmarkId(token, draftName)
      if (!landmarkId) {
        throw new Error('Created landmark not found')
      }
      await session.navigate(`http://127.0.0.1:5173/admin/landmarks/edit/${landmarkId}`)
      await session.waitFor(`document.body.innerText.includes('Replace image')`)
      await session.setInput('input[name="name"]', updatedName)
      await session.clickByText('button', 'Save as Draft')
      await session.waitFor(`location.pathname === '/admin/landmarks'`, 15000)
      const updatedId = await findLandmarkId(token, updatedName)
      if (updatedId !== landmarkId) {
        throw new Error('Updated landmark not persisted')
      }
      await session.clickByText('button', 'Logout')
      await session.waitFor(`location.pathname === '/login'`, 15000)
      const hasToken = await session.evaluate(`Boolean(localStorage.getItem('authToken'))`)
      if (hasToken) {
        throw new Error('Auth token remained after logout')
      }
      return { landmarkId, updatedId }
    })
  } finally {
    token = token || (await getAdminToken().catch(() => null))
    if (token && landmarkId) {
      await deleteLandmark(token, landmarkId).catch(() => {})
    }
  }
}

async function main() {
  const target = (process.argv[2] || 'all').toLowerCase()
  if (!['public', 'admin', 'all'].includes(target)) {
    throw new Error('Usage: node scripts/frontends-smoke.mjs [public|admin|all]')
  }

  const cleanups = []
  const registerCleanup = (cleanup) => {
    cleanups.unshift(cleanup)
  }

  const backendService = await ensureServiceRunning({
    label: 'Backend',
    url: 'http://localhost:5000/api/health',
    cwd: path.join(ROOT_DIR, 'backend'),
    args: ['run', 'dev'],
  })
  registerCleanup(backendService.cleanup)

  if (target === 'public' || target === 'all') {
    const publicService = await ensureServiceRunning({
      label: 'Public frontend',
      url: 'http://127.0.0.1:5174/',
      cwd: path.join(ROOT_DIR, 'public-frontend'),
      args: ['run', 'dev'],
    })
    registerCleanup(publicService.cleanup)
  }

  if (target === 'admin' || target === 'all') {
    const adminService = await ensureServiceRunning({
      label: 'Admin frontend',
      url: 'http://127.0.0.1:5173/',
      cwd: path.join(ROOT_DIR, 'admin-frontend'),
      args: ['run', 'dev'],
    })
    registerCleanup(adminService.cleanup)
  }

  const browser = await startBrowser()
  const results = []

  try {
    if (target === 'public' || target === 'all') {
      await runPublicSmoke(browser.session, results)
    }

    if (target === 'admin' || target === 'all') {
      await runAdminSmoke(browser.session, results)
    }
  } finally {
    await browser.close()
    for (const cleanup of cleanups) {
      await cleanup()
    }
  }

  console.log(JSON.stringify({ results }, null, 2))
  if (results.some((result) => result.status === 'failed')) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
