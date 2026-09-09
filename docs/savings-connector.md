# Existing wallets: Savings connector recovery data

The companion accepts version-1 connector enrollment kits and reconstructs the
family recorded in the kit, including v1 and dual-reserve v2. It verifies the
key origin, program, Savings script, recovery trees, and enrollment commitment
before using imported facts.

A connector public kit identifies scripts and signing roles but contains no
passkey unlock envelope. By itself it cannot restore a device key or provide
missing transaction parents. Encrypted archives and prepared signing requests
can carry additional data for executable recovery.

A retained connector payment can finish only when its saved candidate contains
the approvals required by its enrolled family. A v1 request may await its
external signature after service approval. A v2 request starts with two hardware
approvals before device and service signing. The companion validates imported
partial signatures and refuses changes to the retained transaction.

A new connector payment or a new one-key delayed Savings recovery still needs
its existing service approvals. Waiting does not add a signing path to a normal
Savings output. The conventional signer input used by a normal withdrawal does
not establish device support for the custom delayed recovery scripts.

The public parser also retains direct-hardware Recovery Kits 3 and 4. A kit
with a passkey envelope has different unlock capabilities from a public map.
See [the recovery guide](../README.md) for required keys, original-origin setup,
transaction paths, fees, and preparation versus broadcast.
