import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminDropshipPartners, updateDropshipPartnerStatus } from '../../api/mlmApi'

const STATUS_COLOR = { active: '#86efac', on_hold: '#fbbf24', inactive: '#f87171' }

function Bar({ pct, color = '#a5b4fc' }) {
  return (
    <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, width: '100%' }}>
      <div style={{ background: color, width: `${pct}%`, height: '100%', borderRadius: 4, transition: 'width .4s' }} />
    </div>
  )
}

export default function AdminDropshipPartners() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusF, setStatusF] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => { getAdminDropshipPartners().then(setData).finally(() => setLoading(false)) }, [])

  async function handleStatus(id, status) {
    await updateDropshipPartnerStatus(id, status)
    setData(prev => ({ ...prev, partners: prev.partners.map(p => p.id === id ? { ...p, status } : p) }))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const fmt  = n => n >= 1000 ? `NOK ${(n/1000).toFixed(1)}k` : `NOK ${n}`

  if (loading) return <AdminLayout><div style={{ textAlign:'center', padding:80, color:'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const filtered = data.partners.filter(p => statusF === 'all' || p.status === statusF)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🚚 Dropship Partners</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Third-party fulfillment partners — margin, lead time and reliability.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Partners',   value: data.summary.total,         color: '#a5b4fc' },
            { label: 'Active',           value: data.summary.active,        color: '#86efac' },
            { label: 'On Hold',          value: data.summary.on_hold,       color: '#fbbf24' },
            { label: 'Avg Lead Days',    value: `${data.summary.avg_lead_days}d`, color: '#f9a8d4' },
            { label: 'Avg Margin %',     value: `${data.summary.avg_margin}%`,    color: '#86efac' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['all','active','on_hold','inactive'].map(s => (
            <button key={s} onClick={() => setStatusF(s)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${statusF === s ? '#a5b4fc' : 'var(--border)'}`,
              background: statusF === s ? '#a5b4fc22' : 'transparent',
              color: statusF === s ? '#a5b4fc' : 'var(--text2)', textTransform: 'capitalize',
            }}>{s === 'all' ? 'All' : s.replace('_',' ')}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelected(p)} style={{
                ...card, cursor: 'pointer', outline: selected?.id === p.id ? '2px solid #a5b4fc' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 15, marginRight: 8 }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>{p.country} · {p.contact}</span>
                  </div>
                  <span style={{ background: (STATUS_COLOR[p.status]||'#a5b4fc')+'22', color: STATUS_COLOR[p.status]||'#a5b4fc', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{p.status.replace('_',' ')}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                  {[
                    { label: 'Margin', value: `${p.margin_pct}%`, pct: p.margin_pct * 2, color: '#86efac' },
                    { label: 'Reliability', value: `${p.reliability_pct}%`, pct: p.reliability_pct, color: '#a5b4fc' },
                    { label: 'Lead Days', value: `${p.lead_days}d`, pct: (1 - p.lead_days/10)*100, color: '#fbbf24' },
                    { label: 'SKUs', value: p.skus_count, pct: Math.min(p.skus_count/3, 100), color: '#f9a8d4' },
                  ].map(m => (
                    <div key={m.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{m.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}</span>
                      </div>
                      <Bar pct={m.pct} color={m.color} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12, color: 'var(--text2)' }}>
                  <span>Orders (30d): <strong style={{ color: 'var(--text)' }}>{p.orders_30d.toLocaleString()}</strong></span>
                  <span>Revenue (30d): <strong style={{ color: 'var(--text)' }}>{fmt(p.revenue_30d)}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ ...card, alignSelf: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{selected.name}</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 18, cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Contact', selected.contact],['Country', selected.country],['Margin', `${selected.margin_pct}%`],['Lead Days', `${selected.lead_days} days`],['Reliability', `${selected.reliability_pct}%`],['SKU Count', selected.skus_count]].map(([l,v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text2)' }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Change Status</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['active','on_hold','inactive'].map(s => (
                      <button key={s} onClick={() => handleStatus(selected.id, s)} style={{
                        flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${selected.status === s ? STATUS_COLOR[s] : 'var(--border)'}`,
                        background: selected.status === s ? STATUS_COLOR[s]+'22' : 'transparent',
                        color: selected.status === s ? STATUS_COLOR[s] : 'var(--text2)', textTransform: 'capitalize',
                      }}>{s.replace('_',' ')}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
