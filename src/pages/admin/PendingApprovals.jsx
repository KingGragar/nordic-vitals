import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminPendingApprovals, resolveAdminApproval } from '../../api/mlmApi'

const TYPE_COLOR = { kyc: '#fbbf24', payout: '#86efac', marketplace: '#93c5fd', appeal: '#f87171', 'co-op': '#c4b5fd' }
const TYPE_ICON  = { kyc: '🪪', payout: '💸', marketplace: '🛒', appeal: '⚖️', 'co-op': '📢' }
const PRI_COLOR  = { high: '#f87171', normal: '#9ca3af' }

export default function AdminPendingApprovals() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [resolveId, setResolveId] = useState(null)
  const [resolveAction, setResolveAction] = useState('approve')
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminPendingApprovals().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleResolve() {
    if (!resolveId) return
    setResolving(true)
    await resolveAdminApproval(resolveId, resolveAction, resolveNote)
    setData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== resolveId) }))
    setResolveId(null)
    setResolveNote('')
    setResolving(false)
  }

  const items = (data?.items || []).filter(i => filter === 'all' || i.type === filter)
  const counts = data?.counts || {}
  const totalPending = Object.values(counts).reduce((s, v) => s + v, 0)

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const inp  = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
  const btn  = (bg, fg = '#fff') => ({ padding: '8px 18px', borderRadius: 7, border: 'none', background: bg, color: fg, fontWeight: 600, cursor: 'pointer', fontSize: 14 })

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Pending Approvals</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Unified queue for KYC, payouts, marketplace listings, appeals, and co-op requests</p>
        </div>

        {/* Count tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { key: 'all', label: 'All Pending', value: totalPending },
            { key: 'kyc', label: 'KYC', value: counts.kyc ?? 0 },
            { key: 'payout', label: 'Payouts', value: counts.payouts ?? 0 },
            { key: 'marketplace', label: 'Listings', value: counts.marketplace ?? 0 },
            { key: 'appeal', label: 'Appeals', value: counts.appeals ?? 0 },
            { key: 'co-op', label: 'Co-Op', value: counts.coOp ?? 0 },
          ].map(t => (
            <div key={t.key} onClick={() => setFilter(t.key)} style={{ ...card, cursor: 'pointer', border: filter === t.key ? '1px solid #6366f1' : '1px solid var(--border)', background: filter === t.key ? 'rgba(99,102,241,.12)' : 'var(--card)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: t.key === 'all' ? 'var(--text)' : (TYPE_COLOR[t.key] ?? 'var(--text)') }}>{loading ? '…' : t.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.label}</div>
            </div>
          ))}
        </div>

        {/* Items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <div style={{ ...card, textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading…</div>}
          {!loading && items.map(item => (
            <div key={item.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 28 }}>{TYPE_ICON[item.type] ?? '📋'}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, background: 'rgba(0,0,0,.2)', color: TYPE_COLOR[item.type], borderRadius: 5, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.type}</span>
                  {item.priority === 'high' && <span style={{ fontSize: 11, color: PRI_COLOR.high, fontWeight: 700 }}>⚡ HIGH PRIORITY</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{item.member}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{item.detail}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Submitted: {new Date(item.submittedAt).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {resolveId === item.id ? (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, minWidth: 260 }}>
                    <select style={{ ...inp, marginBottom: 8 }} value={resolveAction} onChange={e => setResolveAction(e.target.value)}>
                      <option value="approve">Approve</option>
                      <option value="reject">Reject</option>
                      <option value="request-info">Request More Info</option>
                    </select>
                    <textarea style={{ ...inp, height: 60, resize: 'none', marginBottom: 8 }} placeholder="Internal note (optional)…" value={resolveNote} onChange={e => setResolveNote(e.target.value)} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ ...btn(resolveAction === 'approve' ? '#22c55e' : resolveAction === 'reject' ? '#ef4444' : '#f59e0b'), flex: 1, padding: '6px 0', fontSize: 13 }} onClick={handleResolve} disabled={resolving}>{resolving ? '…' : 'Confirm'}</button>
                      <button style={{ ...btn('var(--border)', 'var(--text)'), padding: '6px 12px', fontSize: 13 }} onClick={() => setResolveId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button style={{ ...btn('#6366f1'), padding: '8px 16px', fontSize: 13 }} onClick={() => { setResolveId(item.id); setResolveAction('approve') }}>Review</button>
                )}
              </div>
            </div>
          ))}
          {!loading && items.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 600 }}>All clear — no pending approvals in this category.</div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
