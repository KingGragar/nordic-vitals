import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberAutoOrderTemplates, toggleAutoOrderTemplate, deleteAutoOrderTemplate } from '../../api/mlmApi'

export default function DashAutoOrderTemplates() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { getMemberAutoOrderTemplates().then(setData).finally(() => setLoading(false)) }, [])

  async function handleToggle(id, currentActive) {
    setTogglingId(id)
    await toggleAutoOrderTemplate(id, !currentActive)
    setData(prev => ({
      ...prev,
      templates: prev.templates.map(t => t.id === id ? { ...t, active: !t.active, next_order: !currentActive ? '2026-09-01' : null } : t),
    }))
    setTogglingId(null)
  }

  async function handleDelete(id) {
    setDeletingId(id)
    await deleteAutoOrderTemplate(id)
    setData(prev => ({ ...prev, templates: prev.templates.filter(t => t.id !== id) }))
    setDeletingId(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign:'center', padding:80, color:'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🔄 AutoOrder Templates</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Recurring order templates — activate and your stack ships automatically.</div>
          </div>
          <button style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ New Template</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Active Templates',  value: data.summary.active,                         color: '#86efac' },
            { label: 'Est. Monthly PV',   value: data.summary.pv_per_month,                   color: '#a5b4fc' },
            { label: 'Total Orders Saved', value: `${data.summary.total_saved}% avg discount`, color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.templates.map(t => (
            <div key={t.id} style={{ ...card, border: t.active ? '1px solid #86efac66' : '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {t.frequency.charAt(0).toUpperCase() + t.frequency.slice(1)} on day {t.day} · {t.orders_placed} orders placed
                    {t.next_order && ` · Next: ${t.next_order}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => handleToggle(t.id, t.active)} disabled={togglingId === t.id} style={{
                    position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none',
                    background: t.active ? '#86efac' : 'var(--border)', cursor: 'pointer', transition: 'background .25s',
                  }}>
                    <span style={{ position: 'absolute', top: 3, left: t.active ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .25s' }} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 14 }}>🗑</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {t.items.map((item, i) => (
                  <div key={i} style={{ background: 'var(--border)', borderRadius: 8, padding: '5px 12px', fontSize: 12 }}>
                    <span style={{ fontWeight: 600 }}>{item.name}</span> <span style={{ color: 'var(--text2)' }}>×{item.qty}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 24, fontSize: 13, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div>
                  <span style={{ color: 'var(--text2)', fontSize: 12 }}>Total Price</span>
                  <div style={{ fontWeight: 800, color: '#86efac' }}>NOK {t.total_price}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text2)', fontSize: 12 }}>PV</span>
                  <div style={{ fontWeight: 800, color: '#a5b4fc' }}>{t.total_pv}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text2)', fontSize: 12 }}>Status</span>
                  <div style={{ fontWeight: 700, color: t.active ? '#86efac' : 'var(--text2)' }}>{t.active ? 'Active' : 'Paused'}</div>
                </div>
              </div>
            </div>
          ))}

          {data.templates.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔄</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>No templates yet</div>
              <div style={{ fontSize: 13 }}>Create a recurring order template to never miss your stack.</div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
