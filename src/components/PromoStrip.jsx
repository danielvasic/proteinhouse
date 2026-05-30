import { Truck, ShieldCheck, Star, Gift } from '@phosphor-icons/react'

const ITEMS = [
  { Icon: Truck,        title: 'Besplatna dostava',    sub: 'Za narudžbe preko 100 KM' },
  { Icon: ShieldCheck,  title: '100% sigurna kupovina', sub: 'SSL · originalni proizvodi' },
  { Icon: Star,         title: 'Bodovi lojalnosti',    sub: 'Za svaku kupovinu' },
  { Icon: Gift,         title: 'Poklon na izbor',      sub: 'Pri svakoj narudžbi' },
]

export default function PromoStrip() {
  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {ITEMS.map(({ Icon, title, sub }) => (
            <div
              key={title}
              className="flex items-center gap-3.5 py-4 px-4 md:px-6 first:pl-0 last:pr-0"
            >
              <Icon size={20} weight="duotone" color="#0F2952" className="shrink-0 opacity-75" />
              <div>
                <p
                  className="text-[12px] font-bold text-[#0F2952] leading-tight"
                  style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
                >
                  {title}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
