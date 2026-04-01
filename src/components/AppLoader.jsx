import '../styles/components/app-loader.css'

export default function AppLoader() {
  return (
    <div className="app-loader">
      <div className="app-loader-logo">
        <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="512" height="512" rx="120" fill="#FF3300"/>
          <rect x="152" y="236" width="208" height="40" fill="white" rx="6"/>
          <rect x="128" y="200" width="32" height="112" fill="white" rx="7"/>
          <rect x="104" y="216" width="28" height="80" fill="white" rx="6"/>
          <rect x="352" y="200" width="32" height="112" fill="white" rx="7"/>
          <rect x="380" y="216" width="28" height="80" fill="white" rx="6"/>
        </svg>
      </div>
      <div className="app-loader-spinner">
        <div className="app-loader-bar"/>
      </div>
    </div>
  )
}
