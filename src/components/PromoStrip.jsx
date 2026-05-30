import { Truck, ShieldCheck, Star, Gift } from '@phosphor-icons/react'

const ITEMS = [
  { Icon: Truck, title: 'Besplatna dostava', sub: 'Za pošiljke preko 100 KM' },
  { Icon: ShieldCheck, title: '100% sigurna kupovina', sub: 'SSL · originalni proizvodi' },
  { Icon: Star, title: 'Bodovi lojalnosti', sub: 'Za svaku kupovinu' },
  { Icon: Gift, title: 'Pokloni za kupovinu', sub: 'Odaberi pri narudžbi' },
]

export default function PromoStrip() {
  return (
    <section className="border-y border-gray-200 bg-white py-5">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {ITEMS.map(({ Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3.5">
              <div className="shrink-0 w-11 h-11 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                <Icon size={22} weight="duotone" color="#2563EB" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#0F2952] tracking-[0.02em] leading-tight" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>{title}</p>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
