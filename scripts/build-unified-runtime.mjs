import fs from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const PUBLIC_DIR = path.join(ROOT_DIR, 'public-frontend')
const ADMIN_DIR = path.join(ROOT_DIR, 'admin-frontend')
const BACKEND_DIST_DIR = path.join(ROOT_DIR, 'backend', 'dist')
const PUBLIC_TARGET_DIR = path.join(BACKEND_DIST_DIR, 'public')
const ADMIN_TARGET_DIR = path.join(BACKEND_DIST_DIR, 'admin')
const NPM_COMMAND = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const BACKEND_HEALTH_URL = 'http://127.0.0.1:5000/api/health'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function run(command, args, cwd, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: 'inherit',
      shell: true,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} failed in ${cwd} with exit code ${code}`))
    })

    child.on('error', reject)
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

async function waitForEndpoint(url, timeoutMs = 60000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (await isEndpointReachable(url)) {
      return
    }

    await sleep(1000)
  }

  throw new Error(`Timed out waiting for ${url}`)
}

async function ensureBackendRunning() {
  if (await isEndpointReachable(BACKEND_HEALTH_URL)) {
    return async () => {}
  }

  const child = spawn(NPM_COMMAND, ['run', 'start'], {
    cwd: path.join(ROOT_DIR, 'backend'),
    env: process.env,
    stdio: 'inherit',
    shell: true,
  })

  try {
    await waitForEndpoint(BACKEND_HEALTH_URL)
  } catch (error) {
    child.kill()
    throw error
  }

  return async () => {
    child.kill()
    await sleep(500)
  }
}

function copyBuildOutput(sourceDir, targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(targetDir), { recursive: true })
  fs.cpSync(sourceDir, targetDir, { recursive: true })
}

const cleanupBackend = await ensureBackendRunning()

try {
  await run(
    NPM_COMMAND,
    ['run', 'build'],
    PUBLIC_DIR,
    {
      ...process.env,
      PRERENDER_API_BASE_URL: 'http://localhost:5000',
      VITE_API_BASE_URL: '/api',
    }
  )
  await run(
    NPM_COMMAND,
    ['run', 'build'],
    ADMIN_DIR,
    {
      ...process.env,
      VITE_API_BASE_URL: '/api',
      VITE_APP_BASE_PATH: '/admin/',
    }
  )

  copyBuildOutput(path.join(PUBLIC_DIR, 'dist'), PUBLIC_TARGET_DIR)
  copyBuildOutput(path.join(ADMIN_DIR, 'dist'), ADMIN_TARGET_DIR)
} finally {
  await cleanupBackend()
}
