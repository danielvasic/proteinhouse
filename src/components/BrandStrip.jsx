import { brands } from '../data/catalog'

export default function BrandStrip() {
  return (
    <section className="py-8 border-y border-gray-200 bg-white">
      <div className="container">
        <p className="text-center text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400 mb-6" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
          NAŠI BRENDOVI
        </p>
        <div
          className="grid items-center gap-6"
          style={{ gridTemplateColumns: `repeat(${brands.length}, 1fr)` }}
        >
          {brands.map((b) => (
            <div key={b.name} className="flex items-center justify-center opacity-50 hover:opacity-90 transition-opacity duration-150" title={b.name}>
              <img
                src={b.src}
                alt={b.name}
                className="max-h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-150"
                loading="lazy"
                width={100}
                height={48}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
