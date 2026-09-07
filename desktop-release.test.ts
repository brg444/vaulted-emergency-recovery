import { expect, test } from "bun:test";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const candidate = process.env.DESKTOP_RECOVERY_DIR;
test.skipIf(!candidate)("desktop release starts without a package manager and serves its bundled application", async () => {
  const isolated = mkdtempSync(join(tmpdir(), "vaulted-desktop-test-"));
  cpSync(resolve(candidate!), isolated, { recursive: true });
  const child = Bun.spawn([join(isolated, "vaulted-recovery")], {
    cwd: isolated,
    env: { PATH: "/usr/bin:/bin", NO_OPEN: "1", PORT: "0", HOST: "127.0.0.1",
      RECOVERY_NETWORK: "mutinynet", RECOVERY_ASSET_DIR: isolated },
    stdout: "pipe", stderr: "pipe",
  });
  try {
    const reader = child.stdout.getReader();
    let text = "";
    const timer = setTimeout(() => child.kill(), 10_000);
    let match: RegExpMatchArray | null = null;
    try {
      while (!(match = text.match(/http:\/\/127\.0\.0\.1:\d+\//))) {
        const value = await reader.read();
        if (value.done) throw new Error("Desktop server exited before startup: " + text);
        text += new TextDecoder().decode(value.value);
      }
    } finally { clearTimeout(timer); reader.releaseLock(); }
    const origin = match![0];
    const root = await fetch(origin, { redirect: "manual" });
    expect(root.headers.get("location")).toBe("/programs/mutinynet/index.html");
    const html = await (await fetch(new URL(root.headers.get("location")!, origin))).text();
    expect(html).toContain("Recover to Bitcoin");
    expect((await fetch(new URL("programs/mutinynet/recovery.js", origin))).status).toBe(200);
    expect((await fetch(new URL("programs/mainnet/index.html", origin))).status).toBe(409);
    expect((await fetch(new URL("package.json", origin))).status).toBe(404);
    expect((await fetch(new URL("v1/vault/status", origin))).status).toBe(404);
  } finally {
    child.kill();
    await child.exited;
    rmSync(isolated, { recursive: true, force: true });
  }
}, 20_000);
