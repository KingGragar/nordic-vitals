import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminChargebacks, updateAdminChargeback } from '../../api/mlmApi'

const ST_COLOR = { open: '#fbbf24', won: '#86efac', lost: '#f87171', pending: '#93c5fd' }
const REASON_ICON = { fraudulent: '⚠️', unrecognized: '❓', duplicate: '🔄', product_not_received: '📦', subscription_canceled: '✂️', other: '📋' }

export default function AdminChargebacks() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminChargebacks().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleAction(id, action) {
    setSaving(true)
    await updateAdminChargeback(id, action, note)
    setData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, status: action === 'contest' ? 'pending' : action } : i)
    }))
    setSelected(null)
    setNote('')
    setSaving(false)
  }

  const items = (data?.items || []).filter(i => filter === 'all' || i.status === filter)

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const btn = (bg, fg = '#fff') => ({ padding: '7px 16px', borderRadius: 7, border: 'none', background: bg, color: fg, fontWeight: 600, cursor: 'pointer', fontSize: 13 })
  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Chargeback Management</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Track and respond to payment disputes and chargebacks</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Open', value: (data?.items||[]).filter(i=>i.status==='open').length, color: '#fbbf24' },
            { label: 'Won (YTD)', value: (data?.items||[]).filter(i=>i.status==='won').length, color: '#86efac' },
            { label: 'Lost (YTD)', value: (data?.items||[]).filter(i=>i.status==='lost').length, color: '#f87171' },
            { label: 'Total at Risk', value: `€${(data?.items||[]).filter(i=>i.status==='open'||i.status==='pending').reduce((s,i)=>s+i.amount,0).toLocaleString()}`, color: '#c4b5fd' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all','open','pending','won','lost'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: filter === s ? '#6366f1' : 'var(--card)', color: filter === s ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{s}</button>
          ))}
        </div>

        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Case ID','Member','Amount','Reason','Gateway','Status','Deadline',''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: i%2===0?'transparent':'var(--row-alt,rgba(0,0,0,.03))' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{item.caseId}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.member}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f87171' }}>€{item.amount.toFixed(2)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{REASON_ICON[item.reason] || '📋'} {item.reason.replace(/_/g,' ')}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 13 }}>{item.gateway}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: ST_COLOR[item.status], background: 'rgba(0,0,0,.2)', borderRadius: 5, padding: '2px 8px', fontSize: 12, textTransform: 'capitalize' }}>{item.status}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: new Date(item.deadline) < new Date() ? '#f87171' : 'var(--text-muted)' }}>
                        {new Date(item.deadline).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {(item.status === 'open') && (
                          <button style={{ ...btn('#6366f1'), padding: '4px 10px', fontSize: 12 }} onClick={() => { setSelected(item); setNote('') }}>Review</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={8} style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>No chargebacks in this filter.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Review Chargeback</h2>
              <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: 13 }}>{selected.caseId} · {selected.member} · €{selected.amount.toFixed(2)}</p>
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 13 }}>
                <div><strong>Reason:</strong> {selected.reason.replace(/_/g,' ')}</div>
                <div style={{ marginTop: 6 }}><strong>Gateway:</strong> {selected.gateway}</div>
                <div style={{ marginTop: 6 }}><strong>Deadline:</strong> {new Date(selected.deadline).toLocaleDateString()}</div>
                {selected.orderRef && <div style={{ marginTop: 6 }}><strong>Order Ref:</strong> {selected.orderRef}</div>}
              </div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Internal Note</label>
              <textarea style={{ ...inp, height: 80, resize: 'vertical', marginBottom: 18 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note for this decision…" />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button style={btn('var(--border)','var(--text)')} onClick={() => setSelected(null)}>Cancel</button>
                <button style={btn('#ef4444')} disabled={saving} onClick={() => handleAction(selected.id,'accept')}>Accept Loss</button>
                <button style={btn('#10b981')} disabled={saving} onClick={() => handleAction(selected.id,'contest')}>Contest</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
