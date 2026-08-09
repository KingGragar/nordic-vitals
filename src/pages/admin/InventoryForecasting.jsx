import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminInventoryForecasting } from '../../api/mlmApi'

const RISK_COLOR = { critical: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#86efac' }

export default function AdminInventoryForecasting() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    getAdminInventoryForecasting().then(setData).finally(() => setLoading(false))
  }, [])

  const items = (data?.items||[]).filter(i => filter==='all' || i.risk===filter)

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Inventory Forecasting</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Demand predictions, reorder alerts, and stock projections</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Critical Stock', value: (data?.items||[]).filter(i=>i.risk==='critical').length, color: '#f87171' },
            { label: 'Reorder Needed', value: (data?.items||[]).filter(i=>i.risk==='high'||i.risk==='critical').length, color: '#fb923c' },
            { label: 'Avg Days Cover', value: `${data?.avgDaysCover||0}d`, color: '#93c5fd' },
            { label: 'SKUs Tracked', value: data?.items?.length || 0, color: '#c4b5fd' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all','critical','high','medium','low'].map(r => (
            <button key={r} onClick={() => setFilter(r)} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid var(--border)', background: filter===r ? (RISK_COLOR[r]||'#6366f1') : 'var(--card)', color: filter===r ? '#000' : 'var(--text)', cursor:'pointer', fontSize:13, textTransform:'capitalize', fontWeight: filter===r ? 700 : 400 }}>{r==='all'?'All Risks':r}</button>
          ))}
        </div>

        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {loading ? <div style={{ padding:32, textAlign:'center', color:'var(--text-muted)' }}>Loading…</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {['Product','SKU','Current Stock','Days Cover','30d Forecast','Reorder Qty','Lead Time','Risk','Projected Stockout'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'var(--text-muted)', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'transparent':'var(--row-alt,rgba(0,0,0,.03))' }}>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ fontWeight:600 }}>{item.name}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{item.category}</div>
                      </td>
                      <td style={{ padding:'12px 14px', fontFamily:'monospace', fontSize:12, color:'var(--text-muted)' }}>{item.sku}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ fontWeight:600, color: item.currentStock < item.reorderPoint ? '#f87171' : 'var(--text)' }}>{item.currentStock}</div>
                        <div style={{ fontSize:10, color:'var(--text-muted)' }}>reorder @ {item.reorderPoint}</div>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:40, height:5, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${Math.min(100, (item.daysCover/60)*100)}%`, height:'100%', background: item.daysCover<14?'#f87171':item.daysCover<30?'#fbbf24':'#86efac', borderRadius:3 }} />
                          </div>
                          <span style={{ color: item.daysCover<14?'#f87171':item.daysCover<30?'#fbbf24':'var(--text)', fontWeight:600 }}>{item.daysCover}d</span>
                        </div>
                      </td>
                      <td style={{ padding:'12px 14px', color:'#93c5fd' }}>{item.forecastUnits30d} units</td>
                      <td style={{ padding:'12px 14px', fontWeight:600 }}>{item.reorderQty}</td>
                      <td style={{ padding:'12px 14px', color:'var(--text-muted)', fontSize:13 }}>{item.leadTimeDays}d</td>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ color: RISK_COLOR[item.risk], background:'rgba(0,0,0,.2)', borderRadius:5, padding:'2px 8px', fontSize:12, textTransform:'capitalize', fontWeight:600 }}>{item.risk}</span>
                      </td>
                      <td style={{ padding:'12px 14px', color: item.risk==='critical'?'#f87171':'var(--text-muted)', fontSize:12, fontWeight: item.risk==='critical'?700:400 }}>
                        {item.stockoutDate ? new Date(item.stockoutDate).toLocaleDateString() : '> 60d'}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={9} style={{ padding:28, textAlign:'center', color:'var(--text-muted)' }}>No items in this risk category.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
