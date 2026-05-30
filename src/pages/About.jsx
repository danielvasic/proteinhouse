import { Helmet } from 'react-helmet-async'
import { ShieldCheck, Truck, Star, Users } from '@phosphor-icons/react'
import styles from './About.module.css'

const STATS = [
  { label: 'Godina iskustva', value: '10+' },
  { label: 'Zadovoljnih kupaca', value: '50.000+' },
  { label: 'Proizvoda u ponudi', value: '2.000+' },
  { label: 'Brendova', value: '80+' },
]

const VALUES = [
  { Icon: ShieldCheck, title: 'Originalnost', desc: 'Svi naši proizvodi su 100% originalni s certifikatima proizvođača.' },
  { Icon: Truck, title: 'Brza dostava', desc: 'Isporuka unutar 1–3 radna dana na cijelu teritoriju BiH.' },
  { Icon: Star, title: 'Lojalnost', desc: 'Za svaku kupovinu sakupljate bodove i ostvarujete dodatne popuste.' },
  { Icon: Users, title: 'Stručnost', desc: 'Naš tim su certificirani nutricionisti i fitness treneri.' },
]

export default function About() {
  return (
    <>
      <Helmet>
        <title>O nama — ProteinHouse</title>
        <meta name="description" content="Saznajte više o ProteinHouse — vodećem online prodavaonici proteina i suplementa u Bosni i Hercegovini." />
        <link rel="canonical" href="https://proteinhouse.ba/o-nama" />
      </Helmet>

      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <p className={styles.eyebrow}>NAŠA PRIČA</p>
            <h1 className={styles.heading}>O NAMA</h1>
            <p className={styles.intro}>
              ProteinHouse je osnovan s jednim ciljem — omogućiti svim sportašima i
              fitness entuzijastima u Bosni i Hercegovini pristup originalnim,
              kvalitetnim suplementima po fer cijenama. Od 2015. godine, gradimo
              povjerenje jednom narudžbom u isto vrijeme.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className={styles.statsSection}>
          <div className={`container ${styles.statsGrid}`}>
            {STATS.map((s) => (
              <div key={s.label} className={styles.statItem}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className={styles.valuesSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>NAŠE VRIJEDNOSTI</h2>
            <div className={styles.valuesGrid}>
              {VALUES.map(({ Icon, title, desc }) => (
                <div key={title} className={styles.valueCard}>
                  <div className={styles.valueIcon}>
                    <Icon size={28} weight="duotone" color="var(--ph-coral-500)" />
                  </div>
                  <h3 className={styles.valueTitle}>{title}</h3>
                  <p className={styles.valueDesc}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className={styles.teamSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>NAŠE PRODAVNICE</h2>
            <div className={styles.storeGrid}>
              {[
                { city: 'Sarajevo', addr: 'Maršala Tita 28', hours: 'PON–PET 9–17, SUB 9–14' },
                { city: 'Mostar', addr: 'Bulevar 12', hours: 'PON–PET 9–17, SUB 9–13' },
                { city: 'Banja Luka', addr: 'Kralja Petra I 5', hours: 'PON–PET 9–17, SUB 9–14' },
              ].map((s) => (
                <div key={s.city} className={styles.storeCard}>
                  <h3 className={styles.storeCity}>{s.city}</h3>
                  <p className={styles.storeAddr}>{s.addr}</p>
                  <p className={styles.storeHours}>{s.hours}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
