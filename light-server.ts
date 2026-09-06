type Network = "mainnet" | "mutinynet";

/** One process serves one network, including both its page and Bitcoin proxy. */
export function lightRecoveryHandler(
  network: Network,
  providerFetch: typeof fetch = fetch,
) {
  const provider =
    network === "mainnet"
      ? "https://mempool.space/api"
      : "https://mutinynet.com/api";
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    if (
      (url.pathname === "/" ||
        url.pathname === "/programs" ||
        url.pathname === "/programs/") &&
      req.method === "GET"
    )
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/programs/${network}/index.html`,
          "Cache-Control": "no-store",
        },
      });
    const program =
      /^\/programs\/(mainnet|mutinynet)\/(index\.html|recovery\.js(?:\.map)?|manifest\.json)$/.exec(
        url.pathname,
      );
    if (program && req.method === "GET") {
      if (program[1] !== network)
        return new Response(`This recovery server uses ${network}`, {
          status: 409,
        });
      return new Response(
        Bun.file(
          new URL(`./programs/${network}/${program[2]}`, import.meta.url),
        ),
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (
      (url.pathname === "/light" || url.pathname === "/light/") &&
      req.method === "GET"
    )
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/light/${network}/index.html`,
          "Cache-Control": "no-store",
        },
      });
    const file =
      /^\/light\/(mainnet|mutinynet)\/(index\.html|recovery\.js(?:\.map)?|manifest\.json)$/.exec(
        url.pathname,
      );
    if (file && req.method === "GET") {
      if (file[1] !== network)
        return new Response(
          `This recovery server uses ${network}. Restart it with RECOVERY_NETWORK=${file[1]} for this backup.`,
          { status: 409 },
        );
      return new Response(
        Bun.file(new URL(`./light/${network}/${file[2]}`, import.meta.url)),
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    // Only public Bitcoin reads and explicit transaction broadcasts. There is
    // no Vaulted API, Operator connection, key upload, or arbitrary URL proxy.
    const bitcoin =
      /^\/esplora\/(fee-estimates|blocks|txs\/package|blocks\/tip\/height|blocks\/tip\/hash|block-height\/[0-9]+|block\/[0-9a-f]{64}(?:\/header|\/status)?|tx(?:\/[0-9a-f]{64}(?:\/hex|\/status|\/outspends|\/outspend\/[0-9]+)?)?|address\/[A-Za-z0-9]{14,100}(?:\/utxo|\/txs(?:\/chain\/[0-9a-f]{64})?)?)$/.exec(
        url.pathname,
      );
    const packagePost = url.pathname === "/esplora/txs/package";
    if (
      !bitcoin ||
      (packagePost && req.method !== "POST") ||
      (req.method !== "GET" &&
        !(
          req.method === "POST" &&
          (url.pathname === "/esplora/tx" || packagePost)
        ))
    )
      return new Response("Not found", { status: 404 });
    let body: string | undefined;
    if (req.method === "POST") {
      try {
        body = await boundedBody(req, packagePost ? 1_600_007 : 800_000);
        if (packagePost) {
          if (
            req.headers
              .get("content-type")
              ?.split(";")[0]
              .trim()
              .toLowerCase() !== "application/json"
          )
            throw new Error("Package must be JSON");
          const transactions: unknown = JSON.parse(body);
          if (
            !Array.isArray(transactions) ||
            transactions.length !== 2 ||
            !transactions.every(validTransactionHex)
          )
            throw new Error("Expected parent and child");
        } else if (!validTransactionHex(body))
          throw new Error("Invalid transaction");
      } catch {
        return new Response("Invalid Bitcoin transaction or package", {
          status: 400,
        });
      }
    }
    try {
      const result = await providerFetch(
        provider + url.pathname.slice("/esplora".length),
        {
          method: req.method,
          body,
          ...(body !== undefined
            ? {
                headers: {
                  "Content-Type": packagePost
                    ? "application/json"
                    : "text/plain",
                },
              }
            : {}),
          redirect: "error",
          signal: AbortSignal.timeout(30000),
        },
      );
      return new Response(result.body, {
        status: result.status,
        headers: {
          "Content-Type": result.headers.get("Content-Type") || "text/plain",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return new Response(
        "Bitcoin connection unavailable. Retain the prepared exit and check its transaction status before retrying.",
        { status: 502 },
      );
    }
  };
}

function validTransactionHex(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 800_000 &&
    value.length % 2 === 0 &&
    /^[0-9a-f]+$/.test(value)
  );
}

async function boundedBody(req: Request, limit: number): Promise<string> {
  if (Number(req.headers.get("content-length")) > limit)
    throw new Error("Body too large");
  if (!req.body) throw new Error("Body required");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error("Body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
