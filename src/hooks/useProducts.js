/**
 * useProducts — fetches products exclusively from Supabase.
 * No static catalog fallback — if the DB is empty, the UI shows empty state.
 *
 * DB shape  → { id, brand, title, slug, price, old_price, badge, category,
 *               description, flavors, sizes, image_path, image_url,
 *               rating, reviews, is_active, sort_order }
 *
 * Normalised → { id, brand, title, slug, price, old, img, badge, cat,
 *                description, flavors, sizes, rating, reviews }
 */
import { useEffect, useState, useMemo } from 'react'
import { supabase, getProductImageUrl, getProductThumbUrl } from '../lib/supabase'

/**
 * Ako naziv počinje imenom brenda, skini ga iz prikaza — brend se prikazuje
 * zasebno pa se ne ponavlja ("mars" pravilo iz redizajn dokumenta).
 */
function displayTitle(brand, title) {
  if (!brand || !title) return title
  const b = brand.trim()
  const t = title.trim()
  if (t.toLowerCase().startsWith(b.toLowerCase())) {
    const stripped = t.slice(b.length).replace(/^[\s\-–—:,·]+/, '')
    if (stripped) return stripped
  }
  return t
}

/** Normalise a DB row */
export function norm(p) {
  return {
    id:             p.id,
    brand:          p.brand,
    title:          displayTitle(p.brand, p.title),
    slug:           p.slug,
    price:          Number(p.price),
    old:            p.old_price ? Number(p.old_price) : null,
    img:            getProductThumbUrl(p),
    images:         (Array.isArray(p.images) ? p.images : [])
                       .map((entry) => ({
                         src:     getProductImageUrl({ image_path: entry.path, image_url: entry.url }),
                         variant: entry.variant || null,
                       }))
                       .filter((entry) => entry.src),
    badge:          p.badge  || null,
    cat:            p.category ?? p.cat,
    description:    p.description || '',
    flavors:        Array.isArray(p.flavors) ? p.flavors : [],
    sizes:          Array.isArray(p.sizes)   ? p.sizes   : [],
    rating:         p.rating  ?? null,
    reviews:        p.reviews ?? p.review_count ?? 0,
    stock:          p.stock          ?? 0,
    stock_variants: p.stock_variants ?? {},
    tags:           Array.isArray(p.tags) ? p.tags : [],
    sales:          p.sales_count ?? 0,
    usage:          p.usage_instructions || '',
    composition:    p.composition || '',
    nutrition:      p.nutrition_info || '',
    heroStats:      Array.isArray(p.hero_stats) ? p.hero_stats.filter((s) => s?.value) : [],
    // One-click add-oni: [{ product_id, price }] — price je promo cijena ili null
    addons:         (Array.isArray(p.addons) ? p.addons : []).filter((a) => a?.product_id),
  }
}

/**
 * Bestselleri — ručno tagovani ('bestseller') idu prvi, ostatak po broju
 * prodaja (sales_count iz narudžbi). Koristi se na homepage-u i u searchu.
 */
export function rankBestsellers(products, limit = 4) {
  const tagged = products.filter((p) => p.tags.includes('bestseller'))
  const rest   = products
    .filter((p) => !p.tags.includes('bestseller'))
    .slice()
    .sort((a, b) => b.sales - a.sales)
  return [...tagged, ...rest].slice(0, limit)
}

/** Get stock for a specific variant combination */
export function getVariantStock(product, flavor, size) {
  const hasVariants = product.flavors?.length > 0 || product.sizes?.length > 0
  if (!hasVariants) return product.stock ?? 0
  const key = flavor && size ? `${flavor}|${size}`
            : flavor         ? flavor
            : size           ? size
            : ''
  if (!key) return product.stock ?? 0
  return product.stock_variants?.[key]?.qty ?? 0
}

/**
 * Slika koja odgovara izabranom okusu/gramaži (galerija sa vezanim varijantama).
 * Prioritet: tačan par okus+gramaža → samo okus → samo gramaža → prva slika
 * u galeriji → stara jednostruka slika (product.img).
 */
export function getVariantImageSrc(product, flavor, size) {
  const gallery = product?.images
  if (!gallery?.length) return product?.img || ''
  const comboKey = flavor && size ? `${flavor}|${size}` : null
  const match =
    (comboKey && gallery.find((i) => i.variant === comboKey)) ||
    (flavor   && gallery.find((i) => i.variant === flavor)) ||
    (size     && gallery.find((i) => i.variant === size))
  return match?.src || gallery[0]?.src || product.img || ''
}

/** True if any variant (or simple stock) is > 0 */
export function hasAnyStock(product) {
  const hasVariants = product.flavors?.length > 0 || product.sizes?.length > 0
  if (!hasVariants) return (product.stock ?? 0) > 0
  return Object.values(product.stock_variants ?? {}).some((v) => (v?.qty ?? 0) > 0)
}

/** All active products from DB */
export function useAllProducts() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setProducts(data.map(norm))
        setLoading(false)
      })
  }, [])

  return { products, loading }
}

/** Products filtered by category slug */
export function useProductsByCategory(slug) {
  const { products, loading } = useAllProducts()
  const filtered = useMemo(
    () => products.filter((p) => p.cat === slug),
    [products, slug]
  )
  return { products: filtered, loading }
}

/** Single product by slug — DB only */
export function useProduct(slug) {
  const [product, setProduct] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!slug) { setLoading(false); return }
    supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data, error }) => {
        setProduct(!error && data ? norm(data) : null)
        setLoading(false)
      })
  }, [slug])

  return { product, loading }
}

/** Search products by query across brand + title + description */
export function useSearchProducts(query) {
  const { products } = useAllProducts()
  return useMemo(() => {
    if (!query || query.trim().length < 2) return []
    const q = query.toLowerCase().trim()
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    )
  }, [products, query])
}
