import { resolve } from "node:path";
import { existsSync } from "node:fs";
const wallet = resolve(process.env.WALLET_ROOT || "../wallet");
if (!existsSync(resolve(wallet, "tools/program-emergency/build.mjs")))
  throw new Error("Set WALLET_ROOT to the reviewed Vaulted wallet checkout");
const result = Bun.spawnSync(["node", "tools/program-emergency/build.mjs"], {
  cwd: wallet,
  env: {
    ...process.env,
    PROGRAM_RECOVERY_OUTPUT: resolve(import.meta.dir, "../programs"),
  },
  stdout: "inherit",
  stderr: "inherit",
});
if (result.exitCode) process.exit(result.exitCode);
