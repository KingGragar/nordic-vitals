import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminNetworkHealth } from '../../api/mlmApi'

const RANK_COLOR = { Starter: '#9ca3af', Bronze: '#cd7f32', Silver: '#d1d5db', Gold: '#fbbf24', Platinum: '#c4b5fd', Diamond: '#67e8f9' }

export default function AdminNetworkHealth() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    getAdminNetworkHealth().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }
  const maxCount = Math.max(...(data?.rankDistribution || []).map(r => r.count), 1)
  const maxNew   = Math.max(...(data?.monthlyGrowth || []).map(m => m.new + m.churned), 1)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Network Health</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Live overview of MLM network activity, rank distribution, and growth metrics</p>
        </div>

        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
          {(data?.kpis || Array(4).fill(null)).map((k, i) => (
            <div key={i} style={card}>
              <div style={{ fontSize: 26, fontWeight: 700, color: ['#86efac','#93c5fd','#f87171','#fbbf24'][i] }}>{loading ? '…' : k?.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{k?.label ?? ''}</div>
              {k?.delta && (
                <div style={{ fontSize: 12, marginTop: 6, color: k.trend === 'up' ? '#86efac' : k.trend === 'down' ? '#f87171' : '#9ca3af' }}>
                  {k.trend === 'up' ? '▲' : k.trend === 'down' ? '▼' : '●'} {k.delta}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Rank distribution */}
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Rank Distribution</h3>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(data?.rankDistribution || []).map(r => (
                  <div key={r.rank}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: RANK_COLOR[r.rank] ?? 'var(--text)' }}>{r.rank}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{r.count.toLocaleString()} ({r.pct}%)</span>
                    </div>
                    <div style={{ background: 'var(--border)', borderRadius: 4, height: 8 }}>
                      <div style={{ height: 8, borderRadius: 4, background: RANK_COLOR[r.rank] ?? '#6366f1', width: `${(r.count / maxCount) * 100}%`, transition: 'width .4s' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly growth chart */}
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Monthly Growth vs Churn</h3>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (
              <>
                <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#86efac' }}>▬ New</span>
                  <span style={{ fontSize: 12, color: '#f87171' }}>▬ Churned</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 140 }}>
                  {(data?.monthlyGrowth || []).map(m => (
                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ width: '100%', display: 'flex', gap: 3, alignItems: 'flex-end', height: 110 }}>
                        <div title={`New: ${m.new}`} style={{ flex: 1, background: '#86efac', borderRadius: '3px 3px 0 0', height: `${(m.new / maxNew) * 100}%` }} />
                        <div title={`Churned: ${m.churned}`} style={{ flex: 1, background: '#f87171', borderRadius: '3px 3px 0 0', height: `${(m.churned / maxNew) * 100}%` }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{m.month}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dormant high-value members */}
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Dormant High-Value Members <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>(inactive 90+ days)</span></h3>
          {loading ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Member','Rank','Last Active','Team Size','Action'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.dormant || []).map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--row-alt, rgba(0,0,0,.03))' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: RANK_COLOR[m.rank] ?? 'var(--text)', fontWeight: 600 }}>{m.rank}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#f87171' }}>{new Date(m.lastActive).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 12px' }}>{m.teamSize} members</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #6366f1', background: 'transparent', color: '#818cf8', cursor: 'pointer', fontSize: 12 }}>
                          Send Re-Engagement
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
