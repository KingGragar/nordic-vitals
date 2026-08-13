import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminDynamicDiscounts, toggleDynamicDiscount, deleteDynamicDiscount } from '../../api/mlmApi'

const TYPE_COLOR  = { percentage: '#86efac', fixed: '#fbbf24', free_shipping: '#a5b4fc', bogo: '#f9a8d4' }
const STATUS_COLOR = { active: '#86efac', paused: '#fbbf24', draft: '#a5b4fc' }

export default function AdminDynamicDiscounts() {
  const [data, setData]     = useState(null)
  const [loading, setLoad]  = useState(true)
  const [typeF, setTypeF]   = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { getAdminDynamicDiscounts().then(setData).finally(() => setLoad(false)) }, [])

  async function handleToggle(id, current) {
    const next = current === 'active' ? 'paused' : 'active'
    await toggleDynamicDiscount(id, next)
    setData(prev => ({ ...prev, rules: prev.rules.map(r => r.id === id ? { ...r, status: next } : r) }))
  }

  async function handleDelete(id) {
    await deleteDynamicDiscount(id)
    setData(prev => ({ ...prev, rules: prev.rules.filter(r => r.id !== id) }))
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const rules = data.rules.filter(r => typeF === 'all' || r.type === typeF)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💸 Dynamic Discounts</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Rule-based discount engine — conditions trigger automatic price reductions.</div>
          </div>
          <button onClick={() => setShowCreate(true)} style={{
            padding: '9px 18px', borderRadius: 9, border: 'none', background: '#a5b4fc', color: '#1e1b4b',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>+ New Rule</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Active Rules',     value: data.summary.active,        color: '#86efac' },
            { label: 'Total Discounts',  value: `$${data.summary.total_discounted.toLocaleString()}`, color: '#a5b4fc' },
            { label: 'Orders Affected',  value: data.summary.orders_affected.toLocaleString(), color: '#fbbf24' },
            { label: 'Avg Discount',     value: `${data.summary.avg_discount_pct}%`, color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all','percentage','fixed','free_shipping','bogo'].map(t => (
            <button key={t} onClick={() => setTypeF(t)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              border: `1px solid ${typeF === t ? (TYPE_COLOR[t]||'#a5b4fc') : 'var(--border)'}`,
              background: typeF === t ? (TYPE_COLOR[t]||'#a5b4fc')+'22' : 'transparent',
              color: typeF === t ? (TYPE_COLOR[t]||'#a5b4fc') : 'var(--text2)',
            }}>{t === 'all' ? 'All' : t.replace('_',' ')}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rules.map(r => (
            <div key={r.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</span>
                    <span style={{ background: (TYPE_COLOR[r.type]||'#a5b4fc')+'22', color: TYPE_COLOR[r.type]||'#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{r.type.replace('_',' ')}</span>
                    <span style={{ background: (STATUS_COLOR[r.status]||'#a5b4fc')+'22', color: STATUS_COLOR[r.status]||'#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{r.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    Condition: <strong style={{ color: 'var(--text)' }}>{r.condition}</strong>
                    &nbsp;·&nbsp;Value: <strong style={{ color: '#86efac' }}>{r.value}</strong>
                    &nbsp;·&nbsp;Min order: <strong style={{ color: 'var(--text)' }}>${r.min_order}</strong>
                    &nbsp;·&nbsp;Applied: <strong style={{ color: 'var(--text)' }}>{r.times_applied.toLocaleString()}×</strong>
                    {r.expires_at && <>&nbsp;·&nbsp;Expires: <strong style={{ color: '#fbbf24' }}>{new Date(r.expires_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</strong></>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleToggle(r.id, r.status)} style={{
                    padding: '6px 14px', borderRadius: 7, border: `1px solid ${r.status === 'active' ? '#fbbf24' : '#86efac'}`,
                    background: 'transparent', color: r.status === 'active' ? '#fbbf24' : '#86efac',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>{r.status === 'active' ? 'Pause' : 'Activate'}</button>
                  <button onClick={() => handleDelete(r.id)} style={{
                    padding: '6px 14px', borderRadius: 7, border: '1px solid #f87171',
                    background: 'transparent', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>Delete</button>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100,(r.times_applied/r.target_uses)*100||0)}%`, background: TYPE_COLOR[r.type]||'#a5b4fc', borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{r.times_applied}/{r.target_uses} target uses</div>
            </div>
          ))}
          {rules.length === 0 && <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No discount rules match.</div>}
        </div>

        {showCreate && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 420, maxWidth: '95vw' }}>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 16 }}>New Discount Rule</div>
              {['Rule Name','Condition (e.g. cart > $100)','Discount Value (e.g. 10% or $15)','Min Order ($)'].map(lbl => (
                <div key={lbl} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{lbl}</div>
                  <input placeholder={lbl} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowCreate(false)} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#86efac', color: '#14532d', fontWeight: 700, cursor: 'pointer' }}>Create Rule</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
