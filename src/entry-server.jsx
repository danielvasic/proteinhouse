import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import { CartProvider } from './store/CartContext'
import App from './App'
import './globals.css'
import './theme.css'

export async function render(url) {
  const helmetContext = {}

  // React 18 renderToString supports Suspense — lazy components
  // render their fallback on server, then hydrate on client.
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <CartProvider>
          <App />
        </CartProvider>
      </StaticRouter>
    </HelmetProvider>
  )

  const { helmet } = helmetContext
  const head = helmet
    ? [
        helmet.title.toString(),
        helmet.meta.toString(),
        helmet.link.toString(),
        helmet.script.toString(),
      ].join('')
    : ''

  return { html, head }
}
