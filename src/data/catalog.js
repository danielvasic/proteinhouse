// catalog.js — Struktura za fallback dok DB nije popunjena
// Slike su ISKLJUČENE — sve slike idu kroz Supabase Storage
// Proizvodi dolaze isključivo iz Supabase tabele 'products'

export const categories = [
  { slug: 'proteini',    label: 'Proteini',           icon: 'Flask',    subs: ['Whey', 'Izolat', 'Kazein', 'Veganski proteini', 'Proteinski barovi', 'Napici'] },
  { slug: 'gaineri',     label: 'Gaineri',             icon: 'Stack',    subs: ['Mass gaineri', 'Lean gaineri', 'Ugljikohidrati'] },
  { slug: 'kreatini',    label: 'Kreatini',            icon: 'Lightning', subs: ['Kreatin monohidrat', 'Kreatin HCL', 'Kreatin blend'] },
  { slug: 'aminokiseline', label: 'Aminokiseline',     icon: 'Flask',    subs: ['BCAA', 'EAA', 'Glutamin', 'Arginini', 'Beta-alanin'] },
  { slug: 'pre-workout', label: 'Pre-workout',         icon: 'Lightning', subs: ['Stimulansi', 'Bez stimulansa', 'Pumpa'] },
  { slug: 'vitamini',    label: 'Vitamini i zdravlje', icon: 'Leaf',     subs: ['Multivitamini', 'Omega 3', 'Vitamin D', 'Magnezij', 'Kolagen'] },
  { slug: 'mrsavljenje', label: 'Mršavljenje',         icon: 'Scales',   subs: ['Fat burneri', 'CLA', 'L-karnitin', 'Termogenici'] },
  { slug: 'hrana',       label: 'Zdrava hrana',        icon: 'BowlFood', subs: ['Proteinski namazi', 'Proteinske čokolade', 'Proteinska kaša'] },
  { slug: 'oprema',      label: 'Oprema i dodaci',     icon: 'Barbell',  subs: ['Šejkeri', 'Pojasevi', 'Rukavice', 'Torbe', 'Odjeća'] },
  { slug: 'akcija',      label: 'Akcija',              icon: 'Tag',      subs: [], accent: true },
]

// Proizvodi dolaze iz Supabase — ovaj niz je prazan
// Frontend prikazuje prazno stanje dok se DB ne popuni kroz /admin/proizvodi
export const products = []

// Pomoćne funkcije (koriste se u nekim komponentama)
export const getProductBySlug   = (slug) => null
export const getProductsByCategory = (cat) => []
export const getCategoryBySlug  = (slug) => categories.find((c) => c.slug === slug) || null
// fmtKM je preseljen u src/lib/price.js — Intl.NumberFormat nije bio
// determinističan između Node-a i preglednika i obarao je hidraciju.

/**
 * Boja chipa popusta (Notion "Labels"): do 50% crna brand boja, 50% i preko
 * crvena. Bestseller je plavi, New tirkizni — ti su rijeseni u TAG_COLORS.
 */
export function discountChipClass(badge) {
  const pct = parseInt(String(badge).replace(/[^0-9]/g, ''), 10) || 0
  return pct >= 50 ? 'bg-[#ff4103] text-white' : 'bg-[#1e272e] text-white'
}
