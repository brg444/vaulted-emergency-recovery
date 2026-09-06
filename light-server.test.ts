import { describe, expect, it, mock } from "bun:test";
import { lightRecoveryHandler } from "./light-server";

describe("Light recovery network isolation", () => {
  for (const network of ["mainnet", "mutinynet"] as const) {
    it(`serves and proxies only ${network}`, async () => {
      const upstream = mock(async () => new Response("123"));
      const handle = lightRecoveryHandler(
        network,
        upstream as unknown as typeof fetch,
      );
      const origin = "https://rc.getvaulted.xyz";
      for (const route of ["/", "/programs/"])
        expect(
          (await handle(new Request(origin + route))).headers.get("Location"),
        ).toBe(`/programs/${network}/index.html`);
      expect(
        (await handle(new Request(`${origin}/programs/${network}/index.html`)))
          .status,
      ).toBe(200);
      const home = await handle(new Request(`${origin}/light/`));
      expect(home.headers.get("Location")).toBe(`/light/${network}/index.html`);
      const other = network === "mainnet" ? "mutinynet" : "mainnet";
      expect(
        (await handle(new Request(`${origin}/light/${other}/index.html`)))
          .status,
      ).toBe(409);
      expect(
        (await handle(new Request(`${origin}/programs/${other}/index.html`)))
          .status,
      ).toBe(409);
      expect(
        (await handle(new Request(`${origin}/light/${network}/index.html`)))
          .status,
      ).toBe(200);
      const response = await handle(
        new Request(`${origin}/esplora/blocks/tip/height`),
      );
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(upstream.mock.calls[0][0]).toBe(
        `${network === "mainnet" ? "https://mempool.space/api" : "https://mutinynet.com/api"}/blocks/tip/height`,
      );
      expect(upstream.mock.calls[0][1].redirect).toBe("error");
    });
  }
  it("rejects other services, arbitrary paths and malformed broadcasts before contacting Bitcoin", async () => {
    const upstream = mock(async () => new Response("unexpected"));
    const handle = lightRecoveryHandler(
      "mainnet",
      upstream as unknown as typeof fetch,
    );
    for (const path of [
      "/v1/light/backup/read",
      "/esplora/http://example.com",
      "/light/mainnet/../../serve.ts",
    ])
      expect(
        (await handle(new Request(`https://rc.getvaulted.xyz${path}`))).status,
      ).toBe(404);
    for (const body of ["", "a", "not-a-transaction", "ab".repeat(400001)])
      expect(
        (
          await handle(
            new Request("https://rc.getvaulted.xyz/esplora/tx", {
              method: "POST",
              body,
            }),
          )
        ).status,
      ).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("reports an uncertain broadcast without sending it a second time", async () => {
    const upstream = mock(async () => {
      throw new TypeError("lost response");
    });
    const response = await lightRecoveryHandler(
      "mutinynet",
      upstream as unknown as typeof fetch,
    )(
      new Request("https://localhost/esplora/tx", {
        method: "POST",
        body: "ab".repeat(100),
      }),
    );
    expect(response.status).toBe(502);
    expect(await response.text()).toContain("check its transaction status");
    expect(upstream).toHaveBeenCalledTimes(1);
  });
});
