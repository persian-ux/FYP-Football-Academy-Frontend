import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

/** Tiny event bus used to coordinate layers (celebrations, crowd waves). */
export const sportsphereBus = new EventTarget()

export const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const IS_MOBILE = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

export const IS_TABLET = typeof window !== 'undefined' && window.matchMedia('(max-width: 1199px)').matches

export const TEAM_COLORS = ['#00d4ff', '#ff6b35', '#ffd700', '#ffffff', '#39ff14', '#667eea', '#ff2d55']

/** 500+ on desktop, ~260 on tablet, ~110 on phone, 0 when reduced motion. */
export function getParticleCount(): number {
  if (PREFERS_REDUCED_MOTION) return 0
  if (IS_MOBILE) return 110
  if (IS_TABLET) return 260
  return 520
}

export function parseCount(value: string): { target: number; suffix: string } {
  const match = value.match(/^([\d.,]+)(.*)$/)
  if (!match) return { target: Number(value) || 0, suffix: '' }
  const clean = match[1].replace(/,/g, '')
  return { target: Number(clean) || 0, suffix: match[2] }
}

/** Animate a `[data-count-up]` element (e.g. "1842+") from 0 up to its target. */
export function runCountUp(el: HTMLElement, durationMs = 1600): void {
  const raw = el.dataset.countUp ?? el.textContent ?? '0'
  const { target, suffix } = parseCount(raw)
  if (PREFERS_REDUCED_MOTION) {
    el.textContent = raw
    return
  }

  const decimals = raw.includes('.') ? raw.split('.')[1].replace(/[^\d]/g, '').length : 0
  const state = { value: 0 }
  gsap.to(state, {
    value: target,
    duration: durationMs / 1000,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent =
        state.value.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) + suffix
    },
    onComplete: () => {
      el.textContent = raw
    },
  })
}