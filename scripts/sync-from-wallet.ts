import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')
const pin = JSON.parse(readFileSync(resolve(root, 'WALLET.json'), 'utf8')) as {
  libRoot: string
  libFiles: string[]
}
const wallet = resolve(process.env.WALLET_ROOT || '../arkade-wallet-qg-one-tap')
if (!existsSync(resolve(wallet, 'src/lib/vault/program/kit.ts'))) {
  throw new Error(`WALLET_ROOT does not look like Vaulted: ${wallet}`)
}

for (const file of pin.libFiles) {
  const from = resolve(wallet, pin.libRoot, file)
  const to = resolve(root, pin.libRoot, file)
  if (!existsSync(from)) throw new Error(`missing ${from}`)
  copyFileSync(from, to)
  console.log('synced', file)
}

for (const file of ['index.html', 'recover.css', 'serve.ts']) {
  const from = resolve(wallet, 'tools/offline-recovery', file)
  if (existsSync(from)) {
    copyFileSync(from, resolve(root, file))
    console.log('synced ui', file)
  }
}

const recoverFrom = resolve(wallet, 'tools/offline-recovery/recover.ts')
if (existsSync(recoverFrom)) {
  const text = readFileSync(recoverFrom, 'utf8').replaceAll('../../src/lib/vault/', './src/lib/vault/')
  await Bun.write(resolve(root, 'recover.ts'), text)
  console.log('synced ui recover.ts')
}

console.log(`synced from ${wallet}`)
