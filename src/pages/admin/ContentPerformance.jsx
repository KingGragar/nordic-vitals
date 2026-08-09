import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminContentPerformance } from '../../api/mlmApi'

const TYPES = ['all', 'blog', 'resource', 'video', 'landing']
const TYPE_COLORS = { blog: '#a5b4fc', resource: '#fbbf24', video: '#f9a8d4', landing: '#86efac' }
const PERIODS = ['7d', '30d', '90d']

export default function AdminContentPerformance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('all')
  const [period, setPeriod] = useState('30d')
  const [sort, setSort] = useState('views')

  useEffect(() => { getAdminContentPerformance().then(setData).finally(() => setLoading(false)) }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const filtered = data.content
    .filter(c => type === 'all' || c.type === type)
    .sort((a, b) => (b[sort] || 0) - (a[sort] || 0))

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📊 Content Performance</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Engagement and conversion analytics across all content types.</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${period === p ? 'var(--gold)' : 'var(--border)'}`,
                background: period === p ? '#fbbf2422' : 'transparent',
                color: period === p ? '#fbbf24' : 'var(--text2)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
              }}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Views',    value: data.stats.totalViews,     color: '#a5b4fc' },
            { label: 'Avg Time on Page', value: data.stats.avgTime,     color: '#86efac' },
            { label: 'Conversion Assists', value: data.stats.convAssists, color: '#fbbf24' },
            { label: 'Top Category',   value: data.stats.topCategory,   color: '#f9a8d4' },
            { label: 'Bounce Rate',    value: data.stats.bounceRate,     color: '#c4b5fd' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${type === t ? (TYPE_COLORS[t] || 'var(--gold)') : 'var(--border)'}`,
                background: type === t ? (TYPE_COLORS[t] || 'var(--gold)') + '22' : 'transparent',
                color: type === t ? (TYPE_COLORS[t] || 'var(--text)') : 'var(--text2)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              }}>{t}</button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>Sort:</span>
            {['views', 'avgTime', 'convAssists', 'shares'].map(s => (
              <button key={s} onClick={() => setSort(s)} style={{
                padding: '5px 12px', borderRadius: 20, border: `1px solid ${sort === s ? 'var(--gold)' : 'var(--border)'}`,
                background: sort === s ? '#fbbf2422' : 'transparent',
                color: sort === s ? '#fbbf24' : 'var(--text2)', fontWeight: 600, fontSize: 11, cursor: 'pointer',
              }}>{s === 'convAssists' ? 'Conv.' : s === 'avgTime' ? 'Time' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Content', 'Type', 'Views', 'Avg Time', 'Conv. Assists', 'Shares', 'Bounce'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, maxWidth: 280 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{c.publishedAt}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                        background: (TYPE_COLORS[c.type] || '#888') + '22', color: TYPE_COLORS[c.type] || '#888',
                        textTransform: 'capitalize',
                      }}>{c.type}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{c.views.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: '#86efac', fontWeight: 600 }}>{c.avgTime}</td>
                    <td style={{ padding: '10px 12px', color: '#fbbf24', fontWeight: 600 }}>{c.convAssists}</td>
                    <td style={{ padding: '10px 12px' }}>{c.shares}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: c.bounceRate > 70 ? '#ef4444' : c.bounceRate > 50 ? '#fbbf24' : '#86efac', fontWeight: 600 }}>{c.bounceRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Top Performing by Category</div>
            {data.categoryBreakdown.map(c => (
              <div key={c.category} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ textTransform: 'capitalize' }}>{c.category}</span>
                  <span style={{ fontWeight: 700 }}>{c.views.toLocaleString()} views</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{ width: `${(c.views / data.categoryBreakdown[0].views) * 100}%`, height: '100%', background: '#a5b4fc', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Traffic Sources</div>
            {data.trafficSources.map(s => (
              <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ flex: 1, fontSize: 13 }}>{s.source}</span>
                <div style={{ width: 80, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{ width: `${s.pct}%`, height: '100%', background: '#86efac', borderRadius: 3 }} />
                </div>
                <span style={{ width: 36, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
