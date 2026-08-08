import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSubscriptionAnalytics } from '../../api/mlmApi'

function Bar({ pct, color = 'var(--gold)', height = 6 }) {
  return (
    <div style={{ background: 'var(--border)', borderRadius: 99, overflow: 'hidden', height }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s' }} />
    </div>
  )
}

function RetentionCell({ value }) {
  if (value === null) return <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>—</td>
  const color = value >= 85 ? '#86efac' : value >= 70 ? '#fcd34d' : '#fca5a5'
  return (
    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color }}>{value}%</td>
  )
}

export default function AdminSubscriptionAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    setLoading(true)
    getAdminSubscriptionAnalytics(period).then(setData).finally(() => setLoading(false))
  }, [period])

  if (loading || !data) return (
    <AdminLayout>
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div>
    </AdminLayout>
  )

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }
  const maxMrr = Math.max(...data.mrrTrend.map(m => m.mrr))

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📈 Subscription Analytics</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>MRR, churn, plan distribution, and cohort retention.</div>
          </div>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '7px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13 }}>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'MRR', value: `NOK ${(data.mrr / 1000).toFixed(0)}K` },
            { label: 'ARR', value: `NOK ${(data.arr / 1000000).toFixed(2)}M` },
            { label: 'Active Subs', value: data.activeSubscriptions.toLocaleString() },
            { label: 'New This Month', value: `+${data.newThisMonth}` },
            { label: 'Cancelled', value: `-${data.cancelledThisMonth}` },
            { label: 'Churn Rate', value: `${data.churnRate}%` },
            { label: 'Avg Rev / Sub', value: `NOK ${data.avgRevenuePerSub}` },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>MRR Trend</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
              {data.mrrTrend.map(m => (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', background: 'var(--gold)', borderRadius: '4px 4px 0 0', height: `${(m.mrr / maxMrr) * 90}px`, minHeight: 4 }} />
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.month}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Plan Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.planBreakdown.map(p => (
                <div key={p.plan}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{p.plan}</span>
                    <span style={{ color: 'var(--text2)' }}>{p.count} subs · {p.pct}%</span>
                  </div>
                  <Bar pct={p.pct} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Cohort Retention</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--text2)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600 }}>Cohort</th>
                  {['M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map(m => (
                    <th key={m} style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600 }}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.cohortRetention.map(row => (
                  <tr key={row.cohort} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.cohort}</td>
                    <RetentionCell value={row.m1} />
                    <RetentionCell value={row.m2} />
                    <RetentionCell value={row.m3} />
                    <RetentionCell value={row.m4} />
                    <RetentionCell value={row.m5} />
                    <RetentionCell value={row.m6} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 10 }}>Green ≥ 85% · Yellow ≥ 70% · Red &lt; 70%</div>
        </div>
      </div>
    </AdminLayout>
  )
}
