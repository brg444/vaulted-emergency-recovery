import { expect, it } from 'bun:test'
import { hex } from '@scure/base'
import vectors from './connector-enrollment-vectors.json'
import { buildConnectorEnrollmentPreview, buildConnectorRecoveryKit } from './connectorEnrollmentCore'
import { familyFromDescriptor } from './descriptor'
import { parseRecoveryKit, inspectRecoveryKit } from './kit'

for (const vector of vectors) {
  it(`restores ${vector.name} connector recovery without the wallet service`, () => {
    // Source-controlled public Go vectors supply all descriptor facts.
    const input = vector.input as Parameters<typeof buildConnectorEnrollmentPreview>[0]
    const preview = buildConnectorEnrollmentPreview(input)
    const saved = buildConnectorRecoveryKit(preview, { ...input, boarding: input.boarding! })
    const kit = parseRecoveryKit(JSON.parse(JSON.stringify(saved)))
    expect(kit.descriptor.savings.address).toBe(saved.savingsAddress)
    const family = familyFromDescriptor(kit.descriptor)
    expect(hex.encode(family.savings.script)).toBe(saved.savingsScript)
    expect(inspectRecoveryKit(kit).trees.length).toBe(input.recoveryPub ? 7 : 5)
    expect(() => parseRecoveryKit({ ...saved, origin: { ...saved.origin, connectorPath: [0, 1] } })).toThrow()
  })
}
