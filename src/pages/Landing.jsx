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

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: 'var(--navy)', padding: '96px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
              The Opportunity
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: '800', color: 'var(--cream)', letterSpacing: '-1px', marginBottom: '16px' }}>
              Earn while you share
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '15px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
              Three steps to turn your passion for clean supplements into recurring income.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', position: 'relative' }}>
            {[
              {
                step: '01',
                icon: '🛒',
                title: 'Shop & Try',
                desc: 'Choose an enrollment package and experience Nordic Vitals products yourself. Your satisfaction is the foundation of your story.',
              },
              {
                step: '02',
                icon: '📣',
                title: 'Share Your Link',
                desc: 'Get your personal referral link and share it with friends, family, or your audience. Every signup under you builds your network.',
              },
              {
                step: '03',
                icon: '💰',
                title: 'Earn Commissions',
                desc: 'Earn pairing bonuses, sponsor bonuses, and rank rewards as your binary network grows — paid out in MLMT tokens monthly.',
              },
            ].map((item, i) => (
              <div key={item.step} className="card" style={{ padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: '20px', right: '20px',
                  fontSize: '48px', fontWeight: '800', color: 'var(--border)',
                  lineHeight: 1, userSelect: 'none',
                }}>{item.step}</div>
                <div style={{ fontSize: '36px', marginBottom: '20px' }}>{item.icon}</div>
                <h3 style={{ color: 'var(--cream)', fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>{item.title}</h3>
                <p style={{ color: 'var(--text2)', lineHeight: 1.6, fontSize: '14px' }}>{item.desc}</p>
                {i < 2 && (
                  <div style={{
                    display: 'none',
                  }} className="step-arrow" />
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/join" className="btn btn-gold" style={{ fontSize: '15px', padding: '12px 32px' }}>
              Start Earning Today →
            </Link>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ background: 'var(--navy2)', padding: '96px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '64px',
            alignItems: 'center',
          }}>
            {/* Story */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
                Our Story
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: '800', color: 'var(--cream)', letterSpacing: '-1px', marginBottom: '20px', lineHeight: 1.2 }}>
                Born in the Arctic.<br />Built for the world.
              </h2>
              <p style={{ color: 'var(--text2)', lineHeight: 1.8, fontSize: '15px', marginBottom: '16px' }}>
                Nordic Vitals was founded in Oslo by a team of nutritional scientists and wellness entrepreneurs who believed the world deserved access to Scandinavia's purest natural resources.
              </p>
              <p style={{ color: 'var(--text2)', lineHeight: 1.8, fontSize: '15px', marginBottom: '32px' }}>
                Every ingredient is sourced from verified Arctic and Nordic suppliers, third-party tested for potency and purity, and formulated in GMP-certified facilities. No fillers. No compromises.
              </p>
              <Link to="/join" className="btn btn-outline" style={{ display: 'inline-flex' }}>
                Join Our Mission →
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {[
                { value: '5,000+', label: 'Active Members', icon: '👥' },
                { value: '28', label: 'Countries', icon: '🌍' },
                { value: '6', label: 'Premium Products', icon: '🔬' },
                { value: '4.8★', label: 'Avg. Rating', icon: '⭐' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '28px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                  <div style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: '800', color: 'var(--cream)', letterSpacing: '-1px', lineHeight: 1, marginBottom: '6px' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: 'var(--navy)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: '800', color: 'var(--cream)', letterSpacing: '-1px', marginBottom: '12px' }}>
              What our members say
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '15px' }}>Real results from real people across Scandinavia.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              {
                quote: 'The Omega-3 Arctic Pure is unlike anything I\'ve tried. Noticeable difference in joint mobility within two weeks. The quality speaks for itself.',
                name: 'Ingrid Larsson',
                location: 'Stockholm, Sweden',
                initials: 'IL',
                rating: 5,
              },
              {
                quote: 'I\'ve been a network marketer for 8 years. Nordic Vitals\' binary plan is the most transparent I\'ve worked with. My team of 34 earns consistently.',
                name: 'Erik Solberg',
                location: 'Oslo, Norway',
                initials: 'ES',
                rating: 5,
              },
              {
                quote: 'Focus Formula has replaced my morning coffee ritual. The Lion\'s Mane + L-Theanine combo gives me clean, sustained focus without the crash.',
                name: 'Mia Andersen',
                location: 'Copenhagen, Denmark',
                initials: 'MA',
                rating: 5,
              },
            ].map(t => (
              <div key={t.name} className="card" style={{ padding: '28px' }}>
                {/* Stars */}
                <div style={{ color: 'var(--gold)', fontSize: '14px', marginBottom: '16px' }}>
                  {'★'.repeat(t.rating)}
                </div>
                {/* Quote */}
                <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '14px', marginBottom: '20px', fontStyle: 'italic' }}>
                  "{t.quote}"
                </p>
                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: 'var(--navy3)', border: '2px solid var(--gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gold)', fontWeight: '700', fontSize: '12px',
                    flexShrink: 0,
                  }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ color: 'var(--cream)', fontWeight: '600', fontSize: '14px' }}>{t.name}</div>
                    <div style={{ color: 'var(--text2)', fontSize: '12px' }}>{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0d2137 0%, #0a1a2c 50%, #1a120b 100%)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '20px' }}>
            Ready to Start?
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: '800', color: 'var(--cream)', letterSpacing: '-1px', marginBottom: '16px', lineHeight: 1.2 }}>
            Join Nordic Vitals today
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: 1.6, marginBottom: '36px' }}>
            Start with a product package, build your network, and earn recurring commissions — all backed by world-class Nordic supplements.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/join" className="btn btn-gold" style={{ fontSize: '15px', padding: '12px 28px' }}>
              Enroll Now →
            </Link>
            <Link to="/shop" className="btn btn-outline" style={{ fontSize: '15px', padding: '12px 28px' }}>
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
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
