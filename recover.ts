import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex, hexToBytes } from './src/lib/vault/hex'
import { PRF_SALT, unwrapPhoneSecret } from './src/lib/vault/prfEnvelope'
import { zeroBytes } from './src/lib/vault/ceremony/directauth'
import { extractRecoveryKitJson } from './src/lib/vault/program/kitBundle'
import { kitHasUnlock, parseRecoveryKit, type RecoveryKit } from './src/lib/vault/program/kit'
import { sameBip340Key } from './src/lib/vault/setupPlan'
import { allowPasskey, passkeyGetOptions, prfExtension, prfFrom } from './src/lib/vault/webauthn'

type Step = 'ask' | 'import' | 'review' | 'next'

const fileInput = document.querySelector<HTMLInputElement>('#file')!
const dropBtn = document.querySelector<HTMLButtonElement>('#drop-btn')!
const importScreen = document.querySelector<HTMLElement>('#screen-import')!
const paste = document.querySelector<HTMLTextAreaElement>('#paste')!
const parseError = document.querySelector<HTMLElement>('#parse-error')!
const facts = document.querySelector<HTMLElement>('#facts')!
const nextAction = document.querySelector<HTMLElement>('#next-action')!
const originNote = document.querySelector<HTMLElement>('#origin-note')!
const nextTitle = document.querySelector<HTMLElement>('#next-title')!
const nextCopy = document.querySelector<HTMLElement>('#next-copy')!
const unlockBtn = document.querySelector<HTMLButtonElement>('#unlock')!
const unlockError = document.querySelector<HTMLElement>('#unlock-error')!
const afterUnlock = document.querySelector<HTMLElement>('#after-unlock')!
const savingsAddress = document.querySelector<HTMLInputElement>('#savings-address')!
const copyAddress = document.querySelector<HTMLButtonElement>('#copy-address')!
const laptopHelp = document.querySelector<HTMLDetailsElement>('#laptop-help')!
const steps = document.querySelector<HTMLElement>('#steps')!

const screens: Record<string, HTMLElement> = {
  ask: document.querySelector('#screen-ask')!,
  'app-works': document.querySelector('#screen-app-works')!,
  import: document.querySelector('#screen-import')!,
  review: document.querySelector('#screen-review')!,
  next: document.querySelector('#screen-next')!,
}

let loaded: RecoveryKit | null = null
let step: Step = 'ask'

function show(el: HTMLElement, text?: string) {
  el.hidden = false
  if (text !== undefined) el.textContent = text
}

function hide(el: HTMLElement) {
  el.hidden = true
  if ('value' in el) (el as HTMLInputElement).value = ''
  else el.textContent = ''
}

function hostMatches(kit: RecoveryKit): boolean {
  if (!kit.rpId) return false
  return location.hostname.toLowerCase() === kit.rpId.toLowerCase()
}

function showScreen(id: keyof typeof screens, current: Step = step) {
  for (const [name, node] of Object.entries(screens)) node.hidden = name !== id
  step = current
  for (const mark of steps.querySelectorAll('[data-step]')) {
    const name = mark.getAttribute('data-step') as Step
    mark.classList.toggle('is-current', name === current)
    mark.classList.toggle('is-done', ['ask', 'import', 'review', 'next'].indexOf(name) < ['ask', 'import', 'review', 'next'].indexOf(current))
  }
}

function resetKit() {
  loaded = null
  paste.value = ''
  fileInput.value = ''
  hide(parseError)
  hide(unlockError)
  afterUnlock.hidden = true
  hide(unlockBtn)
  laptopHelp.open = false
  showScreen('import', 'import')
}

function nextSentence(kit: RecoveryKit): { text: string; wait: boolean } {
  if (!kitHasUnlock(kit)) {
    return {
      text: 'This file is a map only. Face ID cannot unlock it here.',
      wait: true,
    }
  }
  if (hostMatches(kit)) {
    return { text: 'Next: unlock with Face ID on this device.', wait: false }
  }
  return {
    text: `This page is using the wrong website name. Continue to open it as ${kit.rpId} — the name you enrolled on.`,
    wait: true,
  }
}

function loadKit(raw: string) {
  hide(parseError)
  hide(unlockError)
  afterUnlock.hidden = true
  try {
    const kit = parseRecoveryKit(JSON.parse(raw))
    loaded = kit
    const action = nextSentence(kit)
    nextAction.textContent = action.text
    nextAction.classList.toggle('is-wait', action.wait)
    const site = kit.rpId || 'not in this file'
    facts.innerHTML = [
      ['Protection', kit.protectionTier === 'advanced' ? 'Advanced' : 'Standard'],
      ['Network', kit.descriptor.network],
      ['Website you enrolled on', site],
      ['Savings address', kit.descriptor.savings.address],
    ]
      .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
      .join('')
    savingsAddress.value = kit.descriptor.savings.address
    showScreen('review', 'review')
  } catch (err) {
    loaded = null
    show(parseError, err instanceof Error ? err.message : 'That file is not a Recovery Kit')
    showScreen('import', 'import')
  }
}

