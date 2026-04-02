import { useInstallPrompt } from '../hooks/useInstallPrompt'
import '../styles/components/install-prompt.css'

function AppIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 12, display: 'block' }}>
      <rect width="512" height="512" rx="120" fill="#FF3300"/>
      <rect x="152" y="236" width="208" height="40" fill="white" rx="6"/>
      <rect x="128" y="200" width="32" height="112" fill="white" rx="7"/>
      <rect x="104" y="216" width="28" height="80" fill="white" rx="6"/>
      <rect x="352" y="200" width="32" height="112" fill="white" rx="7"/>
      <rect x="380" y="216" width="28" height="80" fill="white" rx="6"/>
    </svg>
  )
}

function IconShare() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  )
}

function IconAddHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

// ── Banner para Android / Chrome ──────────────────────────────────────────────
function AndroidBanner({ onInstall, onDismiss }) {
  return (
    <div className="install-prompt">
      <div className="install-prompt-icon">
        <AppIcon />
      </div>
      <div className="install-prompt-text">
        <span className="install-prompt-title">Instalar GymFlow</span>
        <span className="install-prompt-sub">Accedé más rápido desde tu pantalla de inicio</span>
      </div>
      <div className="install-prompt-actions">
        <button className="install-prompt-btn install-prompt-btn-primary" onClick={onInstall}>
          Instalar
        </button>
        <button className="install-prompt-btn install-prompt-btn-ghost" onClick={onDismiss}>
          Ahora no
        </button>
      </div>
    </div>
  )
}

// ── Sheet de instrucciones (iOS + dispositivos sin prompt nativo) ─────────────
export function IosSheet({ onDismiss, isIos }) {
  return (
    <div className="install-overlay" onClick={onDismiss}>
      <div className="install-ios-sheet" onClick={e => e.stopPropagation()}>
        <div className="install-handle" />

        <div className="install-ios-header">
          <AppIcon />
          <div>
            <p className="install-ios-title">Agregar GymFlow</p>
            <p className="install-ios-sub">Instalá la app en tu dispositivo</p>
          </div>
        </div>

        <div className="install-ios-steps">
          <div className="install-ios-step">
            <div className="install-ios-step-num">1</div>
            <div className="install-ios-step-body">
              <p className="install-ios-step-text">
                Tocá el botón <strong>Compartir</strong> en la barra{isIos ? ' inferior de Safari' : ' del navegador'}
              </p>
              <div className="install-ios-step-icon">
                <IconShare />
              </div>
            </div>
          </div>

          <div className="install-ios-step">
            <div className="install-ios-step-num">2</div>
            <div className="install-ios-step-body">
              <p className="install-ios-step-text">
                Bajá y tocá <strong>"Agregar a la pantalla de inicio"</strong>
              </p>
              <div className="install-ios-step-icon">
                <IconAddHome />
              </div>
            </div>
          </div>

          <div className="install-ios-step">
            <div className="install-ios-step-num">3</div>
            <div className="install-ios-step-body">
              <p className="install-ios-step-text">
                Confirmá tocando <strong>"Agregar"</strong> arriba a la derecha
              </p>
              <div className="install-ios-step-icon install-ios-step-icon--acento">
                <IconCheck />
              </div>
            </div>
          </div>
        </div>

        {isIos && (
          <div className="install-ios-arrow-wrap">
            <div className="install-ios-arrow-label">El botón compartir está acá abajo</div>
            <div className="install-ios-arrow">↓</div>
          </div>
        )}

        <button className="install-ios-dismiss" onClick={onDismiss}>
          Ahora no
        </button>
      </div>
    </div>
  )
}

// ── Export principal (auto-show global) ───────────────────────────────────────
export default function InstallPrompt() {
  const { canInstall, promptNative, showIosSheet, isIos, dismiss } = useInstallPrompt()

  if (canInstall) {
    return <AndroidBanner onInstall={promptNative} onDismiss={dismiss} />
  }

  if (showIosSheet) {
    return <IosSheet onDismiss={dismiss} isIos={isIos} />
  }

  return null
}
