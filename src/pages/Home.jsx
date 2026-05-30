import { Helmet } from 'react-helmet-async'
import HeroBanner from '../components/HeroBanner'
import PromoStrip from '../components/PromoStrip'
import CategoryStrip from '../components/CategoryStrip'
import ProductCarousel from '../components/ProductCarousel'
import BrandStrip from '../components/BrandStrip'
import { products } from '../data/catalog'

// "Newest" = first 8, "Best sellers" = products 2–10 (matching prototype)
const newest = products.slice(0, 8)
const bestsellers = products.slice(2, 10)

export default function Home() {
  return (
    <>
      <Helmet>
        <title>ProteinHouse — Online protein i suplement shop u BiH</title>
        <meta
          name="description"
          content="Kupujte proteine, suplemente i sportsku opremu online. Originalni proizvodi, brza dostava po Bosni, bodovi lojalnosti. Do −70% popusta."
        />
        <meta property="og:title" content="ProteinHouse — Online protein shop u BiH" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://proteinhouse.ba/" />
      </Helmet>

      <main>
        <HeroBanner />
        <PromoStrip />
        <CategoryStrip />
        <ProductCarousel
          title="NAJNOVIJI PROIZVODI"
          eyebrow="Tek pristigli"
          products={newest}
          categorySlug="proteini"
        />
        <ProductCarousel
          title="NAJPRODAVANIJI PROIZVODI"
          eyebrow="Top proizvodi ove sedmice"
          products={bestsellers}
          categorySlug="akcija"
        />
        <BrandStrip />
      </main>
    </>
  )
}
