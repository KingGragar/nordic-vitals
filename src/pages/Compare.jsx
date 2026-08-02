import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PRODUCTS, PRODUCT_REVIEWS } from '../data/mock'
import { getVpProducts } from '../api/mlmApi'
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

const productEmojis = { 1: '🐟', 2: '🦐', 3: '☀️', 4: '🪨', 5: '🌿', 6: '🧠' }

function avgRating(reviews, productId) {
  const r = (reviews?.[productId] || []).filter(rv => rv.status === 'approved')
  if (!r.length) return null
  return (r.reduce((s, rv) => s + rv.rating, 0) / r.length).toFixed(1)
}

function Stars({ rating }) {
  const full = Math.round(Number(rating))
  return (
    <span style={{ color: 'var(--gold)', fontSize: '16px' }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  )
}

const ROW = ({ label, children, highlight }) => (
  <tr style={{ borderBottom: '1px solid var(--border)', background: highlight ? 'rgba(196,148,41,0.04)' : 'transparent' }}>
    <td style={{
      padding: '14px 16px',
      color: 'var(--text2)',
      fontSize: '13px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      width: '140px',
      verticalAlign: 'top',
    }}>
      {label}
    </td>
    {children}
  </tr>
)

const CELL = ({ children }) => (
  <td style={{
    padding: '14px 16px',
    color: 'var(--cream)',
    fontSize: '14px',
    borderLeft: '1px solid var(--border)',
    verticalAlign: 'top',
  }}>
    {children}
  </td>
)

export default function Compare() {
  usePageTitle('Compare Products', 'Compare Nordic Vitals supplements side by side — price, ingredients, PV, and member benefits.')
  const [searchParams] = useSearchParams()
  const { addToCart, user } = useAuth()
  const [allProducts, setAllProducts] = useState(PRODUCTS)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getVpProducts().then(d => { if (d?.products?.length) setAllProducts(d.products) }).catch(() => {})
  }, [])

  const ids = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || []
  const products = ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean)

  function handleAddToCart(p) {
    addToCart(p)
    setToast(p.name)
    setTimeout(() => setToast(null), 2000)
  }

  const colWidth = products.length === 1 ? '60%' : products.length === 2 ? '40%' : '28%'

  return (
    <>
      <Navbar />
      <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <Link to="/shop" style={{ color: 'var(--gold)', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
              ← Back to Shop
            </Link>
            <h1 style={{ color: 'var(--cream)', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>
              Compare Products
            </h1>
          </div>

          {products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text2)' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚖️</div>
              <p style={{ fontSize: '18px', color: 'var(--cream)', marginBottom: '12px' }}>No products selected</p>
              <p style={{ fontSize: '14px', marginBottom: '28px' }}>Use the "Compare" button on product cards to select up to 3 products.</p>
              <Link to="/shop" className="btn btn-green">Browse Products</Link>
            </div>
          )}

          {products.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <colgroup>
                  <col style={{ width: '140px' }} />
                  {products.map(p => <col key={p.id} style={{ width: colWidth }} />)}
                </colgroup>

                {/* Product header row */}
                <thead>
                  <tr>
                    <th style={{ padding: '0 16px 20px', textAlign: 'left' }} />
                    {products.map(p => (
                      <th key={p.id} style={{ padding: '0 16px 20px', borderLeft: '1px solid var(--border)', verticalAlign: 'top' }}>
                        <div style={{
                          height: '120px',
                          background: productGradients[p.id] || 'var(--navy2)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '14px',
                          position: 'relative',
                        }}>
                          <span style={{ fontSize: '48px' }}>{productEmojis[p.id] || '💊'}</span>
                        </div>
                        <div style={{ color: 'var(--gold)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                          {p.category}
                        </div>
                        <div style={{ color: 'var(--cream)', fontSize: '15px', fontWeight: '800', lineHeight: 1.3, marginBottom: '12px' }}>
                          {p.name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <button
                            onClick={() => handleAddToCart(p)}
                            className="btn btn-green btn-sm"
                            style={{ width: '100%' }}
                          >
                            Add to Cart
                          </button>
                          <Link
                            to={`/shop/${p.id}`}
                            style={{
                              display: 'block',
                              textAlign: 'center',
                              color: 'var(--gold)',
                              fontSize: '12px',
                              fontWeight: '600',
                              textDecoration: 'none',
                            }}
                          >
                            Full details →
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <ROW label="Tagline" highlight>
                    {products.map(p => (
                      <CELL key={p.id}>
                        <span style={{ color: 'var(--text2)', fontStyle: 'italic' }}>{p.tagline}</span>
                      </CELL>
                    ))}
                  </ROW>

                  <ROW label="Retail Price">
                    {products.map(p => (
                      <CELL key={p.id}>
                        <span style={{ fontSize: '20px', fontWeight: '700' }}>NOK {p.price}</span>
                      </CELL>
                    ))}
                  </ROW>

                  <ROW label="Member Price" highlight>
                    {products.map(p => (
                      <CELL key={p.id}>
                        <span style={{ color: 'var(--gold)', fontSize: '18px', fontWeight: '700' }}>NOK {p.memberPrice}</span>
                        <br />
                        <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: '600' }}>
                          Save NOK {p.price - p.memberPrice} ({Math.round((1 - p.memberPrice / p.price) * 100)}% off)
                        </span>
                      </CELL>
                    ))}
                  </ROW>

                  <ROW label="PV Value">
                    {products.map(p => (
                      <CELL key={p.id}>
                        <span style={{ background: 'rgba(196,148,41,0.15)', color: 'var(--gold)', fontSize: '13px', fontWeight: '700', padding: '2px 10px', borderRadius: '10px', border: '1px solid rgba(196,148,41,0.3)' }}>
                          {p.pv} PV
                        </span>
                      </CELL>
                    ))}
                  </ROW>

                  <ROW label="Rating" highlight>
                    {products.map(p => {
                      const rating = avgRating(PRODUCT_REVIEWS, p.id)
                      return (
                        <CELL key={p.id}>
                          {rating ? (
                            <div>
                              <Stars rating={rating} />
                              <span style={{ color: 'var(--text2)', fontSize: '12px', marginLeft: '6px' }}>{rating} ({(PRODUCT_REVIEWS[p.id] || []).filter(r => r.status === 'approved').length} reviews)</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text2)', fontSize: '13px' }}>No reviews yet</span>
                          )}
                        </CELL>
                      )
                    })}
                  </ROW>

                  <ROW label="Description">
                    {products.map(p => (
                      <CELL key={p.id}>
                        <span style={{ color: 'var(--text2)', lineHeight: 1.6, fontSize: '13px' }}>{p.desc}</span>
                      </CELL>
                    ))}
                  </ROW>

                  <ROW label="Key Ingredients" highlight>
                    {products.map(p => (
                      <CELL key={p.id}>
                        {p.ingredients?.length ? (
                          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text2)', fontSize: '13px', lineHeight: 1.8 }}>
                            {p.ingredients.map((ing, i) => (
                              <li key={i}>{ing}</li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ color: 'var(--text2)', fontSize: '13px' }}>—</span>
                        )}
                      </CELL>
                    ))}
                  </ROW>

                  <ROW label="Member Benefit">
                    {products.map(p => (
                      <CELL key={p.id}>
                        {user ? (
                          <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: '600' }}>✓ You save NOK {p.price - p.memberPrice} as a member</span>
                        ) : (
                          <Link to="/join" style={{ color: 'var(--gold)', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                            Join to unlock member pricing →
                          </Link>
                        )}
                      </CELL>
                    ))}
                  </ROW>

                  {/* Bottom CTA row */}
                  <tr>
                    <td />
                    {products.map(p => (
                      <td key={p.id} style={{ padding: '20px 16px', borderLeft: '1px solid var(--border)' }}>
                        <button
                          onClick={() => handleAddToCart(p)}
                          className="btn btn-green"
                          style={{ width: '100%' }}
                        >
                          Add to Cart — NOK {user ? p.memberPrice : p.price}
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Add more products prompt */}
          {products.length > 0 && products.length < 3 && (
            <div style={{
              marginTop: '32px',
              padding: '20px',
              background: 'var(--navy2)',
              borderRadius: '12px',
              border: '1px dashed var(--border)',
              textAlign: 'center',
              color: 'var(--text2)',
              fontSize: '14px',
            }}>
              You can compare up to 3 products.{' '}
              <Link to="/shop" style={{ color: 'var(--gold)', fontWeight: '600', textDecoration: 'none' }}>
                Add {3 - products.length} more →
              </Link>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="toast">
          {toast} added to cart! 🛒
        </div>
      )}
    </>
  )
}
