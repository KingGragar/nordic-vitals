import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberBizAnalytics } from '../../api/mlmApi'

export default function DashBusinessAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('2026-07')

  useEffect(() => {
    setLoading(true)
    getMemberBizAnalytics(period).then(setData).finally(() => setLoading(false))
  }, [period])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }
  const maxEarnings = data ? Math.max(...data.earningsTrend.map(m => m.personal + m.team)) : 1

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📊 Business Analytics</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Key performance indicators for your personal business.</div>
          </div>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '8px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}>
            {['2026-07', '2026-06', '2026-05', '2026-04', '2026-03'].map(p => (
              <option key={p} value={p}>{new Date(p + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !data ? null : (
          <>
            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
              {data.kpis.map(kpi => (
                <div key={kpi.key} style={card}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{kpi.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{kpi.value}{kpi.unit === '%' || kpi.unit === 'NOK' ? '' : ''}{kpi.unit === '%' ? '%' : ''}</div>
                  {kpi.unit === 'NOK' && <div style={{ fontSize: 11, color: 'var(--text2)' }}>NOK</div>}
                  <div style={{ marginTop: 8, fontSize: 12, color: kpi.trendDir === 'up' ? '#86efac' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>{kpi.trendDir === 'up' ? '↑' : '↓'}</span>
                    <span>{kpi.trendDir === 'up' ? '+' : ''}{kpi.trend}{kpi.unit === '%' ? 'pp' : kpi.unit === 'NOK' ? ' NOK' : ''} vs prev month</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Earnings Trend Chart */}
            <div style={{ ...card, marginBottom: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Earnings Trend (NOK)</div>
              <div style={{ display: 'flex', gap: 0, alignItems: 'flex-end', height: 140, borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', padding: '0 8px' }}>
                {data.earningsTrend.map((m, i) => {
                  const totalH = Math.round(((m.personal + m.team) / maxEarnings) * 120)
                  const personalH = Math.round((m.personal / maxEarnings) * 120)
                  const teamH = totalH - personalH
                  return (
                    <div key={m.month} title={`${m.month}: Personal kr ${m.personal.toLocaleString()}, Team kr ${m.team.toLocaleString()}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, position: 'relative', cursor: 'default' }}>
                      <div style={{ width: '60%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
                        <div style={{ height: teamH, background: '#1e3a5f', borderRadius: '4px 4px 0 0', minHeight: teamH > 0 ? 2 : 0 }} />
                        <div style={{ height: personalH, background: 'var(--gold)', borderRadius: teamH > 0 ? 0 : '4px 4px 0 0', minHeight: personalH > 0 ? 2 : 0 }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 6, whiteSpace: 'nowrap' }}>{m.month.slice(5)}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><div style={{ width: 12, height: 12, background: 'var(--gold)', borderRadius: 3 }} /> Personal</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><div style={{ width: 12, height: 12, background: '#1e3a5f', borderRadius: 3 }} /> Team</div>
              </div>
            </div>

            {/* Top Products */}
            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Top Products This Month</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Product</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Units Sold</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Revenue (NOK)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p, i) => (
                    <tr key={p.name} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '9px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, width: 18, height: 18, background: i === 0 ? 'var(--gold)' : 'var(--bg)', color: i === 0 ? '#000' : 'var(--text2)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>{i+1}</span>
                        {p.name}
                      </td>
                      <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 600 }}>{p.sales}</td>
                      <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 700 }}>kr {p.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
