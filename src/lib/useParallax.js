import { useEffect, useRef } from 'react'

/**
 * Lagani scroll-parallax za pozadinske slojeve (iOS-siguran: transform,
 * ne background-attachment). Element mora biti visi od roditelja
 * (npr. -inset-y-[14%]) da pomak ne otkrije rubove.
 * Postuje prefers-reduced-motion.
 */
export function useParallax(speed = 0.18) {
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
        el.style.transform = `translate3d(0, ${(-rect.top * speed).toFixed(1)}px, 0)`
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
  }, [speed])

  return ref
}
