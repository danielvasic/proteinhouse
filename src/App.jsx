import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import CookieConsent from './components/CookieConsent'
import PromoPopup from './components/PromoPopup'
import LifetimeBanner from './components/LifetimeBanner'
import { AdminProvider } from './store/AdminContext'

// Eager — above-the-fold critical pages
import Home from './pages/Home'
import Category from './pages/Category'
import Product from './pages/Product'

// Lazy — secondary pages (smaller initial bundle)
const Contact = lazy(() => import('./pages/Contact'))
const Login   = lazy(() => import('./pages/Login'))
const Blog    = lazy(() => import('./pages/Blog'))
const About   = lazy(() => import('./pages/About'))
const Search   = lazy(() => import('./pages/Search'))
const Novosti   = lazy(() => import('./pages/Novosti'))
const Checkout  = lazy(() => import('./pages/Checkout'))
const Tracking  = lazy(() => import('./pages/Tracking'))

// Lazy — admin (own chunk, never loaded for regular visitors)
const AdminLogin   = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout  = lazy(() => import('./pages/admin/AdminLayout'))
const Dashboard    = lazy(() => import('./pages/admin/Dashboard'))
const AdminBlog    = lazy(() => import('./pages/admin/Blog'))
const BlogEdit     = lazy(() => import('./pages/admin/BlogEdit'))
const Products     = lazy(() => import('./pages/admin/Products'))
const ProductEdit  = lazy(() => import('./pages/admin/ProductEdit'))
const Orders       = lazy(() => import('./pages/admin/Orders'))
const AdminUsers   = lazy(() => import('./pages/admin/Users'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminPromotions = lazy(() => import('./pages/admin/Promotions'))
const AdminBanners    = lazy(() => import('./pages/admin/Banners'))
const AdminSiteContent   = lazy(() => import('./pages/admin/SiteContent'))
const AdminFeatured      = lazy(() => import('./pages/admin/FeaturedSections'))
const AdminNews          = lazy(() => import('./pages/admin/News'))
const AdminNavigation    = lazy(() => import('./pages/admin/Navigation'))
const AdminHeroBanners   = lazy(() => import('./pages/admin/HeroBanners'))
const AdminBrands        = lazy(() => import('./pages/admin/Brands'))
const AdminStores        = lazy(() => import('./pages/admin/Stores'))
const AdminPostavke      = lazy(() => import('./pages/admin/Postavke'))
const AdminFooter        = lazy(() => import('./pages/admin/FooterAdmin'))

function PageLoader() {
  return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--ph-gray-200)', borderTopColor: 'var(--ph-emerald-500)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
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
    <AdminProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Admin routes — no shop Header/Footer ── */}
          <Route path="/admin/prijava" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="proizvodi"        element={<Products />} />
            <Route path="proizvodi/:id"    element={<ProductEdit />} />
            <Route path="blog"             element={<AdminBlog />} />
            <Route path="blog/:id"         element={<BlogEdit />} />
            <Route path="narudzbe"         element={<Orders />} />
            <Route path="korisnici"        element={<AdminUsers />} />
            <Route path="kategorije"       element={<AdminCategories />} />
            <Route path="ponude"           element={<AdminPromotions />} />
            <Route path="baneri"           element={<AdminBanners />} />
            <Route path="sadrzaj"          element={<AdminSiteContent />} />
            <Route path="istaknuti"        element={<AdminFeatured />} />
            <Route path="vijesti"          element={<AdminNews />} />
            <Route path="navigacija"       element={<AdminNavigation />} />
            <Route path="hero-baneri"      element={<AdminHeroBanners />} />
            <Route path="brendovi"         element={<AdminBrands />} />
            <Route path="poslovnice"       element={<AdminStores />} />
            <Route path="footer"           element={<AdminFooter />} />
            <Route path="postavke"         element={<AdminPostavke />} />
          </Route>

          {/* ── Public shop routes ── */}
          <Route path="/*" element={<ShopLayout />} />
        </Routes>
      </Suspense>
    </AdminProvider>
  )
}

function ShopLayout() {
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
          <Route path="/novosti"              element={<Novosti />} />
          <Route path="/checkout"             element={<Checkout />} />
          <Route path="/pracenje"             element={<Tracking />} />
          <Route path="*"                     element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
      <CartDrawer />
      <LifetimeBanner />
      <PromoPopup />
      <CookieConsent />
    </>
  )
}
