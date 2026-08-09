import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminUpsellRules } from '../../api/mlmApi'

const TYPE_COLOR = { upsell: '#818cf8', crosssell: '#34d399', bundle: '#fbbf24' }
const TYPE_LABEL = { upsell: 'Upsell', crosssell: 'Cross-sell', bundle: 'Bundle' }

export default function AdminUpsellRules() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAdminUpsellRules().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Upsell & Cross-sell Rules</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Configure product recommendation triggers shown on product pages, cart, and checkout</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ New Rule</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Active Rules', value: (data?.rules || []).filter(r => r.active).length, color: '#86efac' },
            { label: 'Triggered (30d)', value: data?.triggeredCount || 0, color: '#93c5fd' },
            { label: 'Conversions (30d)', value: data?.conversions || 0, color: '#818cf8' },
            { label: 'Revenue Attributed', value: `€${(data?.revenueAttributed || 0).toLocaleString()}`, color: '#fbbf24' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
            (data?.rules || []).map(rule => (
              <div key={rule.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 280px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[rule.type], background: `${TYPE_COLOR[rule.type]}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{TYPE_LABEL[rule.type] || rule.type}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{rule.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Trigger: <strong>{rule.triggerProduct}</strong> → Recommend: <strong>{rule.recommendProduct}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 18, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>Placement: <strong style={{ color: 'var(--text)' }}>{rule.placement}</strong></span>
                  <span>Shown: <strong style={{ color: '#93c5fd' }}>{rule.impressions.toLocaleString()}</strong></span>
                  <span>Converted: <strong style={{ color: '#86efac' }}>{rule.conversions}</strong></span>
                  <span>CVR: <strong style={{ color: '#fbbf24' }}>{rule.cvr}%</strong></span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  <button style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  <button style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: rule.active ? '#86efac22' : 'var(--border)', color: rule.active ? '#86efac' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {rule.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))
          )}
          {!loading && (data?.rules || []).length === 0 && (
            <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No upsell rules configured yet.</div>
          )}
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 480, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>New Upsell / Cross-sell Rule</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {[
                  { label: 'Rule Name', placeholder: 'e.g. BPC-157 → TB-500 upsell' },
                  { label: 'Trigger Product', placeholder: 'Product that triggers this rule' },
                  { label: 'Recommended Product', placeholder: 'Product to recommend' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                    <input placeholder={f.placeholder} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Rule Type</label>
                  <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                    <option value="upsell">Upsell (premium version)</option>
                    <option value="crosssell">Cross-sell (complementary product)</option>
                    <option value="bundle">Bundle (package deal)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Placement</label>
                  <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                    <option>Product page</option>
                    <option>Cart</option>
                    <option>Checkout</option>
                    <option>Post-purchase</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Save Rule</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
