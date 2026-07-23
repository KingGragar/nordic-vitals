import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCTS } from '../data/mock'
import { getVpProducts } from '../api/mlmApi'
import Navbar from '../components/Navbar'

const productGradients = {
  1: 'linear-gradient(135deg, #164e63, #1e3a5f)',
  2: 'linear-gradient(135deg, #4c0519, #831843)',
  3: 'linear-gradient(135deg, #78350f, #92400e)',
  4: 'linear-gradient(135deg, #1c1917, #27272a)',
  5: 'linear-gradient(135deg, #14532d, #065f46)',
  6: 'linear-gradient(135deg, #3b0764, #4a044e)',
}

export default function Landing() {
  const [allProducts, setAllProducts] = useState(PRODUCTS)

  useEffect(() => {
    getVpProducts()
      .then(d => { if (d?.products?.length) setAllProducts(d.products) })
      .catch(() => {})
  }, [])

  const featured = allProducts.slice(0, 3)

  return (
    <>
    <Navbar />
    <div style={{ background: 'var(--navy)', color: 'var(--text)' }}>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 40%, var(--navy2) 0%, var(--navy) 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px 120px',
        position: 'relative',
      }}>
        {/* Eyebrow label */}
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '4px',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: '24px',
        }}>
          Pure · Nordic · Potent
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(36px, 7vw, 56px)',
          fontWeight: '800',
          color: 'var(--cream)',
          letterSpacing: '-2px',
          lineHeight: 1.1,
          marginBottom: '24px',
          maxWidth: '700px',
          whiteSpace: 'pre-line',
        }}>
          {'Pure from the North.\nPowerful by nature.'}
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'var(--text2)',
          maxWidth: '520px',
          lineHeight: 1.6,
          marginBottom: '40px',
        }}>
          Premium Scandinavian supplements, crafted from the cleanest sources on earth.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/shop" className="btn btn-gold" style={{ fontSize: '15px', padding: '12px 28px' }}>
            Shop Now
          </Link>
          <Link to="/join" className="btn btn-outline" style={{ fontSize: '15px', padding: '12px 28px' }}>
            Join Our Network
          </Link>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: '36px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text2)',
          fontSize: '12px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          <span>Scroll</span>
          <div style={{
            width: '1px',
            height: '40px',
            background: 'linear-gradient(to bottom, var(--gold), transparent)',
          }} />
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section style={{
        background: 'var(--navy)',
        padding: '80px 24px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {[
              {
                icon: '🔬',
                title: 'Science-Backed',
                desc: 'Every formula is developed with leading Nordic researchers and backed by peer-reviewed clinical evidence.',
              },
              {
                icon: '🌿',
                title: 'Nordic Sourcing',
                desc: 'Ingredients harvested from pristine Arctic and Scandinavian environments for unmatched purity and potency.',
              },
              {
                icon: '💎',
                title: 'Member Rewards',
                desc: 'Earn commissions on every sale in your network through our transparent binary compensation plan.',
              },
            ].map(b => (
              <div
                key={b.title}
                className="card"
                style={{
                  textAlign: 'center',
                  padding: '40px 32px',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{b.icon}</div>
                <h3 style={{
                  color: 'var(--cream)',
                  fontSize: '18px',
                  fontWeight: '700',
                  marginBottom: '12px',
                }}>
                  {b.title}
                </h3>
                <p style={{ color: 'var(--text2)', lineHeight: 1.6, fontSize: '14px' }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section style={{
        background: 'var(--navy2)',
        padding: '80px 24px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: '800',
              color: 'var(--cream)',
              letterSpacing: '-1px',
              marginBottom: '12px',
            }}>
              Our Bestsellers
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '15px' }}>
              The products our members love most
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {featured.map(p => (
              <div
                key={p.id}
                className="card"
                style={{ padding: '0', overflow: 'hidden', transition: 'transform 0.18s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                {/* Gradient image area */}
                <div style={{
                  height: '180px',
                  background: productGradients[p.id],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '48px' }}>
                    {p.id === 1 ? '🐟' : p.id === 2 ? '🦐' : '☀️'}
                  </span>
                </div>

                {/* Card body */}
                <div style={{ padding: '20px 24px 24px' }}>
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
                  <h3 style={{
                    color: 'var(--cream)',
                    fontSize: '17px',
                    fontWeight: '700',
                    marginBottom: '8px',
                  }}>
                    {p.name}
                  </h3>
                  <div style={{
                    color: 'var(--cream)',
                    fontSize: '20px',
                    fontWeight: '700',
                    marginBottom: '16px',
                  }}>
                    NOK {p.price}
                  </div>
                  <Link
                    to={`/shop/${p.id}`}
                    className="btn btn-gold btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    View Product →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link to="/shop" className="btn btn-outline">
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="about" style={{
        background: '#080f18',
        borderTop: '1px solid var(--border)',
        padding: '64px 24px 0',
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}>
          {/* 4-column grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}>
            {/* Brand column */}
            <div>
              <div style={{
                color: 'var(--gold)',
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '12px',
              }}>
                ⬡ Nordic Vitals
              </div>
              <p style={{
                color: 'var(--text2)',
                fontSize: '13px',
                lineHeight: 1.7,
                maxWidth: '220px',
              }}>
                Premium Scandinavian supplements from the purest Nordic sources. Science-backed, member-rewarded.
              </p>
            </div>

            {/* Products */}
            <div>
              <h4 style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Products</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Omega-3', 'Collagen', 'Vitamin D'].map(l => (
                  <Link key={l} to="/shop" style={{ color: 'var(--text2)', fontSize: '14px', transition: 'color 0.18s' }}
                    onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text2)'}
                  >{l}</Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['About', 'Blog', 'Careers'].map(l => (
                  <a key={l} href="#" style={{ color: 'var(--text2)', fontSize: '14px', transition: 'color 0.18s' }}
                    onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text2)'}
                  >{l}</a>
                ))}
              </div>
            </div>

            {/* Members */}
            <div>
              <h4 style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Members</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link to="/join" style={{ color: 'var(--text2)', fontSize: '14px', transition: 'color 0.18s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text2)'}
                >Join</Link>
                <Link to="/dashboard" style={{ color: 'var(--text2)', fontSize: '14px', transition: 'color 0.18s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text2)'}
                >Dashboard</Link>
                <Link to="/join" style={{ color: 'var(--text2)', fontSize: '14px', transition: 'color 0.18s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text2)'}
                >Earn</Link>
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Support</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Contact', 'FAQ', 'Shipping'].map(l => (
                  <a key={l} href="#" style={{ color: 'var(--text2)', fontSize: '14px', transition: 'color 0.18s' }}
                    onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text2)'}
                  >{l}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: '20px 0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <p style={{ color: 'var(--text2)', fontSize: '13px' }}>
              © 2026 Nordic Vitals AS · Oslo, Norway
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}
