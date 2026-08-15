import { useEffect, useState } from 'react'

// ---------------------------------------------------------
// Shared scroll store — a single rAF-throttled listener that
// every consumer (3D background, ball physics, HUD) reads from,
// so we only animate ONE scroll listener on the page.
// ---------------------------------------------------------

const store = { progress: 0, section: 0 }
const subscribers = new Set()
let rafId = 0
let attached = false

function parseSection(p) {
  if (p < 0.1) return 0 // Hero
  if (p < 0.3) return 1 // Warmup / formations
  if (p < 0.5) return 2 // Kickoff / features
  if (p < 0.7) return 3 // Attack sequence
  if (p < 0.85) return 4 // Goal celebration
  return 5 // Outro
}

function recompute() {
  rafId = 0
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
  const docHeight = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    1
  )
  store.progress = Math.min(Math.max(scrollTop / docHeight, 0), 1)
  store.section = parseSection(store.progress)
  subscribers.forEach((cb) => cb())
}

function requestTick() {
  if (!rafId) rafId = requestAnimationFrame(recompute)
}

function attach() {
  if (!attached) {
    attached = true
    window.addEventListener('scroll', requestTick, { passive: true })
    window.addEventListener('resize', requestTick, { passive: true })
    recompute()
  }
}

function detach() {
  if (attached && subscribers.size === 0) {
    attached = false
    window.removeEventListener('scroll', requestTick)
    window.removeEventListener('resize', requestTick)
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }
}

/** Imperative read — used inside useFrame so the ball can move smoothly WITHOUT re-rendering React. */
export function getScrollProgress() {
  return store.progress
}

export function getScrollSection() {
  return store.section
}

/** Reactive — re-renders whenever scroll progress OR section changes (for HUD / indicators). */
export function useScrollProgress() {
  const [value, setValue] = useState(() => ({ progress: store.progress, section: store.section }))

  useEffect(() => {
    const cb = () => setValue({ progress: store.progress, section: store.section })
    subscribers.add(cb)
    attach()
    cb()
    return () => {
      subscribers.delete(cb)
      detach()
    }
  }, [])

  return value
}

/** Reactive but re-renders ONLY when the section changes (cheap for the 3D scene). */
export function useScrollSection() {
  const [section, setSection] = useState(store.section)

  useEffect(() => {
    const cb = () => setSection((current) => {
      if (current === store.section) return current
      return store.section
    })
    subscribers.add(cb)
    attach()
    cb()
    return () => {
      subscribers.delete(cb)
      detach()
    }
  }, [])

  return section
}