// catalog.js — Struktura za fallback dok DB nije popunjena
// Slike su ISKLJUČENE — sve slike idu kroz Supabase Storage
// Proizvodi dolaze isključivo iz Supabase tabele 'products'

export const categories = [
  { slug: 'proteini',    label: 'PROTEINI',           icon: 'Flask',    subs: ['Whey', 'Izolat', 'Kazein', 'Veganski proteini', 'Proteinski barovi', 'Napici'] },
  { slug: 'gaineri',     label: 'GAINERI',             icon: 'Stack',    subs: ['Mass gaineri', 'Lean gaineri', 'Ugljikohidrati'] },
  { slug: 'kreatini',    label: 'KREATINI',            icon: 'Lightning', subs: ['Kreatin monohidrat', 'Kreatin HCL', 'Kreatin blend'] },
  { slug: 'aminokiseline', label: 'AMINOKISELINE',     icon: 'Flask',    subs: ['BCAA', 'EAA', 'Glutamin', 'Arginini', 'Beta-alanin'] },
  { slug: 'pre-workout', label: 'PRE-WORKOUT',         icon: 'Lightning', subs: ['Stimulansi', 'Bez stimulansa', 'Pumpa'] },
  { slug: 'vitamini',    label: 'VITAMINI I ZDRAVLJE', icon: 'Leaf',     subs: ['Multivitamini', 'Omega 3', 'Vitamin D', 'Magnezij', 'Kolagen'] },
  { slug: 'mrsavljenje', label: 'MRŠAVLJENJE',         icon: 'Scales',   subs: ['Fat burneri', 'CLA', 'L-karnitin', 'Termogenici'] },
  { slug: 'hrana',       label: 'ZDRAVA HRANA',        icon: 'BowlFood', subs: ['Proteinski namazi', 'Proteinske čokolade', 'Proteinska kaša'] },
  { slug: 'oprema',      label: 'OPREMA I DODACI',     icon: 'Barbell',  subs: ['Šejkeri', 'Pojasevi', 'Rukavice', 'Torbe', 'Odjeća'] },
  { slug: 'akcija',      label: 'AKCIJA',              icon: 'Tag',      subs: [], accent: true },
]

// Proizvodi dolaze iz Supabase — ovaj niz je prazan
// Frontend prikazuje prazno stanje dok se DB ne popuni kroz /admin/proizvodi
export const products = []

// Pomoćne funkcije (koriste se u nekim komponentama)
export const getProductBySlug   = (slug) => null
export const getProductsByCategory = (cat) => []
export const getCategoryBySlug  = (slug) => categories.find((c) => c.slug === slug) || null
export const fmtKM = (n) => {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('bs-BA', { style: 'currency', currency: 'BAM', minimumFractionDigits: 2 })
    .format(n)
    .replace('BAM', 'KM')
    .trim()
}
