import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Phone, Envelope, MapPin, Clock } from '@phosphor-icons/react'
import { useSiteContent } from '../hooks/useSiteContent'
import { useStores } from '../hooks/useStores'
import BrandIcon from '../components/BrandIcon'
import { BODY, DISPLAY } from '../lib/typography'

const inputCls = 'w-full border border-gray-300 px-4 py-3.5 text-[13px] text-[#1e272e] placeholder:text-gray-400 focus:outline-none focus:border-[#0145F2] transition-colors duration-150 bg-white'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const { data } = useSiteContent(
    ['contact_phone', 'contact_email', 'contact_hours'],
    {
      contact_phone: '',
      contact_email: '',
      contact_hours: '',
    }
  )
  const { stores } = useStores()

  // Build INFO list from site_content — skip empty fields
  const INFO = [
    data.contact_phone && { Icon: Phone,    brand: 'telefon',  label: 'Telefon',       text: data.contact_phone },
    data.contact_email && { Icon: Envelope, brand: 'email',    label: 'Email',         text: data.contact_email },
    // First active store address shown if available
    stores[0]?.address && { Icon: MapPin,   brand: 'lokacija', label: 'Adresa',        text: `${stores[0].address}${stores[0].city ? ', ' + stores[0].city : ''}` },
    data.contact_hours || stores[0]?.working_hours
      ? { Icon: Clock, brand: 'sat', label: 'Radno vrijeme', text: data.contact_hours || stores[0]?.working_hours }
      : null,
  ].filter(Boolean)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      <Helmet>
        <title>Kontakt — ProteinHouse</title>
        <meta name="description" content="Kontaktirajte ProteinHouse. Telefon, email, adresa i radno vrijeme naših prodavnica." />
        <link rel="canonical" href="https://proteinhouse.ba/kontakt" />
      </Helmet>

      <main style={BODY}>

        {/* ── Page header ── */}
        <section className="border-b border-gray-200 bg-white">
          <div className="container py-10 md:py-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-gray-300" />
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400">Stupite u kontakt</span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold text-[#1e272e] uppercase"
              style={DISPLAY}
            >
              Kontakt
            </h1>
          </div>
        </section>

        {/* ── Content ── */}
        <section className="py-12 md:py-16 bg-[#edf1f5]">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200">

              {/* Info */}
              <div className="bg-white p-8 md:p-12">
                <h2
                  className="text-xl font-bold text-[#1e272e] uppercase mb-2"
                  style={DISPLAY}
                >
                  Informacije
                </h2>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-8">
                  Tu smo da odgovorimo na sva vaša pitanja. Javite nam se telefonom,
                  mailom ili posjetite jednu od naših prodavnica.
                </p>

                <div className="flex flex-col gap-6">
                  {INFO.map(({ Icon, brand, label, text }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-9 h-9 border border-gray-200 flex items-center justify-center shrink-0">
                        <BrandIcon name={brand} size={20} fallback={<Icon size={16} weight="duotone" color="#0145F2" />} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-0.5">{label}</p>
                        <p className="text-[13px] text-[#1e272e] font-medium">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="bg-white p-8 md:p-12">
                <h2
                  className="text-xl font-bold text-[#1e272e] uppercase mb-8"
                  style={DISPLAY}
                >
                  Pošalji poruku
                </h2>

                {sent ? (
                  <div className="border border-[#0145F2] bg-[#0145F2] text-white px-5 py-4 text-[13px] font-medium">
                    ✓ Poruka je uspješno poslana! Javit ćemo vam se uskoro.
                  </div>
                ) : (
                  <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Ime i prezime</label>
                      <input
                        className={inputCls}
                        placeholder="Vaše ime i prezime"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Email adresa</label>
                      <input
                        className={inputCls}
                        type="email"
                        placeholder="vas@email.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Poruka</label>
                      <textarea
                        className={`${inputCls} resize-none`}
                        placeholder="Vaša poruka…"
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-2 w-full py-4 bg-[#0145F2] text-white text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#0136C4] transition-colors duration-150 cursor-pointer border-0"
                    >
                      Pošalji poruku
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        </section>

      </main>
    </>
  )
}
