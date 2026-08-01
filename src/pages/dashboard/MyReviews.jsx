import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getMyReviews, updateMyReview, deleteMyReview } from '../../api/mlmApi'
import { PRODUCTS } from '../../data/mock'

const STATUS_CONFIG = {
  approved: { label: 'Approved', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map(p => [p.id, p]))

function Stars({ rating, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(null)
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          onClick={interactive && onChange ? () => onChange(n) : undefined}
          onMouseEnter={interactive ? () => setHovered(n) : undefined}
          onMouseLeave={interactive ? () => setHovered(null) : undefined}
          style={{
            fontSize: '18px',
            color: n <= (hovered ?? rating) ? '#c9a84c' : 'var(--border)',
            cursor: interactive ? 'pointer' : 'default',
            lineHeight: 1,
            transition: 'color 0.1s',
          }}
        >★</span>
      ))}
    </span>
  )
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 700, color: c.color,
      background: c.bg, border: `1px solid ${c.color}40`,
    }}>
      {c.label}
    </span>
  )
}

function EditModal({ review, onClose, onSave }) {
  const [rating, setRating] = useState(review.rating)
  const [comment, setComment] = useState(review.comment)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!comment.trim()) return
    setSaving(true)
    try {
      await onSave(review.id, { rating, comment: comment.trim() })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '28px', width: '480px', maxWidth: '100%',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cream)', marginBottom: '6px' }}>
          Edit Review
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
          {PRODUCT_MAP[review.productId]?.name || `Product #${review.productId}`}
        </div>

        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', fontWeight: 600 }}>
            Rating
          </div>
          <Stars rating={rating} interactive onChange={setRating} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', fontWeight: 600 }}>
            Your Review
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            placeholder="Describe your experience…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--navy3)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--cream)', padding: '10px 12px',
              fontSize: '13px', resize: 'vertical', fontFamily: 'inherit',
            }}
          />
          {!comment.trim() && (
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>Review text is required</div>
          )}
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '16px' }}>
          Edited reviews are re-submitted for moderation.
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn btn-sm"
            onClick={handleSave}
            disabled={saving || !comment.trim()}
            style={{ minWidth: '80px' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ review, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false)

  async function handle() {
    setDeleting(true)
    try { await onConfirm(review.id) } finally { setDeleting(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '28px', width: '380px', maxWidth: '100%',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '12px' }}>🗑️</div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '8px' }}>
          Delete Review
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
          Permanently delete your review for <strong style={{ color: 'var(--cream)' }}>
            {PRODUCT_MAP[review.productId]?.name || `Product #${review.productId}`}
          </strong>? This cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={deleting}>Cancel</button>
          <button
            className="btn btn-sm"
            style={{ background: '#ef4444', border: 'none', color: '#fff' }}
            onClick={handle}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewCard({ review, onEdit, onDelete }) {
  const product = PRODUCT_MAP[review.productId]
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{
      background: 'var(--navy2)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '20px', position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '12px' }}>
        {product && (
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
            background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
            backgroundImage: `linear-gradient(135deg, #0e7490, #1e3a5f)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>
            {product.name.startsWith('Omega') ? '🐟' :
             product.name.startsWith('Nordic Collagen') ? '✨' :
             product.name.startsWith('Vitamin D') ? '☀️' :
             product.name.startsWith('Arctic Shilajit') ? '⛰️' :
             product.name.startsWith('Nordic Greens') ? '🌿' : '🧠'}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '15px', marginBottom: '2px' }}>
            {product?.name || `Product #${review.productId}`}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
            {product?.category} · Reviewed {review.date}
          </div>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen(m => !m)}
            style={{
              background: 'none', border: 'none', color: 'var(--text2)',
              cursor: 'pointer', fontSize: '18px', padding: '4px 8px', lineHeight: 1,
            }}
            title="Options"
          >⋮</button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 20,
              background: 'var(--navy3)', border: '1px solid var(--border)',
              borderRadius: '8px', overflow: 'hidden', minWidth: '130px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
              <button
                onClick={() => { setMenuOpen(false); onEdit(review) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', background: 'none', border: 'none',
                  color: 'var(--cream)', cursor: 'pointer', fontSize: '13px',
                }}
              >✏️ Edit</button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(review) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', background: 'none', border: 'none',
                  color: '#ef4444', cursor: 'pointer', fontSize: '13px',
                }}
              >🗑️ Delete</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <Stars rating={review.rating} />
        <StatusBadge status={review.status} />
        {review.verified && (
          <span style={{ fontSize: '11px', color: '#22c55e' }}>✓ Verified purchase</span>
        )}
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
        {review.comment}
      </p>

      {review.status === 'rejected' && (
        <div style={{
          marginTop: '12px', padding: '8px 12px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '6px', fontSize: '12px', color: '#fca5a5',
        }}>
          This review was not approved. Edit and resubmit, or delete it.
        </div>
      )}
    </div>
  )
}

