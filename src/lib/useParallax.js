import { useEffect, useRef } from 'react'

/**
 * Lagani scroll-parallax za pozadinske slojeve (iOS-siguran: transform,
 * ne background-attachment). Element mora imati visak preko roditelja
 * (visi sloj ili scale) da pomak ne otkrije rubove.
 * Postuje prefers-reduced-motion.
 *
 * @param {number} speed     koliko px pomaka po px skrola
 * @param {number} [maxShift] gornja granica pomaka u px; koristi je kad je
 *   visak mali (npr. samo scale), da parallax ne otkrije rub umjesto da se
 *   sloj bespotrebno povecava — povecanje sloja mijenja kadriranje slike.
 */
export function useParallax(speed = 0.18, maxShift = Infinity) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const parent = el.parentElement
        if (!parent) return
        const rect = parent.getBoundingClientRect()
        if (rect.bottom < 0 || rect.top > window.innerHeight) return
        const shift = Math.max(-maxShift, Math.min(maxShift, -rect.top * speed))
        el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [speed, maxShift])

  return ref
}
