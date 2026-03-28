import { useState, useEffect } from 'react'

export function useTheme() {
  const [tema, setTema] = useState(() => {
    return localStorage.getItem('gymflow-tema') ?? 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema)
    localStorage.setItem('gymflow-tema', tema)
  }, [tema])

  function toggleTema() {
    document.documentElement.classList.add('tema-transitioning')
    setTema(prev => prev === 'dark' ? 'light' : 'dark')
    setTimeout(() => {
      document.documentElement.classList.remove('tema-transitioning')
    }, 400)
  }

  return { tema, toggleTema }
}