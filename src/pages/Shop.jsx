import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCTS } from '../data/mock'
import { useAuth } from '../context/AuthContext'

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

export default function Shop() {
  const { addToCart } = useAuth()
  const [toast, setToast] = useState(false)

  function handleAddToCart(product) {
    addToCart(product)
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: '800',
            color: 'var(--cream)',
            letterSpacing: '-1.5px',
            marginBottom: '12px',
          }}>
            Our Products
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
            Science-backed supplements from the cleanest Nordic sources.
          </p>
        </div>

        {/* Products grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {PRODUCTS.map(p => (
            <div
              key={p.id}
              className="card"
              style={{
                padding: '0',
                overflow: 'hidden',
                transition: 'transform 0.18s, box-shadow 0.18s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Gradient image */}
              <div style={{
                height: '160px',
                background: productGradients[p.id],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '52px' }}>{productEmojis[p.id]}</span>
              </div>

              {/* Card body */}
              <div style={{ padding: '20px 20px 24px' }}>
                {/* Tagline */}
                <div style={{
                  fontSize: '11px',
                  color: 'var(--gold)',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}>
                  {p.tagline}
                </div>

                {/* Name */}
                <h3 style={{
                  color: 'var(--cream)',
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '12px',
                  lineHeight: 1.3,
                }}>
                  {p.name}
                </h3>

                {/* Pricing */}
                <div style={{ marginBottom: '18px' }}>
                  <span style={{
                    color: 'var(--cream)',
                    fontSize: '22px',
                    fontWeight: '700',
                    display: 'block',
                    marginBottom: '4px',
                  }}>
                    NOK {p.price}
                  </span>
                  <span style={{
                    color: 'var(--gold)',
                    fontSize: '13px',
                    textDecoration: 'line-through',
                    opacity: 0.8,
                  }}>
                    Member: NOK {p.memberPrice}
                  </span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleAddToCart(p)}
                    className="btn btn-green btn-sm"
                  >
                    Add to Cart
                  </button>
                  <Link
                    to={`/shop/${p.id}`}
                    style={{
                      color: 'var(--gold)',
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'opacity 0.18s',
                    }}
                    onMouseEnter={e => e.target.style.opacity = '0.7'}
                    onMouseLeave={e => e.target.style.opacity = '1'}
                  >
                    Learn more →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast">
          Added to cart! 🛒
        </div>
      )}
    </div>
  )
}
