import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminCoopClaims, getAdminCoopConfig, reviewAdminCoopClaim, updateAdminCoopConfig } from '../../api/mlmApi'

const STATUS_STYLE = {
  pending:  { bg: '#2d1f00', color: '#fbbf24', border: '#92400e' },
  approved: { bg: '#052e16', color: '#86efac', border: '#166534' },
  rejected: { bg: '#2d0f0f', color: '#fca5a5', border: '#991b1b' },
}

const CHANNEL_ICON = { instagram: '📸', facebook: '📘', google: '🔍', tiktok: '🎵', print: '📰', youtube: '▶️', other: '📣' }

function ReviewModal({ claim, onReview, onClose }) {
  const [approve, setApprove] = useState(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function handle() {
    if (approve === null) return
    if (!approve && !reason.trim()) return
    setSaving(true)
    await onReview(claim.id, { approve, reason })
    setSaving(false)
  }

  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Review Co-Op Claim</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{claim.memberName}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{CHANNEL_ICON[claim.channel] || '📣'} {claim.channel} · NOK {claim.amount.toLocaleString()}</div>
          <div style={{ fontSize: 13 }}>{claim.description}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>Submitted: {new Date(claim.submittedAt).toLocaleDateString()}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setApprove(true)}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${approve === true ? '#22c55e' : 'var(--border)'}`, background: approve === true ? '#052e16' : 'var(--bg)', color: approve === true ? '#86efac' : 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>
            ✅ Approve
          </button>
          <button onClick={() => setApprove(false)}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${approve === false ? '#ef4444' : 'var(--border)'}`, background: approve === false ? '#2d0f0f' : 'var(--bg)', color: approve === false ? '#fca5a5' : 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>
            ❌ Reject
          </button>
        </div>
        {approve === false && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Rejection Reason *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Explain why the claim was rejected…" />
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handle} disabled={saving || approve === null || (approve === false && !reason.trim())}
            style={{ flex: 1, background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', opacity: (saving || approve === null || (approve === false && !reason.trim())) ? 0.5 : 1 }}>
            {saving ? 'Submitting…' : 'Submit Decision'}
          </button>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function CoOp() {
  const [claims, setClaims] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [reviewTarget, setReviewTarget] = useState(null)

  useEffect(() => {
    Promise.all([getAdminCoopClaims(), getAdminCoopConfig()])
      .then(([c, cfg]) => { setClaims(c); setConfig(cfg) })
      .finally(() => setLoading(false))
  }, [])

  async function handleReview(id, decision) {
    await reviewAdminCoopClaim(id, decision)
    setClaims(p => p.map(x => x.id === id ? { ...x, status: decision.approve ? 'approved' : 'rejected', reviewedAt: new Date().toISOString(), rejectReason: decision.reason || null } : x))
    setReviewTarget(null)
  }

  const visible = claims.filter(c => statusFilter === 'all' || c.status === statusFilter)
  const pending = claims.filter(c => c.status === 'pending')
  const approved = claims.filter(c => c.status === 'approved')
  const totalApproved = approved.reduce((s, c) => s + c.amount, 0)

  return (
    <AdminLayout>
      {reviewTarget && (
        <ReviewModal claim={reviewTarget} onReview={handleReview} onClose={() => setReviewTarget(null)} />
      )}
      <div style={{ maxWidth: 1050, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 22 }}>📣 Co-Op Advertising Fund</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Review member advertising claims and manage the co-op budget.</div>
        </div>

        {config && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { icon: '💰', label: 'Total Budget', val: `NOK ${(config.totalBudgetNok / 1000).toFixed(0)}k`, sub: 'annual co-op fund' },
              { icon: '✅', label: 'Approved Spend', val: `NOK ${(config.spentNok / 1000).toFixed(1)}k`, sub: `${((config.spentNok / config.totalBudgetNok) * 100).toFixed(0)}% of budget` },
              { icon: '⏳', label: 'Pending Claims', val: pending.length, sub: `NOK ${(config.pendingNok / 1000).toFixed(1)}k pending` },
              { icon: '🔄', label: 'Match Rate', val: `${config.matchRate}%`, sub: 'company match on claims' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {config && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Budget Utilisation</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>NOK {config.spentNok.toLocaleString()} / {config.totalBudgetNok.toLocaleString()}</div>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (config.spentNok / config.totalBudgetNok) * 100)}%`, background: 'var(--gold)', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
              <span>Max per claim: NOK {config.maxClaimNok.toLocaleString()}</span>
              <span>Min sales required: NOK {config.minSalesRequiredNok.toLocaleString()}</span>
              <span>Eligible ranks: {config.eligibleRanks.join(', ')}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', background: statusFilter === f ? 'var(--gold)' : 'var(--bg)', color: statusFilter === f ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: statusFilter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f} {f === 'pending' && pending.length > 0 && `(${pending.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visible.map(claim => {
              const ss = STATUS_STYLE[claim.status] || STATUS_STYLE.pending
              return (
                <div key={claim.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700 }}>{claim.memberName}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'capitalize' }}>{claim.status}</span>
                        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{CHANNEL_ICON[claim.channel] || '📣'} {claim.channel}</span>
                      </div>
                      <div style={{ fontSize: 14, marginBottom: 4 }}>{claim.description}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span>💰 NOK {claim.amount.toLocaleString()} claimed</span>
                        <span>📅 {new Date(claim.submittedAt).toLocaleDateString()}</span>
                        {claim.reviewedAt && <span>✅ Reviewed {new Date(claim.reviewedAt).toLocaleDateString()} by {claim.reviewedBy}</span>}
                      </div>
                      {claim.rejectReason && (
                        <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 6, background: '#2d0f0f', border: '1px solid #991b1b', borderRadius: 6, padding: '6px 10px' }}>
                          Reason: {claim.rejectReason}
                        </div>
                      )}
                    </div>
                    {claim.status === 'pending' && (
                      <button onClick={() => setReviewTarget(claim)}
                        style={{ padding: '8px 16px', background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>
                        Review
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No {statusFilter === 'all' ? '' : statusFilter} claims.</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
