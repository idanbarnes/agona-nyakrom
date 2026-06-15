import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const WORKSPACES = ['public-frontend', 'admin-frontend', 'backend']
const NPM_COMMAND = process.platform === 'win32' ? 'npm.cmd' : 'npm'

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

for (const workspace of WORKSPACES) {
  await run(NPM_COMMAND, ['install'], path.join(ROOT_DIR, workspace))
}
