import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminMarketplaceAnalytics } from '../../api/mlmApi'

export default function AdminMarketplaceAnalytics() {
  const [data, setData]     = useState(null)
  const [loading, setLoad]  = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => { getAdminMarketplaceAnalytics(period).then(setData).finally(() => setLoad(false)) }, [period])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const maxGmv = Math.max(...data.category_breakdown.map(c => c.gmv))

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🛒 Marketplace Analytics</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Member marketplace performance — listings, GMV, seller activity.</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['7d','30d','90d'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${period === p ? '#a5b4fc' : 'var(--border)'}`,
                background: period === p ? '#a5b4fc22' : 'transparent',
                color: period === p ? '#a5b4fc' : 'var(--text2)',
              }}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'GMV',              value: `$${data.summary.gmv.toLocaleString()}`,        color: '#86efac' },
            { label: 'Total Listings',   value: data.summary.listings.toLocaleString(),         color: '#a5b4fc' },
            { label: 'Active Sellers',   value: data.summary.active_sellers.toLocaleString(),   color: '#fbbf24' },
            { label: 'Transactions',     value: data.summary.transactions.toLocaleString(),     color: '#f9a8d4' },
            { label: 'Avg Sale Price',   value: `$${data.summary.avg_sale_price}`,              color: '#67e8f9' },
            { label: 'Pending Review',   value: data.summary.pending_review,                    color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>GMV by Category</div>
            {data.category_breakdown.map(c => (
              <div key={c.name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text)' }}>{c.name}</span>
                  <span style={{ fontWeight: 700 }}>${c.gmv.toLocaleString()}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(c.gmv/maxGmv)*100}%`, background: '#a5b4fc', borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{c.listings} listings · {c.sellers} sellers</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Top Sellers</div>
            {data.top_sellers.map((s, i) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: ['#fbbf24','#94a3b8','#b87333'][i]||'#a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#1e1b4b' }}>{i+1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.listings} listings</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#86efac' }}>${s.gmv.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.sales} sales</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Daily Transactions</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
            {data.daily_transactions.map((d, i) => {
              const maxT = Math.max(...data.daily_transactions.map(x => x.count))
              const h = Math.max(4, Math.round((d.count / maxT) * 80))
              return (
                <div key={i} title={`${d.date}: ${d.count} txns`} style={{ flex: 1, height: h, background: '#a5b4fc', borderRadius: '3px 3px 0 0', minWidth: 0 }} />
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text2)', marginTop: 4 }}>
            <span>{data.daily_transactions[0]?.date}</span>
            <span>{data.daily_transactions[data.daily_transactions.length-1]?.date}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
