import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import HeroBanner from '../components/HeroBanner'
import PromoStrip from '../components/PromoStrip'
import CategoryStrip from '../components/CategoryStrip'
import ProductCarousel from '../components/ProductCarousel'
import BrandStrip from '../components/BrandStrip'
import { useSiteContent } from '../hooks/useSiteContent'
import { useAllProducts } from '../hooks/useProducts'

// Default product selections (used as fallback)
const DEFAULT_NEW_IDS  = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']
const DEFAULT_BEST_IDS = ['p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']

const CONTENT_KEYS = [
  'carousel_new_arrivals_ids',    'carousel_new_arrivals_title',    'carousel_new_arrivals_eyebrow',    'carousel_new_arrivals_slug',
  'carousel_bestsellers_ids',     'carousel_bestsellers_title',     'carousel_bestsellers_eyebrow',     'carousel_bestsellers_slug',
]

const DEFAULTS = {
  carousel_new_arrivals_ids:     DEFAULT_NEW_IDS,
  carousel_new_arrivals_title:   'NAJNOVIJI PROIZVODI',
  carousel_new_arrivals_eyebrow: 'Tek pristigli',
  carousel_new_arrivals_slug:    'proteini',
  carousel_bestsellers_ids:      DEFAULT_BEST_IDS,
  carousel_bestsellers_title:    'NAJPRODAVANIJI PROIZVODI',
  carousel_bestsellers_eyebrow:  'Top proizvodi ove sedmice',
  carousel_bestsellers_slug:     'akcija',
}

export default function Home() {
  const { data }     = useSiteContent(CONTENT_KEYS, DEFAULTS)
  const { products } = useAllProducts()

  // Resolve product objects from admin-selected IDs, preserve order
  const newest = useMemo(() => {
    const ids = Array.isArray(data.carousel_new_arrivals_ids) ? data.carousel_new_arrivals_ids : DEFAULT_NEW_IDS
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean)
  }, [data.carousel_new_arrivals_ids, products])

  const bestsellers = useMemo(() => {
    const ids = Array.isArray(data.carousel_bestsellers_ids) ? data.carousel_bestsellers_ids : DEFAULT_BEST_IDS
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean)
  }, [data.carousel_bestsellers_ids, products])

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
        <PromoStrip />
        <CategoryStrip />
        <ProductCarousel
          title={data.carousel_new_arrivals_title}
          eyebrow={data.carousel_new_arrivals_eyebrow}
          products={newest}
          categorySlug={data.carousel_new_arrivals_slug}
        />
        <ProductCarousel
          title={data.carousel_bestsellers_title}
          eyebrow={data.carousel_bestsellers_eyebrow}
          products={bestsellers}
          categorySlug={data.carousel_bestsellers_slug}
        />
        <BrandStrip />
      </main>
    </>
  )
}
