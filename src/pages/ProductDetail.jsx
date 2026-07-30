import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PRODUCTS } from '../data/mock'
import { useAuth } from '../context/AuthContext'
import { getVpProducts, getProductReviews, submitProductReview, getWishlist, addToWishlist, removeFromWishlist } from '../api/mlmApi'
import Navbar from '../components/Navbar'
import usePageTitle from '../hooks/usePageTitle'

const productGradients = {
  1: 'linear-gradient(135deg,#164e63,#1e3a5f)',
  2: 'linear-gradient(135deg,#4c0519,#831843)',
  3: 'linear-gradient(135deg,#78350f,#92400e)',
  4: 'linear-gradient(135deg,#1c1917,#27272a)',
  5: 'linear-gradient(135deg,#14532d,#065f46)',
  6: 'linear-gradient(135deg,#3b0764,#4a044e)',
}

const productEmojis = {
  1: '🐟', 2: '🦐', 3: '☀️', 4: '🪨', 5: '🌿', 6: '🧠',
}

function Stars({ rating, size = 16 }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: `${size}px`, color: i <= rating ? '#c9a84c' : 'var(--border)', lineHeight: 1 }}>★</span>
      ))}
    </span>
  )
}

function avgRating(reviews) {
  if (!reviews.length) return 0
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
}

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart, user } = useAuth()
  const [products, setProducts] = useState(PRODUCTS)
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ open: false, rating: 5, comment: '', submitting: false, submitted: false })
  const [inWishlist, setInWishlist] = useState(false)

  useEffect(() => {
    getVpProducts()
      .then(d => { if (d?.products?.length) setProducts(d.products) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    getProductReviews(Number(id))
      .then(d => { if (d?.reviews) setReviews(d.reviews) })
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    getWishlist(user.userId)
      .then(d => { if (d?.productIds) setInWishlist(d.productIds.includes(Number(id))) })
      .catch(() => {})
  }, [user, id])

  const product = products.find(p => p.id === Number(id))

  usePageTitle(
    product ? product.name : 'Product',
    product ? `${product.name} — ${product.tagline}. ${product.desc}` : undefined
  )

  if (!product) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: 'var(--text2)',
      }}>
        <div style={{ fontSize: '48px' }}>🔍</div>
        <h2 style={{ color: 'var(--cream)' }}>Product not found</h2>
        <Link to="/shop" className="btn btn-gold">← Back to Shop</Link>
      </div>
    )
  }

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      addToCart(product)
    }
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  async function handleToggleWishlist() {
    if (!user) return
    if (inWishlist) {
      await removeFromWishlist(user.userId, product.id).catch(() => {})
      setInWishlist(false)
    } else {
      await addToWishlist(user.userId, product.id).catch(() => {})
      setInWishlist(true)
    }
  }

  function decQty() { setQty(q => Math.max(1, q - 1)) }
  function incQty() { setQty(q => q + 1) }

  async function handleSubmitReview(e) {
    e.preventDefault()
    setReviewForm(f => ({ ...f, submitting: true }))
    try {
      await submitProductReview(Number(id), { rating: reviewForm.rating, comment: reviewForm.comment })
      const newReview = {
        id: `local-${Date.now()}`,
        reviewer: user.name || 'You',
        rating: reviewForm.rating,
        date: new Date().toISOString().slice(0, 10),
        comment: reviewForm.comment,
        verified: true,
      }
      setReviews(r => [newReview, ...r])
      setReviewForm(f => ({ ...f, submitting: false, submitted: true, open: false, comment: '' }))
    } catch {
      setReviewForm(f => ({ ...f, submitting: false }))
    }
  }

  return (
    <>
    <Navbar />
    <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: '32px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--text2)' }}>
          <Link to="/shop" style={{ color: 'var(--text2)', transition: 'color 0.18s' }}
            onMouseEnter={e => e.target.style.color = 'var(--gold)'}
            onMouseLeave={e => e.target.style.color = 'var(--text2)'}
          >Shop</Link>
          <span>›</span>
          <span style={{ color: 'var(--cream)' }}>{product.name}</span>
        </div>

        {/* Two-column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          alignItems: 'start',
        }}>

          {/* LEFT: Gradient visual */}
          <div style={{
            background: productGradients[product.id],
            borderRadius: '16px',
            height: '420px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '80px' }}>{productEmojis[product.id]}</span>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'var(--cream)',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '0.5px',
            }}>
              {product.tagline}
            </div>
          </div>

          {/* RIGHT: Product info */}
          <div>
            {/* Name */}
            <h1 style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: '800',
              color: 'var(--cream)',
              letterSpacing: '-1px',
              marginBottom: '8px',
              lineHeight: 1.15,
            }}>
              {product.name}
            </h1>

            {/* Rating badge */}
            {reviews.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Stars rating={Math.round(avgRating(reviews))} size={15} />
                <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
                  {avgRating(reviews).toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Tagline */}
            <p style={{
              color: 'var(--gold)',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '20px',
              letterSpacing: '0.5px',
            }}>
              {product.tagline}
            </p>

            {/* Pricing */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ color: 'var(--cream)', fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>
                NOK {product.price}
              </div>
              <div style={{ color: 'var(--gold)', fontSize: '14px', fontWeight: '600' }}>
                ★ Members: NOK {product.memberPrice} · Save NOK {product.price - product.memberPrice}
              </div>
            </div>

            {/* Description */}
            <p style={{
              color: 'var(--text)',
              fontSize: '15px',
              lineHeight: 1.7,
              marginBottom: '24px',
            }}>
              {product.desc}
            </p>

            {/* Key ingredients */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--text2)',
                marginBottom: '10px',
              }}>
                Key Ingredients
              </div>
              <ul style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {product.ingredients.map((ing, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text)' }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--gold)',
                      flexShrink: 0,
                    }} />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* PV badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--navy3)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 14px',
              marginBottom: '24px',
              fontSize: '13px',
              color: 'var(--text2)',
            }}>
              <span style={{ color: 'var(--gold)', fontWeight: '700' }}>★</span>
              Earns <span style={{ color: 'var(--gold)', fontWeight: '700' }}>{product.pv} PV</span> when purchased by a member
            </div>

            {/* Quantity selector */}
            <div style={{ marginBottom: '16px' }}>
              <div className="label-text">Quantity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0', width: 'fit-content' }}>
                <button
                  onClick={decQty}
                  style={{
                    width: '40px', height: '40px', borderRadius: '8px 0 0 8px',
                    background: 'var(--navy2)', border: '1px solid var(--border)',
                    color: 'var(--cream)', fontSize: '18px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.18s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--navy3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--navy2)'}
                >−</button>
                <div style={{
                  width: '56px', height: '40px',
                  background: 'var(--navy)',
                  borderTop: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--cream)', fontSize: '16px', fontWeight: '700',
                }}>
                  {qty}
                </div>
                <button
                  onClick={incQty}
                  style={{
                    width: '40px', height: '40px', borderRadius: '0 8px 8px 0',
                    background: 'var(--navy2)', border: '1px solid var(--border)',
                    color: 'var(--cream)', fontSize: '18px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.18s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--navy3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--navy2)'}
                >+</button>
              </div>
            </div>

            {/* Add to Cart + Wishlist */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={handleAddToCart}
                className="btn btn-gold"
                style={{ flex: 1, justifyContent: 'center', fontSize: '15px', padding: '14px' }}
              >
                Add to Cart — NOK {product.price * qty}
              </button>
              {user && (
                <button
                  onClick={handleToggleWishlist}
                  title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                  style={{
                    width: '52px', height: '52px', flexShrink: 0,
                    background: 'var(--navy2)', border: '1px solid var(--border)',
                    borderRadius: '10px', fontSize: '22px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.18s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--navy3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--navy2)'}
                >
                  {inWishlist ? '❤️' : '🤍'}
                </button>
              )}
            </div>

            {/* Member upsell callout */}
            <div style={{
              background: 'var(--navy3)',
              borderLeft: '3px solid var(--gold)',
              borderRadius: '0 10px 10px 0',
              padding: '16px 20px',
            }}>
              <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
                <span style={{ color: 'var(--gold)', fontWeight: '700' }}>💎 Member benefit:</span>{' '}
                Become a Nordic Vitals member and earn commissions on every sale in your network.
              </p>
              <Link
                to="/join"
                style={{
                  color: 'var(--gold)',
                  fontSize: '13px',
                  fontWeight: '700',
                  transition: 'opacity 0.18s',
                }}
                onMouseEnter={e => e.target.style.opacity = '0.7'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                → Join here
              </Link>
            </div>
          </div>
        </div>

        {/* ── Reviews section ──────────────────────────────────────── */}
        <div style={{ marginTop: '64px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
          }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--cream)', letterSpacing: '-0.5px' }}>
              Customer Reviews
              {reviews.length > 0 && (
                <span style={{ marginLeft: '10px', fontSize: '14px', color: 'var(--text2)', fontWeight: '400' }}>
                  ({reviews.length})
                </span>
              )}
            </h2>
            {user && !reviewForm.submitted && (
              <button
                onClick={() => setReviewForm(f => ({ ...f, open: !f.open }))}
                className="btn btn-gold"
                style={{ fontSize: '13px', padding: '8px 18px' }}
              >
                {reviewForm.open ? 'Cancel' : 'Write a Review'}
              </button>
            )}
            {!user && (
              <Link to="/login" style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '600' }}>
                Login to leave a review →
              </Link>
            )}
            {reviewForm.submitted && (
              <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: '600' }}>✓ Review submitted</span>
            )}
          </div>

          {/* Write review form */}
          {reviewForm.open && (
            <form onSubmit={handleSubmitReview} style={{
              background: 'var(--navy2)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '8px' }}>Your Rating</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewForm(f => ({ ...f, rating: i }))}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '28px', color: i <= reviewForm.rating ? '#c9a84c' : 'var(--border)',
                        padding: '2px', lineHeight: 1, transition: 'color 0.15s',
                      }}
                    >★</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '8px' }}>Your Review</div>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your experience with this product…"
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--navy)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--cream)', padding: '12px',
                    fontSize: '14px', fontFamily: 'inherit', resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-gold"
                disabled={reviewForm.submitting || !reviewForm.comment.trim()}
                style={{ fontSize: '14px', padding: '10px 24px' }}
              >
                {reviewForm.submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )}

          {/* Summary bar */}
          {reviews.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '24px',
              background: 'var(--navy2)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px 24px', marginBottom: '24px',
              flexWrap: 'wrap',
            }}>
              <div style={{ textAlign: 'center', minWidth: '60px' }}>
                <div style={{ fontSize: '40px', fontWeight: '800', color: 'var(--cream)', lineHeight: 1 }}>
                  {avgRating(reviews).toFixed(1)}
                </div>
                <Stars rating={Math.round(avgRating(reviews))} size={16} />
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>{reviews.length} reviews</div>
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                {[5,4,3,2,1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length
                  const pct = reviews.length ? (count / reviews.length) * 100 : 0
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text2)', width: '16px', textAlign: 'right' }}>{star}</span>
                      <span style={{ color: '#c9a84c', fontSize: '12px' }}>★</span>
                      <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#c9a84c', borderRadius: '3px', transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text2)', width: '16px' }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px',
              color: 'var(--text2)', fontSize: '14px',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
              No reviews yet. Be the first to share your experience!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.map(r => (
                <div key={r.id} style={{
                  background: 'var(--navy2)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'var(--navy3)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--gold)', fontWeight: '700', fontSize: '14px', flexShrink: 0,
                    }}>
                      {r.reviewer[0]}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--cream)' }}>{r.reviewer}</span>
                        {r.verified && (
                          <span style={{
                            fontSize: '11px', background: 'rgba(34,197,94,0.12)',
                            color: '#22c55e', borderRadius: '4px', padding: '2px 6px', fontWeight: '600',
                          }}>✓ Verified Purchase</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <Stars rating={r.rating} size={13} />
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{r.date}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Related products ──────────────────────────────────────── */}
        {(() => {
          const related = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 3)
          const fallback = related.length < 2
            ? products.filter(p => p.id !== product.id).slice(0, 3 - related.length)
            : []
          const show = [...related, ...fallback].slice(0, 3)
          if (!show.length) return null
          return (
            <div style={{ marginTop: '64px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--cream)', letterSpacing: '-0.5px', marginBottom: '24px' }}>
                You May Also Like
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {show.map(p => (
                  <Link key={p.id} to={`/shop/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: productGradients[p.id] || 'var(--navy2)',
                      borderRadius: '12px', padding: '24px',
                      border: '1px solid var(--border)', cursor: 'pointer',
                      transition: 'transform 0.18s, box-shadow 0.18s',
                      display: 'flex', flexDirection: 'column', gap: '10px',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                    >
                      <span style={{ fontSize: '36px' }}>{productEmojis[p.id]}</span>
                      <div style={{ fontWeight: '700', color: 'var(--cream)', fontSize: '15px', lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ color: 'var(--gold)', fontSize: '14px', fontWeight: '700' }}>NOK {p.price}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })()}

      </div>

      {/* Toast */}
      {toast && (
        <div className="toast">
          Added to cart! 🛒
        </div>
      )}
    </div>
    </>
  )
}
