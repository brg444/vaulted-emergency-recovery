import { isConnectorTemplate } from './connector'
import { CONNECTOR_KIT_NAME, connectorRecoveryDescriptor } from './connectorEnrollmentCore'
import { PROGRAM_CSV, PROGRAM_SCHEMA, familyKeysFor, isSavingsTemplate } from './constants'
import { hashVaultProgramDescriptor, validateVaultProgramDescriptor, type VaultProgramDescriptor } from './descriptor'
import type { ProtectionTier } from '../protectionTier'
import { isSupportedVaultNetwork, type VaultNetwork } from '../constants'
import { requireLowerHex } from '../hex'
import { KEK_HKDF_INFO_UTF8, PRF_SALT_UTF8 } from '../prfEnvelope'
import type { BoardingDescriptor } from '../types'

export const RECOVERY_KIT_NAME = 'arkade-recovery-kit'
export const RECOVERY_KIT_VERSION_V3 = 3
export const RECOVERY_KIT_VERSION = 4

export interface KitUnlock {
  prfSalt: typeof PRF_SALT_UTF8
  kekInfo: typeof KEK_HKDF_INFO_UTF8
  credId: string
  webauthnP256: string
  nonce: string
  ciphertext: string
}

export interface KitBoardingPins {
  schema: 'arkade-vault/board-v1'
  program: 'vault-board-v1'
  template: 'vault-board-v1-boarding-vault-and-operator'
  network: VaultNetwork
  boardingPub: string
  recoveryPhonePub: string
  vaultBoardCosignerPub: string
  operatorPub: string
  exitDelay: number
  exitDelayUnit: 'seconds'
  script: string
  address: string
}

export interface RecoveryKit {
  name: typeof RECOVERY_KIT_NAME
  version: 3 | 4
  descriptor: VaultProgramDescriptor
  descriptorHash: string
  spendingPolicyDigest: string
  protectionTier: ProtectionTier
  rpId?: string
  clientOrigin?: string
  unlock?: KitUnlock
  boarding?: KitBoardingPins
}

export interface RecoveryKitEmergency {
  rpId: string
  clientOrigin: string
  unlock: KitUnlock
  boarding?: KitBoardingPins
}

export interface RecoveryKitReport {
  vaultId: string
  hash: string
  trees: { role: string; address: string; delay?: number; guardians?: readonly string[] }[]
  warnings: string[]
}

const UNLOCK_KEYS = ['prfSalt', 'kekInfo', 'credId', 'webauthnP256', 'nonce', 'ciphertext'] as const
const BOARDING_KEYS = [
  'schema',
  'program',
  'template',
  'network',
  'boardingPub',
  'recoveryPhonePub',
  'vaultBoardCosignerPub',
  'operatorPub',
  'exitDelay',
  'exitDelayUnit',
  'script',
  'address',
] as const

function requireExactKeys(value: object, allowed: readonly string[], label: string) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`Recovery Kit ${label} has an unknown field`)
  }
}

function parseHostname(value: unknown, label: string): string {
  const host = String(value || '')
    .trim()
    .toLowerCase()
  if (!host || host.includes('/') || host.includes(':') || host.includes(' ')) {
    throw new Error(`Recovery Kit ${label} is not a hostname`)
  }
  return host
}

function parseOrigin(value: unknown): string {
  const raw = String(value || '').trim()
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('Recovery Kit origin is not a valid URL')
  }
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
    throw new Error('Recovery Kit origin must be https')
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new Error('Recovery Kit origin must contain only scheme and host')
  }
  return `${parsed.protocol}//${parsed.host.toLowerCase()}`
}

export function parseKitUnlock(raw: unknown): KitUnlock {
  if (!raw || typeof raw !== 'object') throw new Error('Recovery Kit is missing the unlock envelope')
  requireExactKeys(raw, UNLOCK_KEYS, 'unlock')
  const rec = raw as Record<string, unknown>
  if (rec.prfSalt !== PRF_SALT_UTF8 || rec.kekInfo !== KEK_HKDF_INFO_UTF8) {
    throw new Error('Recovery Kit unlock constants do not match this wallet')
  }
  const credId = requireLowerHex(String(rec.credId || ''), 'credential id')
  if (credId.length < 2 || credId.length > 256) throw new Error('credential id must be 1..128 bytes')
  return {
    prfSalt: PRF_SALT_UTF8,
    kekInfo: KEK_HKDF_INFO_UTF8,
    credId,
    webauthnP256: requireLowerHex(String(rec.webauthnP256 || ''), 'webauthn P-256', 33),
    nonce: requireLowerHex(String(rec.nonce || ''), 'envelope nonce', 12),
    ciphertext: requireLowerHex(String(rec.ciphertext || ''), 'envelope ciphertext', 48),
  }
}

