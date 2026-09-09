# Integrating independent Spending recovery

A user can recover eligible Spending funds to Bitcoin when the saved transaction
paths, required signing keys and Bitcoin transport remain available. Guardian
and Operator cooperation is unnecessary for the committed exit path. This
outcome depends on the actual enrolled program and retained transaction data.

## Keep data available to the keys that can recover

| Saved account or output | Keys for the independent path | Additional requirements |
| --- | --- | --- |
| Standard Spending | Phone and hardware | Original passkey unlock, complete paths, Bitcoin fees and committed delay |
| Advanced Spending | Hardware and recovery | Readable paths, Bitcoin fees and committed delay; the portable format permits phone absence |
| Light Spending | Owner | Its supported backup unlock, complete paths, Bitcoin fees and committed delay |
| Boarding | Phone | Saved boarding descriptor and parent, original key unlock and boarding delay |
| Connector Savings | Hardware plus retained service approvals for the exact action | The complete protected journal is needed to finish an approved action; initiating a new action needs services |
| Legacy normal Savings | Phone and hardware | Exact script and parent transaction |
| Outbound Lightning lockup | Sender refund key | Saved funded contract, exact refund path and applicable delay; qualify separately from ordinary Spending |

A public Savings kit cannot reconstruct Spending ancestry. Encrypting every
transaction path under the phone key also makes phone absence a data-access
failure, even when the script permits hardware and recovery signatures.

The portable package keeps a readable transaction archive beside the encrypted
complete backup. Its exporter selects public identity, output, parent and
ancestry fields. Operational journals and key envelopes remain protected.
Readable data uses a distinct `vaulted-readable-recovery` format internally;
the wallet restore validator rejects it. Wallet restore authenticates the
complete encrypted backup before restoring operational state.

Treat packages as private financial records. Saved scripts and paths reveal
addresses and transaction relationships. Signed transactions may already
permit execution of their exact authorized action.

## Update the data with transaction activity

Coverage compares exact output identities, amounts and scripts. A matching
balance or recent timestamp does not establish that successor paths are saved.
The wallet checks locally known outputs before and after capture and retains
the previous complete copy when those sets disagree. Local snapshot replacement
and retention of the previous generation share one IndexedDB transaction.
Imported files remain separate from the current complete local generation.

These checks cover snapshot replacement. Atomic publication across the SDK
wallet database, recovery database and remote services remains unqualified. The
current SDK performs exit capture after output persistence, catches capture
errors and prunes spent branches. Periodic repair cannot close every crash
window. Keep this limit explicit until lifecycle persistence is qualified.

| Activity | Required retained evidence | Current qualification boundary |
| --- | --- | --- |
| Receipt | Accepted output and signed ancestry | Snapshot comparison detects a locally known output missing from the archive; remote acceptance may precede local capture. |
| Send | Submitted identity, reservation, successor paths and payment journal | Recovery write failure must leave the financial outcome unchanged; retrying capture must never replay a payment. |
| Boarding | Deposit parent, final signed batch path and commitment | Existing signed-tree capture is preserved; atomic local publication remains to be qualified. |
| Renewal | Previous path and verified replacement with exact operation identity | Unattended replacement requires evidence delivery beyond the failing service. A closed browser cannot acknowledge it. |
| Lightning funding or refund | Funded lockup, change, claim or refund path and unresolved journal | Public Spending data alone excludes protected payment journals. Unlock and test the funded contract separately. |
| Connector action | Exact approved transaction and retained signatures | Protected journal restore preserves the existing exact-action checks. A new action cannot reuse old approvals. |

Continuous device-loss coverage requires delivery outside Vaulted before a
renewal replaces the previous path. This release does not provide that delivery
while the browser is closed.

## Reproduce the consumer handoff

The wallet source includes `pnpm test:recovery-browser`. It builds the companion,
imports a synthetic Advanced package, reviews its saved amount, downloads a
PSBT, signs with disposable hardware and recovery test keys, imports the signed
file and reopens the exact prepared action. It also rejects a malformed
replacement file without retaining prior execution controls. Network requests
are limited to a local mocked Bitcoin endpoint, and nothing is broadcast.

This test establishes the browser handoff and phone-free data access. It does
not qualify a physical signer, original passkey provider, funded Bitcoin exit,
Apple distribution or closed-browser renewal.

For a partner demonstration, record matched wallet, SDK, companion and desktop
build revisions. With disposable funded test wallets, exercise receipt,
boarding, renewal and payment, then save an updated package outside the phone.
Close the wallet, deny Guardian and Operator endpoints and launch the companion
from a clean installation. Recover to a selected Bitcoin address, interrupt
execution and resume the saved transaction. Record actual fees, confirmations,
signer behavior and every network request. Repeat with an older file and an
Advanced wallet whose original phone is unavailable.

Keep funded test-network evidence labeled with its network and source revision.
A new mainnet or physical-device claim requires its own evidence. Qualify
Lightning refund separately, and show the service requirements for Savings
beside the independent Spending result.

## Native Ledger Savings

Native Ledger Savings signs the Savings input directly with the phone and Ledger.
Its normal payment uses the recipient and optional Savings change. Connector
reserves, retained connector approvals and proof packets belong only to existing
connector contracts and their migration transactions.

The companion must reconstruct a new native contract from its immutable account
origins, network, vault identity, Spending policy and exact recovery programs.
Receive and change are separate scripts with separate child keys; each saved
parent must be checked against its enrolled coordinate. Both scripts need normal
and delayed-recovery coverage before new enrollment is enabled.

The Ledger registration record preserves the policy name, template, key vector,
policy identifier, authorization HMAC and verified addresses. Losing the HMAC
requires registering the exact original policy again with the same Ledger seed.
The record contains no phone key and cannot establish recovery completeness.
Never interpret an existing phone scalar backup as a new HD seed. The phone HD
backup and its restore validation must be delivered with the new contract.

Keep native registration metadata in the complete recovery package only after
the package schema and canonical contract reconstruction support it. Signing and execution
controls require a validated recovery package that reconstructs a supported
contract.
The present release continues to accept its existing package schemas; it does
not enable native Ledger recovery.

Spending exit capture, successor-path synchronization and fee funding retain their
existing requirements. A Savings signer change does not replace Spending recovery
data or change its committed exit paths.
