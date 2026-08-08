import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminPayoutSchedule, updateAdminPayoutSchedule, triggerAdminPayoutRun } from '../../api/mlmApi'

const RUN_STATUS = {
  scheduled:  { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8', label: 'Scheduled' },
  pending:    { bg: '#2d2200', color: '#fbbf24', border: '#92400e', label: 'Pending' },
  completed:  { bg: '#052e16', color: '#86efac', border: '#166534', label: 'Completed' },
  processing: { bg: '#1a0d2e', color: '#c084fc', border: '#7e22ce', label: 'Processing' },
}

export default function AdminPayoutSchedule() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [triggered, setTriggered] = useState(null)

  useEffect(() => {
    getAdminPayoutSchedule().then(d => { setData(d); setForm(d) }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await updateAdminPayoutSchedule(form)
    setData(form)
    setSaving(false)
    setEditing(false)
  }

  async function handleTrigger(run) {
    if (!window.confirm(`Trigger payout run for ${run.scheduledDate}? This will initiate processing immediately.`)) return
    await triggerAdminPayoutRun(run.id)
    setTriggered(run.id)
    setData(prev => ({
      ...prev,
      upcomingRuns: prev.upcomingRuns.map(r => r.id === run.id ? { ...r, status: 'processing' } : r)
    }))
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }
  const lbl = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>

  return (
    <AdminLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💸 Payout Schedule</div>
        <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 22 }}>Configure when commission payouts are processed and dispatched to members.</div>

        {/* Config Card */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Schedule Configuration</div>
            {!editing && (
              <button onClick={() => setEditing(true)} style={{ padding: '7px 16px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Edit</button>
            )}
          </div>

          {!editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {[
                { label: 'Frequency', value: data.frequency.charAt(0).toUpperCase() + data.frequency.slice(1) },
                { label: 'Processing Day', value: DAYS[data.dayOfWeek] },
                { label: 'Cutoff (days before)', value: `${data.cutoffDays} days` },
                { label: 'Minimum Payout', value: `$${data.minPayoutAmount}` },
                { label: 'Maximum Payout', value: `$${data.maxPayoutAmount.toLocaleString()}` },
                { label: 'Bank Processing', value: `${data.processingBankDays} business days` },
                { label: 'Currencies', value: data.currencies.join(', ') },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <div>
                <label style={lbl}>Frequency</label>
                <select value={form.frequency} onChange={set('frequency')} style={inp}>
                  {['weekly', 'biweekly', 'monthly'].map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Processing Day</label>
                <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))} style={inp}>
                  {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Cutoff (days before)</label>
                <input type="number" min="1" max="14" value={form.cutoffDays} onChange={e => setForm(f => ({ ...f, cutoffDays: Number(e.target.value) }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Min Payout ($)</label>
                <input type="number" min="0" value={form.minPayoutAmount} onChange={e => setForm(f => ({ ...f, minPayoutAmount: Number(e.target.value) }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Max Payout ($)</label>
                <input type="number" min="0" value={form.maxPayoutAmount} onChange={e => setForm(f => ({ ...f, maxPayoutAmount: Number(e.target.value) }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Bank Processing Days</label>
                <input type="number" min="1" max="10" value={form.processingBankDays} onChange={e => setForm(f => ({ ...f, processingBankDays: Number(e.target.value) }))} style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => { setEditing(false); setForm(data) }} style={{ padding: '8px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '8px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Upcoming Runs */}
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Payout Runs</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--text2)', borderBottom: '2px solid var(--border)' }}>
                  {['Scheduled Date', 'Cutoff Date', 'Members', 'Estimated Total', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.upcomingRuns || []).map(run => {
                  const st = RUN_STATUS[run.status] || RUN_STATUS.pending
                  return (
                    <tr key={run.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 600 }}>{run.scheduledDate}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{run.cutoffDate}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>{run.memberCount || '—'}</td>
                      <td style={{ padding: '10px 10px', fontWeight: run.estimatedTotal ? 600 : 400 }}>
                        {run.estimatedTotal ? `kr ${run.estimatedTotal.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        {run.status === 'scheduled' && (
                          <button onClick={() => handleTrigger(run)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}>
                            {triggered === run.id ? 'Triggered' : 'Trigger Now'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
