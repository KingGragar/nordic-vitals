import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminMemberFeedback, reviewAdminMemberFeedback } from '../../api/mlmApi'

const TYPE_ICONS = { nps: '📊', feature: '💡', product: '⭐', support: '🎧' }
const STATUS_COLORS = {
  pending:  { bg: '#1c1917', color: '#fbbf24', border: '#92400e' },
  reviewed: { bg: '#052e16', color: '#86efac', border: '#166534' },
  featured: { bg: '#1e1b4b', color: '#a5b4fc', border: '#3730a3' },
}

export default function AdminMemberFeedback() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [acting, setActing] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminMemberFeedback().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function act(id, status) {
    setActing(id)
    await reviewAdminMemberFeedback(id, status)
    setData(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === id ? { ...e, status } : e),
    }))
    setActing(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const filtered = filter === 'all' ? data.entries : data.entries.filter(e => e.status === filter || e.type === filter)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💬 Member Feedback</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>NPS responses, feature requests, product reviews, and sentiment analysis.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Responses', value: data.stats.total,                   color: '#a5b4fc' },
            { label: 'NPS Score',       value: data.stats.npsScore,                color: '#86efac' },
            { label: 'Avg Rating',      value: `${data.stats.avgRating} / 5`,      color: '#fbbf24' },
            { label: 'Pending Review',  value: data.stats.pendingReview,           color: '#fca5a5' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['all', 'pending', 'reviewed', 'featured', 'nps', 'feature', 'product', 'support'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 12, fontWeight: filter === f ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {f}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(e => {
                const sc = STATUS_COLORS[e.status] || STATUS_COLORS.pending
                return (
                  <div key={e.id} style={{ ...card }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{TYPE_ICONS[e.type] || '📝'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{e.member}</div>
                        <div style={{ color: 'var(--text2)', fontSize: 12 }}>{e.ts.slice(0, 10)} · {e.type}</div>
                      </div>
                      {e.score && <div style={{ color: '#fbbf24', fontSize: 14 }}>{'★'.repeat(Math.round(e.score / 2))}{'☆'.repeat(5 - Math.round(e.score / 2))}</div>}
                      <span style={{ fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '2px 10px', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                        {e.status}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px 32px', color: 'var(--text)', fontSize: 13, fontStyle: 'italic' }}>"{e.comment}"</p>
                    {e.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginLeft: 32 }}>
                        <button disabled={acting === e.id} onClick={() => act(e.id, 'reviewed')} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #166534', background: '#052e16', color: '#86efac', fontSize: 12, cursor: 'pointer' }}>Mark Reviewed</button>
                        <button disabled={acting === e.id} onClick={() => act(e.id, 'featured')} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #3730a3', background: '#1e1b4b', color: '#a5b4fc', fontSize: 12, cursor: 'pointer' }}>Feature</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Sentiment Breakdown</div>
            <div style={{ ...card, marginBottom: 16 }}>
              {[
                { label: 'Positive', pct: data.sentiment.positive, color: '#86efac' },
                { label: 'Neutral',  pct: data.sentiment.neutral,  color: '#fbbf24' },
                { label: 'Negative', pct: data.sentiment.negative, color: '#fca5a5' },
              ].map(s => (
                <div key={s.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>{s.label}</span><span style={{ color: s.color, fontWeight: 700 }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 700, marginBottom: 12 }}>By Category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.categories.map(c => (
                <div key={c.name} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 11 }}>{c.count} responses</div>
                  </div>
                  <div style={{ color: '#fbbf24', fontSize: 14, textAlign: 'right' }}>
                    {'★'.repeat(Math.round(c.avgRating))}{'☆'.repeat(5 - Math.round(c.avgRating))}
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.avgRating}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
