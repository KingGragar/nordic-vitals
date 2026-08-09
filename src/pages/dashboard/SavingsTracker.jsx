import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberSavingsTracker } from '../../api/mlmApi'

export default function DashSavingsTracker() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('allTime')

  useEffect(() => {
    setLoading(true)
    getMemberSavingsTracker().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  const periodData = data?.periods?.[period] || {}

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Savings Tracker</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Track your cumulative savings versus retail price across all orders</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Saved', value: data?.totalSaved || '—', color: '#86efac' },
            { label: 'Avg Discount', value: data?.avgDiscount ? `${data.avgDiscount}%` : '—', color: '#818cf8' },
            { label: 'Orders Placed', value: data?.totalOrders || 0, color: '#93c5fd' },
            { label: 'Retail Equivalent', value: data?.retailEquivalent || '—', color: '#fbbf24' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ ...card, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Savings Over Time</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['allTime', 'All Time'], ['thisYear', 'This Year'], ['last90', 'Last 90d'], ['last30', 'Last 30d']].map(([key, label]) => (
                <button key={key} onClick={() => setPeriod(key)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: period === key ? '#6366f1' : 'var(--border)', color: period === key ? '#fff' : 'var(--text-muted)' }}>{label}</button>
              ))}
            </div>
          </div>
          {loading ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, marginBottom: 6 }}>
                {(periodData.chart || []).map((v, i) => {
                  const max = Math.max(...(periodData.chart || [1]))
                  const pct = max ? (v / max) * 100 : 0
                  return (
                    <div key={i} style={{ flex: 1, height: `${pct}%`, minHeight: 4, background: pct > 70 ? '#86efac' : pct > 40 ? '#818cf8' : '#94a3b8', borderRadius: '3px 3px 0 0' }} />
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                <span>{periodData.startLabel || ''}</span>
                <span>{periodData.endLabel || 'Now'}</span>
              </div>
            </div>
          )}
        </div>

        {!loading && (
          <div style={{ ...card, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Savings by Category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data?.byCategory || []).map(cat => (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 110, fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{cat.name}</div>
                  <div style={{ flex: 1, height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cat.pct}%`, background: '#818cf8', borderRadius: 5 }} />
                  </div>
                  <div style={{ width: 80, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#86efac', flexShrink: 0 }}>{cat.saved}</div>
                  <div style={{ width: 40, textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{cat.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && (data?.topSavings || []).length > 0 && (
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Top Savings Orders</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Order', 'Date', 'Retail Value', 'You Paid', 'Saved', 'Discount'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.topSavings || []).map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 600 }}>#{row.orderId}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>{row.date}</td>
                      <td style={{ padding: '10px 10px' }}>{row.retailValue}</td>
                      <td style={{ padding: '10px 10px' }}>{row.paid}</td>
                      <td style={{ padding: '10px 10px', color: '#86efac', fontWeight: 700 }}>{row.saved}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ background: '#86efac22', color: '#86efac', borderRadius: 5, padding: '2px 8px', fontWeight: 700, fontSize: 12 }}>{row.discountPct}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
