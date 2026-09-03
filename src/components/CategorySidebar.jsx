import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categories } from '../data/catalog'
import { BODY } from '../lib/typography'
import { formatPrice } from '../lib/price'

const BRANDS = ['Optimum Nutrition', 'Ostrovit', 'BSN', 'MuscleTech', 'AllNutrition', 'Scitec']

export default function CategorySidebar({ activeSlug, onPriceFilter }) {
  const navigate = useNavigate()
  const [priceMax, setPriceMax] = useState(300)
  const [selectedBrands, setSelectedBrands] = useState([])

  const toggleBrand = (b) =>
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b])

  const boxTitle = 'text-[10px] font-bold tracking-[0.18em] text-gray-400 mb-4'

  return (
    <aside className="flex flex-col gap-6 min-w-[200px]" style={BODY}>

      {/* Categories */}
      <div className="border border-gray-200 bg-white p-5">
        <h3 className={boxTitle}>Kategorije</h3>
        <ul className="flex flex-col gap-0 list-none p-0 m-0">
          {categories.map((c) => (
            <li
              key={c.slug}
              className={`px-0 py-2 border-b border-gray-100 last:border-0 text-[12px] cursor-pointer transition-colors duration-150 font-medium ${
                c.slug === activeSlug
                  ? 'text-[#1e272e] font-bold'
                  : 'text-gray-500 hover:text-[#0145F2]'
              }`}
              onClick={() => navigate(`/kategorija/${c.slug}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/kategorija/${c.slug}`)}
            >
              {c.slug === activeSlug && <span className="inline-block w-1.5 h-1.5 bg-[#0145F2] mr-2 mb-px" />}
              {c.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Price filter */}
      <div className="border border-gray-200 bg-white p-5">
        <h3 className={boxTitle}>Filter po cijeni</h3>
        <input
          type="range"
          min={0}
          max={300}
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="w-full accent-[#0145F2] cursor-pointer"
          aria-label="Maksimalna cijena"
        />
        <div className="flex items-center justify-between mt-2 mb-4">
          <span className="text-[11px] text-gray-400">{formatPrice(0, { decimals: 0 })}</span>
          <span className="text-[12px] font-bold text-[#1e272e]">{formatPrice(priceMax, { decimals: 0 })}</span>
        </div>
        <button
          className="w-full py-2.5 border border-[#0145F2] text-[#1e272e] text-[10px] font-bold tracking-[0.12em] hover:bg-[#0145F2] hover:text-white transition-all duration-150 cursor-pointer bg-transparent"
          onClick={() => onPriceFilter?.(priceMax)}
        >
          Primijeni
        </button>
      </div>

      {/* Brands */}
      <div className="border border-gray-200 bg-white p-5">
        <h3 className={boxTitle}>Brendovi</h3>
        <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
          {BRANDS.map((b) => (
            <li key={b}>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(b)}
                  onChange={() => toggleBrand(b)}
                  className="w-4 h-4 accent-[#0145F2] cursor-pointer"
                />
                <span className={`text-[12px] transition-colors duration-150 ${selectedBrands.includes(b) ? 'text-[#1e272e] font-semibold' : 'text-gray-600 group-hover:text-[#0145F2]'}`}>
                  {b}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

    </aside>
  )
}
