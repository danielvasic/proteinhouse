import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'

// Eager — above-the-fold critical pages
import Home from './pages/Home'
import Category from './pages/Category'
import Product from './pages/Product'

// Lazy — secondary pages (smaller initial bundle)
const Contact = lazy(() => import('./pages/Contact'))
const Login   = lazy(() => import('./pages/Login'))
const Blog    = lazy(() => import('./pages/Blog'))
const About   = lazy(() => import('./pages/About'))
const Search  = lazy(() => import('./pages/Search'))

function PageLoader() {
  return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--ph-gray-200)', borderTopColor: 'var(--ph-coral-500)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function NotFound() {
  return (
    <main style={{ padding: '80px 24px', textAlign: 'center', minHeight: '40vh' }}>
      <h1 style={{ fontFamily: 'Oswald, Impact, sans-serif', fontSize: 80, color: 'var(--ph-navy-700)', margin: 0, lineHeight: 1 }}>404</h1>
      <p style={{ color: 'var(--ph-gray-600)', marginTop: 12, fontSize: 15 }}>Stranica nije pronađena.</p>
      <a href="/" style={{ display: 'inline-block', marginTop: 20, padding: '12px 28px', background: 'var(--ph-navy-700)', color: '#fff', borderRadius: 4, fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Nazad na početnu
      </a>
    </main>
  )
}

export default function App() {
  return (
    <>
      <Header />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                     element={<Home />} />
          <Route path="/kategorija/:slug"     element={<Category />} />
          <Route path="/proizvod/:slug"       element={<Product />} />
          <Route path="/kontakt"              element={<Contact />} />
          <Route path="/nalog"                element={<Login />} />
          <Route path="/nalog/registracija"   element={<Login />} />
          <Route path="/blog"                 element={<Blog />} />
          <Route path="/o-nama"               element={<About />} />
          <Route path="/pretraga"             element={<Search />} />
          <Route path="*"                     element={<NotFound />} />
        </Routes>
      </Suspense>

      <Footer />
      <CartDrawer />
    </>
  )
}
