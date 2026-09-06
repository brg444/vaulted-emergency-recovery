type Network = 'mainnet' | 'mutinynet'

/** One process serves one network, including both its page and Bitcoin proxy. */
export function lightRecoveryHandler(network: Network, providerFetch: typeof fetch = fetch) {
  const provider = network === 'mainnet' ? 'https://mempool.space/api' : 'https://mutinynet.com/api'
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url)
    if ((url.pathname === '/light' || url.pathname === '/light/') && req.method === 'GET')
      return new Response(null, { status: 302, headers: { Location: `/light/${network}/index.html`, 'Cache-Control': 'no-store' } })
    const file = /^\/light\/(mainnet|mutinynet)\/(index\.html|recovery\.js(?:\.map)?|manifest\.json)$/.exec(url.pathname)
    if (file && req.method === 'GET') {
      if (file[1] !== network) return new Response(`This recovery server uses ${network}. Restart it with RECOVERY_NETWORK=${file[1]} for this backup.`, { status: 409 })
      return new Response(Bun.file(new URL(`./light/${network}/${file[2]}`, import.meta.url)), { headers: { 'Cache-Control': 'no-store' } })
    }
    // Only public Bitcoin reads and explicit transaction broadcasts. There is
    // no Vaulted API, Operator connection, key upload, or arbitrary URL proxy.
    const bitcoin = /^\/esplora\/(fee-estimates|blocks\/tip\/height|blocks\/tip\/hash|block-height\/[0-9]+|block\/[0-9a-f]{64}(?:\/header|\/status)?|tx(?:\/[0-9a-f]{64}(?:\/hex|\/status|\/outspends|\/outspend\/[0-9]+)?)?|address\/[A-Za-z0-9]{14,100}(?:\/utxo|\/txs(?:\/chain\/[0-9a-f]{64})?)?)$/.exec(url.pathname)
    if (!bitcoin || (req.method !== 'GET' && !(req.method === 'POST' && url.pathname === '/esplora/tx'))) return new Response('Not found', { status: 404 })
    const body = req.method === 'POST' ? await req.text() : undefined
    if (body !== undefined && (!body.length || body.length > 800000 || body.length % 2 || !/^[0-9a-f]+$/.test(body))) return new Response('Invalid Bitcoin transaction', { status: 400 })
    try {
      const result = await providerFetch(provider + url.pathname.slice('/esplora'.length), { method: req.method, body, redirect: 'error', signal: AbortSignal.timeout(30000) })
      return new Response(result.body, { status: result.status, headers: { 'Content-Type': result.headers.get('Content-Type') || 'text/plain', 'Cache-Control': 'no-store' } })
    } catch {
      return new Response('Bitcoin connection unavailable. Retain the prepared exit and check its transaction status before retrying.', { status: 502 })
    }
  }
}
