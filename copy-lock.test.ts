import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = import.meta.dir;

describe("companion lock", () => {
  test("points at Vaulted and ships the wizard", () => {
    const pin = JSON.parse(
      readFileSync(resolve(root, "WALLET.json"), "utf8"),
    ) as {
      repo: string;
      libRoot: string;
      libFiles: string[];
    };
    expect(pin.repo).toBe("https://github.com/brg444/vaulted-bitcoin-wallet");
    expect(pin.libFiles.length).toBeGreaterThan(10);
    for (const file of pin.libFiles) {
      expect(existsSync(resolve(root, pin.libRoot, file))).toBe(true);
    }
    const html = readFileSync(resolve(root, "index.html"), "utf8");
    expect(html).toMatch(/Vaulted emergency recovery/);
    expect(html).toMatch(/Open recovery/);
    expect(html).not.toMatch(/version 4/i);
    expect(html).not.toMatch(/\bRP ID\b/);
    expect(html).not.toMatch(/envelope/i);
    expect(existsSync(resolve(root, "Recover.command"))).toBe(true);
    const readme = readFileSync(resolve(root, "README.md"), "utf8");
    expect(readme).toMatch(/brg444\/vaulted-bitcoin-wallet/);
  });
});
