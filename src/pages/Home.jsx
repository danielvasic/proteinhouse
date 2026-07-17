import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import HeroBanner from '../components/HeroBanner'
import PromoStrip from '../components/PromoStrip'
import QuickCategories from '../components/QuickCategories'
import GoalsSection from '../components/GoalsSection'
import ProductGrid from '../components/ProductGrid'
import CategoryStrip from '../components/CategoryStrip'
import BrandStrip from '../components/BrandStrip'
import { useSiteContent } from '../hooks/useSiteContent'
import { useAllProducts, rankBestsellers } from '../hooks/useProducts'

const CONTENT_KEYS = [
  'carousel_new_arrivals_ids',    'carousel_new_arrivals_title',    'carousel_new_arrivals_eyebrow',    'carousel_new_arrivals_slug',
  'carousel_bestsellers_ids',     'carousel_bestsellers_title',     'carousel_bestsellers_eyebrow',     'carousel_bestsellers_slug',
]

const CONTENT_DEFAULTS = {
  carousel_new_arrivals_title:   'NOVI PROIZVODI',
  carousel_new_arrivals_eyebrow: 'Tek pristigli',
  carousel_new_arrivals_slug:    'proteini',
  carousel_bestsellers_title:    'BESTSELLERI',
  carousel_bestsellers_eyebrow:  'Najprodavanije ove sedmice',
  carousel_bestsellers_slug:     'akcija',
  // IDs intentionally NOT defaulted — if admin hasn't picked, we use automatic ranking
}

export default function Home() {
  const { data }               = useSiteContent(CONTENT_KEYS, CONTENT_DEFAULTS)
  const { products, loading }  = useAllProducts()

  // Bestselleri: admin-odabrani IDs > tag 'bestseller' > najviše prodaja (sales_count)
  const bestsellers = useMemo(() => {
    const ids = Array.isArray(data.carousel_bestsellers_ids) && data.carousel_bestsellers_ids.length > 0
      ? data.carousel_bestsellers_ids
      : null
    if (ids) return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean).slice(0, 4)
    return rankBestsellers(products, 4)
  }, [data.carousel_bestsellers_ids, products])

  // Novi proizvodi: admin-odabrani IDs > tag 'new' / badge NOVO > redoslijed iz DB
  const newest = useMemo(() => {
    const ids = Array.isArray(data.carousel_new_arrivals_ids) && data.carousel_new_arrivals_ids.length > 0
      ? data.carousel_new_arrivals_ids
      : null
    if (ids) return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean).slice(0, 4)
    const tagged = products.filter((p) => p.tags.includes('new') || p.badge === 'NOVO')
    const rest   = products.filter((p) => !tagged.includes(p))
    return [...tagged, ...rest].slice(0, 4)
  }, [data.carousel_new_arrivals_ids, products])

  return (
    <>
      <Helmet>
        <title>ProteinHouse — Online protein i suplement shop u BiH</title>
        <meta name="description" content="Kupujte proteine, suplemente i sportsku opremu online. Originalni proizvodi, brza dostava po Bosni, bodovi lojalnosti. Do −70% popusta." />
        <meta property="og:title" content="ProteinHouse — Online protein shop u BiH" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://proteinhouse.ba/" />
      </Helmet>

      <main>
        <HeroBanner />
        <QuickCategories />
        <PromoStrip />
        {(bestsellers.length > 0 || !loading) && (
          <ProductGrid
            title={data.carousel_bestsellers_title}
            eyebrow={data.carousel_bestsellers_eyebrow}
            products={bestsellers}
            categorySlug={data.carousel_bestsellers_slug}
          />
        )}
        <GoalsSection />
        {(newest.length > 0 || !loading) && (
          <ProductGrid
            title={data.carousel_new_arrivals_title}
            eyebrow={data.carousel_new_arrivals_eyebrow}
            products={newest}
            categorySlug={data.carousel_new_arrivals_slug}
          />
        )}
        <CategoryStrip />
        <BrandStrip />
      </main>
    </>
  )
}
