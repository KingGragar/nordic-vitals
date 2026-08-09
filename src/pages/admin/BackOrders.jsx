import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminBackOrders } from '../../api/mlmApi'

const ST_COLOR = { pending: '#fbbf24', notified: '#93c5fd', fulfilled: '#86efac', cancelled: '#f87171' }

export default function AdminBackOrders() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    getAdminBackOrders().then(setData).finally(() => setLoading(false))
  }, [])

  const orders = (data?.orders || []).filter(o => filter === 'all' || o.status === filter)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Back Orders</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Manage orders awaiting restocked inventory — notify customers and fulfill when stock arrives</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Back Orders', value: data?.orders?.length || 0, color: '#93c5fd' },
            { label: 'Pending', value: (data?.orders || []).filter(o => o.status === 'pending').length, color: '#fbbf24' },
            { label: 'Customers Waiting', value: data?.customersWaiting || 0, color: '#c4b5fd' },
            { label: 'Avg Wait Days', value: `${data?.avgWaitDays || 0}d`, color: '#86efac' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'pending', 'notified', 'fulfilled', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: filter === s ? '#6366f1' : 'var(--card)', color: filter === s ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{s === 'all' ? 'All' : s}</button>
          ))}
        </div>

        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Order ID', 'Customer', 'Product', 'SKU', 'Qty', 'Order Date', 'Est. Restock', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--row-alt,rgba(0,0,0,.03))' }}>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{o.orderId}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.customerEmail}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{o.productName}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{o.sku}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>{o.qty}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.orderDate).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: o.estRestock ? '#fbbf24' : 'var(--text-muted)' }}>{o.estRestock ? new Date(o.estRestock).toLocaleDateString() : 'TBD'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ color: ST_COLOR[o.status], background: 'rgba(0,0,0,.2)', borderRadius: 5, padding: '2px 8px', fontSize: 12, textTransform: 'capitalize', fontWeight: 600 }}>{o.status}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {o.status === 'pending' && (
                            <button onClick={() => setSelected(o)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 5, border: '1px solid #93c5fd', background: 'transparent', color: '#93c5fd', cursor: 'pointer' }}>Notify</button>
                          )}
                          {o.status === 'notified' && (
                            <button onClick={() => setSelected(o)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 5, border: '1px solid #86efac', background: 'transparent', color: '#86efac', cursor: 'pointer' }}>Fulfill</button>
                          )}
                          {(o.status === 'pending' || o.status === 'notified') && (
                            <button style={{ fontSize: 12, padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={9} style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>No back orders in this category.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelected(null)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 440, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px' }}>{selected.status === 'pending' ? 'Notify Customer' : 'Mark as Fulfilled'}</h3>
              <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 14 }}>
                Order <strong>{selected.orderId}</strong> — {selected.productName} × {selected.qty}<br />
                Customer: {selected.customerName} ({selected.customerEmail})
              </p>
              {selected.status === 'pending' && (
                <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-muted)' }}>
                  Send an email notification to the customer with the estimated restock date and a courtesy note.
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setSelected(null)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setSelected(null)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  {selected.status === 'pending' ? 'Send Notification' : 'Mark Fulfilled'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
