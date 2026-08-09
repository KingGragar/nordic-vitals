import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminProductReviews } from '../../api/mlmApi'

const STATUS_COLOR = { pending: '#fbbf24', approved: '#86efac', rejected: '#f87171', featured: '#818cf8' }
const STARS = n => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function AdminProductReviews() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    getAdminProductReviews().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  const reviews = (data?.reviews || []).filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (ratingFilter === 'all' || r.rating === Number(ratingFilter))
  )

  const handleAction = (action) => {
    setSelected(null)
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Product Reviews</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Moderate member-submitted product reviews and testimonials</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Pending', value: data?.pendingCount ?? '—', color: '#fbbf24' },
            { label: 'Approved', value: data?.approvedCount ?? '—', color: '#86efac' },
            { label: 'Avg Rating', value: data?.avgRating ? `${data.avgRating}★` : '—', color: '#818cf8' },
            { label: 'Total Reviews', value: (data?.totalReviews || 0).toLocaleString(), color: '#93c5fd' },
            { label: 'Featured', value: data?.featuredCount ?? '—', color: '#f0abfc' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {['all', 'pending', 'approved', 'featured', 'rejected'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: statusFilter === s ? '#6366f1' : 'var(--border)', color: statusFilter === s ? '#fff' : 'var(--text-muted)', textTransform: 'capitalize' }}>{s}</button>
              ))}
              <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12 }}>
                <option value="all">All ratings</option>
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading ? <div style={{ color: 'var(--text-muted)', padding: 16 }}>Loading…</div> : reviews.length === 0 ? (
                <div style={{ ...card, color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No reviews match this filter</div>
              ) : reviews.map(r => (
                <div key={r.id} onClick={() => setSelected(r)} style={{ ...card, cursor: 'pointer', borderColor: selected?.id === r.id ? '#6366f1' : 'var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{r.productName}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>by {r.memberName}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[r.status], background: `${STATUS_COLOR[r.status]}22`, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize', flexShrink: 0 }}>{r.status}</span>
                  </div>
                  <div style={{ color: '#fbbf24', fontSize: 15, letterSpacing: 1, marginBottom: 6 }}>{STARS(r.rating)}</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{r.body}</p>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{r.date} · {r.verified ? '✅ Verified purchase' : 'Unverified'}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'sticky', top: 20 }}>
            {selected ? (
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Review Actions</h3>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{selected.productName}</div>
                  <div style={{ color: '#fbbf24', fontSize: 14, letterSpacing: 1, marginBottom: 4 }}>{STARS(selected.rating)}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{selected.body}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => handleAction('approve')} style={{ padding: '9px 0', background: '#86efac22', color: '#86efac', border: '1px solid #86efac44', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>✓ Approve</button>
                  <button onClick={() => handleAction('feature')} style={{ padding: '9px 0', background: '#818cf822', color: '#818cf8', border: '1px solid #818cf844', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>★ Feature</button>
                  <button onClick={() => handleAction('reject')} style={{ padding: '9px 0', background: '#f8717122', color: '#f87171', border: '1px solid #f8717144', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>✕ Reject</button>
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Admin Note</label>
                  <textarea rows={3} placeholder="Optional moderation note…" style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>
            ) : (
              <div style={{ ...card, color: 'var(--text-muted)', textAlign: 'center', padding: 32, fontSize: 13 }}>Select a review to moderate</div>
            )}

            <div style={{ ...card, marginTop: 14 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Rating Breakdown</h3>
              {[5, 4, 3, 2, 1].map(n => {
                const count = (data?.ratingBreakdown || {})[n] || 0
                const total = data?.totalReviews || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#fbbf24', width: 14 }}>{n}</span>
                    <div style={{ flex: 1, height: 12, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#fbbf24', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
