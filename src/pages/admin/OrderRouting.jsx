import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminOrderRouting } from '../../api/mlmApi'

const PRIORITY_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#86efac' }
const STATUS_COLOR = { active: '#86efac', inactive: '#94a3b8', draft: '#fbbf24' }

export default function AdminOrderRouting() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    getAdminOrderRouting().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Order Routing</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Define rules to automatically route orders to the right warehouse or fulfillment partner</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ New Rule</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Active Rules', value: (data?.rules || []).filter(r => r.status === 'active').length, color: '#86efac' },
            { label: 'Warehouses', value: (data?.warehouses || []).length, color: '#93c5fd' },
            { label: 'Routed (7d)', value: data?.routed7d || 0, color: '#fbbf24' },
            { label: 'Fallback Rate', value: `${data?.fallbackRate || 0}%`, color: '#f87171' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Routing Rules <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>— evaluated in priority order</span></div>
            {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (data?.rules || []).map(rule => (
              <div key={rule.id} style={{ ...card, cursor: 'pointer', outline: selected?.id === rule.id ? '2px solid #6366f1' : 'none' }} onClick={() => setSelected(rule)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{rule.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[rule.status], background: `${STATUS_COLOR[rule.status]}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>{rule.status}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLOR[rule.priority], background: `${PRIORITY_COLOR[rule.priority]}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>P:{rule.priority}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>→ {rule.warehouse}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(rule.conditions || []).map((c, i) => (
                    <span key={i} style={{ fontSize: 11, background: 'rgba(99,102,241,.1)', color: '#818cf8', borderRadius: 6, padding: '2px 8px' }}>{c}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Orders routed: <strong style={{ color: 'var(--text)' }}>{rule.ordersRouted}</strong></div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Avg fulfil: <strong style={{ color: 'var(--text)' }}>{rule.avgFulfillHours}h</strong></div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ ...card }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Warehouses</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>…</div> : (data?.warehouses || []).map(w => (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: w.active ? '#86efac' : '#94a3b8', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.location} · {w.pendingOrders} pending</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...card }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Fallback Rule</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>If no rule matches, orders go to:</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#818cf8' }}>{loading ? '…' : data?.fallbackWarehouse}</div>
            </div>
          </div>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div style={{ ...card, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>New Routing Rule</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Rule Name', 'Target Warehouse'].map(f => (
                  <div key={f}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{f}</label>
                    <input style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Priority</label>
                  <select style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)' }}>
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Conditions</label>
                  <textarea rows={3} placeholder="e.g. country=NO, weight>5kg, product_type=peptide" style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Save Rule</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
