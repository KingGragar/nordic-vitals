import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSocialProof, updateAdminSocialProofStatus } from '../../api/mlmApi'

const STATUS_COLORS = {
  featured: { bg: '#3b1f00', color: '#fbbf24', border: '#d97706' },
  approved: { bg: '#052e16', color: '#86efac', border: '#166534' },
  pending:  { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8' },
  rejected: { bg: '#2d1515', color: '#fca5a5', border: '#991b1b' },
}

const SOURCE_ICONS = { email: '✉️', web: '🌐', instagram: '📸', review: '⭐', tiktok: '🎵' }

function Stars({ n }) {
  if (!n) return null
  return <span style={{ color: '#fbbf24', fontSize: 13 }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

export default function AdminSocialProof() {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    getAdminSocialProof().then(setItems).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function setStatus(id, status) {
    await updateAdminSocialProofStatus(id, status)
    setItems(prev => prev.map(x => x.id === id ? { ...x, status } : x))
  }

  const filtered = !items ? [] : filter === 'all' ? items : items.filter(i => i.status === filter)
  const stats = {
    total: (items || []).length,
    featured: (items || []).filter(i => i.status === 'featured').length,
    pending: (items || []).filter(i => i.status === 'pending').length,
    approved: (items || []).filter(i => i.status === 'approved').length,
  }
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💬 Social Proof</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Manage testimonials, UGC, and reviews. Feature the best on your landing page.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total', value: stats.total },
            { label: 'Featured', value: stats.featured },
            { label: 'Approved', value: stats.approved },
            { label: 'Pending', value: stats.pending },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'pending', 'featured', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No items found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(item => {
              const sc = STATUS_COLORS[item.status] || STATUS_COLORS.pending
              return (
                <div key={item.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>{item.author}</span>
                      {item.location && <span style={{ color: 'var(--text2)', fontSize: 12, marginLeft: 8 }}>{item.location}</span>}
                      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text2)' }}>{SOURCE_ICONS[item.source] || '🔗'} {item.source}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {item.status}
                      </span>
                      {item.status !== 'featured' && item.status !== 'rejected' && (
                        <button onClick={() => setStatus(item.id, 'featured')} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #d97706', background: 'transparent', color: '#fbbf24', fontSize: 12, cursor: 'pointer' }}>
                          Feature
                        </button>
                      )}
                      {item.status === 'pending' && (
                        <button onClick={() => setStatus(item.id, 'approved')} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #166534', background: 'transparent', color: '#86efac', fontSize: 12, cursor: 'pointer' }}>
                          Approve
                        </button>
                      )}
                      {item.status !== 'rejected' && (
                        <button onClick={() => setStatus(item.id, 'rejected')} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #991b1b', background: 'transparent', color: '#fca5a5', fontSize: 12, cursor: 'pointer' }}>
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.5, fontStyle: item.type === 'ugc' ? 'italic' : 'normal' }}>
                    "{item.text}"
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
                    {item.product && <span>🛍 {item.product}</span>}
                    {item.rating && <Stars n={item.rating} />}
                    <span>📅 {item.submittedAt}</span>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10, padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 4 }}>{item.type}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
