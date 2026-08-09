import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminCommissionClawbacks, processAdminClawback } from '../../api/mlmApi'

const REASON_LABELS = { return: 'Product Return', chargeback: 'Chargeback', fraud: 'Fraud', policy: 'Policy Violation', cancel: 'Order Cancellation' }
const STATUS_COLORS = { pending: '#fbbf24', processing: '#a5b4fc', completed: '#86efac', disputed: '#f9a8d4', waived: 'var(--text2)' }

export default function AdminCommissionClawbacks() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [processing, setProcessing] = useState(null)
  const [modal, setModal] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    getAdminCommissionClawbacks().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleProcess(id, action) {
    setProcessing(id)
    await processAdminClawback(id, action, note)
    setData(prev => ({
      ...prev,
      clawbacks: prev.clawbacks.map(c => c.id === id ? { ...c, status: action === 'approve' ? 'processing' : 'waived' } : c),
    }))
    setModal(null); setNote(''); setProcessing(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const statuses = ['all', 'pending', 'processing', 'completed', 'disputed', 'waived']
  const filtered = data.clawbacks.filter(c => statusFilter === 'all' || c.status === statusFilter)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>↩️ Commission Clawbacks</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Track and process commission reversals due to returns, chargebacks, fraud, or policy violations.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Pending',        value: data.stats.pending,                        color: '#fbbf24' },
            { label: 'This Month',     value: `€${data.stats.thisMonth.toLocaleString()}`, color: '#f87171' },
            { label: 'YTD Recovered',  value: `€${data.stats.ytdRecovered.toLocaleString()}`, color: '#86efac' },
            { label: 'Avg Resolution', value: `${data.stats.avgResolutionDays}d`,         color: '#a5b4fc' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '5px 14px', borderRadius: 20, border: `1px solid ${statusFilter === s ? (STATUS_COLORS[s] || 'var(--gold)') : 'var(--border)'}`,
              background: statusFilter === s ? (STATUS_COLORS[s] || 'var(--gold)') + '22' : 'transparent',
              color: statusFilter === s ? (STATUS_COLORS[s] || 'var(--gold)') : 'var(--text2)',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
            }}>{s}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.memberName}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {REASON_LABELS[c.reason] || c.reason} · Order {c.orderId} · {c.date}
                </div>
                {c.note && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, fontStyle: 'italic' }}>{c.note}</div>}
              </div>
              <div style={{ textAlign: 'right', minWidth: 90 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#f87171' }}>−€{c.amount.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>commission</div>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: (STATUS_COLORS[c.status] || '#888') + '22',
                color: STATUS_COLORS[c.status] || '#888', textTransform: 'capitalize', minWidth: 80, textAlign: 'center',
              }}>{c.status}</span>
              {c.status === 'pending' && (
                <button
                  onClick={() => { setModal(c); setNote('') }}
                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                >
                  Review
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 14 }}>No clawbacks match this filter.</div>
          )}
        </div>

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ ...card, width: '100%', maxWidth: 440 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Review Clawback</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{modal.memberName} · €{modal.amount.toFixed(2)} · {REASON_LABELS[modal.reason]}</div>
              <textarea
                value={note} onChange={e => setNote(e.target.value)}
                placeholder="Internal note (optional)…"
                rows={3}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button onClick={() => handleProcess(modal.id, 'approve')} disabled={processing === modal.id} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#86efac', color: '#052e16', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  {processing === modal.id ? '…' : 'Approve Clawback'}
                </button>
                <button onClick={() => handleProcess(modal.id, 'waive')} disabled={processing === modal.id} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  Waive
                </button>
                <button onClick={() => setModal(null)} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
