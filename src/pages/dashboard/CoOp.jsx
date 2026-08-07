import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberCoopSummary, getMemberCoopClaims, submitMemberCoopClaim } from '../../api/mlmApi'

const STATUS_STYLE = {
  pending:  { bg: '#2d1f00', color: '#fbbf24', border: '#92400e' },
  approved: { bg: '#052e16', color: '#86efac', border: '#166534' },
  rejected: { bg: '#2d0f0f', color: '#fca5a5', border: '#991b1b' },
}

const CHANNELS = ['instagram', 'facebook', 'tiktok', 'youtube', 'google', 'print', 'other']
const CHANNEL_ICON = { instagram: '📸', facebook: '📘', tiktok: '🎵', youtube: '▶️', google: '🔍', print: '📰', other: '📣' }

const BLANK = { channel: 'instagram', amount: '', description: '' }

function SubmitModal({ matchRate, maxClaim, onSubmit, onClose }) {
  const [form, setForm] = useState(BLANK)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const amt = parseFloat(form.amount) || 0
  const matched = Math.round(amt * (matchRate / 100))
  const valid = form.channel && amt > 0 && amt <= maxClaim && form.description.trim()

  async function handle() {
    if (!valid) return
    setSubmitting(true)
    await onSubmit({ ...form, amount: amt })
    setSubmitting(false)
    setDone(true)
  }

  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  if (done) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Claim Submitted!</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>Your claim for NOK {amt.toLocaleString()} is under review. You'll be notified once it's processed.</div>
        <button onClick={onClose} style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 32px', cursor: 'pointer', fontSize: 14 }}>Done</button>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 500, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Submit Ad Claim</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Advertising Channel</label>
            <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} style={inp}>
              {CHANNELS.map(c => <option key={c} value={c}>{CHANNEL_ICON[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Ad Spend Amount (NOK)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder={`Max NOK ${maxClaim.toLocaleString()}`} min={1} max={maxClaim} style={inp} />
            {amt > maxClaim && <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>Exceeds max claim of NOK {maxClaim.toLocaleString()}</div>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Campaign Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Describe the ad campaign, target audience, and promoted products…" />
          </div>
          {amt > 0 && amt <= maxClaim && (
            <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>
              <div style={{ color: '#86efac', fontWeight: 600, marginBottom: 4 }}>Estimated co-op match</div>
              <div style={{ color: '#86efac', fontSize: 18, fontWeight: 700 }}>+ NOK {matched.toLocaleString()}</div>
              <div style={{ color: '#6ee7b7', fontSize: 12, marginTop: 2 }}>{matchRate}% company match on NOK {amt.toLocaleString()} spend</div>
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
            📎 Receipt upload: attach a copy of your ad receipt or invoice when the admin contacts you for verification.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={handle} disabled={!valid || submitting}
            style={{ flex: 1, background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', opacity: (!valid || submitting) ? 0.5 : 1 }}>
            {submitting ? 'Submitting…' : 'Submit Claim'}
          </button>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function MemberCoOp() {
  const [summary, setSummary] = useState(null)
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([getMemberCoopSummary(), getMemberCoopClaims()])
      .then(([s, c]) => { setSummary(s); setClaims(c) })
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(data) {
    const n = await submitMemberCoopClaim(data)
    setClaims(p => [n, ...p])
    setShowModal(false)
  }

  if (loading) return (
    <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  )

  return (
    <DashboardLayout>
      {showModal && summary && (
        <SubmitModal matchRate={summary.matchRate} maxClaim={summary.maxClaimNok} onSubmit={handleSubmit} onClose={() => setShowModal(false)} />
      )}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>📣 Co-Op Advertising</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Submit your advertising spend and earn a company match towards your next order.</div>
          </div>
          {summary?.eligibilityStatus === 'eligible' && (
            <button onClick={() => setShowModal(true)}
              style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>
              + Submit Claim
            </button>
          )}
        </div>

        {summary && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { icon: '💰', label: 'Co-Op Balance', val: `NOK ${summary.balance.toLocaleString()}`, sub: 'available to earn' },
                { icon: '📈', label: 'Lifetime Earned', val: `NOK ${summary.lifetimeEarned.toLocaleString()}`, sub: 'total co-op matched' },
                { icon: '✅', label: 'Lifetime Claimed', val: `NOK ${summary.lifetimeClaimed.toLocaleString()}`, sub: 'applied to orders' },
                { icon: '⏳', label: 'Pending Review', val: `NOK ${summary.pendingApproval.toLocaleString()}`, sub: 'awaiting approval' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>Your Eligibility — {summary.currentRank} rank</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>Company matches {summary.matchRate}% of your verified ad spend · max NOK {summary.maxClaimNok.toLocaleString()} per claim</div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#052e16', color: '#86efac', border: '1px solid #166534', fontWeight: 600 }}>
                  ✅ Eligible
                </span>
              </div>
              {summary.nextLevelUnlocks && (
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  🚀 Next tier: {summary.nextLevelUnlocks}
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Claim History</div>
        {claims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📣</div>
            <div>No claims yet — submit your first advertising spend to get started.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {claims.map(c => {
              const ss = STATUS_STYLE[c.status] || STATUS_STYLE.pending
              return (
                <div key={c.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'capitalize', fontWeight: 600 }}>{c.status}</span>
                        <span style={{ fontSize: 13 }}>{CHANNEL_ICON[c.channel] || '📣'} {c.channel}</span>
                      </div>
                      <div style={{ fontSize: 14, marginBottom: 4 }}>{c.description}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span>💰 NOK {c.amount.toLocaleString()} spend</span>
                        {c.matched && <span style={{ color: '#86efac' }}>+ NOK {c.matched.toLocaleString()} matched</span>}
                        <span>📅 {new Date(c.submittedAt).toLocaleDateString()}</span>
                        {c.reviewedAt && <span>✅ Reviewed {new Date(c.reviewedAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginTop: 28 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>How co-op advertising works</div>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Run your own ad campaign on any eligible channel (Instagram, Facebook, Google, etc.)',
              'Submit a claim with your spend amount, channel, and a campaign description.',
              'Admin reviews the claim within 2–3 business days.',
              'Once approved, the matched amount is credited to your co-op balance.',
              'Apply your balance to future product orders.',
            ].map((s, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--text2)' }}>{s}</li>
            ))}
          </ol>
        </div>
      </div>
    </DashboardLayout>
  )
}
