# Vaulted emergency recovery

Recover using a saved Vaulted recovery package, archive or Recovery Kit when the wallet or its
services are unavailable. This is the companion to
[Vaulted](https://github.com/brg444/vaulted-bitcoin-wallet).

The page validates saved scripts, transaction parents, signing keys and delays
before preparing a transaction. Preparation does not broadcast. Save the
prepared recovery file before starting; after a lost response, import that
same file to check Bitcoin status and resume.

## Savings contract support

The saved contract determines the recovery path. Existing connector wallets keep
their original approval journals and signing requirements; retain those files
until the funds and unresolved transactions have been explicitly migrated.
[Connector recovery](docs/savings-connector.md) applies to those existing wallets.

The native Ledger Savings integration is being developed separately. Its
registration record contains the exact public wallet policy and Ledger
registration authorization. That record is not a recovery package and is not
accepted as one by this release. Native activation requires the complete recovery
family, phone HD backup restoration and verified receive/change coin recovery.
See [the integration requirements](INTEGRATION.md#native-ledger-savings).

## Open the desktop package

A macOS desktop build includes the runtime and both network applications.
Extract the folder, verify its ZIP checksum against the release record, then
open `Recover.command`. No package installation is needed to run this build.
The default network is mainnet; to use test bitcoin, run
`RECOVERY_NETWORK=mutinynet ./Recover.command` in the extracted folder.

Current development builds are unsigned. Apple signing, notarization and
actual passkey-provider testing remain release requirements. A successful
software test does not establish physical hardware or original-passkey support.

## Run from source

```sh
bun install
RECOVERY_NETWORK=mainnet bun serve.ts
```

On a Mac, `Recover.command` starts the same server. Use
`RECOVERY_NETWORK=mutinynet` for test bitcoin. Each server serves one network
and rejects artifacts for the other network. Open the address printed by the
server, then choose your JSON or ZIP file.

## Files and recovery paths

| Saved file                             | Available recovery information                                                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Portable recovery package version 1 | Readable Spending paths and onchain parents, with the complete backup and operational journals encrypted inside. Advanced Spending can use hardware and recovery keys without the phone. |
| Encrypted Standard or Advanced archive | Original passkey envelope, Spending exit graph, onchain parents, pending sends, connector operations and outbound Lightning lockups |
| Encrypted Light archive                | Original passkey envelope, Spending exit graph and saved payment journals                                                           |
| Public Recovery Kit version 3          | Verified Savings, Pending and Quarantine scripts; no phone-key unlock data                                                          |
| Recovery Kit version 4                 | The public scripts plus its original passkey unlock data and any saved boarding pins                                                |
| Connector enrollment kit version 1     | Exact connector program and key origin; this is the public kit associated with recovery binding version 5                           |
| Prepared recovery or signing request   | Exact transaction and retained partial signatures for resuming the same action                                                      |

The companion first shows **Funds found in this backup**. Its amount is the
saved transaction data, not a current balance. Later receipts, payments and
renewals need updated paths; Bitcoin queries cannot discover missing offchain
history. Public file validation does not prove key access or current eligibility.

For a portable package, optional passkey unlock opens payment journals and saved
connector approvals. Standard Spending still needs its phone signature.
Download the requested PSBT, review it in compatible signing software and import
the signed file. Keep the exact prepared recovery to resume after interruption.
A malformed replacement file clears the earlier review and execution controls.

Legacy Normal Savings uses phone and hardware signatures. Standard Spending
also requires phone and hardware; Advanced Spending requires hardware and the
separate recovery key. A Pending claim needs its designated key after its
block delay. Cancellation and Quarantine use the remaining keys in the exact
saved program. Boarding uses the phone key after its delay in seconds.

A saved connector payment can finish with its hardware signature after its
Savings service approvals have been captured. A new connector payment or a
new one-key delayed Savings recovery still needs its existing service
approvals. Waiting does not create another signing path.

Outbound Lightning refunds use the saved lockup contract, phone key and exact
refund delay. This companion does not add Lightning receive. A backup covers
its capture time; later receipts or payments require a later archive.

Signing devices exchange partial PSBTs, and the importer verifies signatures
while rejecting changes to the requested inputs, outputs or signing metadata.
Software fixtures exercise these handoffs; physical hardware compatibility
requires separate device qualification. Keep private hardware and recovery
keys in their signing devices.

Spending and Lightning exits may need separate Bitcoin fee funding. Use the
fee address shown for the selected signing key. The current SDK waits for a
parent already in the mempool; it does not automatically raise that parent's
fee. Keep the prepared file while waiting for confirmations and timelocks.

Older Light files with a recovery code retain their existing page at
`/light/`. The main page at `/programs/` handles encrypted archives and
partial signing requests.

## Original passkey origin

Opening a passkey-protected archive requires the saved wallet origin and its
WebAuthn RP ID. The imported backup shows that origin, including its port. During a website outage,
map that hostname to loopback on the recovery computer and use a trusted
local certificate for the hostname. An unrelated localhost origin cannot
unlock the original passkey.

After configuring the local certificate and hostname mapping:

```sh
HOST=127.0.0.1 PORT=443 NO_OPEN=1 RECOVERY_NETWORK=mainnet \
RECOVERY_TLS_CERT=/absolute/path/to/trusted-certificate.pem \
RECOVERY_TLS_KEY=/absolute/path/to/private-certificate-key.pem bun serve.ts
```

Open your original wallet origin. Keep the server bound to loopback and
restore the hostname mapping when finished. If the original passkey is lost,
recover access through its provider or use another signing path
present in your saved program.

## Build a desktop package

After rebuilding the reviewed application bundles, run `bun run build:desktop`
on a Mac. The ZIP in `dist/` includes its runtime, static applications, a launcher
and source and binary verification records. Build each supported architecture
on a matching machine. The release record identifies uncommitted source when
present; a published candidate requires clean, pinned sources.

See [the integration guide](INTEGRATION.md) for storage obligations and the
partner demonstration requirements.

## Verify and rebuild

The server exposes public Bitcoin queries and explicit transaction
broadcasts. It does not proxy the Guardian, Emulator, Operator or arbitrary
URLs. Signing keys stay in the browser or signing device.

The `programs/` and `light/` directories contain separate mainnet and
Mutinynet artifacts. Each manifest records the wallet revision, source input
hashes, build settings and hashes of the JavaScript, source map and HTML.
Rebuild them from the reviewed wallet checkout:

```sh
WALLET_ROOT=/path/to/vaulted-bitcoin-wallet bun scripts/sync-programs-from-wallet.ts
WALLET_ROOT=/path/to/vaulted-bitcoin-wallet bun scripts/sync-light-from-wallet.ts
bun test
```

Release validation also runs the SDK against the local server with a mocked
Bitcoin upstream:

```sh
WALLET_ROOT=/path/to/vaulted-bitcoin-wallet bun test sdk-transport.test.ts
```

These three tests must pass without skips to qualify SDK transport. A
standalone checkout without the reviewed wallet SDK reports them as skipped
while running the remaining companion tests.

The public-kit parser retains versions 3 and 4 and the connector format.
Preserve support for all three formats when refreshing copied libraries. The main interface prepares recovery and external signing requests from the supported artifacts.
