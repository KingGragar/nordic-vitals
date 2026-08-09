import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberOrderTracking } from '../../api/mlmApi'

const STATUS_LABELS = { in_transit: 'In Transit', delivered: 'Delivered', processing: 'Processing', shipped: 'Shipped' }
const STATUS_COLORS = {
  in_transit: { color: '#fbbf24', bg: '#3b2500', border: '#d97706' },
  delivered:  { color: '#86efac', bg: '#052e16', border: '#166534' },
  processing: { color: '#a5b4fc', bg: '#1e1b4b', border: '#3730a3' },
  shipped:    { color: '#fbbf24', bg: '#3b2500', border: '#d97706' },
}

export default function DashOrderTracking() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    getMemberOrderTracking().then(d => { setData(d); if (d?.orders?.[0]) setOpenId(d.orders[0].id) }).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📦 Order Tracking</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Live shipment status and delivery timeline for your recent orders.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.orders.map(order => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.processing
            const isOpen = openId === order.id
            const doneSteps = order.steps.filter(s => s.done).length
            const pct = Math.round((doneSteps / order.steps.length) * 100)
            return (
              <div key={order.id} style={card}>
                <div
                  onClick={() => setOpenId(isOpen ? null : order.id)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: isOpen ? 16 : 0 }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{order.orderNo}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
                      {order.items.map(i => i.name).join(', ')}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '3px 12px' }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span style={{ fontSize: 16, color: 'var(--text2)' }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text2)' }}>
                      <span>Carrier: <b style={{ color: 'var(--text)' }}>{order.carrier}</b></span>
                      <span>Tracking: <b style={{ color: 'var(--text)' }}>{order.trackingNo}</b></span>
                      <span>ETA: <b style={{ color: 'var(--text)' }}>{order.estimatedDelivery}</b></span>
                    </div>

                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 20 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: order.status === 'delivered' ? '#166534' : '#d97706', borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {order.steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                              background: step.done ? '#166534' : 'var(--border)',
                              border: `2px solid ${step.done ? '#86efac' : 'var(--border)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, color: step.done ? '#86efac' : 'var(--text2)',
                            }}>
                              {step.done ? '✓' : ''}
                            </div>
                            {idx < order.steps.length - 1 && (
                              <div style={{ width: 2, flex: 1, minHeight: 24, background: step.done ? '#166534' : 'var(--border)', margin: '2px 0' }} />
                            )}
                          </div>
                          <div style={{ paddingBottom: idx < order.steps.length - 1 ? 16 : 0 }}>
                            <div style={{ fontSize: 13, fontWeight: step.done ? 600 : 400, color: step.done ? 'var(--text)' : 'var(--text2)' }}>{step.label}</div>
                            {step.ts && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{step.ts}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
