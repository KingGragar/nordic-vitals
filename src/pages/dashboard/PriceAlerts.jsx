import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberPriceAlerts, deleteMemberPriceAlert, toggleMemberPriceAlert } from '../../api/mlmApi'

const TYPE_META = {
  price_drop:  { icon: '📉', label: 'Price Drop', color: '#86efac' },
  back_in_stock: { icon: '📦', label: 'Back in Stock', color: '#93c5fd' },
  low_stock:   { icon: '⚠️', label: 'Low Stock', color: '#fbbf24' },
}

export default function DashPriceAlerts() {
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    getMemberPriceAlerts().then(setAlerts).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function toggle(id) {
    await toggleMemberPriceAlert(id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))
  }

  async function del(id) {
    await deleteMemberPriceAlert(id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const activeCount = (alerts || []).filter(a => a.active).length
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🔔 Price & Stock Alerts</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>{activeCount} active alert{activeCount !== 1 ? 's' : ''}. Get notified when prices drop or products come back in stock.</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !alerts || alerts.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No alerts set</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Browse products and tap "Notify me" to track price drops and restocks.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map(alert => {
              const meta = TYPE_META[alert.type] || { icon: '🔔', label: alert.type, color: 'var(--text)' }
              return (
                <div key={alert.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', opacity: alert.active ? 1 : 0.55 }}>
                  {alert.image && <img src={alert.image} alt="" style={{ width: 52, height: 52, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 700 }}>{alert.productName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <span style={{ fontSize: 11, color: meta.color, fontWeight: 600 }}>{meta.icon} {meta.label}</span>
                      {alert.targetPrice && <span style={{ fontSize: 12, color: 'var(--text2)' }}>below {alert.targetPrice}</span>}
                    </div>
                    {alert.currentPrice && (
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Current: {alert.currentPrice}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div
                      onClick={() => toggle(alert.id)}
                      style={{ width: 40, height: 22, borderRadius: 11, background: alert.active ? '#166534' : 'var(--border)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <div style={{ position: 'absolute', top: 3, left: alert.active ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                    </div>
                    <button onClick={() => del(alert.id)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #991b1b', background: 'transparent', color: '#fca5a5', fontSize: 12, cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ ...card, marginTop: 18, background: 'transparent', borderStyle: 'dashed' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>💡 How alerts work</div>
          <ul style={{ color: 'var(--text2)', fontSize: 13, margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Price drop — triggers when the product price falls below your target</li>
            <li>Back in stock — notifies you the moment an out-of-stock item is replenished</li>
            <li>Low stock — warns you when fewer than 5 units remain</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
