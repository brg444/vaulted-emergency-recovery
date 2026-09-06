# Vaulted emergency recovery

Recover using a saved Vaulted archive or Recovery Kit when the wallet or its
services are unavailable. This is the companion to
[Vaulted](https://github.com/brg444/vaulted-bitcoin-wallet).

The page validates saved scripts, transaction parents, signing keys and delays
before preparing a transaction. Preparation does not broadcast. Save the
prepared recovery file before starting; after a lost response, import that
same file to check Bitcoin status and resume.

## Run locally

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
| Encrypted Standard or Advanced archive | Original passkey envelope, Spending exit graph, onchain parents, pending sends, connector operations and outbound Lightning lockups |
| Encrypted Light archive                | Original passkey envelope, Spending exit graph and saved payment journals                                                           |
| Public Recovery Kit version 3          | Verified Savings, Pending and Quarantine scripts; no phone-key unlock data                                                          |
| Recovery Kit version 4                 | The public scripts plus its original passkey unlock data and any saved boarding pins                                                |
| Connector enrollment kit version 1     | Exact connector program and key origin; this is the public kit associated with recovery binding version 5                           |
| Prepared recovery or signing request   | Exact transaction and retained partial signatures for resuming the same action                                                      |

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

A passkey works at the HTTPS origin where the wallet was created, including
its port. The imported backup shows that origin. During a website outage,
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
Preserve support for all three formats when refreshing copied libraries. The retired map-only interface has been replaced by executable
recovery and signing handoffs.
