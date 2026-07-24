import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { enrollMember } from '../api/mlmApi'
import Navbar from '../components/Navbar'

const PACKAGES = [
  {
    key: 'starter',
    name: 'Starter',
    price: 299,
    desc: '1 product included, 30 PV',
    pv: 30,
    border: '2px solid var(--border)',
    badge: null,
    badgeClass: null,
  },
  {
    key: 'builder',
    name: 'Builder',
    price: 799,
    desc: '3 products included, 80 PV',
    pv: 80,
    border: '2px solid var(--gold)',
    badge: 'Most Popular',
    badgeClass: 'badge badge-gold',
  },
  {
    key: 'executive',
    name: 'Executive',
    price: 1499,
    desc: '5 products included, 150 PV',
    pv: 150,
    border: '2px solid var(--green2)',
    badge: 'Best Value',
    badgeClass: 'badge badge-green',
  },
]

const COUNTRIES = [
  'Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland',
  'Germany', 'Netherlands', 'United Kingdom', 'United States', 'Other',
]

export default function Join() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const refParam = searchParams.get('ref') // e.g. NV-10042

  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [newMemberId, setNewMemberId] = useState('')

  // Step 1
  const [sponsorId, setSponsorId] = useState(refParam || '')

  // Step 2
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: 'Norway',
    city: '',
    terms: false,
  })
  const [formError, setFormError] = useState('')

  // Step 3
  const [selectedPackage, setSelectedPackage] = useState('builder')

  function handleFormChange(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function validateStep2() {
    if (!form.firstName.trim() || !form.lastName.trim()) return 'Please enter your full name.'
    if (!form.email.includes('@')) return 'Please enter a valid email address.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    if (!form.terms) return 'You must accept the Terms & Conditions.'
    return ''
  }

  function handleStep2Continue() {
    const err = validateStep2()
    if (err) { setFormError(err); return }
    setFormError('')
    setStep(3)
  }

  async function handleEnroll() {
    setEnrolling(true)
    const tempId = 'NV-1' + String(Math.floor(Math.random() * 9000) + 1000)
    try {
      const result = await enrollMember({
        userId: tempId,
        planType: 'binary',
        sponsorUserId: sponsorId || null,
        leg: null,
      })
      setNewMemberId(result?.node?.id || tempId)
    } catch {
      setNewMemberId(tempId)
    } finally {
      setEnrolling(false)
      setDone(true)
    }
  }

  // ─── SUCCESS STATE ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{
        background: 'var(--navy)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: '800',
            color: 'var(--cream)',
            letterSpacing: '-1px',
            marginBottom: '16px',
          }}>
            Welcome to Nordic Vitals!
          </h1>
          <div style={{ marginBottom: '12px', color: 'var(--text2)', fontSize: '16px' }}>
            Your Member ID:
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '36px',
            fontWeight: '700',
            color: 'var(--gold)',
            marginBottom: '24px',
            letterSpacing: '2px',
          }}>
            {newMemberId}
          </div>
          <p style={{
            color: 'var(--text2)',
            fontSize: '15px',
            lineHeight: 1.6,
            marginBottom: '36px',
          }}>
            Check your email for next steps. Your account is being set up and you will receive a welcome email shortly.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-gold"
            style={{ fontSize: '15px', padding: '12px 32px' }}
          >
            Go to my dashboard →
          </button>
        </div>
      </div>
    )
  }

  // ─── MULTI-STEP FORM ─────────────────────────────────────────────────────────
  return (
    <>
    <Navbar />
    <div style={{
      background: 'var(--navy)',
      minHeight: '100vh',
      padding: '48px 24px 80px',
    }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link to="/" style={{ color: 'var(--gold)', fontSize: '20px', fontWeight: '700', display: 'inline-block', marginBottom: '16px' }}>
            ⬡ Nordic Vitals
          </Link>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 34px)',
            fontWeight: '800',
            color: 'var(--cream)',
            letterSpacing: '-1px',
            marginBottom: '8px',
          }}>
            Join Our Network
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '15px' }}>
            Become a member and start earning today.
          </p>
        </div>

        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
          gap: '0',
        }}>
          {[
            { num: 1, label: 'Sponsor' },
            { num: 2, label: 'Your Info' },
            { num: 3, label: 'Package' },
          ].map((s, idx) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Circle */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: step === s.num
                    ? 'var(--gold)'
                    : step > s.num
                      ? 'var(--green2)'
                      : 'var(--navy2)',
                  border: step === s.num
                    ? '2px solid var(--gold)'
                    : step > s.num
                      ? '2px solid var(--green2)'
                      : '2px solid var(--border)',
                  color: step === s.num
                    ? 'var(--navy)'
                    : step > s.num
                      ? '#fff'
                      : 'var(--text2)',
                  fontWeight: '700',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: step === s.num ? 'var(--gold)' : step > s.num ? 'var(--green2)' : 'var(--text2)',
                  whiteSpace: 'nowrap',
                }}>
                  {s.label}
                </span>
              </div>
              {/* Connector line */}
              {idx < 2 && (
                <div style={{
                  width: '80px',
                  height: '2px',
                  background: step > s.num ? 'var(--green2)' : 'var(--border)',
                  margin: '0 4px',
                  marginBottom: '22px',
                  transition: 'background 0.2s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Sponsor ── */}
        {step === 1 && (
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ color: 'var(--cream)', fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
              Sponsor
            </h2>

            {refParam ? (
              /* Ref link banner */
              <div style={{
                background: 'rgba(29,93,57,0.3)',
                border: '1px solid var(--green2)',
                borderRadius: '10px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span style={{ color: 'var(--green2)', fontSize: '20px' }}>✓</span>
                <div>
                  <div style={{ color: '#86efac', fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>
                    You are joining under sponsor {refParam}
                  </div>
                  <div style={{ color: 'var(--text2)', fontSize: '13px' }}>
                    Your sponsor has been automatically applied.
                  </div>
                </div>
              </div>
            ) : null}

            {/* Sponsor ID field */}
            <div style={{ marginBottom: '24px' }}>
              <label className="label-text">
                Sponsor ID {refParam ? '(locked)' : '(optional)'}
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. NV-10042"
                value={sponsorId}
                onChange={e => setSponsorId(e.target.value)}
                disabled={!!refParam}
                style={{ opacity: refParam ? 0.6 : 1, cursor: refParam ? 'not-allowed' : 'text' }}
              />
              {!refParam && (
                <p style={{ color: 'var(--text2)', fontSize: '12px', marginTop: '6px' }}>
                  Leave blank if you were not referred by a current member.
                </p>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn btn-gold"
              style={{ width: '100%', justifyContent: 'center', fontSize: '15px' }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2: Your Info ── */}
        {step === 2 && (
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ color: 'var(--cream)', fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
              Your Information
            </h2>

            {formError && (
              <div style={{
                background: 'rgba(229,62,62,0.12)',
                border: '1px solid rgba(229,62,62,0.4)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#fca5a5',
                fontSize: '14px',
                marginBottom: '20px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}>
                <span>⚠</span> {formError}
              </div>
            )}

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="label-text">First name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Lars"
                  value={form.firstName}
                  onChange={e => handleFormChange('firstName', e.target.value)}
                />
              </div>
              <div>
                <label className="label-text">Last name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Eriksen"
                  value={form.lastName}
                  onChange={e => handleFormChange('lastName', e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label className="label-text">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => handleFormChange('email', e.target.value)}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="label-text">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => handleFormChange('password', e.target.value)}
                />
              </div>
              <div>
                <label className="label-text">Confirm password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => handleFormChange('confirmPassword', e.target.value)}
                />
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '16px' }}>
              <label className="label-text">Phone</label>
              <input
                type="tel"
                className="input"
                placeholder="+47 000 00 000"
                value={form.phone}
                onChange={e => handleFormChange('phone', e.target.value)}
              />
            </div>

            {/* Country + City */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="label-text">Country</label>
                <select
                  className="input"
                  value={form.country}
                  onChange={e => handleFormChange('country', e.target.value)}
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">City</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Oslo"
                  value={form.city}
                  onChange={e => handleFormChange('city', e.target.value)}
                />
              </div>
            </div>

            {/* Terms */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              cursor: 'pointer',
              marginBottom: '28px',
              fontSize: '14px',
              color: 'var(--text2)',
              lineHeight: 1.5,
            }}>
              <input
                type="checkbox"
                checked={form.terms}
                onChange={e => handleFormChange('terms', e.target.checked)}
                style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: 'var(--gold)', cursor: 'pointer', flexShrink: 0 }}
              />
              I accept the{' '}
              <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--gold)', fontWeight: '600' }}>
                Terms & Conditions
              </a>
            </label>

            {/* Nav buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setStep(1); setFormError('') }}
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                ← Back
              </button>
              <button
                onClick={handleStep2Continue}
                className="btn btn-gold"
                style={{ flex: 2, justifyContent: 'center' }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Package ── */}
        {step === 3 && (
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ color: 'var(--cream)', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              Choose Your Package
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '28px' }}>
              Select the enrollment package that's right for you.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}>
              {PACKAGES.map(pkg => {
                const isSelected = selectedPackage === pkg.key
                return (
                  <div
                    key={pkg.key}
                    onClick={() => setSelectedPackage(pkg.key)}
                    style={{
                      background: isSelected ? 'var(--navy3)' : 'var(--navy)',
                      border: isSelected ? '2px solid var(--gold)' : pkg.border,
                      borderRadius: '12px',
                      padding: '20px 16px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.18s',
                      textAlign: 'center',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--gold)' }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = pkg.border.replace('2px solid ', '')
                      }
                    }}
                  >
                    {/* Badge */}
                    {pkg.badge && (
                      <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                        <span className={pkg.badgeClass}>{pkg.badge}</span>
                      </div>
                    )}

                    {/* Selected indicator */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'var(--navy)',
                        fontWeight: '700',
                      }}>✓</div>
                    )}

                    <div style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '16px', marginBottom: '8px', marginTop: pkg.badge ? '8px' : '0' }}>
                      {pkg.name}
                    </div>
                    <div style={{ color: 'var(--gold)', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                      NOK {pkg.price}
                    </div>
                    <div style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: 1.5 }}>
                      {pkg.desc}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Nav buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(2)}
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                ← Back
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="btn btn-gold"
                style={{ flex: 2, justifyContent: 'center', fontSize: '15px', opacity: enrolling ? 0.7 : 1 }}
              >
                {enrolling ? 'Enrolling…' : 'Enroll Now →'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom note */}
        <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '12px', marginTop: '24px' }}>
          Already a member?{' '}
          <Link to="/login" style={{ color: 'var(--gold)', fontWeight: '600' }}>Sign in here</Link>
        </p>
      </div>
    </div>
    </>
  )
}
