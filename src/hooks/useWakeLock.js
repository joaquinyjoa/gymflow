import { useEffect } from 'react'

export function useWakeLock(active = true) {
  useEffect(() => {
    if (!('wakeLock' in navigator) || !active) return
    let lock = null

    async function acquire() {
      try { lock = await navigator.wakeLock.request('screen') } catch {}
    }

    acquire()

    function onVisibility() {
      if (document.visibilityState === 'visible') acquire()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      lock?.release()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active])
}
