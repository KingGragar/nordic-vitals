import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, cart, cartCount, cartTotal, updateQty, removeFromCart } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleCheckout() {
    setDrawerOpen(false)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  return (
    <>
      {/* Navbar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: '#0d1b2a',
        height: '64px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: '16px',
      }}>
        {/* Left: Logo */}
        <Link to="/" style={{
          color: 'var(--gold)',
          fontSize: '18px',
          fontWeight: '700',
          letterSpacing: '-0.5px',
          flexShrink: 0,
        }}>
          ⬡ Nordic Vitals
        </Link>

        {/* Center: Nav links (desktop) */}
        <div style={{
          display: 'flex',
          gap: '32px',
          alignItems: 'center',
        }} className="nav-links-desktop">
          <Link to="/shop" style={{
            color: 'var(--text)',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'color 0.18s',
          }}
            onMouseEnter={e => e.target.style.color = 'var(--gold)'}
            onMouseLeave={e => e.target.style.color = 'var(--text)'}
          >Shop</Link>
          <a href="/#about" style={{
            color: 'var(--text)',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'color 0.18s',
          }}
            onMouseEnter={e => e.target.style.color = 'var(--gold)'}
            onMouseLeave={e => e.target.style.color = 'var(--text)'}
          >About</a>
          <Link to="/join" style={{
            color: 'var(--text)',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'color 0.18s',
          }}
            onMouseEnter={e => e.target.style.color = 'var(--gold)'}
            onMouseLeave={e => e.target.style.color = 'var(--text)'}
          >Join Us</Link>
        </div>

        {/* Right: Auth + Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {/* Desktop auth links */}
          <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <>
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  style={{ color: 'var(--text)', fontSize: '14px', fontWeight: '500', transition: 'color 0.18s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text)'}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{ color: 'var(--text)', fontSize: '14px', fontWeight: '500', transition: 'color 0.18s' }}
                onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                onMouseLeave={e => e.target.style.color = 'var(--text)'}
              >
                Login
              </Link>
            )}
          </div>

          {/* Cart icon */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              position: 'relative',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
            aria-label="Open cart"
          >
            🛒
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--gold)',
                color: 'var(--navy)',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* Hamburger (mobile) */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileMenuOpen(o => !o)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cream)',
              fontSize: '22px',
              display: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div style={{
          background: 'var(--navy2)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'sticky',
          top: '64px',
          zIndex: 999,
        }} className="nav-mobile-menu">
          <Link to="/shop" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text)', fontSize: '15px' }}>Shop</Link>
          <a href="/#about" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text)', fontSize: '15px' }}>About</a>
          <Link to="/join" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text)', fontSize: '15px' }}>Join Us</Link>
          {user ? (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: 'var(--text)', fontSize: '15px' }}
              >Dashboard</Link>
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false) }} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text)', fontSize: '15px' }}>Login</Link>
          )}
        </div>
      )}

      {/* Cart drawer overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1100,
          }}
        />
      )}

      {/* Cart drawer panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: drawerOpen ? 0 : '-400px',
        width: '360px',
        height: '100%',
        background: 'var(--navy2)',
        borderLeft: '1px solid var(--border)',
        zIndex: 1101,
        transition: 'right 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Drawer header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '17px' }}>
            Your Cart {cartCount > 0 && <span style={{ color: 'var(--gold)', fontSize: '14px' }}>({cartCount})</span>}
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer' }}
          >✕</button>
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text2)', marginTop: '48px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛒</div>
              <p>Your cart is empty.</p>
              <Link
                to="/shop"
                onClick={() => setDrawerOpen(false)}
                style={{ color: 'var(--gold)', fontSize: '14px', marginTop: '12px', display: 'inline-block' }}
              >Browse products →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  background: 'var(--navy3)',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ color: 'var(--cream)', fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{item.name}</div>
                      <div style={{ color: 'var(--gold)', fontSize: '13px' }}>NOK {item.price} ea.</div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}
                      aria-label="Remove item"
                    >×</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        style={{
                          width: '28px', height: '28px', borderRadius: '6px 0 0 6px',
                          background: 'var(--navy)', border: '1px solid var(--border)',
                          color: 'var(--cream)', fontSize: '16px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >−</button>
                      <div style={{
                        width: '36px', height: '28px', background: 'var(--navy)',
                        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--cream)', fontSize: '14px', fontWeight: '600',
                      }}>{item.qty}</div>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        style={{
                          width: '28px', height: '28px', borderRadius: '0 6px 6px 0',
                          background: 'var(--navy)', border: '1px solid var(--border)',
                          color: 'var(--cream)', fontSize: '16px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >+</button>
                    </div>
                    <div style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '15px' }}>
                      NOK {item.price * item.qty}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer footer */}
        {cart.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--navy2)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <span style={{ color: 'var(--text2)', fontSize: '14px' }}>Total</span>
              <span style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '20px' }}>
                NOK {cartTotal}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="btn btn-gold"
              style={{ width: '100%', justifyContent: 'center', fontSize: '15px' }}
            >
              Checkout
            </button>
          </div>
        )}
      </div>

      {/* Checkout toast */}
      {toastVisible && (
        <div className="toast">
          Order placed! 🎉
        </div>
      )}

      {/* Responsive styles injected */}
      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}
