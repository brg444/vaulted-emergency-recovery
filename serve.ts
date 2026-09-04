import homepage from './index.html'

const port = Number(process.env.PORT || 8789)
const hostname = process.env.HOST || '127.0.0.1'

const server = Bun.serve({
  port,
  hostname,
  routes: {
    '/': homepage,
  },
})

const url = `http://${hostname === '127.0.0.1' ? '127.0.0.1' : hostname}:${server.port}/`
console.log(`Emergency recovery is open at ${url}`)
console.log('Face ID only works if this page uses the website name you enrolled on.')
console.log('Stop with Ctrl+C.')

if (process.env.NO_OPEN !== '1') {
  Bun.spawn(['open', url], { stdout: 'ignore', stderr: 'ignore' })
}
