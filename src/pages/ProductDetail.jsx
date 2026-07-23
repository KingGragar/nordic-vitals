import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PRODUCTS } from '../data/mock'
import { useAuth } from '../context/AuthContext'
import { getVpProducts } from '../api/mlmApi'
import Navbar from '../components/Navbar'

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

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useAuth()
  const [products, setProducts] = useState(PRODUCTS)
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    getVpProducts()
      .then(d => { if (d?.products?.length) setProducts(d.products) })
      .catch(() => {})
  }, [])

  const product = products.find(p => p.id === Number(id))

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

  function decQty() { setQty(q => Math.max(1, q - 1)) }
  function incQty() { setQty(q => q + 1) }

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

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className="btn btn-gold"
              style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px', marginBottom: '20px' }}
            >
              Add to Cart — NOK {product.price * qty}
            </button>

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