export function parseKitBoardingPins(raw: unknown): KitBoardingPins {
  if (!raw || typeof raw !== 'object') throw new Error('Recovery Kit boarding pins are missing')
  requireExactKeys(raw, BOARDING_KEYS, 'boarding')
  const rec = raw as Record<string, unknown>
  if (rec.schema !== 'arkade-vault/board-v1' || rec.program !== 'vault-board-v1') {
    throw new Error('Recovery Kit boarding program does not match this wallet')
  }
  if (rec.template !== 'vault-board-v1-boarding-vault-and-operator' || rec.exitDelayUnit !== 'seconds') {
    throw new Error('Recovery Kit boarding template does not match this wallet')
  }
  if (!isSupportedVaultNetwork(rec.network)) throw new Error('Recovery Kit boarding network is unsupported')
  const exitDelay = Number(rec.exitDelay)
  if (!Number.isInteger(exitDelay) || exitDelay <= 0) throw new Error('Recovery Kit boarding delay is invalid')
  return {
    schema: 'arkade-vault/board-v1',
    program: 'vault-board-v1',
    template: 'vault-board-v1-boarding-vault-and-operator',
    network: rec.network,
    boardingPub: requireLowerHex(String(rec.boardingPub || ''), 'boarding pub', 33),
    recoveryPhonePub: requireLowerHex(String(rec.recoveryPhonePub || ''), 'boarding recovery pub', 33),
    vaultBoardCosignerPub: requireLowerHex(String(rec.vaultBoardCosignerPub || ''), 'vault board cosigner', 33),
    operatorPub: requireLowerHex(String(rec.operatorPub || ''), 'boarding operator pub', 33),
    exitDelay,
    exitDelayUnit: 'seconds',
    script: requireLowerHex(String(rec.script || ''), 'boarding script'),
    address: String(rec.address || '').trim(),
  }
}

export function unlockFromEnrollment(enrollment: {
  credId: string
  webauthnP256: string
  nonce: string
  ciphertext: string
}): KitUnlock {
  return parseKitUnlock({
    prfSalt: PRF_SALT_UTF8,
    kekInfo: KEK_HKDF_INFO_UTF8,
    credId: enrollment.credId,
    webauthnP256: enrollment.webauthnP256,
    nonce: enrollment.nonce,
    ciphertext: enrollment.ciphertext,
  })
}

export function boardingPinsFromDescriptor(boarding: BoardingDescriptor): KitBoardingPins {
  return parseKitBoardingPins({
    ...boarding,
    network: boarding.network,
  })
}

export function kitHasUnlock(kit: RecoveryKit): kit is RecoveryKit & { unlock: KitUnlock; rpId: string; clientOrigin: string } {
  return kit.version === 4 && Boolean(kit.unlock && kit.rpId && kit.clientOrigin)
}

export function enrollmentSecretsFromKit(kit: RecoveryKit) {
  if (!kitHasUnlock(kit)) throw new Error('This Recovery Kit cannot unlock without Vaulted')
  return {
    vaultId: kit.descriptor.vaultId,
    credId: kit.unlock.credId,
    webauthnP256: kit.unlock.webauthnP256,
    phoneDirectP256: kit.descriptor.keys.phoneDirectP256,
    phoneBip340Pub: kit.descriptor.keys.phoneBip340,
    nonce: kit.unlock.nonce,
    ciphertext: kit.unlock.ciphertext,
  }
}