const TABS = [
  { key: 'all',      label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending',  label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
]

export default function MyReviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [editReview, setEditReview] = useState(null)
  const [deleteReview, setDeleteReview] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMyReviews(user?.userId)
      .then(d => setReviews(d?.reviews || []))
      .finally(() => setLoading(false))
  }, [user?.userId])

  async function handleUpdate(reviewId, data) {
    await updateMyReview(reviewId, data)
    setReviews(prev =>
      prev.map(r => r.id === reviewId ? { ...r, ...data, status: 'pending' } : r)
    )
  }

  async function handleDelete(reviewId) {
    await deleteMyReview(reviewId)
    setReviews(prev => prev.filter(r => r.id !== reviewId))
    setDeleteReview(null)
  }

  const filtered = tab === 'all' ? reviews : reviews.filter(r => r.status === tab)

  const total    = reviews.length
  const approved = reviews.filter(r => r.status === 'approved').length
  const pending  = reviews.filter(r => r.status === 'pending').length
  const rejected = reviews.filter(r => r.status === 'rejected').length
  const avgRating = total
    ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
    : '—'

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '0 0 48px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', margin: '0 0 4px' }}>
            My Reviews
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0 }}>
            Product reviews you've written. Approved reviews are visible to other members.
          </p>
        </div>

        {/* KPI strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
          marginBottom: '28px',
        }}>
          {[
            { label: 'Total Reviews',  value: total,    icon: '⭐' },
            { label: 'Avg Rating',     value: avgRating, icon: '📊' },
            { label: 'Approved',       value: approved,  icon: '✅' },
            { label: 'Pending / Rejected', value: `${pending} / ${rejected}`, icon: '⏳' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{
              background: 'var(--navy2)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '14px 16px',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cream)', marginBottom: '2px' }}>{value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {TABS.map(t => {
            const count = t.key === 'all' ? total
              : t.key === 'approved' ? approved
              : t.key === 'pending'  ? pending
              : rejected
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '6px 16px', borderRadius: '999px', border: '1px solid',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  borderColor: tab === t.key ? 'var(--gold)' : 'var(--border)',
                  background:  tab === t.key ? 'rgba(201,168,76,0.12)' : 'transparent',
                  color:       tab === t.key ? 'var(--gold)' : 'var(--text2)',
                }}
              >
                {t.label}{count > 0 ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text2)' }}>
            Loading your reviews…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '64px 24px',
            background: 'var(--navy2)', border: '1px solid var(--border)',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⭐</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '6px' }}>
              {tab === 'all' ? 'No reviews yet' : `No ${tab} reviews`}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
              {tab === 'all'
                ? 'Share your experience with a product on the product page.'
                : `You have no ${tab} reviews at this time.`}
            </div>
            {tab === 'all' && (
              <a
                href="/shop"
                className="btn btn-sm"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                Browse Products
              </a>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filtered.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onEdit={setEditReview}
                onDelete={setDeleteReview}
              />
            ))}
          </div>
        )}

        <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6 }}>
          Reviews are subject to moderation. Approved reviews appear on product pages for all members.
          Editing a review will resubmit it for moderation.
        </div>
      </div>

      {editReview && (
        <EditModal
          review={editReview}
          onClose={() => setEditReview(null)}
          onSave={handleUpdate}
        />
      )}
      {deleteReview && (
        <DeleteModal
          review={deleteReview}
          onClose={() => setDeleteReview(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  )
}