async function loadFile(file: File) {
  loadKit(extractRecoveryKitJson(new Uint8Array(await file.arrayBuffer())))
}

function paintNext() {
  const kit = loaded
  if (!kit) return
  hide(unlockError)
  afterUnlock.hidden = true
  if (!kitHasUnlock(kit)) {
    nextTitle.textContent = 'This file cannot unlock'
    nextCopy.textContent =
      'This file contains public recovery information. Use Recovery in Vaulted with your enrolled passkey, or compatible recovery tools with your keys.'
    originNote.textContent = ''
    hide(unlockBtn)
    laptopHelp.open = false
    showScreen('next', 'next')
    return
  }
  if (hostMatches(kit)) {
    nextTitle.textContent = 'Unlock with Face ID'
    nextCopy.textContent = 'Use the passkey on this phone. Ordinary savings still need your hardware after that.'
    originNote.textContent = ''
    unlockBtn.hidden = false
    unlockBtn.disabled = false
    laptopHelp.open = false
  } else {
    nextTitle.textContent = 'Wrong website name'
    nextCopy.textContent = `Face ID will not run until this page is opened as ${kit.rpId}. That is the website you enrolled on — not a random new app.`
    originNote.textContent = `This page is ${location.host}. Open https://${kit.rpId}/ after pointing that name at this computer.`
    unlockBtn.hidden = false
    unlockBtn.disabled = true
    laptopHelp.open = true
  }
  showScreen('next', 'next')
}

document.querySelector('#ask-yes')!.addEventListener('click', () => {
  showScreen('app-works', 'ask')
})
document.querySelector('#ask-back')!.addEventListener('click', () => {
  showScreen('ask', 'ask')
})
document.querySelector('#ask-no')!.addEventListener('click', () => {
  showScreen('import', 'import')
})
document.querySelector('#review-continue')!.addEventListener('click', paintNext)
document.querySelector('#review-other')!.addEventListener('click', resetKit)
document.querySelector('#next-other')!.addEventListener('click', resetKit)

dropBtn.addEventListener('click', () => fileInput.click())
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]
  if (file) await loadFile(file)
})

;['dragenter', 'dragover'].forEach((name) => {
  importScreen.addEventListener(name, (event) => {
    event.preventDefault()
    dropBtn.classList.add('is-over')
  })
})
;['dragleave', 'drop'].forEach((name) => {
  importScreen.addEventListener(name, (event) => {
    event.preventDefault()
    dropBtn.classList.remove('is-over')
  })
})
importScreen.addEventListener('drop', async (event) => {
  const file = event.dataTransfer?.files?.[0]
  if (file) await loadFile(file)
})

paste.addEventListener('change', () => {
  if (paste.value.trim()) loadKit(paste.value)
})
paste.addEventListener('paste', () => {
  queueMicrotask(() => {
    if (paste.value.trim()) loadKit(paste.value)
  })
})

copyAddress.addEventListener('click', async () => {
  const value = savingsAddress.value
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    copyAddress.textContent = 'Copied'
  } catch {
    savingsAddress.select()
    copyAddress.textContent = 'Select and copy'
  }
})

unlockBtn.addEventListener('click', async () => {
  hide(unlockError)
  afterUnlock.hidden = true
  const kit = loaded
  if (!kit || !kitHasUnlock(kit)) return
  if (!hostMatches(kit)) {
    show(
      unlockError,
      `This page is using the wrong website name. Open it as ${kit.rpId} — the name you enrolled on.`,
    )
    return
  }
  const credId = hexToBytes(kit.unlock.credId)
  try {
    const got = (await navigator.credentials.get({
      publicKey: passkeyGetOptions(
        {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: kit.rpId,
          userVerification: 'required',
          extensions: prfExtension(PRF_SALT, credId),
          allowCredentials: [allowPasskey(credId, 'any')],
        },
        'any',
      ),
    })) as PublicKeyCredential | null
    if (!got) throw new Error('The operation was aborted.')
    const prf = prfFrom(got)
    if (!prf || prf.length !== 32) throw new Error('this passkey did not return its secret on this device')
    let phone: Uint8Array | undefined
    try {
      phone = await unwrapPhoneSecret(prf, kit.unlock.nonce, kit.unlock.ciphertext)
      const pub = bytesToHex(secp256k1.getPublicKey(phone, true))
      if (!sameBip340Key(pub, kit.descriptor.keys.phoneBip340)) {
        throw new Error('unlocked phone key does not match this kit')
      }
      afterUnlock.hidden = false
    } finally {
      zeroBytes(prf, phone as Uint8Array)
    }
  } catch (err) {
    show(unlockError, err instanceof Error ? err.message : 'Could not unlock')
  }
})

showScreen('ask', 'ask')
