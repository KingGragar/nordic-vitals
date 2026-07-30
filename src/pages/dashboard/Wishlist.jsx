import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getWishlist, removeFromWishlist } from '../../api/mlmApi'
import DashboardLayout from '../../components/DashboardLayout'

const productGradients = {
  1: 'linear-gradient(135deg,#164e63,#1e3a5f)',
  2: 'linear-gradient(135deg,#4c0519,#831843)',
  3: 'linear-gradient(135deg,#78350f,#92400e)',
  4: 'linear-gradient(135deg,#1c1917,#27272a)',
  5: 'linear-gradient(135deg,#14532d,#065f46)',
  6: 'linear-gradient(135deg,#3b0764,#4a044e)',
}

const productEmojis = { 1: '🐟', 2: '🦐', 3: '☀️', 4: '🪨', 5: '🌿', 6: '🧠' }

export default function Wishlist() {
  const { user, addToCart } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!user) return
    getWishlist(user.userId)
      .then(d => setItems(d?.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  async function handleRemove(productId) {
    await removeFromWishlist(user.userId, productId).catch(() => {})
    setItems(prev => prev.filter(p => p.id !== productId))
    showToast('Removed from wishlist')
  }

  function handleAddToCart(product) {
    addToCart(product)
    showToast(`${product.name} added to cart 🛒`)
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '900px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--cream)', marginBottom: '6px', letterSpacing: '-0.5px' }}>
            ❤️ My Wishlist
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>
            Products you've saved for later.
          </p>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text2)', textAlign: 'center', padding: '60px 0', fontSize: '14px' }}>
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>💛</div>
            <h3 style={{ color: 'var(--cream)', fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>
              Your wishlist is empty
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px' }}>
              Browse the shop and tap the heart icon to save products for later.
            </p>
            <Link to="/shop" className="btn btn-gold">Browse Products →</Link>
          </div>
        ) : (
          <>
            <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '20px' }}>
              {items.length} saved product{items.length !== 1 ? 's' : ''}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}>
              {items.map(p => (
                <div key={p.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  {/* Gradient image */}
                  <div style={{
                    height: '140px',
                    background: productGradients[p.id],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <span style={{ fontSize: '48px' }}>{productEmojis[p.id]}</span>
                    {/* Remove heart button */}
                    <button
                      onClick={() => handleRemove(p.id)}
                      title="Remove from wishlist"
                      style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(0,0,0,0.45)', border: 'none',
                        borderRadius: '50%', width: '34px', height: '34px',
                        fontSize: '16px', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.18s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,0,0,0.55)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                    >
                      ❤️
                    </button>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '18px 18px 20px' }}>
                    <div style={{
                      fontSize: '10px', color: 'var(--gold)', fontWeight: '600',
                      letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px',
                    }}>
                      {p.tagline}
                    </div>
                    <h3 style={{
                      color: 'var(--cream)', fontSize: '15px', fontWeight: '700',
                      marginBottom: '10px', lineHeight: 1.3,
                    }}>
                      {p.name}
                    </h3>
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ color: 'var(--cream)', fontSize: '20px', fontWeight: '700', display: 'block' }}>
                        NOK {p.price}
                      </span>
                      <span style={{ color: 'var(--gold)', fontSize: '12px', fontWeight: '600' }}>
                        ★ Members: NOK {p.memberPrice} · Save NOK {p.price - p.memberPrice}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="btn btn-green btn-sm"
                      >
                        Add to Cart
                      </button>
                      <Link to={`/shop/${p.id}`} style={{
                        color: 'var(--gold)', fontSize: '13px', fontWeight: '600',
                        alignSelf: 'center', transition: 'opacity 0.18s',
                      }}
                        onMouseEnter={e => e.target.style.opacity = '0.7'}
                        onMouseLeave={e => e.target.style.opacity = '1'}
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </DashboardLayout>
  )
}
