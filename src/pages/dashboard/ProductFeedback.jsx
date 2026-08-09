import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberProductFeedback } from '../../api/mlmApi'

const RATING_COLOR = { 5: '#86efac', 4: '#86efac', 3: '#fbbf24', 2: '#fb923c', 1: '#f87171' }

export default function DashProductFeedback() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    setLoading(true)
    getMemberProductFeedback().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '7px 16px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Product Feedback</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Share your product experiences and see your feedback history</p>
          </div>
          <button onClick={() => setShowModal(true)} style={btn('#6366f1')}>+ Submit Feedback</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Reviews Submitted', value: (data?.feedback || []).length, color: '#93c5fd' },
            { label: 'Avg Rating', value: data?.avgRating ? `${data.avgRating} ★` : '—', color: '#fbbf24' },
            { label: 'Helpful Votes', value: data?.helpfulVotes || 0, color: '#86efac' },
            { label: 'Products Reviewed', value: data?.productsReviewed || 0, color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Loading…</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(data?.feedback || []).map(fb => (
              <div key={fb.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>💊</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{fb.productName}</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} style={{ fontSize: 16, color: s <= fb.rating ? (RATING_COLOR[fb.rating] || '#fbbf24') : 'var(--border)' }}>★</span>
                        ))}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fb.date}</span>
                      {fb.verified && <span style={{ fontSize: 11, fontWeight: 700, color: '#86efac', background: '#86efac22', borderRadius: 5, padding: '2px 7px' }}>Verified Purchase</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={btn('#6366f111', '#6366f1')}>Edit</button>
                    <button style={btn('#f8717122', '#f87171')}>Delete</button>
                  </div>
                </div>
                {fb.title && <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 5 }}>{fb.title}</div>}
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{fb.body}</p>
                {fb.effects && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {fb.effects.map(e => (
                      <span key={e} style={{ fontSize: 11, background: '#818cf822', color: '#818cf8', borderRadius: 5, padding: '2px 8px' }}>{e}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <span>👍 {fb.helpfulCount} found helpful</span>
                  {fb.adminReply && <span style={{ color: '#818cf8', fontWeight: 600 }}>Admin replied</span>}
                  <span style={{ textTransform: 'capitalize' }}>{fb.status}</span>
                </div>
                {fb.adminReply && (
                  <div style={{ background: '#6366f108', border: '1px solid #6366f122', borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', marginBottom: 4 }}>Nordic Vitals Team</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fb.adminReply}</div>
                  </div>
                )}
              </div>
            ))}
            {(data?.feedback || []).length === 0 && (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💊</div>
                <div style={{ fontWeight: 700 }}>No feedback yet</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Share your product experiences to help the community.</div>
                <button onClick={() => setShowModal(true)} style={{ ...btn('#6366f1'), marginTop: 14 }}>Submit Your First Review</button>
              </div>
            )}
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 500, width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>Submit Product Feedback</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Product</label>
                  <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                    {(data?.purchasedProducts || ['BPC-157', 'TB-500', 'GHK-Cu', 'Sermorelin']).map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Rating</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)} style={{ fontSize: 28, cursor: 'pointer', color: s <= (hoverRating || rating) ? '#fbbf24' : 'var(--border)', transition: 'color .1s' }}>★</span>
                    ))}
                  </div>
                </div>
                {['Review Title', 'Your Experience'].map((f, i) => (
                  <div key={f}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{f}</label>
                    {i === 0
                      ? <input placeholder={f} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                      : <textarea rows={4} placeholder="Describe the effects, dosage experience, results…" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
                    }
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={btn('#6366f1')}>Submit Feedback</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
