import { useState, useEffect } from 'react'

const DISMISS_KEY = 'gymflow_install_dismissed'
const DISMISS_DAYS = 14

function detectIos() {
  // iPhone/iPod
  if (/iphone|ipod/i.test(navigator.userAgent)) return true
  // iPad: iOS 13+ reports as MacIntel with touch
  if (/ipad/i.test(navigator.userAgent)) return true
  // iPadOS 13+ reports as Macintosh but has touch support
  if (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1) return true
  return false
}

function isStandalone() {
  // CSS media query (works in Chrome/Edge)
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari standalone property
  if ('standalone' in window.navigator && window.navigator.standalone === true) return true
  return false
}

function wasDismissed() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY)
    if (!ts) return false
    const elapsed = Date.now() - parseInt(ts, 10)
    return elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [showIosSheet, setShowIosSheet] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true)
      return
    }

    if (wasDismissed()) return

    if (detectIos()) {
      // Delay to not compete with first render
      const t = setTimeout(() => setShowIosSheet(true), 2500)
      return () => clearTimeout(t)
    }

    // Android / Chrome / Edge
    const handler = (e) => {
      e.preventDefault()
      setPromptEvent(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setPromptEvent(null)
    })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const promptNative = async () => {
    if (!promptEvent) return
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setPromptEvent(null)
  }

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()) } catch { /* noop */ }
    setPromptEvent(null)
    setShowIosSheet(false)
  }

  return {
    // Android/Chrome: native install banner
    canInstall: !!promptEvent && !installed,
    promptNative,
    // iOS: show manual instructions sheet
    showIosSheet: showIosSheet && !installed,
    isIos: detectIos(),
    dismiss,
  }
}
