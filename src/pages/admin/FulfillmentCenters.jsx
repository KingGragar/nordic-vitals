import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminFulfillmentCenters } from '../../api/mlmApi'

const STATUS_COLORS = {
  operational: { bg: '#052e16', color: '#86efac', border: '#166534' },
  maintenance: { bg: '#1c1917', color: '#fbbf24', border: '#92400e' },
  offline:     { bg: '#18181b', color: '#71717a', border: '#3f3f46' },
}

export default function AdminFulfillmentCenters() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    getAdminFulfillmentCenters().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🏭 Fulfillment Centers</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Warehouse capacity, active orders, and fulfillment status across all locations.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Centers',         value: data.stats.centers,                    color: '#a5b4fc' },
            { label: 'Active Orders',   value: data.stats.activeOrders.toLocaleString(), color: '#fbbf24' },
            { label: 'Avg Pick Time',   value: data.stats.avgPickTime,                color: '#86efac' },
            { label: 'On-Time Rate',    value: `${data.stats.onTimeRate}%`,           color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
          {data.centers.map(fc => {
            const sc = STATUS_COLORS[fc.status] || STATUS_COLORS.offline
            const capColor = fc.capacity > 80 ? '#fca5a5' : fc.capacity > 60 ? '#fbbf24' : '#86efac'
            return (
              <div key={fc.id} style={{ ...card }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{fc.name}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12 }}>{fc.country}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '3px 12px', textTransform: 'capitalize' }}>
                    {fc.status}
                  </span>
                </div>

                {fc.status !== 'offline' && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text2)' }}>Capacity</span>
                      <span style={{ color: capColor, fontWeight: 700 }}>{fc.capacity}%</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${fc.capacity}%`, background: capColor, borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Active Orders',  value: fc.activeOrders.toLocaleString(), color: '#fbbf24' },
                    { label: 'Staff',           value: fc.staff,                         color: '#a5b4fc' },
                    { label: 'Pending Stock',   value: fc.pendingStock > 0 ? `⚠ ${fc.pendingStock}` : '✓ 0', color: fc.pendingStock > 0 ? '#fca5a5' : '#86efac' },
                    { label: 'Last Sync',       value: fc.lastSync.slice(11, 16) + ' UTC', color: 'var(--text2)' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
