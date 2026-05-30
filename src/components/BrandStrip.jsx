import { brands } from '../data/catalog'

export default function BrandStrip() {
  return (
    <section className="py-10 bg-gray-50 border-b border-gray-200">
      <div className="container">
        <div className="flex items-center gap-4 mb-7">
          <div className="h-px flex-1 bg-gray-200" />
          <p
            className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400"
            style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
          >
            Naši brendovi
          </p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div
          className="grid items-center gap-8"
          style={{ gridTemplateColumns: `repeat(${brands.length}, 1fr)` }}
        >
          {brands.map((b) => (
            <div
              key={b.name}
              className="flex items-center justify-center opacity-40 hover:opacity-75 transition-opacity duration-200"
              title={b.name}
            >
              <img
                src={b.src}
                alt={b.name}
                className="max-h-8 w-auto object-contain grayscale"
                loading="lazy"
                width={100}
                height={32}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
