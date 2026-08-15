import { useState } from 'react'

const supportsWebGL = (() => {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
})()

const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isLowPower = (() => {
  try {
    return (navigator.hardwareConcurrency || 8) <= 2
  } catch {
    return false
  }
})()

export function useDeviceCapability() {
  const [capability] = useState({
    supportsWebGL,
    isMobile,
    isLowPower,
    prefersReducedMotion,
  })

  return capability
}

export function deviceSupports3D() {
  return supportsWebGL && !prefersReducedMotion && !isMobile
}