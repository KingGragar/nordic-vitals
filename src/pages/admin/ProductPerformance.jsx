import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminProductPerformance } from '../../api/mlmApi'

const TREND_C = { up: '#86efac', down: '#f87171', stable: '#9ca3af' }
const TREND_I = { up: '▲', down: '▼', stable: '●' }

export default function AdminProductPerformance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('revenue')
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    setLoading(true)
    getAdminProductPerformance(period).then(setData).finally(() => setLoading(false))
  }, [period])

  const products = [...(data?.products || [])].sort((a,b) => b[sort] - a[sort])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const btn = (active) => ({ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: active ? '#6366f1' : 'var(--card)', color: active ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13 })

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Product Performance</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Revenue, conversion, and margin analytics by product</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['week','month','quarter','year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={btn(period===p)}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Revenue', value: `€${(data?.totalRevenue||0).toLocaleString()}`, color: '#86efac' },
            { label: 'Units Sold', value: (data?.totalUnits||0).toLocaleString(), color: '#93c5fd' },
            { label: 'Avg Margin', value: `${data?.avgMargin||0}%`, color: '#fbbf24' },
            { label: 'Top SKUs', value: data?.products?.length || '—', color: '#c4b5fd' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Sort controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sort by:</span>
          {['revenue','units','margin','conversionRate','returns'].map(s => (
            <button key={s} onClick={() => setSort(s)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: sort===s ? '#818cf8' : 'var(--card)', color: sort===s ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 12, textTransform: 'capitalize' }}>{s.replace(/([A-Z])/g,' $1')}</button>
          ))}
        </div>

        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Product','SKU','Revenue','Units','Margin %','Conv. Rate','Returns','PV','Trend'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: i%2===0?'transparent':'var(--row-alt,rgba(0,0,0,.03))' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.category}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{p.sku}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#86efac' }}>€{p.revenue.toLocaleString()}</td>
                      <td style={{ padding: '12px 14px' }}>{p.units.toLocaleString()}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${p.margin}%`, height: '100%', background: p.margin>50?'#86efac':p.margin>30?'#fbbf24':'#f87171', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 13 }}>{p.margin}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>{p.conversionRate}%</td>
                      <td style={{ padding: '12px 14px', color: p.returns>5?'#f87171':'var(--text)' }}>{p.returns}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13 }}>{p.pv}</td>
                      <td style={{ padding: '12px 14px', color: TREND_C[p.trend], fontWeight: 700 }}>{TREND_I[p.trend]}</td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan={9} style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>No products found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
