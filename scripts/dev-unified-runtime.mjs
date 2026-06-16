import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const LOCAL_API_URL = 'http://localhost:5000'
const LOCAL_PUBLIC_URL = 'http://localhost:5174'
const LOCAL_ADMIN_URL = 'http://localhost:5173'
const NODE_COMMAND = process.execPath
const BACKEND_DIR = path.join(ROOT_DIR, 'backend')
const PUBLIC_DIR = path.join(ROOT_DIR, 'public-frontend')
const ADMIN_DIR = path.join(ROOT_DIR, 'admin-frontend')
const PROCESS_WRAPPER_SCRIPT = path.join(ROOT_DIR, 'scripts', 'dev-process-wrapper.mjs')

const processes = []
let shuttingDown = false
let exitCode = 0

function prefixStream(stream, prefix) {
  if (!stream) {
    return
  }

  const rl = readline.createInterface({ input: stream })
  rl.on('line', (line) => {
    console.log(`[${prefix}] ${line}`)
  })
}

function spawnProcess(name, cwd, args, env = process.env) {
  const child = spawn(
    NODE_COMMAND,
    [PROCESS_WRAPPER_SCRIPT, String(process.pid), cwd, NODE_COMMAND, ...args],
    {
      cwd,
      env,
      detached: process.platform !== 'win32',
      stdio: ['inherit', 'pipe', 'pipe'],
    }
  )

  prefixStream(child.stdout, name)
  prefixStream(child.stderr, name)

  const record = { child, name }
  processes.push(record)
  return record
}

function spawnDirectProcess(name, cwd, args, env = process.env) {
  const child = spawn(NODE_COMMAND, args, {
    cwd,
    env,
    detached: process.platform !== 'win32',
    stdio: ['inherit', 'pipe', 'pipe'],
  })

  prefixStream(child.stdout, name)
  prefixStream(child.stderr, name)

  const record = { child, name }
  processes.push(record)
  return record
}

async function killProcessTree(pid) {
  if (!pid) {
    return
  }

  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(pid), '/t', '/f'], {
        stdio: 'ignore',
      })
      killer.on('exit', () => resolve())
      killer.on('error', () => resolve())
    })
    return
  }

  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    return
  }

  await new Promise((resolve) => setTimeout(resolve, 500))
}

async function shutdown(code = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  exitCode = exitCode || code

  await Promise.allSettled(
    processes.map(({ child }) => killProcessTree(child.pid))
  )

  process.exit(exitCode)
}

function assertFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`)
  }
}

function runToCompletion(name, cwd, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const { child } = spawnDirectProcess(name, cwd, args, env)

    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`[${name}] exited from signal ${signal}`))
        return
      }

      if (code !== 0) {
        reject(new Error(`[${name}] exited with code ${code}`))
        return
      }

      resolve()
    })

    child.on('error', reject)
  })
}

function buildBackendEnv() {
  return {
    ...process.env,
    PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL || LOCAL_PUBLIC_URL,
    ADMIN_SITE_URL: process.env.ADMIN_SITE_URL || LOCAL_ADMIN_URL,
    PUBLIC_ASSET_BASE_URL:
      process.env.PUBLIC_ASSET_BASE_URL || LOCAL_API_URL,
  }
}

const BACKEND_MIGRATE_SCRIPT = path.join(
  BACKEND_DIR,
  'node_modules',
  'knex',
  'bin',
  'cli.js'
)
const BACKEND_SERVER_SCRIPT = path.join(BACKEND_DIR, 'server.js')
const PUBLIC_VITE_SCRIPT = path.join(
  PUBLIC_DIR,
  'node_modules',
  'vite',
  'bin',
  'vite.js'
)
const ADMIN_VITE_SCRIPT = path.join(
  ADMIN_DIR,
  'node_modules',
  'vite',
  'bin',
  'vite.js'
)

assertFileExists(BACKEND_MIGRATE_SCRIPT)
assertFileExists(BACKEND_SERVER_SCRIPT)
assertFileExists(PUBLIC_VITE_SCRIPT)
assertFileExists(ADMIN_VITE_SCRIPT)
assertFileExists(PROCESS_WRAPPER_SCRIPT)

const backendEnv = buildBackendEnv()

const admin = spawnProcess('admin', ADMIN_DIR, [ADMIN_VITE_SCRIPT])
const publicFrontend = spawnProcess('public', PUBLIC_DIR, [PUBLIC_VITE_SCRIPT])

await runToCompletion(
  'backend:migrate',
  BACKEND_DIR,
  [BACKEND_MIGRATE_SCRIPT, '--knexfile', 'knexfile.js', 'migrate:latest'],
  backendEnv
)

const backend = spawnProcess('backend', BACKEND_DIR, [BACKEND_SERVER_SCRIPT], backendEnv)

for (const { child, name } of [backend, admin, publicFrontend]) {
  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return
    }

    if (signal) {
      console.error(`[${name}] exited from signal ${signal}`)
      shutdown(1)
      return
    }

    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`)
      shutdown(code || 1)
      return
    }

    console.log(`[${name}] exited`)
    shutdown(0)
  })

  child.on('error', (error) => {
    if (shuttingDown) {
      return
    }

    console.error(`[${name}] failed to start: ${error.message}`)
    shutdown(1)
  })
}

process.on('SIGINT', () => {
  shutdown(0)
})

process.on('SIGTERM', () => {
  shutdown(0)
})
