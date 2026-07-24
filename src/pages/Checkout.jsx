import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { placeOrder, postVolumeEvent } from '../api/mlmApi'
import Navbar from '../components/Navbar'

const COUNTRIES = [
  'Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland',
  'Germany', 'Netherlands', 'United Kingdom', 'United States', 'Other',
]

export default function Checkout() {
  const { cart, cartTotal, cartCount, removeFromCart, clearCart, user } = useAuth()
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderRef, setOrderRef] = useState('')
  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email || '',
    address:   '',
    city:      '',
    postal:    '',
    country:   'Norway',
  })
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim())  e.lastName  = 'Required'
    if (!form.email.includes('@')) e.email = 'Valid email required'
    if (!form.address.trim()) e.address = 'Required'
    if (!form.city.trim())    e.city    = 'Required'
    if (!form.postal.trim())  e.postal  = 'Required'
    return e
  }

  function handleChange(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSubmitting(true)
    const ref = 'NV-ORD-' + String(Date.now()).slice(-6)
    try {
      await placeOrder({
        userId: user?.userId,
        items: cart,
        shippingAddress: { ...form },
        orderRef: ref,
      })
      if (user?.userId) {
        const totalPv = cart.reduce((s, i) => s + (i.pv || i.price) * i.qty, 0)
        postVolumeEvent({
          userId: user.userId,
          planType: user.planType || 'binary',
          pv: totalPv,
          bv: totalPv,
          orderId: ref,
        }).catch(() => {})
      }
    } catch {}
    clearCart()
    setOrderRef(ref)
    setSubmitting(false)
    setDone(true)
  }

  if (cart.length === 0 && !done) {
    return (
      <>
        <Navbar />
        <div style={{ background: 'var(--navy)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px 24px' }}>
          <div style={{ fontSize: '48px' }}>🛒</div>
          <h2 style={{ color: 'var(--cream)', fontSize: '22px', fontWeight: '700' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text2)', fontSize: '15px' }}>Add some products before checking out.</p>
          <Link to="/shop" className="btn btn-gold" style={{ padding: '12px 28px' }}>Browse Products →</Link>
        </div>
      </>
    )
  }

  if (done) {
    return (
      <div style={{ background: 'var(--navy)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800', color: 'var(--cream)', letterSpacing: '-1px', marginBottom: '16px' }}>
            Order Confirmed!
          </h1>
          <div style={{ color: 'var(--text2)', fontSize: '15px', marginBottom: '8px' }}>Order reference:</div>
          <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: '700', color: 'var(--gold)', marginBottom: '24px', letterSpacing: '2px' }}>
            {orderRef}
          </div>
          <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: 1.6, marginBottom: '36px' }}>
            Thank you for your order! A confirmation has been sent to <strong style={{ color: 'var(--cream)' }}>{form.email}</strong>. You will receive a shipping notification once your order is dispatched.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard/orders')} className="btn btn-gold" style={{ padding: '12px 24px' }}>
              View My Orders →
            </button>
            <Link to="/shop" className="btn btn-outline" style={{ padding: '12px 24px' }}>
              Keep Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>

          {/* Breadcrumb */}
          <div style={{ marginBottom: '32px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--text2)' }}>
            <Link to="/shop" style={{ color: 'var(--text2)' }}
              onMouseEnter={e => e.target.style.color = 'var(--gold)'}
              onMouseLeave={e => e.target.style.color = 'var(--text2)'}
            >Shop</Link>
            <span>›</span>
            <span style={{ color: 'var(--cream)' }}>Checkout</span>
          </div>

          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800', color: 'var(--cream)', letterSpacing: '-1px', marginBottom: '40px' }}>
            Checkout
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'start' }}>

            {/* LEFT: Shipping form */}
            <form onSubmit={handleSubmit}>
              <div className="card" style={{ padding: '28px' }}>
                <h2 style={{ color: 'var(--cream)', fontSize: '17px', fontWeight: '700', marginBottom: '24px' }}>
                  Shipping Information
                </h2>

                {/* Name row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label className="label-text">First name</label>
                    <input
                      className="input"
                      placeholder="Lars"
                      value={form.firstName}
                      onChange={e => handleChange('firstName', e.target.value)}
                    />
                    {errors.firstName && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{errors.firstName}</div>}
                  </div>
                  <div>
                    <label className="label-text">Last name</label>
                    <input
                      className="input"
                      placeholder="Eriksen"
                      value={form.lastName}
                      onChange={e => handleChange('lastName', e.target.value)}
                    />
                    {errors.lastName && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{errors.lastName}</div>}
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: '14px' }}>
                  <label className="label-text">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                  />
                  {errors.email && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{errors.email}</div>}
                </div>

                {/* Address */}
                <div style={{ marginBottom: '14px' }}>
                  <label className="label-text">Street address</label>
                  <input
                    className="input"
                    placeholder="Karl Johans gate 1"
                    value={form.address}
                    onChange={e => handleChange('address', e.target.value)}
                  />
                  {errors.address && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{errors.address}</div>}
                </div>

                {/* City + Postal */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label className="label-text">City</label>
                    <input
                      className="input"
                      placeholder="Oslo"
                      value={form.city}
                      onChange={e => handleChange('city', e.target.value)}
                    />
                    {errors.city && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{errors.city}</div>}
                  </div>
                  <div>
                    <label className="label-text">Postal code</label>
                    <input
                      className="input"
                      placeholder="0154"
                      value={form.postal}
                      onChange={e => handleChange('postal', e.target.value)}
                    />
                    {errors.postal && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{errors.postal}</div>}
                  </div>
                </div>

                {/* Country */}
                <div style={{ marginBottom: '28px' }}>
                  <label className="label-text">Country</label>
                  <select
                    className="input"
                    value={form.country}
                    onChange={e => handleChange('country', e.target.value)}
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Payment notice */}
                <div style={{
                  background: 'var(--navy3)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: 'var(--text2)',
                  lineHeight: 1.5,
                }}>
                  💳 Secure payment is being set up. Your order will be confirmed and invoiced via email.
                </div>

                <button
                  type="submit"
                  className="btn btn-gold"
                  disabled={submitting}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Placing order…' : `Confirm Order · NOK ${cartTotal}`}
                </button>
              </div>
            </form>

            {/* RIGHT: Order summary */}
            <div className="card" style={{ padding: '28px' }}>
              <h2 style={{ color: 'var(--cream)', fontSize: '17px', fontWeight: '700', marginBottom: '20px' }}>
                Order Summary ({cartCount} {cartCount === 1 ? 'item' : 'items'})
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--cream)', fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{item.name}</div>
                      <div style={{ color: 'var(--text2)', fontSize: '13px' }}>Qty {item.qty} × NOK {item.price}</div>
                    </div>
                    <div style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                      NOK {item.price * item.qty}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>
                  <span>Subtotal</span>
                  <span>NOK {cartTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
                  <span>Shipping</span>
                  <span style={{ color: 'var(--gold)' }}>Free</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '16px' }}>Total</span>
                  <span style={{ color: 'var(--cream)', fontWeight: '800', fontSize: '22px' }}>NOK {cartTotal}</span>
                </div>
              </div>

              {user && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', fontSize: '13px', color: 'var(--gold)' }}>
                  ★ Member order — earns PV towards your rank progress.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
