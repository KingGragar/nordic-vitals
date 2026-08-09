import { useState, useEffect } from 'react'
import DashLayout from '../../components/DashboardLayout'
import { getMemberReadingList } from '../../api/mlmApi'

const CAT_COLOR = { peptides: '#86efac', business: '#93c5fd', wellness: '#fbbf24', nutrition: '#f0abfc', mindset: '#818cf8' }

export default function DashReadingList() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    getMemberReadingList().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  const articles = (data?.articles || []).filter(a =>
    (catFilter === 'all' || a.category === catFilter) &&
    (statusFilter === 'all' || a.status === statusFilter)
  )

  return (
    <DashLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Reading List</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Curated resources to grow your knowledge and business</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Saved', value: data?.savedCount ?? '—', color: '#93c5fd' },
            { label: 'Read', value: data?.readCount ?? '—', color: '#86efac' },
            { label: 'In Progress', value: data?.inProgressCount ?? '—', color: '#fbbf24' },
            { label: 'Reading Streak', value: data?.streak ? `${data.streak}d` : '—', color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <button onClick={() => setCatFilter('all')} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: catFilter === 'all' ? '#6366f1' : 'var(--border)', color: catFilter === 'all' ? '#fff' : 'var(--text-muted)' }}>All</button>
          {Object.keys(CAT_COLOR).map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: catFilter === c ? CAT_COLOR[c] : 'var(--border)', color: catFilter === c ? '#000' : 'var(--text-muted)', textTransform: 'capitalize' }}>{c}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['all', 'unread', 'in_progress', 'read'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: statusFilter === s ? '#6366f1' : 'var(--border)', color: statusFilter === s ? '#fff' : 'var(--text-muted)', textTransform: 'capitalize' }}>{s.replace('_', ' ')}</button>
          ))}
        </div>

        {loading ? <div style={{ color: 'var(--text-muted)', padding: 24 }}>Loading…</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {articles.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No articles match this filter</div>
            ) : articles.map(a => (
              <div key={a.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: CAT_COLOR[a.category] || '#93c5fd', background: `${CAT_COLOR[a.category] || '#93c5fd'}22`, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize' }}>{a.category}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.readTime} min read</span>
                      {a.status === 'read' && <span style={{ fontSize: 11, fontWeight: 700, color: '#86efac' }}>✓ Read</span>}
                      {a.status === 'in_progress' && <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>↻ In Progress</span>}
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{a.title}</h3>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{a.summary}</p>
                    {a.status === 'in_progress' && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                          <span>Progress</span><span>{a.progressPct}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${a.progressPct}%`, background: '#fbbf24', borderRadius: 3 }} />
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>By {a.author} · {a.publishedDate}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    <button style={{ padding: '7px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{a.status === 'read' ? 'Re-read' : a.status === 'in_progress' ? 'Continue' : 'Read'}</button>
                    <button style={{ padding: '7px 14px', background: 'var(--border)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...card, marginTop: 24 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Recommended for You</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
            {(data?.recommended || []).map(r => (
              <div key={r.id} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: CAT_COLOR[r.category] || '#93c5fd', marginBottom: 6, textTransform: 'capitalize' }}>{r.category}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{r.readTime} min · {r.author}</div>
                <button style={{ padding: '5px 12px', background: '#6366f122', color: '#6366f1', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Save</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashLayout>
  )
}
