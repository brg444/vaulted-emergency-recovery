import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
const wallet = resolve(process.env.WALLET_ROOT || '../wallet')
if (!existsSync(resolve(wallet, 'tools/light-emergency/build.mjs'))) throw new Error('Set WALLET_ROOT to the Vaulted wallet checkout')
const result = Bun.spawnSync(['node', 'tools/light-emergency/build.mjs'], { cwd: wallet, env: { ...process.env, LIGHT_RECOVERY_OUTPUT: resolve(import.meta.dir, '../light') }, stdout: 'inherit', stderr: 'inherit' })
if (result.exitCode) process.exit(result.exitCode)
