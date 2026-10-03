import { useEffect, useState } from 'react'

/** Whether the element, found once on mount, has scrolled out above the viewport. */
export const useScrolledPast = (elementId: string): boolean => {
  const [isPast, setIsPast] = useState(false)

  useEffect(() => {
    const element = document.getElementById(elementId)

    if (element === null) {
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry !== undefined) {
        setIsPast(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      }
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [elementId])

  return isPast
}
