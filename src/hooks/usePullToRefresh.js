import { useEffect, useRef, useState } from 'react'

const UMBRAL = 70 // px para disparar el refresh

export function usePullToRefresh(onRefresh) {
  const [tirando, setTirando] = useState(false)
  const [progreso, setProgreso] = useState(0) // 0-1
  const [refrescando, setRefrescando] = useState(false)
  const startYRef = useRef(null)
  const activoRef = useRef(false)

  useEffect(() => {
    function onTouchStart(e) {
      // Solo activar si estamos al tope del scroll
      if (window.scrollY > 2) return
      startYRef.current = e.touches[0].clientY
      activoRef.current = true
    }

    function onTouchMove(e) {
      if (!activoRef.current || startYRef.current === null) return
      const dy = e.touches[0].clientY - startYRef.current
      if (dy <= 0) { activoRef.current = false; return }

      // Resistencia: cuanto más estirás, menos responde
      const resistido = Math.min(dy * 0.5, UMBRAL * 1.2)
      setProgreso(Math.min(resistido / UMBRAL, 1))
      setTirando(true)
    }

    function onTouchEnd() {
      if (!activoRef.current) return
      activoRef.current = false
      startYRef.current = null

      if (progreso >= 1) {
        setRefrescando(true)
        setTirando(false)
        setProgreso(0)
        Promise.resolve(onRefresh()).finally(() => {
          setTimeout(() => setRefrescando(false), 600)
        })
      } else {
        setTirando(false)
        setProgreso(0)
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [onRefresh, progreso])

  return { tirando, progreso, refrescando }
}
