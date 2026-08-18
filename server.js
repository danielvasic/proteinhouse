import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import compression from 'compression'
import { verifyAdmin } from './src/server/supabaseAdmin.js'
import { generateProductCopy } from './src/server/bedrock.js'

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

  // AI generator opisa proizvoda — dev ekvivalent netlify/functions/generate-description.mjs
  app.post('/api/generate-description', express.json(), async (req, res) => {
    try {
      const token = req.get('authorization')?.replace(/^Bearer\s+/i, '')
      const admin = await verifyAdmin(token)
      if (!admin) return res.status(401).json({ error: 'Neautorizovano.' })

      const result = await generateProductCopy(req.body || {})
      res.status(200).json(result)
    } catch (err) {
      const statusCode = err.code === 'BAD_INPUT' ? 400 : err.code === 'NOT_CONFIGURED' ? 501 : 500
      res.status(statusCode).json({ error: err.message || 'Greška pri generisanju opisa.' })
    }
  })

  // AI prijedlog kategorija — dev ekvivalent netlify/functions/suggest-categories.mjs
  app.post('/api/suggest-categories', express.json(), async (req, res) => {
    try {
      const token = req.get('authorization')?.replace(/^Bearer\s+/i, '')
      const admin = await verifyAdmin(token)
      if (!admin) return res.status(401).json({ error: 'Neautorizovano.' })

      const { suggestCategoriesAI } = await import('./src/server/bedrock.js')
      res.status(200).json({ slugs: await suggestCategoriesAI(req.body || {}) })
    } catch (err) {
      const statusCode = err.code === 'BAD_INPUT' ? 400 : err.code === 'NOT_CONFIGURED' ? 501 : 500
      res.status(statusCode).json({ error: err.message || 'Greška pri predlaganju kategorija.' })
    }
  })

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
