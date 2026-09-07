import { cpSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

// Build for the current host; no runtime download or package install on recovery day.
const root = resolve(import.meta.dir, "..");
if (process.platform !== "darwin") throw new Error("The initial desktop distribution targets macOS");
const name = `vaulted-recovery-macos-${process.arch}`;
const output = resolve(root, "dist", name);
mkdirSync(output, { recursive: true });
const binary = join(output, "vaulted-recovery");
execFileSync(process.execPath, ["build", "--compile", join(root, "serve.ts"), "--outfile", binary], { stdio: "inherit" });
for (const folder of ["programs", "light"]) cpSync(join(root, folder), join(output, folder), { recursive: true });
for (const file of ["README.md", "LICENSE"]) cpSync(join(root, file), join(output, file));
writeFileSync(join(output, "Recover.command"), `#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
export RECOVERY_ASSET_DIR="$PWD"
exec ./vaulted-recovery
`);
chmodSync(join(output, "Recover.command"), 0o755);
const checksum = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
writeFileSync(join(output, "release.json"), JSON.stringify({
  platform: process.platform, architecture: process.arch, runtime: Bun.version,
  companionRevision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
  workingTreeDirty: Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim()),
  binarySha256: checksum(binary),
  programManifests: Object.fromEntries(["mainnet", "mutinynet"].map(network => [network,
    JSON.parse(readFileSync(join(output, "programs", network, "manifest.json"), "utf8"))])),
  qualification: "Local build; Apple signing, notarization and physical passkey qualification remain separate.",
}, null, 2) + "\n");
const zip = output + ".zip";
execFileSync("ditto", ["-c", "-k", "--keepParent", output, zip]);
writeFileSync(zip + ".sha256", checksum(zip) + "  " + name + ".zip\n");
console.log(zip);
