import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminReviews, moderateReview, deleteAdminReview } from '../../api/mlmApi'
import { PRODUCTS } from '../../data/mock'

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  approved: { label: 'Approved', color: '#22c55e', bg: 'rgba(34,197,94,0.15)'   },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
}

function Stars({ rating, size = 14 }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: size }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 700,
      color: c.color, background: c.bg, border: `1px solid ${c.color}40`,
    }}>
      {c.label}
    </span>
  )
}

function DeleteModal({ review, onClose, onConfirm }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '28px', width: '380px', maxWidth: '90vw',
      }}>
        <div style={{ fontSize: '20px', marginBottom: '12px' }}>🗑️</div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '8px' }}>
          Delete Review
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
          Permanently delete this review by <strong style={{ color: 'var(--cream)' }}>{review.reviewer}</strong>?
          This cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-sm"
            style={{ background: '#ef4444', border: 'none', color: '#fff' }}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 15

export default function AdminReviews() {
  const [reviews, setReviews]         = useState([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('')
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving]           = useState(null)
  const [toast, setToast]             = useState(null)

  function showToast(msg, color = '#22c55e') {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminReviews({
        status: statusFilter,
        productId: productFilter || null,
        search,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      setReviews(res.reviews || [])
      setTotal(res.total || 0)
    } catch (_) {}
    setLoading(false)
  }, [statusFilter, productFilter, search, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [statusFilter, productFilter, search])

  async function handleModerate(reviewId, newStatus) {
    setSaving(reviewId)
    try {
      await moderateReview(reviewId, newStatus)
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r))
      showToast(`Review ${newStatus}`)
    } catch (_) { showToast('Failed to update', '#ef4444') }
    setSaving(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(deleteTarget.id)
    try {
      await deleteAdminReview(deleteTarget.id)
      setReviews(prev => prev.filter(r => r.id !== deleteTarget.id))
      setTotal(t => t - 1)
      showToast('Review deleted')
    } catch (_) { showToast('Failed to delete', '#ef4444') }
    setSaving(null)
    setDeleteTarget(null)
  }

  function downloadCsv() {
    const header = ['Product', 'Reviewer', 'Rating', 'Date', 'Status', 'Verified', 'Comment']
    const rows = reviews.map(r => {
      const prod = PRODUCTS.find(p => p.id === r.productId)
      return [
        `"${prod?.name || r.productId}"`,
        `"${r.reviewer}"`,
        r.rating,
        r.date,
        r.status,
        r.verified ? 'Yes' : 'No',
        `"${r.comment.replace(/"/g, '""')}"`,
      ]
    })
    const csv = [header, ...rows].map(row => row.join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `reviews-${new Date().toISOString().slice(0, 10)}.csv`,
    })
    a.click()
  }

  const allCount      = reviews.filter(r => true).length
  const pendingCount  = reviews.filter(r => r.status === 'pending').length
  const approvedCount = reviews.filter(r => r.status === 'approved').length
  const avgRating     = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminLayout>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.color, color: '#fff',
          borderRadius: '8px', padding: '10px 20px',
          fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          {toast.msg}
        </div>
      )}
      {deleteTarget && (
        <DeleteModal
          review={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>
              ⭐ Product Reviews
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
              Moderate member reviews before they appear publicly
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={downloadCsv}>
            ⬇ Export CSV
          </button>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Reviews', value: total, color: 'var(--gold)'  },
            { label: 'Pending',       value: total - approvedCount - (reviews.filter(r => r.status === 'rejected').length), color: '#f59e0b' },
            { label: 'Approved',      value: approvedCount, color: '#22c55e' },
            { label: 'Avg Rating',    value: avgRating + ' ★', color: '#c084fc' },
          ].map(k => (
            <div key={k.label} style={{
              background: 'var(--navy2)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '16px',
            }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  background: statusFilter === s ? 'var(--gold)' : 'transparent',
                  color: statusFilter === s ? '#000' : 'var(--text2)',
                  borderColor: statusFilter === s ? 'var(--gold)' : 'var(--border)',
                  textTransform: 'capitalize',
                }}
              >
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>

          {/* Product filter */}
          <select
            value={productFilter}
            onChange={e => setProductFilter(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
              background: 'var(--navy2)', border: '1px solid var(--border)', color: 'var(--text)',
            }}
          >
            <option value="">All Products</option>
            {PRODUCTS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Search */}
          <input
            placeholder="Search reviewer or text…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: '200px', padding: '6px 12px', borderRadius: '8px',
              background: 'var(--navy2)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: '13px',
            }}
          />
        </div>

        {/* Reviews table */}
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)', fontSize: '14px' }}>
              Loading reviews…
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)', fontSize: '14px' }}>
              No reviews match the current filters.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--navy3)' }}>
                      {['Product', 'Reviewer', 'Rating', 'Date', 'Status', 'Review', 'Actions'].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', textAlign: 'left',
                          fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                          color: 'var(--text2)', whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r, i) => {
                      const prod = PRODUCTS.find(p => p.id === r.productId)
                      const isLoading = saving === r.id
                      return (
                        <tr key={r.id} style={{
                          borderBottom: i < reviews.length - 1 ? '1px solid var(--border)' : 'none',
                          opacity: isLoading ? 0.5 : 1,
                          transition: 'opacity 0.2s',
                        }}>
                          <td style={{ padding: '12px 14px', color: 'var(--cream)', whiteSpace: 'nowrap', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prod?.name || `Product ${r.productId}`}
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {r.reviewer}
                              {r.verified && (
                                <span title="Verified purchase" style={{ fontSize: '10px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <Stars rating={r.rating} />
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                            {r.date}
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <StatusBadge status={r.status} />
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text)', maxWidth: '300px' }}>
                            <span title={r.comment} style={{
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {r.comment}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {r.status !== 'approved' && (
                                <button
                                  onClick={() => handleModerate(r.id, 'approved')}
                                  disabled={isLoading}
                                  title="Approve"
                                  style={{
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                    background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                                    border: '1px solid #22c55e40', cursor: 'pointer',
                                  }}
                                >
                                  ✓ Approve
                                </button>
                              )}
                              {r.status !== 'rejected' && (
                                <button
                                  onClick={() => handleModerate(r.id, 'rejected')}
                                  disabled={isLoading}
                                  title="Reject"
                                  style={{
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                    background: 'rgba(239,68,68,0.1)', color: '#f87171',
                                    border: '1px solid #ef444440', cursor: 'pointer',
                                  }}
                                >
                                  ✕ Reject
                                </button>
                              )}
                              {r.status === 'rejected' && (
                                <button
                                  onClick={() => handleModerate(r.id, 'pending')}
                                  disabled={isLoading}
                                  title="Reset to Pending"
                                  style={{
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                    background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                                    border: '1px solid #f59e0b40', cursor: 'pointer',
                                  }}
                                >
                                  ↩ Reset
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteTarget(r)}
                                disabled={isLoading}
                                title="Delete permanently"
                                style={{
                                  padding: '4px 8px', borderRadius: '6px', fontSize: '12px',
                                  background: 'transparent', color: 'var(--text2)',
                                  border: '1px solid var(--border)', cursor: 'pointer',
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderTop: '1px solid var(--border)',
                  fontSize: '12px', color: 'var(--text2)',
                }}>
                  <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} reviews</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="btn btn-outline btn-sm"
                      style={{ opacity: page === 0 ? 0.4 : 1 }}
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const start = Math.max(0, Math.min(page - 2, totalPages - 5))
                      const p = start + i
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className="btn btn-sm"
                          style={{
                            background: p === page ? 'var(--gold)' : 'var(--navy3)',
                            color: p === page ? '#000' : 'var(--text)',
                            border: 'none', minWidth: 32,
                          }}
                        >
                          {p + 1}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="btn btn-outline btn-sm"
                      style={{ opacity: page >= totalPages - 1 ? 0.4 : 1 }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info note */}
        <div style={{
          marginTop: '16px', padding: '14px 16px', borderRadius: '10px',
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
          fontSize: '12px', color: 'var(--text2)',
        }}>
          <strong style={{ color: '#60a5fa' }}>ℹ️ Moderation policy:</strong> New member reviews enter as{' '}
          <strong style={{ color: '#f59e0b' }}>Pending</strong>. Approve to make them visible on product pages,
          Reject to hide without deleting (member can be re-reviewed). Deleted reviews are permanent.
          Pre-launch seed reviews are shown publicly by default.
        </div>
      </div>
    </AdminLayout>
  )
}
