import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getMyReturns, submitReturn, cancelReturn } from '../../api/mlmApi'
import { ORDERS } from '../../data/mock'

const REASONS = [
  { value: 'changed_mind',      label: 'Changed my mind' },
  { value: 'not_as_described',  label: 'Not as described' },
  { value: 'wrong_item',        label: 'Received wrong item' },
  { value: 'defective',         label: 'Defective / damaged' },
  { value: 'allergic_reaction', label: 'Allergic reaction / side effects' },
  { value: 'duplicate_order',   label: 'Duplicate order' },
  { value: 'other',             label: 'Other' },
]

const STATUS_META = {
  pending:      { label: 'Pending',      bg: '#1a2a1a', color: '#4ade80' },
  under_review: { label: 'Under Review', bg: '#1a1a2a', color: '#818cf8' },
  approved:     { label: 'Approved',     bg: '#1a2814', color: '#c9a84c' },
  rejected:     { label: 'Rejected',     bg: '#2a1a1a', color: '#f87171' },
  cancelled:    { label: 'Cancelled',    bg: '#1a1a1a', color: '#9ca3af' },
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, bg: '#1a1a1a', color: '#9ca3af' }
  return (
    <span style={{
      background: m.bg, color: m.color, border: `1px solid ${m.color}40`,
      borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>{m.label}</span>
  )
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMoney(n) {
  if (n == null) return '—'
  return `${Number(n).toLocaleString('nb-NO')} NOK`
}

const BLANK_FORM = { orderId: '', reason: '', description: '' }

export default function Returns() {
  const { user } = useAuth()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await getMyReturns(user.userId)
      setReturns(res || [])
    } catch {}
    setLoading(false)
  }

  const eligible = ORDERS.filter(o => o.status === 'Delivered')

  const filtered = filter === 'all' ? returns : returns.filter(r => r.status === filter)

  const counts = { pending: 0, under_review: 0, approved: 0, rejected: 0, total: returns.length }
  for (const r of returns) {
    if (counts[r.status] !== undefined) counts[r.status]++
  }
  const totalRefunded = returns.filter(r => r.status === 'approved').reduce((s, r) => s + (r.refundAmount || 0), 0)

  function validateForm() {
    const errs = {}
    if (!form.orderId) errs.orderId = 'Select an order'
    if (!form.reason) errs.reason = 'Select a reason'
    if (!form.description.trim()) errs.description = 'Describe the issue'
    return errs
  }

  async function handleSubmit() {
    const errs = validateForm()
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSubmitting(true)
    try {
      const order = eligible.find(o => o.id === form.orderId)
      await submitReturn(user.userId, {
        orderId: form.orderId,
        items: order?.items || [],
        orderTotal: order?.total || 0,
        memberName: user.name,
        memberEmail: user.email,
        reason: form.reason,
        description: form.description,
      })
      setShowModal(false)
      setForm(BLANK_FORM)
      setFormErrors({})
      load()
    } catch {}
    setSubmitting(false)
  }

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelReturn(cancelTarget.id)
      setCancelTarget(null)
      load()
    } catch {}
    setCancelling(false)
  }

  const kpiCards = [
    { label: 'Total Returns',    value: counts.total,      color: 'var(--gold)' },
    { label: 'Pending',          value: counts.pending,    color: '#4ade80' },
    { label: 'Under Review',     value: counts.under_review, color: '#818cf8' },
    { label: 'Total Refunded',   value: fmtMoney(totalRefunded), color: '#c9a84c', small: true },
  ]

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Returns & Refunds</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
            Norwegian law (angrerettloven) gives you 14 days to return unused products.
          </p>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
          {kpiCards.map(c => (
            <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ color: 'var(--text2)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{c.label}</div>
              <div style={{ color: c.color, fontSize: c.small ? 18 : 28, fontWeight: 700 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Policy note */}
        <div style={{ background: '#1a2a1a', border: '1px solid #4ade8040', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#4ade80' }}>
          <strong>Return Policy:</strong> Products must be unused and in original packaging. Opened consumables (supplements) may only be returned if defective or not as described. Refunds are processed within 14 business days.
        </div>

        {/* Actions bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {['all', 'pending', 'under_review', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: filter === s ? 'var(--gold)' : 'var(--surface)',
                color: filter === s ? '#000' : 'var(--text2)',
              }}
            >
              {s === 'all' ? 'All' : STATUS_META[s]?.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => { setShowModal(true); setForm(BLANK_FORM); setFormErrors({}) }}
              style={{ background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              + New Return Request
            </button>
          </div>
        </div>

        {/* Returns list */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: 40 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div style={{ fontWeight: 600 }}>No return requests found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Contact support if you need help with a return.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(ret => (
              <div
                key={ret.id}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpanded(expanded === ret.id ? null : ret.id)}
                  style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
                >
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{ret.id}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12 }}>Order: {ret.orderId} · Filed {fmtDate(ret.filedAt)}</div>
                  </div>
                  <div style={{ color: 'var(--text2)', fontSize: 12, flex: 1 }}>
                    {REASONS.find(r => r.value === ret.reason)?.label || ret.reason}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtMoney(ret.orderTotal)}</div>
                    {ret.status === 'approved' && (
                      <div style={{ color: '#c9a84c', fontSize: 12 }}>Refund: {fmtMoney(ret.refundAmount)}</div>
                    )}
                  </div>
                  <StatusBadge status={ret.status} />
                  <span style={{ color: 'var(--text2)', fontSize: 16 }}>{expanded === ret.id ? '▲' : '▼'}</span>
                </div>

                {/* Expanded detail */}
                {expanded === ret.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', background: 'var(--bg)' }}>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>Items</div>
                      {(ret.items || []).map((item, i) => (
                        <div key={i} style={{ fontSize: 13, color: 'var(--text1)', marginBottom: 2 }}>• {item}</div>
                      ))}
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>Your Description</div>
                      <div style={{ fontSize: 13 }}>{ret.description}</div>
                    </div>
                    {ret.adminNote && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>Admin Note</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)' }}>{ret.adminNote}</div>
                      </div>
                    )}
                    {ret.resolvedAt && (
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
                        Resolved {fmtDate(ret.resolvedAt)} by {ret.resolvedBy}
                        {ret.pvDeducted ? ` · ${ret.pvDeducted} PV deducted` : ''}
                      </div>
                    )}
                    {ret.status === 'pending' && (
                      <button
                        onClick={() => setCancelTarget(ret)}
                        style={{ background: 'transparent', color: '#f87171', border: '1px solid #f8717140', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New return modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 14, width: '100%', maxWidth: 500, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Request a Return</div>

              <label style={{ display: 'block', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Select Order *</div>
                <select
                  value={form.orderId}
                  onChange={e => { setForm(f => ({ ...f, orderId: e.target.value })); setFormErrors(er => ({ ...er, orderId: '' })) }}
                  style={{ width: '100%', background: 'var(--bg)', border: `1px solid ${formErrors.orderId ? '#f87171' : 'var(--border)'}`, borderRadius: 8, padding: '8px 10px', color: 'var(--text1)', fontSize: 13 }}
                >
                  <option value="">— choose order —</option>
                  {eligible.map(o => (
                    <option key={o.id} value={o.id}>{o.id} · {o.date} · {o.items[0]}{o.items.length > 1 ? ` +${o.items.length - 1}` : ''}</option>
                  ))}
                </select>
                {formErrors.orderId && <div style={{ color: '#f87171', fontSize: 11, marginTop: 3 }}>{formErrors.orderId}</div>}
              </label>

              <label style={{ display: 'block', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Reason for Return *</div>
                <select
                  value={form.reason}
                  onChange={e => { setForm(f => ({ ...f, reason: e.target.value })); setFormErrors(er => ({ ...er, reason: '' })) }}
                  style={{ width: '100%', background: 'var(--bg)', border: `1px solid ${formErrors.reason ? '#f87171' : 'var(--border)'}`, borderRadius: 8, padding: '8px 10px', color: 'var(--text1)', fontSize: 13 }}
                >
                  <option value="">— select reason —</option>
                  {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {formErrors.reason && <div style={{ color: '#f87171', fontSize: 11, marginTop: 3 }}>{formErrors.reason}</div>}
              </label>

              <label style={{ display: 'block', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Description *</div>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setFormErrors(er => ({ ...er, description: '' })) }}
                  placeholder="Describe why you want to return this order…"
                  style={{ width: '100%', background: 'var(--bg)', border: `1px solid ${formErrors.description ? '#f87171' : 'var(--border)'}`, borderRadius: 8, padding: '8px 10px', color: 'var(--text1)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                />
                {formErrors.description && <div style={{ color: '#f87171', fontSize: 11, marginTop: 3 }}>{formErrors.description}</div>}
              </label>

              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 18, background: 'var(--bg)', borderRadius: 8, padding: 10 }}>
                Under angrerettloven, you have 14 days from delivery to request a return for any reason. Note that PV associated with the order will be reversed upon approval.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ flex: 1, padding: '10px', background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Submitting…' : 'Submit Return Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel confirm modal */}
        {cancelTarget && (
          <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 14, width: '100%', maxWidth: 380, padding: 28 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>Cancel Return Request?</div>
              <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
                Are you sure you want to cancel return request <strong>{cancelTarget.id}</strong>? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setCancelTarget(null)}
                  style={{ flex: 1, padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', cursor: 'pointer', fontSize: 13 }}
                >
                  Keep Request
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  style={{ flex: 1, padding: '10px', background: '#dc2626', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: cancelling ? 'not-allowed' : 'pointer', fontSize: 13, opacity: cancelling ? 0.7 : 1 }}
                >
                  {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
