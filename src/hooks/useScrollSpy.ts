import { useEffect, useState } from 'react'

export function useScrollSpy(sectionIds: string[]) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '')

  useEffect(() => {
    if (!sectionIds.length) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

        if (visibleEntry?.target instanceof HTMLElement) {
          setActiveId(visibleEntry.target.id)
          console.log('Scroll spy active section', visibleEntry.target.id)
        }
      },
      {
        rootMargin: '-28% 0px -55% 0px',
        threshold: [0.2, 0.35, 0.5, 0.65],
      }
    )

    sectionIds.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [sectionIds])

  return activeId
}
