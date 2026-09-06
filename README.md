# Vaulted emergency recovery

A local page that opens a Vaulted Recovery Kit if the Vaulted app or website is
gone.

This is the companion to **[Vaulted](https://github.com/brg444/vaulted-bitcoin-wallet)**.
Vaulted creates the kit. This repo is the recipe you keep next to that file.

Use this repository or the copy inside a Vaulted checkout you already trust
(`tools/offline-recovery`).

## Use it

1. If the Vaulted app still opens, recover there. Stop here.
2. Clone this repo from a source you already trust.
3. On a Mac, double-click **Recover.command**. Or run `bun serve.ts`.
4. Choose your Recovery Kit (the zip or JSON you saved).
5. If Face ID cannot run, check that the website address matches the one
   where you enrolled.
6. Ordinary savings still need this phone **and** your hardware. The kit is not
   a seed.

Needs [Bun](https://bun.sh).

## How this is tied to Vaulted

| This repo | Vaulted |
| --- | --- |
| Emergency page | Creates and saves the Recovery Kit |
| `WALLET.json` names the wallet repo and the copied library files | Vendors this repo at `tools/offline-recovery` |
| `scripts/sync-from-wallet.ts` refreshes those copies | Lock test requires the copies to match byte-for-byte |

Kit parse and Face ID unwrap stay identical to Vaulted. This page does not
print the phone key.

## Develop

```sh
bun install
bun test
bun serve.ts
```

Set `WALLET_ROOT` to a Vaulted checkout when refreshing the library copies:

```sh
WALLET_ROOT=/path/to/vaulted-bitcoin-wallet bun scripts/sync-from-wallet.ts
```


## Light backups

Open `/light/` to recover a Light wallet from its encrypted local backup and
original passkey. The file contains the saved VTXO transaction paths as well as
the encrypted signing key. The page checks the complete archive before preparing
an exit; it uses Bitcoin chain access for fees, confirmations and broadcasts.
Vaulted approval and an available Arkade Operator are unnecessary for this path.

Each server runs on one network. `RECOVERY_NETWORK=mainnet` is the default;
set `RECOVERY_NETWORK=mutinynet` for test bitcoin. The server directs `/light/`
to that network and rejects the other network's page, keeping the recovery
bundle and Bitcoin connection aligned.

### Original passkey origin

Passkeys are bound to the website where the wallet was created. The imported
backup displays its original HTTPS origin. During a website outage, use a
trusted local certificate for that hostname and map the hostname to loopback
on the recovery computer. Serve the same HTTPS origin, including its port.
For an origin such as `https://rc.getvaulted.xyz`, the local server needs port
443 and a certificate trusted by that computer for `rc.getvaulted.xyz`.

After the certificate and local hostname mapping are configured:

```sh
HOST=127.0.0.1 PORT=443 NO_OPEN=1 RECOVERY_NETWORK=mainnet \
RECOVERY_TLS_CERT=/absolute/path/to/trusted-certificate.pem \
RECOVERY_TLS_KEY=/absolute/path/to/private-certificate-key.pem bun serve.ts
```

Open `https://rc.getvaulted.xyz/light/` using the origin from your own backup.
Keep the server bound to loopback and restore the hostname mapping when
finished. An unrelated localhost origin cannot unlock the original passkey.
Older Light files with a recovery code retain their existing recovery route.
If every copy of the original passkey is permanently lost, a new automatic
backup depends on recovering access through its passkey provider.

### Exit files and source verification

Choose a Bitcoin destination after opening the backup. Preparation creates a
signed graph that can be saved before funding or broadcasting. Fund the fee
address displayed by the executor you use, then start recovery and retain the
file while waiting for Bitcoin confirmations and the committed exit delay.
A downloaded backup covers the outputs recorded at its capture time; later
payments require a later backup.

The SDK-format export also opens in
[`arkade-os/arkade-unilateral-exit`](https://github.com/arkade-os/arkade-unilateral-exit).
That executor uses its own fee wallet and funding address.

`light/mainnet/manifest.json` and `light/mutinynet/manifest.json` record the
wallet revision, whether its working tree had changes, hashes of every bundled
source input, and hashes of the JavaScript, source map and page. Rebuild from
the reviewed wallet checkout to compare those inputs and artifacts:

```sh
WALLET_ROOT=/path/to/vaulted-bitcoin-wallet bun scripts/sync-light-from-wallet.ts
bun test
```
