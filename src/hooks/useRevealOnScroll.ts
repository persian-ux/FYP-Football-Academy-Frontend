import { useEffect, type RefObject } from 'react'
import { runCountUp } from '@/lib/sportsphere'

/**
 * Adds `ss-in` to every `.ss-reveal` element when it scrolls into view
 * (CSS-driven 3D card flips + count-ups), while skipping when the visitor
 * prefers reduced motion.
 */
export function useRevealOnScroll<T extends HTMLElement>(scopeRef: RefObject<T | null>) {
  useEffect(() => {
    const root = scopeRef.current
    if (!root) return

    const els = Array.from(root.querySelectorAll<HTMLElement>('.ss-reveal'))
    if (!els.length) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      els.forEach((el) => el.classList.add('ss-in'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          el.classList.add('ss-in')
          if (el.hasAttribute('data-count-up')) runCountUp(el)
          el.querySelectorAll<HTMLElement>('[data-count-up]').forEach((child) => runCountUp(child))
          observer.unobserve(el)
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    )

    els.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 70}ms`
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [scopeRef])
}