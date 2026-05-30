import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Phone, Envelope, MapPin, Clock } from '@phosphor-icons/react'
import styles from './Contact.module.css'

const INFO = [
  { Icon: Phone, text: '+387 33 545 000 · +387 62 077 044' },
  { Icon: Envelope, text: 'info@proteinhouse.ba' },
  { Icon: MapPin, text: 'Maršala Tita 28, 71000 Sarajevo' },
  { Icon: Clock, text: 'PON–PET 9:00–17:00 · SUB 9:00–14:00' },
]

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: connect to Supabase Edge Function or backend API
    setSent(true)
  }

  return (
    <>
      <Helmet>
        <title>Kontakt — ProteinHouse</title>
        <meta name="description" content="Kontaktirajte ProteinHouse. Telefon, email, adresa i radno vrijeme naših prodavnica." />
        <link rel="canonical" href="https://proteinhouse.ba/kontakt" />
      </Helmet>

      <main className={styles.main}>
        <div className={`container ${styles.grid}`}>
          {/* Info side */}
          <div>
            <h1 className={styles.heading}>KONTAKT</h1>
            <p className={styles.intro}>
              Tu smo da odgovorimo na sva vaša pitanja. Javite nam se telefonom,
              mailom ili posjetite jednu od naših prodavnica.
            </p>
            <div className={styles.infoList}>
              {INFO.map(({ Icon, text }) => (
                <div key={text} className={styles.infoItem}>
                  <Icon size={22} weight="duotone" color="var(--ph-navy-700)" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>POŠALJI PORUKU</h2>
            {sent ? (
              <div className={styles.success}>
                ✓ Poruka je uspješno poslana! Javit ćemo vam se uskoro.
              </div>
            ) : (
              <>
                <input
                  className={styles.input}
                  placeholder="Ime i prezime"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Email adresa"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <textarea
                  className={styles.textarea}
                  placeholder="Vaša poruka…"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
                <button type="submit" className={styles.submitBtn}>POŠALJI</button>
              </>
            )}
          </form>
        </div>
      </main>
    </>
  )
}
