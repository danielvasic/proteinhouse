import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import compression from 'compression'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 3000
const base = process.env.BASE || '/'

async function createServer() {
  const app = express()
  app.use(compression())

  let vite
  if (!isProd) {
    // Dev: use Vite dev server as middleware
    const { createServer: createViteServer } = await import('vite')
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      base,
    })
    app.use(vite.middlewares)
  } else {
    // Prod: serve static assets
    const sirv = (await import('sirv')).default
    app.use(base, sirv(path.resolve(__dirname, 'dist/client'), { extensions: [] }))
  }

  // Handle all routes with SSR
  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl.replace(base, '')

      let template
      let render

      if (!isProd) {
        // Dev: read fresh template and load module via Vite
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
      } else {
        // Prod: use built files
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
        render = (await import('./dist/server/entry-server.js')).render
      }

      const { html: appHtml, head } = await render(req.originalUrl, `${req.protocol}://${req.get('host')}`)

      const finalHtml = template
        .replace('<!--app-head-->', head ?? '')
        .replace('<!--app-html-->', appHtml)

      res.status(200).set({ 'Content-Type': 'text/html' }).send(finalHtml)
    } catch (e) {
      if (!isProd && vite) {
        vite.ssrFixStacktrace(e)
      }
      console.error(e.stack)
      res.status(500).send(e.message)
    }
  })

  app.listen(port, () => {
    console.log(`🚀 ProteinHouse server running at http://localhost:${port}`)
  })
}

createServer()
