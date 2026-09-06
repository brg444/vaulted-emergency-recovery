import { describe, expect, it, mock } from "bun:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { lightRecoveryHandler } from "./light-server";

// Mandatory in the release workspace; a standalone companion checkout can run
// its remaining tests without installing the wallet's pinned vendored SDK.
const sdkPath = resolve(
  process.env.WALLET_ROOT || "../wallet",
  "node_modules/@arkade-os/sdk/dist/index.js",
);
if (process.env.WALLET_ROOT && !existsSync(sdkPath))
  throw new Error(
    "WALLET_ROOT must contain the installed, reviewed wallet SDK",
  );
const sdk = existsSync(sdkPath)
  ? await import(pathToFileURL(sdkPath).href)
  : null;
const sdkTest = sdk ? it : it.skip;

describe("actual SDK through the shipped Bitcoin proxy", () => {
  for (const network of ["mainnet", "mutinynet"] as const) {
    sdkTest(
      `passes chain tip and atomic parent-child submission on ${network}`,
      async () => {
        const calls: { url: string; init?: RequestInit }[] = [];
        const receipt = { package_msg: "success", tx_results: {} };
        const upstream = mock(async (url: string, init?: RequestInit) => {
          calls.push({ url, init });
          if (url.endsWith("/blocks"))
            return Response.json([
              { id: "ab".repeat(32), height: 123, mediantime: 2000000000 },
            ]);
          return Response.json(receipt);
        });
        const server = Bun.serve({
          port: 0,
          hostname: "127.0.0.1",
          fetch: lightRecoveryHandler(
            network,
            upstream as unknown as typeof fetch,
          ),
        });
        try {
          const provider = new sdk!.EsploraProvider(
            `http://127.0.0.1:${server.port}/esplora`,
          );
          expect(await provider.getChainTip()).toEqual({
            hash: "ab".repeat(32),
            height: 123,
            time: 2000000000,
          });
          expect(
            await provider.broadcastPackage("ab".repeat(100), "cd".repeat(100)),
          ).toEqual(receipt);
          const origin =
            network === "mainnet"
              ? "https://mempool.space/api"
              : "https://mutinynet.com/api";
          expect(calls.map((c) => c.url)).toEqual([
            origin + "/blocks",
            origin + "/txs/package",
          ]);
          expect(calls[1].init).toMatchObject({
            method: "POST",
            body: JSON.stringify(["ab".repeat(100), "cd".repeat(100)]),
            headers: { "Content-Type": "application/json" },
            redirect: "error",
          });
        } finally {
          server.stop(true);
        }
      },
    );
  }
  sdkTest(
    "does not split or retry a package after an uncertain response",
    async () => {
      const upstream = mock(async () => {
        throw new TypeError("Response lost");
      });
      const server = Bun.serve({
        port: 0,
        hostname: "127.0.0.1",
        fetch: lightRecoveryHandler(
          "mainnet",
          upstream as unknown as typeof fetch,
        ),
      });
      try {
        const provider = new sdk!.EsploraProvider(
          `http://127.0.0.1:${server.port}/esplora`,
        );
        await expect(
          provider.broadcastPackage("ab".repeat(100), "cd".repeat(100)),
        ).rejects.toThrow("check its transaction status");
        expect(upstream).toHaveBeenCalledTimes(1);
      } finally {
        server.stop(true);
      }
    },
  );
});
