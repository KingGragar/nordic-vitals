import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminCommissionDisputes, resolveAdminCommissionDispute } from '../../api/mlmApi'

const STATUS_COLORS = {
  open: { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8' },
  reviewing: { bg: '#3b2a0f', color: '#fcd34d', border: '#d97706' },
  resolved: { bg: '#052e16', color: '#86efac', border: '#166534' },
  denied: { bg: '#2d1515', color: '#fca5a5', border: '#991b1b' },
}

function DisputeModal({ dispute, onResolve, onClose }) {
  const [decision, setDecision] = useState('resolved')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }
  const lbl = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    await onResolve(dispute.id, { decision, note })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 540, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Dispute #{dispute.id}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><span style={{ color: 'var(--text2)' }}>Member:</span> <strong>{dispute.memberName}</strong></div>
            <div><span style={{ color: 'var(--text2)' }}>Run:</span> {dispute.runLabel}</div>
            <div><span style={{ color: 'var(--text2)' }}>Claimed:</span> <strong style={{ color: '#86efac' }}>{dispute.claimedAmount}</strong></div>
            <div><span style={{ color: 'var(--text2)' }}>Paid:</span> {dispute.paidAmount}</div>
          </div>
          <div style={{ marginTop: 10, color: 'var(--text2)', fontSize: 12 }}>Member's reason:</div>
          <div style={{ marginTop: 4, lineHeight: 1.5 }}>{dispute.reason}</div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Decision</label>
            <select value={decision} onChange={e => setDecision(e.target.value)} style={inp}>
              <option value="resolved">Resolve — approve correction</option>
              <option value="denied">Deny — calculation was correct</option>
              <option value="reviewing">Keep in Review</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Internal Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Reasoning for this decision…" />
          </div>
          <button type="submit" disabled={saving} style={{ padding: '10px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Submit Decision'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminCommissionDisputes() {
  const [disputes, setDisputes] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminCommissionDisputes().then(setDisputes).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleResolve(id, payload) {
    await resolveAdminCommissionDispute(id, payload)
    setDisputes(d => d.map(x => x.id === id ? { ...x, status: payload.decision, note: payload.note } : x))
  }

  const filtered = !disputes ? [] : filter === 'all' ? disputes : disputes.filter(d => d.status === filter)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  const stats = {
    total: (disputes || []).length,
    open: (disputes || []).filter(d => d.status === 'open').length,
    reviewing: (disputes || []).filter(d => d.status === 'reviewing').length,
    resolved: (disputes || []).filter(d => d.status === 'resolved').length,
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>⚖️ Commission Disputes</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Review and resolve member disputes about commission calculations.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total', value: stats.total },
            { label: 'Open', value: stats.open },
            { label: 'Reviewing', value: stats.reviewing },
            { label: 'Resolved', value: stats.resolved },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'open', 'reviewing', 'resolved', 'denied'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No disputes found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--text2)', borderBottom: '2px solid var(--border)' }}>
                  {['Member', 'Run', 'Claimed', 'Paid', 'Filed', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const sc = STATUS_COLORS[d.status] || STATUS_COLORS.open
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 600 }}>{d.memberName}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{d.runLabel}</td>
                      <td style={{ padding: '10px 10px', color: '#86efac', fontWeight: 600 }}>{d.claimedAmount}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{d.paidAmount}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{d.filedAt}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        {(d.status === 'open' || d.status === 'reviewing') && (
                          <button onClick={() => setModal(d)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}>
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <DisputeModal dispute={modal} onResolve={handleResolve} onClose={() => setModal(null)} />}
    </AdminLayout>
  )
}
