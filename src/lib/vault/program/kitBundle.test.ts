import { describe, expect, test } from 'bun:test'
import { buildVaultProgramDescriptor } from './descriptor'
import { PROGRAM_FIXTURE } from './fixtures'
import { buildRecoveryKit, parseRecoveryKit } from './kit'
import { extractRecoveryKitJson, packRecoveryKit, RECOVERY_GUIDE, recoveryKitArchiveName } from './kitBundle'

const unlock = {
  prfSalt: 'arkade-2fa-vault/prf/v1' as const,
  kekInfo: 'arkade-2fa-vault/kek/v1' as const,
  credId: 'aa',
  webauthnP256: '02' + 'ab'.repeat(32),
  nonce: '11'.repeat(12),
  ciphertext: '22'.repeat(48),
}

describe('Recovery Kit archive', () => {
  test('names the zip with the date, protection, and site', () => {
    const kit = buildRecoveryKit(buildVaultProgramDescriptor(PROGRAM_FIXTURE), {
      rpId: 'rc.getvaulted.xyz',
      clientOrigin: 'https://rc.getvaulted.xyz',
      unlock,
    })
    expect(recoveryKitArchiveName(kit, new Date('2026-09-04T12:00:00.000Z'))).toBe(
      'Vaulted Recovery 2026-09-04 Advanced rc.getvaulted.xyz.zip',
    )
  })

  test('packs the kit with the how-to note and reads the json back', () => {
    const kit = buildRecoveryKit(buildVaultProgramDescriptor(PROGRAM_FIXTURE), {
      rpId: 'rc.getvaulted.xyz',
      clientOrigin: 'https://rc.getvaulted.xyz',
      unlock,
    })
    const packed = packRecoveryKit(kit, new Date('2026-09-04T12:00:00.000Z'))
    const json = extractRecoveryKitJson(packed.bytes)
    expect(parseRecoveryKit(JSON.parse(json)).rpId).toBe('rc.getvaulted.xyz')
    expect(RECOVERY_GUIDE).toMatch(/Keep this note with Recovery Kit.json/)
    expect(RECOVERY_GUIDE).not.toMatch(/version 4/i)
    expect(RECOVERY_GUIDE).not.toMatch(/RP ID/)
    expect(RECOVERY_GUIDE).not.toMatch(/envelope/i)
  })
})
