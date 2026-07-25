import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const TOPICS = [
  'Order / Shipping inquiry',
  'Product question',
  'Membership & commissions',
  'Technical / account issue',
  'Returns & refunds',
  'Other',
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Please enter your name.'); return }
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError('Please enter a valid email address.'); return }
    if (!form.topic) { setError('Please select a topic.'); return }
    if (form.message.trim().length < 10) { setError('Please describe your question (at least 10 characters).'); return }
    setError('')
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '72px' }}>
        {/* Hero */}
        <div style={{ background: 'var(--navy2)', borderBottom: '1px solid var(--border)', padding: '56px 24px 48px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
              SUPPORT
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--cream)', marginBottom: '14px', lineHeight: 1.15 }}>
              Get in Touch
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text2)', maxWidth: '480px', margin: '0 auto' }}>
              We typically respond within one business day. For urgent order issues please include your order number.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '56px 24px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>

            {/* Left: contact info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                {
                  icon: '📦',
                  title: 'Orders & Shipping',
                  text: 'For questions about existing orders, delivery times, or tracking numbers.',
                },
                {
                  icon: '💊',
                  title: 'Products',
                  text: 'Ingredient questions, dosage guidance, or product recommendations.',
                },
                {
                  icon: '💰',
                  title: 'Commissions & Membership',
                  text: 'Questions about your downline, rank requirements, or MLMT withdrawals.',
                },
                {
                  icon: '🔒',
                  title: 'Account & Privacy',
                  text: 'Login issues, data requests, or GDPR rights. See also our Privacy Policy.',
                  link: { to: '/privacy', label: 'Privacy Policy' },
                },
              ].map(card => (
                <div key={card.title} style={{
                  background: 'var(--navy2)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '20px 22px',
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '8px' }}>{card.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cream)', marginBottom: '6px' }}>{card.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>
                    {card.text}
                    {card.link && (
                      <> <Link to={card.link.to} style={{ color: 'var(--gold)' }}>{card.link.label}</Link></>
                    )}
                  </div>
                </div>
              ))}

              <div style={{
                background: 'var(--navy2)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '20px 22px',
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7 }}>
                  <div style={{ color: 'var(--cream)', fontWeight: 700, marginBottom: '8px' }}>Email</div>
                  <a href="mailto:support@nordic-vitals.com" style={{ color: 'var(--gold)' }}>
                    support@nordic-vitals.com
                  </a>
                  <div style={{ color: 'var(--cream)', fontWeight: 700, marginTop: '14px', marginBottom: '6px' }}>Response time</div>
                  Within 1 business day (Mon–Fri, CET)
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div>
              {submitted ? (
                <div style={{
                  background: 'var(--navy2)', border: '1px solid var(--border)',
                  borderRadius: '16px', padding: '48px 32px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cream)', marginBottom: '10px' }}>
                    Message sent!
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '24px', lineHeight: 1.6 }}>
                    We have received your message and will reply to <strong style={{ color: 'var(--cream)' }}>{form.email}</strong> within one business day.
                  </p>
                  <Link to="/" className="btn btn-outline" style={{ fontSize: '14px' }}>
                    Back to Home
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  style={{
                    background: 'var(--navy2)', border: '1px solid var(--border)',
                    borderRadius: '16px', padding: '32px',
                    display: 'flex', flexDirection: 'column', gap: '16px',
                  }}
                >
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>
                    Send us a message
                  </h2>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Your name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Full name"
                      style={{
                        width: '100%', padding: '10px 14px',
                        background: 'var(--navy3)', border: '1px solid var(--border)',
                        borderRadius: '8px', color: 'var(--cream)', fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        width: '100%', padding: '10px 14px',
                        background: 'var(--navy3)', border: '1px solid var(--border)',
                        borderRadius: '8px', color: 'var(--cream)', fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Topic
                    </label>
                    <select
                      value={form.topic}
                      onChange={e => set('topic', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px',
                        background: 'var(--navy3)', border: '1px solid var(--border)',
                        borderRadius: '8px', color: form.topic ? 'var(--cream)' : 'var(--text2)', fontSize: '14px',
                        appearance: 'none',
                      }}
                    >
                      <option value="" disabled>Select a topic…</option>
                      {TOPICS.map(t => <option key={t} value={t} style={{ color: 'var(--cream)', background: 'var(--navy3)' }}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={e => set('message', e.target.value)}
                      placeholder="Describe your question or issue…"
                      rows={5}
                      style={{
                        width: '100%', padding: '10px 14px',
                        background: 'var(--navy3)', border: '1px solid var(--border)',
                        borderRadius: '8px', color: 'var(--cream)', fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {error && (
                    <div style={{ padding: '10px 14px', background: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '8px', fontSize: '13px', color: '#fca5a5' }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-gold"
                    disabled={submitting}
                    style={{ justifyContent: 'center', fontSize: '14px', padding: '12px', opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* FAQ link */}
          <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '14px', color: 'var(--text2)' }}>
            Looking for quick answers?{' '}
            <Link to="/faq" style={{ color: 'var(--gold)', fontWeight: 600 }}>Browse our FAQ →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
