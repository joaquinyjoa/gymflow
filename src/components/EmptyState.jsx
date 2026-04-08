const ICONS = {
  clientes: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  rutinas: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  ),
  ejercicios: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/>
      <path d="M3 9.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-5z"/>
      <path d="M17 9.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-5z"/>
    </svg>
  ),
  busqueda: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  ),
  rutina: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M9 16l2 2 4-4"/>
    </svg>
  ),
}

export default function EmptyState({ tipo = 'rutinas', titulo, descripcion, accion, accionLabel }) {
  const icono = ICONS[tipo] ?? ICONS.rutinas
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icono}</div>
      <p className="empty-state-titulo">{titulo}</p>
      {descripcion && <p className="empty-state-desc">{descripcion}</p>}
      {accion && (
        <button className="btn btn-primary" onClick={accion}>{accionLabel}</button>
      )}
    </div>
  )
}
