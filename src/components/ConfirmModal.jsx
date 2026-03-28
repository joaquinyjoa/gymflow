export default function ConfirmModal({ open, titulo, desc, onConfirm, onCancel, loading }) {
  if (!open) return null
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-icono">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <h2 className="confirm-titulo">{titulo}</h2>
        <p className="confirm-desc">{desc}</p>
        <div className="confirm-acciones">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
