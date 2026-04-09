export function SkeletonLine({ width = '100%', height = '14px', style = {} }) {
  return <div className="skeleton" style={{ width, height, borderRadius: '6px', ...style }} />
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <SkeletonLine width="140px" height="16px" style={{ marginBottom: '6px' }} />
          <SkeletonLine width="80px" height="12px" />
        </div>
        <SkeletonLine width="32px" height="32px" style={{ borderRadius: '8px' }} />
      </div>
      <SkeletonLine width="100%" height="12px" style={{ marginBottom: '6px' }} />
      <SkeletonLine width="70%" height="12px" style={{ marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <SkeletonLine width="80px" height="32px" style={{ borderRadius: '8px' }} />
        <SkeletonLine width="80px" height="32px" style={{ borderRadius: '8px' }} />
      </div>
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="skeleton-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px' }}>
      <SkeletonLine width="40px" height="40px" style={{ borderRadius: '10px' }} />
      <SkeletonLine width="48px" height="28px" style={{ borderRadius: '6px' }} />
      <SkeletonLine width="80px" height="12px" />
    </div>
  )
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="admin-cards-list">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="dashboard-stats">
      {Array.from({ length: count }).map((_, i) => <SkeletonStatCard key={i} />)}
    </div>
  )
}
