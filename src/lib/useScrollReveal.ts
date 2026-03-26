// Hook réutilisable pour activer les animations au scroll
import { useEffect, useRef } from 'react'

export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Activer tous les éléments reveal dans la section
          entry.target.querySelectorAll(
            '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-zoom, .reveal-cinema'
          ).forEach((r, i) => {
            setTimeout(() => r.classList.add('visible'), i * 80)
          })
          obs.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, ...options })

    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return ref
}