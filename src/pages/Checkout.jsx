import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { placeOrder, processPayment, postVolumeEvent, validatePromoCode } from '../api/mlmApi'
import Navbar from '../components/Navbar'

const COUNTRIES = [
  'Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland',
  'Germany', 'Netherlands', 'United Kingdom', 'United States', 'Other',
]

const STEPS = ['Shipping', 'Payment', 'Confirmation']

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '40px' }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i < current ? 'var(--gold)' : i === current ? 'var(--gold)' : 'var(--navy3)',
              border: i <= current ? '2px solid var(--gold)' : '2px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700',
              color: i <= current ? '#000' : 'var(--text2)',
              flexShrink: 0,
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: '13px', fontWeight: i === current ? '700' : '400',
              color: i === current ? 'var(--cream)' : i < current ? 'var(--gold)' : 'var(--text2)',
              whiteSpace: 'nowrap',
            }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? 'var(--gold)' : 'var(--border)', margin: '0 12px' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function detectCardBrand(num) {
  const n = num.replace(/\s/g, '')
  if (/^4/.test(n)) return 'Visa'
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  return null
}

const CARD_BRAND_EMOJI = { Visa: '💳', Mastercard: '💳', Amex: '💳' }

export default function Checkout() {
  const { cart, cartTotal, cartCount, removeFromCart, clearCart, user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [orderRef, setOrderRef] = useState('')
  const [txnId, setTxnId] = useState('')

  const [ship, setShip] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email || '',
    address:   '',
    city:      '',
    postal:    '',
    country:   'Norway',
  })
  const [shipErrors, setShipErrors] = useState({})

  const [payMethod, setPayMethod] = useState('card')
  const [card, setCard] = useState({ name: user?.name || '', number: '', expiry: '', cvv: '' })
  const [cardErrors, setCardErrors] = useState({})
  const [vippsPhone, setVippsPhone] = useState('')
  const [vippsError, setVippsError] = useState('')
  const [showCvv, setShowCvv] = useState(false)
  const cvvRef = useRef(null)

  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState(null)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)

  const finalTotal = Math.max(0, cartTotal - promoDiscount)

  async function handleApplyPromo() {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError('')
    setPromoApplied(null)
    setPromoDiscount(0)
    try {
      const res = await validatePromoCode(promoInput.trim(), cartTotal)
      if (res.valid) { setPromoApplied(res.promo); setPromoDiscount(res.discount) }
      else setPromoError(res.error || 'Invalid promo code.')
    } catch { setPromoError('Could not validate. Try again.') }
    setPromoLoading(false)
  }

  function validateShip() {
    const e = {}
    if (!ship.firstName.trim()) e.firstName = 'Required'
    if (!ship.lastName.trim())  e.lastName  = 'Required'
    if (!ship.email.includes('@')) e.email = 'Valid email required'
    if (!ship.address.trim()) e.address = 'Required'
    if (!ship.city.trim())    e.city    = 'Required'
    if (!ship.postal.trim())  e.postal  = 'Required'
    return e
  }

  function handleNextShip() {
    const e = validateShip()
    if (Object.keys(e).length) { setShipErrors(e); return }
    setStep(1)
    window.scrollTo(0, 0)
  }

  function validateCard() {
    const e = {}
    if (!card.name.trim()) e.name = 'Required'
    const digits = card.number.replace(/\s/g, '')
    if (digits.length < 13) e.number = 'Enter a valid card number'
    const [mm, yy] = (card.expiry || '').split('/')
    if (!mm || !yy || parseInt(mm) < 1 || parseInt(mm) > 12 || yy.length < 2) e.expiry = 'MM/YY'
    if (card.cvv.length < 3) e.cvv = '3+ digits'
    return e
  }

  function validateVipps() {
    const digits = vippsPhone.replace(/\D/g, '')
    if (digits.length < 8) return 'Enter your Norwegian mobile number'
    return ''
  }

  async function handlePay(ev) {
    ev.preventDefault()

    if (payMethod === 'card') {
      const e = validateCard()
      if (Object.keys(e).length) { setCardErrors(e); return }
    } else if (payMethod === 'vipps') {
      const err = validateVipps()
      if (err) { setVippsError(err); return }
    }

    setSubmitting(true)
    const ref = 'NV-ORD-' + String(Date.now()).slice(-6)
    try {
      await placeOrder({
        userId: user?.userId, items: cart,
        shippingAddress: ship, orderRef: ref,
        promoCode: promoApplied?.code || null, discount: promoDiscount, total: finalTotal,
      })
      const payDetails = payMethod === 'card'
        ? { cardLast4: card.number.replace(/\s/g, '').slice(-4), cardBrand: detectCardBrand(card.number) }
        : payMethod === 'vipps'
        ? { phone: vippsPhone }
        : {}
      const txn = await processPayment({ orderRef: ref, method: payMethod, amount: finalTotal, paymentDetails: payDetails })
      if (user?.userId) {
        const totalPv = cart.reduce((s, i) => s + (i.pv || i.price) * i.qty, 0)
        postVolumeEvent({ userId: user.userId, planType: user.planType || 'binary', pv: totalPv, bv: totalPv, orderId: ref }).catch(() => {})
      }
      setOrderRef(ref)
      setTxnId(txn.transactionId || '')
      clearCart()
      setStep(2)
      window.scrollTo(0, 0)
    } catch (err) {
      setCardErrors({ _submit: err.message || 'Payment failed. Please try again.' })
    }
    setSubmitting(false)
  }

  function handleCardNumber(val) {
    setCard(c => ({ ...c, number: formatCardNumber(val) }))
    setCardErrors(e => ({ ...e, number: '' }))
  }
  function handleExpiry(val) {
    let v = val.replace(/\D/g, '').slice(0, 4)
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
    setCard(c => ({ ...c, expiry: v }))
    setCardErrors(e => ({ ...e, expiry: '' }))
  }

  if (cart.length === 0 && step !== 2) {
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

  const cardBrand = detectCardBrand(card.number)

  return (
    <>
      <Navbar />
      <div style={{ background: 'var(--navy)', minHeight: '100vh', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>

          {/* Breadcrumb */}
          <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--text2)' }}>
            <Link to="/shop" style={{ color: 'var(--text2)' }}
              onMouseEnter={e => e.target.style.color = 'var(--gold)'}
              onMouseLeave={e => e.target.style.color = 'var(--text2)'}
            >Shop</Link>
            <span>›</span>
            <span style={{ color: 'var(--cream)' }}>Checkout</span>
          </div>

          <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: '800', color: 'var(--cream)', letterSpacing: '-0.5px', marginBottom: '32px' }}>
            Checkout
          </h1>

          <StepBar current={step} />

          {/* ── STEP 0: SHIPPING ── */}
          {step === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'start' }}>
              <div className="card" style={{ padding: '28px' }}>
                <h2 style={{ color: 'var(--cream)', fontSize: '17px', fontWeight: '700', marginBottom: '24px' }}>Shipping Information</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label className="label-text">First name</label>
                    <input className="input" placeholder="Lars" value={ship.firstName}
                      onChange={e => { setShip(s => ({ ...s, firstName: e.target.value })); setShipErrors(er => ({ ...er, firstName: '' })) }} />
                    {shipErrors.firstName && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{shipErrors.firstName}</div>}
                  </div>
                  <div>
                    <label className="label-text">Last name</label>
                    <input className="input" placeholder="Eriksen" value={ship.lastName}
                      onChange={e => { setShip(s => ({ ...s, lastName: e.target.value })); setShipErrors(er => ({ ...er, lastName: '' })) }} />
                    {shipErrors.lastName && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{shipErrors.lastName}</div>}
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="label-text">Email</label>
                  <input type="email" className="input" placeholder="you@example.com" value={ship.email}
                    onChange={e => { setShip(s => ({ ...s, email: e.target.value })); setShipErrors(er => ({ ...er, email: '' })) }} />
                  {shipErrors.email && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{shipErrors.email}</div>}
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="label-text">Street address</label>
                  <input className="input" placeholder="Karl Johans gate 1" value={ship.address}
                    onChange={e => { setShip(s => ({ ...s, address: e.target.value })); setShipErrors(er => ({ ...er, address: '' })) }} />
                  {shipErrors.address && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{shipErrors.address}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label className="label-text">City</label>
                    <input className="input" placeholder="Oslo" value={ship.city}
                      onChange={e => { setShip(s => ({ ...s, city: e.target.value })); setShipErrors(er => ({ ...er, city: '' })) }} />
                    {shipErrors.city && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{shipErrors.city}</div>}
                  </div>
                  <div>
                    <label className="label-text">Postal code</label>
                    <input className="input" placeholder="0154" value={ship.postal}
                      onChange={e => { setShip(s => ({ ...s, postal: e.target.value })); setShipErrors(er => ({ ...er, postal: '' })) }} />
                    {shipErrors.postal && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{shipErrors.postal}</div>}
                  </div>
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label className="label-text">Country</label>
                  <select className="input" value={ship.country} onChange={e => setShip(s => ({ ...s, country: e.target.value }))}>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <button className="btn btn-gold" onClick={handleNextShip}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px' }}>
                  Continue to Payment →
                </button>
              </div>

              <OrderSummary cart={cart} cartTotal={cartTotal} cartCount={cartCount} removeFromCart={removeFromCart}
                promoInput={promoInput} setPromoInput={setPromoInput} promoApplied={promoApplied}
                promoDiscount={promoDiscount} promoError={promoError} promoLoading={promoLoading}
                handleApplyPromo={handleApplyPromo} removePromo={() => { setPromoApplied(null); setPromoDiscount(0); setPromoInput(''); setPromoError('') }}
                finalTotal={finalTotal} user={user} editable />
            </div>
          )}

          {/* ── STEP 1: PAYMENT ── */}
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'start' }}>
              <form onSubmit={handlePay}>
                <div className="card" style={{ padding: '28px' }}>
                  <h2 style={{ color: 'var(--cream)', fontSize: '17px', fontWeight: '700', marginBottom: '20px' }}>Payment Method</h2>

                  {/* Method selector */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'card',   label: '💳 Card',   sub: 'Visa · Mastercard' },
                      { id: 'vipps',  label: '📱 Vipps',  sub: 'Mobile pay' },
                      { id: 'klarna', label: '🛍️ Klarna', sub: 'Pay later' },
                    ].map(m => (
                      <button
                        key={m.id} type="button"
                        onClick={() => { setPayMethod(m.id); setCardErrors({}); setVippsError('') }}
                        style={{
                          flex: 1, minWidth: '100px', padding: '12px 14px', borderRadius: '10px',
                          border: payMethod === m.id ? '2px solid var(--gold)' : '2px solid var(--border)',
                          background: payMethod === m.id ? 'rgba(201,168,76,0.08)' : 'var(--navy3)',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: '700', color: payMethod === m.id ? 'var(--gold)' : 'var(--cream)' }}>{m.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{m.sub}</div>
                      </button>
                    ))}
                  </div>

                  {/* Card form */}
                  {payMethod === 'card' && (
                    <div>
                      <div style={{ marginBottom: '14px' }}>
                        <label className="label-text">Cardholder name</label>
                        <input className="input" placeholder="Lars Eriksen" value={card.name}
                          onChange={e => { setCard(c => ({ ...c, name: e.target.value })); setCardErrors(er => ({ ...er, name: '' })) }} />
                        {cardErrors.name && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{cardErrors.name}</div>}
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <label className="label-text" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Card number</span>
                          {cardBrand && <span style={{ color: 'var(--text2)', fontSize: '12px' }}>{cardBrand}</span>}
                        </label>
                        <input className="input" placeholder="0000 0000 0000 0000" value={card.number}
                          inputMode="numeric" maxLength={19}
                          onChange={e => handleCardNumber(e.target.value)}
                          style={{ fontFamily: 'monospace', letterSpacing: '2px' }} />
                        {cardErrors.number && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{cardErrors.number}</div>}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                        <div>
                          <label className="label-text">Expiry (MM/YY)</label>
                          <input className="input" placeholder="08/27" value={card.expiry}
                            inputMode="numeric" maxLength={5}
                            onChange={e => handleExpiry(e.target.value)}
                            style={{ fontFamily: 'monospace', letterSpacing: '2px' }} />
                          {cardErrors.expiry && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{cardErrors.expiry}</div>}
                        </div>
                        <div>
                          <label className="label-text" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>CVV</span>
                            <button type="button" tabIndex={-1}
                              onMouseDown={() => setShowCvv(true)} onMouseUp={() => setShowCvv(false)} onMouseLeave={() => setShowCvv(false)}
                              onTouchStart={() => setShowCvv(true)} onTouchEnd={() => setShowCvv(false)}
                              style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                              {showCvv ? 'hide' : 'show'}
                            </button>
                          </label>
                          <input className="input" ref={cvvRef} placeholder="•••" value={card.cvv}
                            type={showCvv ? 'text' : 'password'} inputMode="numeric" maxLength={4}
                            onChange={e => { setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })); setCardErrors(er => ({ ...er, cvv: '' })) }}
                            style={{ fontFamily: 'monospace', letterSpacing: '4px' }} />
                          {cardErrors.cvv && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{cardErrors.cvv}</div>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '12px', color: 'var(--text2)' }}>
                        <span>🔒</span>
                        <span>256-bit SSL encryption · PCI DSS compliant · Your card details are never stored.</span>
                      </div>
                    </div>
                  )}

                  {/* Vipps form */}
                  {payMethod === 'vipps' && (
                    <div>
                      <div style={{ padding: '16px', background: 'rgba(255,90,0,0.06)', border: '1px solid rgba(255,90,0,0.2)', borderRadius: '10px', marginBottom: '20px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: '600', marginBottom: '6px' }}>Pay with Vipps</div>
                        <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>Enter your Norwegian mobile number and confirm the payment in the Vipps app.</div>
                      </div>
                      <div style={{ marginBottom: '24px' }}>
                        <label className="label-text">Mobile number</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ padding: '10px 12px', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', fontSize: '14px', flexShrink: 0 }}>🇳🇴 +47</div>
                          <input className="input" placeholder="400 00 000" value={vippsPhone}
                            inputMode="tel" maxLength={12}
                            onChange={e => { setVippsPhone(e.target.value); setVippsError('') }}
                            style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '1px' }} />
                        </div>
                        {vippsError && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '6px' }}>{vippsError}</div>}
                      </div>
                    </div>
                  )}

                  {/* Klarna */}
                  {payMethod === 'klarna' && (
                    <div>
                      <div style={{ padding: '16px', background: 'rgba(255,182,193,0.06)', border: '1px solid rgba(255,182,193,0.15)', borderRadius: '10px', marginBottom: '20px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: '600', marginBottom: '6px' }}>🛍️ Pay later with Klarna</div>
                        <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5, marginBottom: '12px' }}>
                          Split your NOK {finalTotal} purchase into 3 interest-free payments of <strong style={{ color: 'var(--cream)' }}>NOK {Math.ceil(finalTotal / 3)}</strong> per month.
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[1, 2, 3].map(n => (
                            <div key={n} style={{ flex: 1, padding: '8px', background: 'var(--navy3)', borderRadius: '6px', textAlign: 'center' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '2px' }}>Month {n}</div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gold)' }}>NOK {Math.ceil(finalTotal / 3)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: '24px', fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6 }}>
                        By continuing, you agree to Klarna's{' '}
                        <a href="https://www.klarna.com/no/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>terms</a>.
                        Klarna will perform a soft credit check.
                      </div>
                    </div>
                  )}

                  {cardErrors._submit && (
                    <div style={{ padding: '12px 14px', background: 'rgba(252,165,165,0.1)', border: '1px solid rgba(252,165,165,0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                      ⚠️ {cardErrors._submit}
                    </div>
                  )}

                  <button
                    type="submit" className="btn btn-gold"
                    disabled={submitting}
                    style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px', opacity: submitting ? 0.7 : 1, marginBottom: '12px' }}
                  >
                    {submitting
                      ? (payMethod === 'vipps' ? 'Sending Vipps request…' : payMethod === 'klarna' ? 'Connecting to Klarna…' : 'Processing payment…')
                      : payMethod === 'vipps'
                      ? `Send Vipps request · NOK ${finalTotal}`
                      : payMethod === 'klarna'
                      ? `Pay with Klarna · NOK ${Math.ceil(finalTotal / 3)}/mo`
                      : `Pay now · NOK ${finalTotal}`
                    }
                  </button>

                  <button
                    type="button" className="btn btn-outline"
                    onClick={() => { setStep(0); setCardErrors({}); setVippsError('') }}
                    style={{ width: '100%', justifyContent: 'center', fontSize: '14px', padding: '12px' }}
                  >
                    ← Back to shipping
                  </button>

                  <p style={{ fontSize: '12px', color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6, marginTop: '12px' }}>
                    By paying you agree to our{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Terms</a>
                    {' '}and{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Privacy Policy</a>.
                  </p>
                </div>
              </form>

              <OrderSummary cart={cart} cartTotal={cartTotal} cartCount={cartCount}
                promoApplied={promoApplied} promoDiscount={promoDiscount} finalTotal={finalTotal} user={user}
                editable={false} />
            </div>
          )}

          {/* ── STEP 2: CONFIRMATION ── */}
          {step === 2 && (
            <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: '72px', marginBottom: '24px' }}>✅</div>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800', color: 'var(--cream)', letterSpacing: '-1px', marginBottom: '16px' }}>
                Order Confirmed!
              </h1>
              <div style={{ color: 'var(--text2)', fontSize: '15px', marginBottom: '6px' }}>Order reference</div>
              <div style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: '700', color: 'var(--gold)', marginBottom: '8px', letterSpacing: '2px' }}>
                {orderRef}
              </div>
              {txnId && (
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text2)', marginBottom: '24px' }}>
                  Transaction: {txnId}
                </div>
              )}
              <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: 1.6, marginBottom: '36px' }}>
                Thank you for your order! A confirmation has been sent to{' '}
                <strong style={{ color: 'var(--cream)' }}>{ship.email}</strong>.{' '}
                You will receive a shipping notification once dispatched.
              </p>
              {payMethod === 'vipps' && (
                <div style={{ padding: '14px', background: 'rgba(255,90,0,0.08)', border: '1px solid rgba(255,90,0,0.2)', borderRadius: '10px', marginBottom: '24px', fontSize: '13px', color: 'var(--cream)' }}>
                  📱 A Vipps payment request has been sent to <strong>{vippsPhone}</strong>. Open your Vipps app to confirm.
                </div>
              )}
              {payMethod === 'klarna' && (
                <div style={{ padding: '14px', background: 'rgba(255,182,193,0.06)', border: '1px solid rgba(255,182,193,0.15)', borderRadius: '10px', marginBottom: '24px', fontSize: '13px', color: 'var(--cream)' }}>
                  🛍️ Klarna will send your payment schedule to <strong>{ship.email}</strong>. First payment: NOK {Math.ceil(finalTotal / 3)} today.
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/dashboard/orders')} className="btn btn-gold" style={{ padding: '12px 24px' }}>
                  View My Orders →
                </button>
                <Link to="/shop" className="btn btn-outline" style={{ padding: '12px 24px' }}>Keep Shopping</Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

function OrderSummary({ cart, cartTotal, cartCount, removeFromCart, promoInput, setPromoInput, promoApplied, promoDiscount, promoError, promoLoading, handleApplyPromo, removePromo, finalTotal, user, editable }) {
  return (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '14px' }}>NOK {item.price * item.qty}</div>
              {editable && removeFromCart && (
                <button onClick={() => removeFromCart(item.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>×</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Promo code */}
      {editable && (
        <div style={{ marginBottom: '16px' }}>
          {promoApplied ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px' }}>
              <span style={{ color: '#34d399', fontSize: '13px', flex: 1 }}>
                ✅ <strong style={{ fontFamily: 'monospace' }}>{promoApplied.code}</strong> applied — NOK {promoDiscount} off
              </span>
              <button type="button" onClick={removePromo}
                style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 2px' }}>×</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="input" placeholder="Promo code" value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()) }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
                  style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '1px' }} />
                <button type="button" className="btn btn-outline"
                  onClick={handleApplyPromo} disabled={promoLoading || !promoInput?.trim()}
                  style={{ padding: '10px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  {promoLoading ? '…' : 'Apply'}
                </button>
              </div>
              {promoError && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '6px' }}>{promoError}</div>}
            </div>
          )}
        </div>
      )}

      {!editable && promoApplied && (
        <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#34d399' }}>
          ✅ Promo <strong style={{ fontFamily: 'monospace' }}>{promoApplied.code}</strong> — NOK {promoDiscount} off
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>
          <span>Subtotal</span><span>NOK {cartTotal}</span>
        </div>
        {promoDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#34d399', marginBottom: '8px' }}>
            <span>Promo ({promoApplied?.code})</span><span>– NOK {promoDiscount}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
          <span>Shipping</span><span style={{ color: 'var(--gold)' }}>Free</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '16px' }}>Total</span>
          <span style={{ color: 'var(--cream)', fontWeight: '800', fontSize: '22px' }}>NOK {finalTotal}</span>
        </div>
      </div>

      {user && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', fontSize: '13px', color: 'var(--gold)' }}>
          ★ Member order — earns PV towards your rank progress.
        </div>
      )}

      <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text2)' }}>
        <span>🔒 Secure checkout</span>
        <span>·</span>
        <span>Visa</span>
        <span>·</span>
        <span>Mastercard</span>
        <span>·</span>
        <span>Vipps</span>
        <span>·</span>
        <span>Klarna</span>
      </div>
    </div>
  )
}
