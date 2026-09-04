# Vaulted emergency recovery

A local page that opens a Vaulted Recovery Kit if the Vaulted app or website is
gone.

This is the companion to **[Vaulted](https://github.com/brg444/vaulted-bitcoin-wallet)**.
Vaulted creates the kit. This repo is the recipe you keep next to that file.

Do not download a random “Vaulted recovery” app. Use this repository, or the
copy inside a Vaulted checkout you already trust (`tools/offline-recovery`).

## Use it

1. If the Vaulted app still opens, recover there. Stop here.
2. Clone this repo from a source you already trust.
3. On a Mac, double-click **Recover.command**. Or run `bun serve.ts`.
4. Choose your Recovery Kit (the zip or JSON you saved).
5. If Face ID will not run, this page is using the **wrong website name**. Open
   it as the site you originally enrolled on.
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
