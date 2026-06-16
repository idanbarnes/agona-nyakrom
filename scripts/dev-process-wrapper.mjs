import { spawn } from 'node:child_process'
import process from 'node:process'

const [, , expectedParentPidArg, cwd, command, ...args] = process.argv
const expectedParentPid = Number(expectedParentPidArg)

if (!expectedParentPid || !cwd || !command) {
  throw new Error('Usage: node dev-process-wrapper.mjs <parentPid> <cwd> <command> [...args]')
}

let shuttingDown = false

function killTree(pid) {
  if (!pid) {
    return Promise.resolve()
  }

  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(pid), '/t', '/f'], {
        stdio: 'ignore',
      })
      killer.on('exit', () => resolve())
      killer.on('error', () => resolve())
    })
  }

  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    return Promise.resolve()
  }

  return new Promise((resolve) => setTimeout(resolve, 500))
}

const child = spawn(command, args, {
  cwd,
  detached: process.platform !== 'win32',
  stdio: 'inherit',
})

async function shutdown(code = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  await killTree(child.pid)
  process.exit(code)
}

const parentWatch = setInterval(() => {
  if (process.ppid !== expectedParentPid) {
    shutdown(0)
  }
}, 1000)

parentWatch.unref()

child.on('exit', (code, signal) => {
  clearInterval(parentWatch)

  if (shuttingDown) {
    process.exit(code ?? 0)
    return
  }

  if (signal) {
    process.exit(1)
    return
  }

  process.exit(code ?? 0)
})

child.on('error', async () => {
  clearInterval(parentWatch)
  await shutdown(1)
})

process.on('SIGINT', () => {
  shutdown(0)
})

process.on('SIGTERM', () => {
  shutdown(0)
})

process.on('disconnect', () => {
  shutdown(0)
})
