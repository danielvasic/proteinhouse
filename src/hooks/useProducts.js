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
import { supabase, getProductImageUrl } from '../lib/supabase'

/** Normalise a DB row */
function norm(p) {
  return {
    id:          p.id,
    brand:       p.brand,
    title:       p.title,
    slug:        p.slug,
    price:       Number(p.price),
    old:         p.old_price ? Number(p.old_price) : null,
    img:         getProductImageUrl(p),
    badge:       p.badge  || null,
    cat:         p.category ?? p.cat,
    description: p.description || '',
    flavors:     Array.isArray(p.flavors) ? p.flavors : [],
    sizes:       Array.isArray(p.sizes)   ? p.sizes   : [],
    rating:      p.rating  ?? null,
    reviews:     p.reviews ?? 0,
  }
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
