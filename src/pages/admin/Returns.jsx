import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminReturns, reviewReturn } from '../../api/mlmApi'

const REASONS = {
  changed_mind:      'Changed mind',
  not_as_described:  'Not as described',
  wrong_item:        'Wrong item received',
  defective:         'Defective / damaged',
  allergic_reaction: 'Allergic / side effects',
  duplicate_order:   'Duplicate order',
  other:             'Other',
}

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

export default function AdminReturns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const [reviewAction, setReviewAction] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => { load() }, [statusFilter, search])

  async function load() {
    setLoading(true)
    try {
      const res = await getAdminReturns({ status: statusFilter, search })
      setReturns(res || [])
    } catch {}
    setLoading(false)
  }

  async function handleReview() {
    if (!reviewAction || !selected) return
    setReviewing(true)
    try {
      await reviewReturn(selected.id, {
        action: reviewAction,
        adminNote,
        refundAmount: reviewAction === 'approve' ? (parseFloat(refundAmount) || selected.orderTotal) : undefined,
      })
      setSelected(null)
      setReviewAction('')
      setAdminNote('')
      setRefundAmount('')
      load()
    } catch {}
    setReviewing(false)
  }

  function openDrawer(ret) {
    setSelected(ret)
    setReviewAction('')
    setAdminNote(ret.adminNote || '')
    setRefundAmount(String(ret.refundAmount ?? ret.orderTotal))
  }

  const counts = { all: returns.length, pending: 0, under_review: 0, approved: 0, rejected: 0 }
  const totalRefunded = returns.filter(r => r.status === 'approved').reduce((s, r) => s + (r.refundAmount || 0), 0)
  for (const r of returns) { if (counts[r.status] !== undefined) counts[r.status]++ }

  const filtered = statusFilter === 'all' ? returns : returns.filter(r => r.status === statusFilter)

  return (
    <AdminLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Returns & Refunds</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
            Manage product return requests under Norwegian angrerettloven (14-day right of withdrawal).
          </p>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Requests', value: counts.all, color: 'var(--gold)' },
            { label: 'Pending Review', value: counts.pending, color: '#4ade80' },
            { label: 'Under Review',  value: counts.under_review, color: '#818cf8' },
            { label: 'Approved',      value: counts.approved, color: '#c9a84c' },
            { label: 'Rejected',      value: counts.rejected, color: '#f87171' },
            { label: 'Total Refunded', value: fmtMoney(totalRefunded), color: '#c9a84c', small: true },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ color: 'var(--text2)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{c.label}</div>
              <div style={{ color: c.color, fontSize: c.small ? 16 : 26, fontWeight: 700 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {['all', 'pending', 'under_review', 'approved', 'rejected', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: statusFilter === s ? 'var(--gold)' : 'var(--surface)',
                color: statusFilter === s ? '#000' : 'var(--text2)',
              }}
            >
              {s === 'all' ? 'All' : STATUS_META[s]?.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search member, order ID…"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text1)', fontSize: 13, width: 210 }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: 40 }}>Loading…</div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Return ID', 'Member', 'Order', 'Reason', 'Filed', 'Amount', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No returns found</td></tr>
                ) : filtered.map(ret => (
                  <tr
                    key={ret.id}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => openDrawer(ret)}
                  >
                    <td style={{ padding: '11px 14px', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>{ret.id}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{ret.memberName}</div>
                      <div style={{ color: 'var(--text2)', fontSize: 11 }}>{ret.memberEmail}</div>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{ret.orderId}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13 }}>{REASONS[ret.reason] || ret.reason}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDate(ret.filedAt)}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtMoney(ret.orderTotal)}</td>
                    <td style={{ padding: '11px 14px' }}><StatusBadge status={ret.status} /></td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600 }}>Review →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review drawer */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: 480, height: '100%', overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.id}</div>
                <div style={{ color: 'var(--text2)', fontSize: 12 }}>Order {selected.orderId} · Filed {fmtDate(selected.filedAt)}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <StatusBadge status={selected.status} />
            </div>

            {/* Member info */}
            <section style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Member</div>
              <div style={{ fontWeight: 600 }}>{selected.memberName}</div>
              <div style={{ color: 'var(--text2)', fontSize: 12 }}>{selected.memberEmail}</div>
            </section>

            {/* Items */}
            <section style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Items in Order</div>
              {(selected.items || []).map((item, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 3 }}>• {item}</div>
              ))}
              <div style={{ marginTop: 8, fontWeight: 700, fontSize: 14 }}>Total: {fmtMoney(selected.orderTotal)}</div>
            </section>

            {/* Reason */}
            <section style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Reason</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{REASONS[selected.reason] || selected.reason}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>{selected.description}</div>
            </section>

            {/* Existing admin note */}
            {selected.adminNote && (
              <section style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Previous Admin Note</div>
                <div style={{ color: 'var(--text2)', fontSize: 13 }}>{selected.adminNote}</div>
              </section>
            )}

            {/* Resolution info if already resolved */}
            {selected.resolvedAt && (
              <section style={{ marginBottom: 18, background: 'var(--bg)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Resolution</div>
                <div style={{ fontSize: 13 }}>
                  <strong>{selected.status === 'approved' ? 'Approved' : 'Rejected'}</strong> on {fmtDate(selected.resolvedAt)} by {selected.resolvedBy}
                </div>
                {selected.status === 'approved' && (
                  <div style={{ color: '#c9a84c', fontWeight: 700, marginTop: 4 }}>Refunded: {fmtMoney(selected.refundAmount)}</div>
                )}
              </section>
            )}

            {/* Action area — only for pending/under_review */}
            {(selected.status === 'pending' || selected.status === 'under_review') && (
              <>
                <div style={{ borderTop: '1px solid var(--border)', marginBottom: 18, paddingTop: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Take Action</div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {['review', 'approve', 'reject'].map(a => (
                      <button
                        key={a}
                        onClick={() => setReviewAction(a)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${reviewAction === a ? (a === 'approve' ? '#c9a84c' : a === 'reject' ? '#f87171' : '#818cf8') : 'var(--border)'}`,
                          background: reviewAction === a ? (a === 'approve' ? '#c9a84c20' : a === 'reject' ? '#f8717120' : '#818cf820') : 'var(--bg)',
                          color: reviewAction === a ? (a === 'approve' ? '#c9a84c' : a === 'reject' ? '#f87171' : '#818cf8') : 'var(--text2)',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {a === 'review' ? '🔍 Mark Review' : a === 'approve' ? '✅ Approve' : '✕ Reject'}
                      </button>
                    ))}
                  </div>

                  {reviewAction === 'approve' && (
                    <label style={{ display: 'block', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Refund Amount (NOK)</div>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={e => setRefundAmount(e.target.value)}
                        style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text1)', fontSize: 13, boxSizing: 'border-box' }}
                      />
                    </label>
                  )}

                  <label style={{ display: 'block', marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Admin Note {reviewAction === 'reject' ? '*' : '(optional)'}</div>
                    <textarea
                      rows={3}
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      placeholder={reviewAction === 'reject' ? 'Explain reason for rejection…' : 'Internal note…'}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text1)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </label>

                  <button
                    onClick={handleReview}
                    disabled={!reviewAction || reviewing || (reviewAction === 'reject' && !adminNote.trim())}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      background: reviewAction === 'approve' ? '#c9a84c' : reviewAction === 'reject' ? '#dc2626' : '#4f46e5',
                      color: reviewAction === 'reject' ? '#fff' : '#000',
                      opacity: (!reviewAction || reviewing || (reviewAction === 'reject' && !adminNote.trim())) ? 0.5 : 1,
                    }}
                  >
                    {reviewing ? 'Saving…' : reviewAction === 'approve' ? 'Approve & Issue Refund' : reviewAction === 'reject' ? 'Reject Return' : 'Mark Under Review'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
