import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCTS } from '../data/mock'
import { useAuth } from '../context/AuthContext'
import { getVpProducts, getWishlist, addToWishlist, removeFromWishlist, getBundles } from '../api/mlmApi'
import Navbar from '../components/Navbar'
import SocialProofTicker from '../components/SocialProofTicker'
import PromoBanner from '../components/PromoBanner'
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

const SORT_OPTIONS = [
  { value: 'default',    label: 'Featured' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name-asc',   label: 'Name: A → Z' },
]

export default function Shop() {
  usePageTitle('Shop', 'Browse Nordic Vitals premium Arctic supplements — Omega-3, Collagen, Vitamin D3, Shilajit, Greens, and Focus Formula. Member pricing available.')
  const { addToCart, user } = useAuth()
  const [products, setProducts] = useState(PRODUCTS)
  const [bundles, setBundles] = useState([])
  const [toast, setToast] = useState(false)
  const [bundleToast, setBundleToast] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sort, setSort] = useState('default')
  const [wishlistIds, setWishlistIds] = useState([])

  useEffect(() => {
    getVpProducts()
      .then(d => { if (d?.products?.length) setProducts(d.products) })
      .catch(() => {})
    getBundles({ activeOnly: true })
      .then(d => { if (Array.isArray(d)) setBundles(d) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    getWishlist(user.userId).then(d => { if (d?.productIds) setWishlistIds(d.productIds) }).catch(() => {})
  }, [user])

  function handleAddBundle(bundle) {
    const included = products.filter(p => bundle.productIds?.includes(p.id))
    included.forEach(p => addToCart(p))
    setBundleToast(bundle.name)
    setTimeout(() => setBundleToast(null), 2500)
  }

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))]
    return ['All', ...cats]
  }, [products])

  const displayed = useMemo(() => {
    let list = products
    if (activeCategory !== 'All') {
      list = list.filter(p => p.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.tagline?.toLowerCase().includes(q) ||
        p.desc?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
    }
    if (sort === 'price-asc')  list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'name-asc')   list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [products, activeCategory, search, sort])

  function handleAddToCart(product) {
    addToCart(product)
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  async function handleToggleWishlist(e, product) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    const inWishlist = wishlistIds.includes(product.id)
    if (inWishlist) {
      await removeFromWishlist(user.userId, product.id).catch(() => {})
      setWishlistIds(ids => ids.filter(id => id !== product.id))
    } else {
      await addToWishlist(user.userId, product.id).catch(() => {})
      setWishlistIds(ids => [...ids, product.id])
    }
  }

  return (
    <>
    <Navbar />
    <PromoBanner page="shop" />
    <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: '36px', textAlign: 'center' }}>
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

        {/* Starter Packs / Bundles */}
        {bundles.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--cream)', fontSize: '20px', fontWeight: '800', margin: 0 }}>Starter Packs</h2>
              <span style={{ background: 'rgba(196,148,41,0.15)', color: 'var(--gold)', fontSize: '12px', fontWeight: '700', padding: '2px 10px', borderRadius: '10px', border: '1px solid rgba(196,148,41,0.3)' }}>
                Save more with bundles
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '20px' }}>
              {bundles.map(b => {
                const included = products.filter(p => b.productIds?.includes(p.id))
                const discount = b.retailPrice && b.bundlePrice ? Math.round((1 - b.bundlePrice / b.retailPrice) * 100) : 0
                const price = user ? (b.memberBundlePrice || b.bundlePrice) : b.bundlePrice
                return (
                  <div key={b.id} style={{ background: 'linear-gradient(160deg, var(--navy2) 0%, rgba(26,26,46,0.95) 100%)', border: '1px solid rgba(196,148,41,0.35)', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                    {b.badge && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold)', color: '#000', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', zIndex: 1 }}>
                        {b.badge}
                      </div>
                    )}
                    <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '36px' }}>{b.emoji}</span>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{b.tagline}</div>
                        <h3 style={{ color: 'var(--cream)', fontSize: '16px', fontWeight: '800', margin: '2px 0 0' }}>{b.name}</h3>
                      </div>
                    </div>
                    <div style={{ padding: '12px 20px' }}>
                      <div style={{ marginBottom: '12px' }}>
                        {included.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)', padding: '2px 0' }}>
                            <span>✓ {p.name}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ color: 'var(--text2)', fontSize: '12px', textDecoration: 'line-through' }}>NOK {b.retailPrice}</span>
                            <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '11px', fontWeight: '700', padding: '1px 7px', borderRadius: '8px' }}>-{discount}%</span>
                          </div>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--cream)', lineHeight: 1 }}>NOK {price}</div>
                          {user && b.memberBundlePrice && (
                            <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: '600' }}>★ Member price</div>
                          )}
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{b.totalPv} PV</div>
                        </div>
                        <button
                          onClick={() => handleAddBundle(b)}
                          style={{ padding: '10px 18px', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Add Bundle 🛒
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        {bundles.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', marginBottom: '40px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: 'var(--navy)', padding: '0 14px', color: 'var(--text2)', fontSize: '12px', fontWeight: '600' }}>
              Individual Products
            </span>
          </div>
        )}

        {/* Search + Sort row */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text2)',
              fontSize: '15px',
              pointerEvents: 'none',
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                background: 'var(--navy2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--cream)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              padding: '10px 14px',
              background: 'var(--navy2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text)',
              fontSize: '14px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Category filter pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '32px',
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: activeCategory === cat ? '1px solid var(--gold)' : '1px solid var(--border)',
                background: activeCategory === cat ? 'rgba(196,148,41,0.15)' : 'var(--navy2)',
                color: activeCategory === cat ? 'var(--gold)' : 'var(--text2)',
                fontSize: '13px',
                fontWeight: activeCategory === cat ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Result count */}
        <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '20px' }}>
          {displayed.length === products.length
            ? `Showing all ${products.length} products`
            : `${displayed.length} of ${products.length} products`}
        </div>

        {/* Products grid */}
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>No products match your search.</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('All') }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold)',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {displayed.map(p => (
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
                  position: 'relative',
                }}>
                  <span style={{ fontSize: '52px' }}>{productEmojis[p.id]}</span>
                  {p.category && (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(0,0,0,0.45)',
                      color: 'var(--text2)',
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '3px 9px',
                      borderRadius: '12px',
                      letterSpacing: '0.3px',
                    }}>
                      {p.category}
                    </span>
                  )}
                  {user && (
                    <button
                      onClick={e => handleToggleWishlist(e, p)}
                      title={wishlistIds.includes(p.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                      style={{
                        position: 'absolute', top: '10px', left: '10px',
                        background: 'rgba(0,0,0,0.45)', border: 'none',
                        borderRadius: '50%', width: '32px', height: '32px',
                        fontSize: '15px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.18s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                    >
                      {wishlistIds.includes(p.id) ? '❤️' : '🤍'}
                    </button>
                  )}
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
                      marginBottom: '2px',
                    }}>
                      NOK {p.price}
                    </span>
                    <span style={{
                      color: 'var(--gold)',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      ★ Members: NOK {p.memberPrice} · Save NOK {p.price - p.memberPrice}
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
        )}
      </div>

      {/* Bundle toast */}
      {bundleToast && (
        <div className="toast" style={{ bottom: '80px' }}>
          {bundleToast} added to cart! 🛒
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">
          Added to cart! 🛒
        </div>
      )}
    </div>
    <SocialProofTicker />
    </>
  )
}
