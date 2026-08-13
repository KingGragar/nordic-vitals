import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminTicketEscalations, resolveEscalation } from '../../api/mlmApi'

const PRIORITY_COLOR = { urgent: '#f87171', high: '#fbbf24', medium: '#86efac' }
const STATUS_COLOR   = { breach_risk: '#f87171', open: '#fbbf24' }

export default function AdminTicketEscalations() {
  const [data, setData]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [priorityF, setPriorityF] = useState('all')
  const [modal, setModal]       = useState(null)
  const [decision, setDecision]  = useState('resolved')
  const [note, setNote]         = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { getAdminTicketEscalations().then(setData).finally(() => setLoading(false)) }, [])

  async function handleResolve() {
    if (!modal) return
    setSubmitting(true)
    await resolveEscalation(modal.id, decision, note)
    setData(prev => ({ ...prev, tickets: prev.tickets.filter(t => t.id !== modal.id), summary: { ...prev.summary, open: prev.summary.open - 1, resolved_today: prev.summary.resolved_today + 1 } }))
    setModal(null); setNote(''); setSubmitting(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign:'center', padding:80, color:'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const filtered = data.tickets.filter(t => priorityF === 'all' || t.priority === priorityF)
  const fmtTime  = iso => new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  const fmtDate  = iso => new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short' })

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🚨 Ticket Escalations</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>High-priority support tickets needing immediate attention.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Open Escalations', value: data.summary.open,             color: '#fbbf24' },
            { label: 'Breach Risk',       value: data.summary.breach_risk,      color: '#f87171' },
            { label: 'Resolved Today',    value: data.summary.resolved_today,   color: '#86efac' },
            { label: 'Avg Resolution',    value: `${data.summary.avg_resolution_h}h`, color: '#a5b4fc' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['all','urgent','high','medium'].map(p => (
            <button key={p} onClick={() => setPriorityF(p)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${priorityF === p ? (PRIORITY_COLOR[p]||'#a5b4fc') : 'var(--border)'}`,
              background: priorityF === p ? (PRIORITY_COLOR[p]||'#a5b4fc')+'22' : 'transparent',
              color: priorityF === p ? (PRIORITY_COLOR[p]||'#a5b4fc') : 'var(--text2)', textTransform: 'capitalize',
            }}>{p === 'all' ? 'All' : p}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(t => (
            <div key={t.id} style={{ ...card, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>#{t.id} — {t.subject}</span>
                  <span style={{ background: (PRIORITY_COLOR[t.priority]||'#a5b4fc')+'22', color: PRIORITY_COLOR[t.priority]||'#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{t.priority}</span>
                  {t.status === 'breach_risk' && <span style={{ background: '#f8717122', color: '#f87171', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>⚠ SLA Breach Risk</span>}
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text2)' }}>
                  <span>Member: <strong style={{ color: 'var(--text)' }}>{t.member}</strong></span>
                  <span>Reason: <strong style={{ color: 'var(--text)' }}>{t.reason}</strong></span>
                  <span>Assigned: <strong style={{ color: 'var(--text)' }}>{t.assigned_to}</strong></span>
                  <span>Contacts: <strong style={{ color: t.contact_count >= 3 ? '#f87171' : 'var(--text)' }}>{t.contact_count}</strong></span>
                  <span>Opened: {fmtDate(t.opened_at)} {fmtTime(t.opened_at)}</span>
                  <span>SLA due: {fmtDate(t.sla_due_at)} {fmtTime(t.sla_due_at)}</span>
                </div>
              </div>
              <button onClick={() => setModal(t)} style={{
                padding: '8px 18px', borderRadius: 8, border: 'none', background: '#a5b4fc', color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>Resolve</button>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No tickets match filter.</div>}
        </div>

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 420, maxWidth: '95vw' }}>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Resolve Ticket #{modal.id}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 18 }}>{modal.subject}</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Decision</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['resolved','escalated_tier2','refunded','credited'].map(d => (
                    <button key={d} onClick={() => setDecision(d)} style={{
                      flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                      border: `1px solid ${decision === d ? '#a5b4fc' : 'var(--border)'}`,
                      background: decision === d ? '#a5b4fc22' : 'transparent',
                      color: decision === d ? '#a5b4fc' : 'var(--text2)',
                    }}>{d.replace('_',' ')}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Internal Note</div>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Resolution note…"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleResolve} disabled={submitting} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: '#86efac', color: '#14532d', fontWeight: 700, cursor: 'pointer' }}>
                  {submitting ? 'Saving…' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
