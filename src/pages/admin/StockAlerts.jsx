import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminStockAlerts, updateAdminStockAlertThreshold, dismissAdminStockAlert } from '../../api/mlmApi'

const LEVEL_COLORS = {
  critical: { bg: '#2d1515', color: '#fca5a5', border: '#991b1b' },
  low:      { bg: '#3b2500', color: '#fbbf24', border: '#d97706' },
  ok:       { bg: '#052e16', color: '#86efac', border: '#166534' },
}

export default function AdminStockAlerts() {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [editId, setEditId] = useState(null)
  const [editVal, setEditVal] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getAdminStockAlerts().then(setItems).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function saveThreshold(id) {
    const threshold = parseInt(editVal, 10)
    if (isNaN(threshold) || threshold < 0) return
    await updateAdminStockAlertThreshold(id, threshold)
    setItems(prev => prev.map(x => x.id === id ? { ...x, threshold } : x))
    setEditId(null)
  }

  async function dismiss(id) {
    await dismissAdminStockAlert(id)
    setItems(prev => prev.map(x => x.id === id ? { ...x, dismissed: true, level: 'ok' } : x))
  }

  const filtered = !items ? [] : filter === 'all' ? items : items.filter(i => i.level === filter)
  const stats = {
    critical: (items || []).filter(i => i.level === 'critical').length,
    low: (items || []).filter(i => i.level === 'low').length,
    ok: (items || []).filter(i => i.level === 'ok').length,
  }
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🔔 Stock Alerts</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Monitor inventory levels and configure low-stock thresholds per SKU.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Critical', value: stats.critical, color: '#fca5a5' },
            { label: 'Low Stock', value: stats.low, color: '#fbbf24' },
            { label: 'OK', value: stats.ok, color: '#86efac' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'critical', 'low', 'ok'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No alerts found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(item => {
              const lc = LEVEL_COLORS[item.level] || LEVEL_COLORS.ok
              return (
                <div key={item.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>SKU: {item.sku}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: lc.color }}>{item.stock}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>In Stock</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    {editId === item.id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input
                          type="number"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
                          min="0"
                        />
                        <button onClick={() => saveThreshold(item.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#166534', color: '#86efac', fontSize: 12, cursor: 'pointer' }}>✓</button>
                        <button onClick={() => setEditId(null)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>✗</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditId(item.id); setEditVal(String(item.threshold)) }} style={{ fontSize: 13, color: 'var(--text2)', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
                        Threshold: {item.threshold}
                      </button>
                    )}
                  </div>
                  <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: lc.bg, color: lc.color, border: `1px solid ${lc.border}` }}>
                    {item.level.toUpperCase()}
                  </span>
                  {item.level !== 'ok' && !item.dismissed && (
                    <button onClick={() => dismiss(item.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                      Dismiss
                    </button>
                  )}
                  <div style={{ color: 'var(--text2)', fontSize: 11, minWidth: 90 }}>{item.lastUpdated}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
