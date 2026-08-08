import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminLoyaltyLedger, adjustAdminLoyaltyPoints } from '../../api/mlmApi'

function AdjustModal({ onSave, onClose }) {
  const [form, setForm] = useState({ memberId: '', memberName: '', delta: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }
  const lbl = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave({ ...form, delta: Number(form.delta) })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 460, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Adjust Points</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Member ID</label><input required value={form.memberId} onChange={set('memberId')} style={inp} placeholder="M-0001" /></div>
          <div><label style={lbl}>Member Name</label><input required value={form.memberName} onChange={set('memberName')} style={inp} placeholder="Anna Hansen" /></div>
          <div>
            <label style={lbl}>Point Delta (use negative to deduct)</label>
            <input required type="number" value={form.delta} onChange={set('delta')} style={inp} placeholder="e.g. 500 or -200" />
          </div>
          <div><label style={lbl}>Reason</label><input required value={form.reason} onChange={set('reason')} style={inp} placeholder="Manual compensation — order #12345" /></div>
          <button type="submit" disabled={saving} style={{ padding: '10px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Apply Adjustment'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLoyaltyLedger() {
  const [entries, setEntries] = useState(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminLoyaltyLedger().then(setEntries).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdjust(payload) {
    const result = await adjustAdminLoyaltyPoints(payload)
    setEntries(e => [result, ...(e || [])])
  }

  const txTypes = ['all', 'purchase', 'bonus', 'referral', 'manual', 'expiry', 'redemption']
  const filtered = !entries ? [] : typeFilter === 'all' ? entries : entries.filter(e => e.type === typeFilter)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  const totalIssued = (entries || []).filter(e => e.delta > 0).reduce((s, e) => s + e.delta, 0)
  const totalRedeemed = (entries || []).filter(e => e.delta < 0).reduce((s, e) => s + Math.abs(e.delta), 0)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💎 Loyalty Point Ledger</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Full transaction history for all loyalty point movements.</div>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Adjust Points
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Entries', value: (entries || []).length.toLocaleString() },
            { label: 'Points Issued', value: totalIssued.toLocaleString() },
            { label: 'Points Redeemed', value: totalRedeemed.toLocaleString() },
            { label: 'Net Balance', value: (totalIssued - totalRedeemed).toLocaleString() },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {txTypes.map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: typeFilter === f ? 'var(--gold)' : 'var(--card)', color: typeFilter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: typeFilter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No transactions found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--text2)', borderBottom: '2px solid var(--border)' }}>
                  {['Date', 'Member', 'Type', 'Delta', 'Balance After', 'Reason'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{e.date}</td>
                    <td style={{ padding: '10px 10px', fontWeight: 600 }}>{e.memberName}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'var(--bg)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>{e.type}</span>
                    </td>
                    <td style={{ padding: '10px 10px', fontWeight: 700, color: e.delta > 0 ? '#86efac' : '#f87171' }}>
                      {e.delta > 0 ? '+' : ''}{e.delta.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{e.balanceAfter.toLocaleString()}</td>
                    <td style={{ padding: '10px 10px', color: 'var(--text2)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <AdjustModal onSave={handleAdjust} onClose={() => setShowModal(false)} />}
    </AdminLayout>
  )
}
