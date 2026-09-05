import { describe, expect, test } from 'bun:test'
import { PROGRAM_FIXTURE } from './fixtures'
import { buildVaultProgramDescriptor } from './descriptor'
import { buildRecoveryKit, parseRecoveryKit, inspectRecoveryKit } from './kit'
import { defaultSpendingPolicy } from '../spendingPolicy'

// Bun's emergency page has no wallet build environment: the kit selects its network.
for (const network of ['mainnet', 'mutinynet'] as const) {
  describe(`${network} emergency recovery`, () => {
    for (const protectionTier of ['standard', 'advanced'] as const) {
      test(`${protectionTier} preserves the public kit and recovery scripts`, () => {
        const descriptor = buildVaultProgramDescriptor({
          ...PROGRAM_FIXTURE,
          network,
          protectionTier,
          recoveryPub: protectionTier === 'advanced' ? PROGRAM_FIXTURE.recoveryPub : undefined,
        })
        expect(descriptor.policy.absoluteFeeCapSats).toBe(network === 'mainnet' ? 20000 : 5000)
        expect(descriptor.policy.feerateCapSatVb).toBe(network === 'mainnet' ? 25 : 10)
        const kit = buildRecoveryKit(descriptor)
        const restored = parseRecoveryKit(JSON.parse(JSON.stringify(kit)))
        expect(restored).toEqual(kit)
        expect(inspectRecoveryKit(restored).trees).toEqual(inspectRecoveryKit(kit).trees)
      })
    }
    test('rejects another network fee policy', () => {
      expect(() =>
        buildVaultProgramDescriptor({
          ...PROGRAM_FIXTURE,
          network,
          spendingPolicy: defaultSpendingPolicy(network === 'mainnet' ? 'mutinynet' : 'mainnet'),
        }),
      ).toThrow(/absolute fee cap/)
    })
  })
}