export function buildRecoveryKit(descriptor: VaultProgramDescriptor, emergency?: RecoveryKitEmergency): RecoveryKit {
  const d = validateVaultProgramDescriptor(descriptor)
  const publicKit: RecoveryKit = {
    name: RECOVERY_KIT_NAME,
    version: RECOVERY_KIT_VERSION_V3,
    descriptor: d,
    descriptorHash: hashVaultProgramDescriptor(d),
    spendingPolicyDigest: d.policy.digest,
    protectionTier: d.protectionTier,
  }
  if (!emergency) return publicKit
  const unlock = parseKitUnlock(emergency.unlock)
  const rpId = parseHostname(emergency.rpId, 'RP ID')
  const clientOrigin = parseOrigin(emergency.clientOrigin)
  if (new URL(clientOrigin).hostname !== rpId && rpId !== 'localhost') {
    throw new Error('Recovery Kit origin host must equal the RP ID')
  }
  return {
    ...publicKit,
    version: RECOVERY_KIT_VERSION,
    rpId,
    clientOrigin,
    unlock,
    ...(emergency.boarding ? { boarding: parseKitBoardingPins(emergency.boarding) } : {}),
  }
}

export function parseRecoveryKit(raw: unknown): RecoveryKit {
  if (!raw || typeof raw !== 'object') throw new Error('not a Recovery Kit')
  if (raw && typeof raw === 'object' && 'name' in raw && raw.name === CONNECTOR_KIT_NAME)
    return buildRecoveryKit(connectorRecoveryDescriptor(raw))
  const kit = raw as RecoveryKit
  if (kit.name !== RECOVERY_KIT_NAME) throw new Error('not a Recovery Kit')
  if (kit.version !== RECOVERY_KIT_VERSION_V3 && kit.version !== RECOVERY_KIT_VERSION) {
    throw new Error('unsupported Recovery Kit version')
  }
  const built = buildRecoveryKit(kit.descriptor)
  if (kit.descriptorHash && kit.descriptorHash !== built.descriptorHash) {
    throw new Error('Recovery Kit hash does not match the rebuilt descriptor')
  }
  if (kit.spendingPolicyDigest !== built.spendingPolicyDigest) {
    throw new Error('Recovery Kit spending policy digest does not match the rebuilt descriptor')
  }
  if (kit.protectionTier !== built.protectionTier) {
    throw new Error('Recovery Kit protection tier does not match the rebuilt descriptor')
  }
  if (kit.version === RECOVERY_KIT_VERSION_V3) return built
  return buildRecoveryKit(kit.descriptor, {
    rpId: String(kit.rpId || ''),
    clientOrigin: String(kit.clientOrigin || ''),
    unlock: parseKitUnlock(kit.unlock),
    boarding: kit.boarding ? parseKitBoardingPins(kit.boarding) : undefined,
  })
}

export function inspectRecoveryKit(kit: RecoveryKit): RecoveryKitReport {
  const parsed = parseRecoveryKit(kit)
  const d = parsed.descriptor
  const familyKeys = familyKeysFor(Boolean(d.keys.recovery))
  const trees = [
    { role: 'savings', address: d.savings.address },
    ...familyKeys.map((key) => ({
      role: `pending-${key}`,
      address: d.pending[key].address,
      delay: d.pending[key].delay,
    })),
    ...familyKeys.map((key) => ({
      role: `quarantine-${key}`,
      address: d.quarantine[key].address,
      guardians: d.quarantine[key].guardians,
    })),
  ]
  return {
    vaultId: d.vaultId,
    hash: parsed.descriptorHash,
    trees,
    warnings: [
      kitHasUnlock(parsed)
        ? 'This file can unlock the phone key on the enrolled website name without Vaulted.'
        : 'This file is a public map only. It cannot unlock the phone key if Vaulted is gone.',
      isConnectorTemplate(d.templateVersion)
        ? 'A new connector Savings payment needs its existing service approvals and hardware signature.'
        : 'Normal Savings can be recovered with the phone and hardware keys without either service.',
      'Starting a one-key delayed recovery still requires both recovery services.',
      'Pending cancellation requires the exact remaining keys or service approvals in the saved script.',
      'A mature Pending recovery claim can pay any destination.',
      `Delays are ${PROGRAM_CSV.hardware}, ${PROGRAM_CSV.phone}, and ${PROGRAM_CSV.recovery} blocks. Mutinynet is much faster than a 10-minute chain.`,
    ],
  }
}

export function assertKitTemplate(d: VaultProgramDescriptor) {
  if (d.schema !== PROGRAM_SCHEMA || (!isSavingsTemplate(d.templateVersion) && !isConnectorTemplate(d.templateVersion))) {
    throw new Error('Recovery Kit does not match the current Vault Program')
  }
}
