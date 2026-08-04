import { useState } from 'react'
import { subscribeNewsletter } from '../api/mlmApi'

export default function NewsletterWidget({ source = 'landing', compact = false }) {
  const [email, setEmail] = useState('')
  const [name, setName]   = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [msg, setMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setMsg('Please enter a valid email address.'); setStatus('error'); return }
    if (!consent) { setMsg('Please accept the privacy terms to subscribe.'); setStatus('error'); return }
    setStatus('loading')
    setMsg('')
    try {
      const res = await subscribeNewsletter({ email: email.trim(), name: name.trim(), source, segments: ['blog'], consent: true })
      if (res.already) {
        setMsg("You're already subscribed — check your inbox for the latest issue!")
      } else if (res.resubscribed) {
        setMsg("Welcome back! You've been re-added to the newsletter.")
      } else {
        setMsg("You're in! Expect science-backed health tips and product news.")
      }
      setStatus('done')
      setEmail('')
      setName('')
      setConsent(false)
    } catch {
      setMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (compact) {
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ color: 'var(--cream)', fontSize: '16px', fontWeight: '700', margin: '0 0 6px' }}>📬 Stay Updated</h3>
        <p style={{ color: 'var(--text2)', fontSize: '13px', margin: '0 0 16px', lineHeight: '1.5' }}>
          Get new articles, product guides & health tips straight to your inbox.
        </p>
        {status === 'done' ? (
          <div style={{ background: '#14532d', border: '1px solid #16a34a', borderRadius: '8px', padding: '12px 16px', color: '#4ade80', fontSize: '14px' }}>
            ✅ {msg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--cream)', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
            <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer', color: 'var(--text2)', fontSize: '12px', lineHeight: '1.4' }}>
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: '2px', flexShrink: 0 }} />
              I agree to receive email newsletters and have read the <a href="/privacy" target="_blank" rel="noopener" style={{ color: 'var(--gold)' }}>Privacy Policy</a>.
            </label>
            {status === 'error' && <div style={{ color: '#f87171', fontSize: '12px' }}>{msg}</div>}
            <button type="submit" disabled={status === 'loading'}
              style={{ padding: '10px', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: '#0a0a0f', fontWeight: '700', cursor: status === 'loading' ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: status === 'loading' ? 0.7 : 1 }}>
              {status === 'loading' ? 'Subscribing…' : 'Subscribe Free'}
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
    <section style={{ background: 'linear-gradient(135deg, #0f1a2e 0%, #1a0a2e 100%)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
        <h2 style={{ color: 'var(--cream)', fontSize: '28px', fontWeight: '700', margin: '0 0 12px', lineHeight: '1.3' }}>
          Science-backed health tips,<br />straight to your inbox
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '16px', margin: '0 0 32px', lineHeight: '1.6' }}>
          Join 2,400+ readers getting Nordic Vitals product guides, health research, and member success stories — no spam, unsubscribe any time.
        </p>

        {status === 'done' ? (
          <div style={{ background: '#14532d', border: '1px solid #16a34a', borderRadius: '12px', padding: '24px', color: '#4ade80', fontSize: '16px', fontWeight: '500' }}>
            ✅ {msg}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name (optional)"
                style={{ flex: '1', minWidth: '140px', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)', borderRadius: '10px', padding: '13px 16px', color: 'var(--cream)', fontSize: '15px', outline: 'none' }}
              />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ flex: '2', minWidth: '200px', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)', borderRadius: '10px', padding: '13px 16px', color: 'var(--cream)', fontSize: '15px', outline: 'none' }}
              />
              <button type="submit" disabled={status === 'loading'}
                style={{ padding: '13px 28px', background: 'var(--gold)', border: 'none', borderRadius: '10px', color: '#0a0a0f', fontWeight: '700', cursor: status === 'loading' ? 'not-allowed' : 'pointer', fontSize: '15px', opacity: status === 'loading' ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                {status === 'loading' ? 'Subscribing…' : 'Subscribe Free →'}
              </button>
            </div>
            <label style={{ display: 'inline-flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer', color: 'var(--text2)', fontSize: '13px', lineHeight: '1.5', textAlign: 'left' }}>
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: '2px', flexShrink: 0 }} />
              I agree to receive email newsletters from Nordic Vitals AS and have read the{' '}
              <a href="/privacy" target="_blank" rel="noopener" style={{ color: 'var(--gold)' }}>Privacy Policy</a>.
            </label>
            {status === 'error' && <div style={{ color: '#f87171', fontSize: '14px', marginTop: '8px' }}>{msg}</div>}
          </form>
        )}

        <p style={{ color: 'var(--text2)', fontSize: '12px', marginTop: '16px' }}>
          🔒 No spam · GDPR compliant · Unsubscribe any time
        </p>
      </div>
    </section>
  )
}
