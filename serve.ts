import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { lightRecoveryHandler } from "./light-server";

const network = process.env.RECOVERY_NETWORK || "mainnet";
if (network !== "mainnet" && network !== "mutinynet")
  throw new Error("Choose RECOVERY_NETWORK=mainnet or mutinynet");

const port = Number(process.env.PORT || 8789);
const hostname = process.env.HOST || "127.0.0.1";

const tlsCert = process.env.RECOVERY_TLS_CERT;
const tlsKey = process.env.RECOVERY_TLS_KEY;
if (Boolean(tlsCert) !== Boolean(tlsKey))
  throw new Error("Provide both RECOVERY_TLS_CERT and RECOVERY_TLS_KEY");
const server = Bun.serve({
  ...(tlsCert && tlsKey
    ? { tls: { cert: Bun.file(tlsCert), key: Bun.file(tlsKey) } }
    : {}),
  port,
  hostname,
  fetch: lightRecoveryHandler(network, fetch, process.env.RECOVERY_ASSET_DIR
    ? pathToFileURL(resolve(process.env.RECOVERY_ASSET_DIR) + "/") : undefined),
});

const url = `${tlsCert ? "https" : "http"}://${hostname === "127.0.0.1" ? "127.0.0.1" : hostname}:${server.port}/`;
console.log(`Emergency recovery is open at ${url}`);
console.log(
  "Face ID only works if this page uses the website name you enrolled on.",
);
console.log("Stop with Ctrl+C.");

if (process.env.NO_OPEN !== "1") {
  Bun.spawn(["open", url], { stdout: "ignore", stderr: "ignore" });
}
