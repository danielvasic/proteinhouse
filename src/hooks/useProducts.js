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
import { supabase, getProductImageUrl, getProductThumbUrl, selectAllRows } from '../lib/supabase'

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

/**
 * Ista SKU sifra ume stajati pod dva ključa: ERP preimenuje artikal, a
 * stock_variants se spaja pa stari ključ ostane (vidi stockFor u erpSync.js).
 * Zastarjeli ključ nosi svoju cijenu i svoje stanje, pa bi hasAnyStock mogao
 * proizvod drzati "na stanju" po zalihi koje vise nema — a od kad vidljivost
 * odlucuje stanje, to znaci prikazan proizvod koji se ne moze kupiti.
 *
 * Zadrzavamo ključ čiji su i okus i gramaža u deklarisanim listama proizvoda.
 * U svim zatecenim slucajevima (16 grupa) to je tacno jedan ključ, i to onaj
 * sa svjezijom cijenom. Sync isto ovo rjesava na upisu; ovo je zastita za
 * podatke koji su vec u bazi i za artikle koje ERP prestane slati.
 */
export function dedupeVariants(stockVariants, flavors = [], sizes = []) {
  const kljucevi = Object.keys(stockVariants ?? {})
  if (kljucevi.length === 0) return stockVariants ?? {}

  const kanonski = (key) => {
    const i = key.indexOf('|')
    if (i < 0) return flavors.includes(key) || sizes.includes(key)
    return flavors.includes(key.slice(0, i)) && sizes.includes(key.slice(i + 1))
  }

  const zaSku = new Map()
  for (const key of kljucevi) {
    const sku = stockVariants[key]?.sku
    if (sku == null) continue
    const dosad = zaSku.get(String(sku))
    if (dosad == null || (!kanonski(dosad) && kanonski(key))) zaSku.set(String(sku), key)
  }

  const out = {}
  for (const key of kljucevi) {
    const sku = stockVariants[key]?.sku
    if (sku == null || zaSku.get(String(sku)) === key) out[key] = stockVariants[key]
  }
  return out
}

/** Normalise a DB row */
export function norm(p) {
  const flavors = Array.isArray(p.flavors) ? p.flavors : []
  const sizes   = Array.isArray(p.sizes)   ? p.sizes   : []
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
    // Sve kategorije proizvoda: primarna + dodatne (visestruka pripadnost)
    cats:           [p.category ?? p.cat, ...(Array.isArray(p.extra_categories) ? p.extra_categories : [])].filter(Boolean),
    description:    p.description || '',
    flavors,
    sizes,
    rating:         p.rating  ?? null,
    reviews:        p.reviews ?? p.review_count ?? 0,
    stock:          p.stock          ?? 0,
    stock_variants: dedupeVariants(p.stock_variants, flavors, sizes),
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
 * Cijena izabrane varijante.
 *
 * Cijena je funkcija varijante, ne proizvoda: Gold Whey ide od 7.50
 * (vrećica 30 g) do 389 (4450 g). `product.price` ostaje rezerva za
 * proizvode bez varijanti i za zapise koje sync još nije dopunio.
 *
 * Ključ se gradi isto kao u getVariantStock i u SQL funkciji koja naplaćuje
 * narudžbu — sva tri mjesta moraju ostati usklađena.
 */
export function getVariantPrice(product, flavor, size) {
  const key = flavor && size ? `${flavor}|${size}`
            : flavor         ? flavor
            : size           ? size
            : ''
  const cijena = key ? product?.stock_variants?.[key]?.price : null
  return cijena != null ? Number(cijena) : Number(product?.price ?? 0)
}

/**
 * Gramaže koje STVARNO postoje za izabrani okus.
 *
 * U bazi su `flavors` i `sizes` dva nezavisna niza, pa bi njihov Kartezijev
 * proizvod nudio i kombinacije kojih nema: Gold Whey ima okus "Banana" i
 * gramažu "4450g", ali ključ "Banana|4450g" ne postoji (4450 g postoji samo
 * za Vanilla Ice Cream i Double Rich Chocolate). getVariantPrice bi na takav
 * promašaj pao na `product.price`, a to je 7.50 — cijena vrećice od 30 g.
 * Zato ponudu gramaža uvijek filtriramo kroz stvarne ključeve varijanti.
 *
 * Poredak se čuva iz `product.sizes`. Ako proizvod ne koristi složene
 * ključeve (npr. samo "60 caps"), vraća se cijela lista nepromijenjena.
 */
export function getSizesForFlavor(product, flavor) {
  const sve = product?.sizes ?? []
  const varijante = product?.stock_variants ?? {}
  if (!flavor || Object.keys(varijante).length === 0) return sve
  const valjane = sve.filter((s) => `${flavor}|${s}` in varijante)
  return valjane.length ? valjane : sve
}

/**
 * Raspon cijena za prikaz na kartici, gdje varijanta još nije izabrana.
 * Vraća null kad su sve cijene jednake — tada se prikazuje obična cijena.
 */
export function getPriceRange(product) {
  const cijene = Object.values(product?.stock_variants ?? {})
    .map((v) => (v?.price != null ? Number(v.price) : null))
    .filter((x) => x != null && x > 0)
  if (cijene.length < 2) return null
  const min = Math.min(...cijene), max = Math.max(...cijene)
  return min === max ? null : { min, max }
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

/**
 * Proizvodi za storefront.
 *
 * Vidljivost odlučuje STANJE, ne `is_active`: proizvod se prikazuje tek kad
 * ga ima na stanju. Nema smisla nuditi ono što se ne može kupiti, a artikli
 * se kroz ERP sync stalno vraćaju na stanje pa ručno prebacivanje zastavice
 * nikad ne bi bilo u koraku sa lagerom.
 */
export function useAllProducts() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    selectAllRows(() =>
      supabase.from('products').select('*').order('sort_order', { ascending: true })
    ).then(({ data, error }) => {
      if (!error && data) setProducts(data.map(norm).filter(hasAnyStock))
      setLoading(false)
    })
  }, [])

  return { products, loading }
}

/** Products filtered by category slug */
export function useProductsByCategory(slug) {
  const { products, loading } = useAllProducts()
  const filtered = useMemo(
    () => products.filter((p) => p.cats.includes(slug)),
    [products, slug]
  )
  return { products: filtered, loading }
}

/**
 * Jedan proizvod po slugu. Ostaje dostupan direktnim linkom i kad padne sa
 * stanja — liste ga sakriju, ali postojeći linkovi i indeksirane stranice ne
 * smiju odjednom vraćati 404. Dugme se svejedno prikaže kao "Nema na stanju".
 */
export function useProduct(slug) {
  const [product, setProduct] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!slug) { setLoading(false); return }
    supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
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
