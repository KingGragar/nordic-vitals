import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getPlanConfig } from '../../api/mlmApi'
import { PRODUCTS } from '../../data/mock'
import DashboardLayout from '../../components/DashboardLayout'

const ONBOARD_KEY = uid => `nv_onboarded_${uid}`

const STEPS = [
  { id: 'welcome',    label: 'Welcome',       icon: '👋' },
  { id: 'profile',    label: 'Your Profile',  icon: '👤' },
  { id: 'products',   label: 'Products',      icon: '🛍️' },
  { id: 'referral',   label: 'Share & Earn',  icon: '🔗' },
  { id: 'goal',       label: 'Income Goal',   icon: '🎯' },
  { id: 'training',   label: 'Training',      icon: '🎓' },
  { id: 'done',       label: "You're Set!",   icon: '🏆' },
]

const INCOME_GOALS = [500, 2000, 5000, 10000, 25000]

function ProgressBar({ step, total }) {
  const pct = Math.round((step / (total - 1)) * 100)
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
        <span>Step {step + 1} of {total}</span>
        <span>{pct}% complete</span>
      </div>
      <div style={{ height: 6, background: 'var(--navy3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)', borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function StepNav({ steps, current, onClick }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 32, justifyContent: 'center' }}>
      {steps.map((s, i) => (
        <button
          key={s.id}
          onClick={() => i < current && onClick(i)}
          style={{
            padding: '4px 10px',
            borderRadius: 20,
            border: '1px solid var(--border)',
            background: i === current ? 'var(--gold)' : i < current ? 'var(--navy3)' : 'transparent',
            color: i === current ? '#0a0d14' : i < current ? 'var(--gold)' : 'var(--text2)',
            cursor: i < current ? 'pointer' : 'default',
            fontSize: 12,
            fontWeight: i === current ? 700 : 400,
            transition: 'all 0.2s',
          }}
        >
          {i < current ? '✓ ' : ''}{s.label}
        </button>
      ))}
    </div>
  )
}

// ── Step components ─────────────────────────────────────────────────────────

function WelcomeStep({ user }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🌿</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>
        Welcome to Nordic Vitals, {user?.name?.split(' ')[0] || 'there'}!
      </h2>
      <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 24px' }}>
        You've joined an exclusive community of health-focused entrepreneurs. This quick setup will get you earning, sharing, and growing in just a few minutes.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, maxWidth: 500, margin: '0 auto' }}>
        {[
          { icon: '💰', label: 'Earn commissions on every product sale' },
          { icon: '🌳', label: 'Build your team and grow your network' },
          { icon: '🏅', label: 'Unlock rank rewards and bonuses' },
          { icon: '🎓', label: 'Learn with our training program' },
        ].map(item => (
          <div key={item.label} style={{ padding: 16, background: 'var(--navy3)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{item.label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, display: 'inline-block' }}>
        <span style={{ color: 'var(--gold)', fontSize: 13 }}>
          Your Member ID: <strong>{user?.memberId || 'NV-?????'}</strong>
        </span>
      </div>
    </div>
  )
}

function ProfileStep({ user }) {
  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Your Profile</h3>
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
        A complete profile builds trust with your team and customers. You can update these anytime in Settings → Profile.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Full Name', value: user?.name, status: user?.name ? 'done' : 'pending', link: '/dashboard/profile' },
          { label: 'Email Address', value: user?.email, status: user?.email ? 'done' : 'pending', link: '/dashboard/profile' },
          { label: 'Phone Number', value: null, status: 'pending', link: '/dashboard/profile' },
          { label: 'Country', value: null, status: 'pending', link: '/dashboard/profile' },
          { label: 'Profile Photo', value: null, status: 'pending', link: '/dashboard/profile' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', background: 'var(--navy3)',
            borderRadius: 10, border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 18 }}>{item.status === 'done' ? '✅' : '⬜'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</div>
              {item.value && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{item.value}</div>}
            </div>
            {item.status !== 'done' && (
              <Link to={item.link} style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}>
                Add →
              </Link>
            )}
          </div>
        ))}
      </div>
      <Link
        to="/dashboard/profile"
        style={{
          display: 'inline-block', padding: '10px 20px',
          background: 'var(--navy3)', border: '1px solid var(--gold)',
          color: 'var(--gold)', borderRadius: 8, textDecoration: 'none', fontSize: 14,
        }}
      >
        Open Profile Settings →
      </Link>
    </div>
  )
}

function ProductsStep() {
  const [featured] = useState(PRODUCTS.slice(0, 3))

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Discover Our Products</h3>
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
        As a member, you get <strong style={{ color: 'var(--gold)' }}>exclusive member pricing</strong> on all 6 products — and earn PV with every purchase to qualify for commissions.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {featured.map(p => (
          <div key={p.id} style={{ padding: 16, background: 'var(--navy3)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{p.tagline}</div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <span style={{ textDecoration: 'line-through', color: 'var(--text2)', marginRight: 6 }}>NOK {p.price}</span>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>NOK {p.memberPrice}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{p.pv} PV per unit</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/shop" style={{ padding: '10px 20px', background: 'var(--gold)', color: '#0a0d14', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
          Browse All Products →
        </Link>
        <Link to="/dashboard/autoship" style={{ padding: '10px 20px', background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text1)', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
          Set Up Autoship ♻️
        </Link>
      </div>
      <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
        <span style={{ fontSize: 13, color: '#22c55e' }}>💡 Tip: Set up a monthly autoship to automatically qualify for commissions every month.</span>
      </div>
    </div>
  )
}

function ReferralStep({ user }) {
  const [copied, setCopied] = useState(false)
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://nordic-vitals.vercel.app'
  const referralUrl = `${siteUrl}/join?ref=${user?.memberId || ''}`

  function copyLink() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Share & Earn</h3>
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
        Every person who joins through your link becomes part of your team. You earn a <strong style={{ color: 'var(--gold)' }}>Sponsor Bonus (10% PV)</strong> on their first order and commissions on their team's volume.
      </p>
      <div style={{ padding: 20, background: 'var(--navy3)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Your Referral Link</div>
        <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--gold)', wordBreak: 'break-all', marginBottom: 12 }}>
          {referralUrl}
        </div>
        <button
          onClick={copyLink}
          style={{ padding: '8px 18px', background: copied ? '#22c55e' : 'var(--gold)', color: '#0a0d14', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, transition: 'background 0.2s' }}
        >
          {copied ? '✓ Copied!' : '📋 Copy Link'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '💬', label: 'Share in WhatsApp, iMessage, or Telegram' },
          { icon: '📱', label: 'Post to Instagram, TikTok, or Facebook' },
          { icon: '📧', label: 'Send via email to friends & family' },
          { icon: '🔗', label: 'Add to your bio link on social media' },
        ].map(item => (
          <div key={item.label} style={{ padding: 14, background: 'var(--navy3)', borderRadius: 10, border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4 }}>{item.label}</div>
          </div>
        ))}
      </div>
      <Link to="/dashboard/referral" style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>
        View full Referral Dashboard →
      </Link>
    </div>
  )
}

function GoalStep({ goal, setGoal }) {
  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Set Your Income Goal</h3>
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
        Choose a monthly target. Your Business Plan will show exactly how many recruits and how much volume you need to get there.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {INCOME_GOALS.map(g => (
          <button
            key={g}
            onClick={() => setGoal(g)}
            style={{
              padding: '14px 20px',
              background: goal === g ? 'rgba(201,168,76,0.15)' : 'var(--navy3)',
              border: `2px solid ${goal === g ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 10,
              color: 'var(--text1)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>
              {g <= 500 ? '🌱' : g <= 2000 ? '🥉' : g <= 5000 ? '🥈' : g <= 10000 ? '🥇' : '💎'}
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{g.toLocaleString()} MLMT / month</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                {g <= 500 ? 'Starter — cover your monthly supplements'
                  : g <= 2000 ? 'Bronze level — solid side income'
                  : g <= 5000 ? 'Silver level — replace a part-time job'
                  : g <= 10000 ? 'Gold level — full-time equivalent'
                  : 'Platinum level — top earner track'}
              </div>
            </div>
            {goal === g && <span style={{ marginLeft: 'auto', color: 'var(--gold)', fontWeight: 700 }}>✓</span>}
          </button>
        ))}
      </div>
      <Link to="/dashboard/business-plan" style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>
        Open Business Plan calculator →
      </Link>
    </div>
  )
}

function TrainingStep() {
  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Start Your Training</h3>
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
        Our training program covers everything from product knowledge to advanced network strategies. Complete all 5 modules to earn your <strong style={{ color: 'var(--gold)' }}>Certified Member</strong> badge and <strong>500 MLMT</strong> in rewards.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {[
          { title: 'Getting Started', lessons: 3, reward: 50, desc: 'Platform basics, your member ID, first steps' },
          { title: 'Product Knowledge', lessons: 4, reward: 100, desc: 'Deep dive into all 6 NV products' },
          { title: 'Network Building', lessons: 4, reward: 100, desc: 'How to recruit and grow your team' },
          { title: 'Advanced MLM Strategy', lessons: 3, reward: 150, desc: 'Binary leg balancing, rank advancement' },
          { title: 'Leadership & Team Management', lessons: 4, reward: 100, desc: 'Leading your team to Silver and beyond' },
        ].map((m, i) => (
          <div key={m.title} style={{
            padding: '14px 16px', background: 'var(--navy3)', borderRadius: 10, border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? 'var(--gold)' : 'var(--navy2)', color: i === 0 ? '#0a0d14' : 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{m.lessons} lessons · {m.reward} MLMT reward</div>
            </div>
            {i === 0 && <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>Start here</span>}
          </div>
        ))}
      </div>
      <Link
        to="/dashboard/training"
        style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--gold)', color: '#0a0d14', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}
      >
        Begin Training →
      </Link>
    </div>
  )
}

function DoneStep({ user, goal }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🏆</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>
        You're All Set, {user?.name?.split(' ')[0] || 'there'}!
      </h2>
      <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 28px' }}>
        Your Nordic Vitals account is ready. Here's your quick-start summary:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 440, margin: '0 auto 32px', textAlign: 'left' }}>
        {[
          { icon: '✅', text: `Member ID confirmed: ${user?.memberId || 'NV-?????'}` },
          { icon: '✅', text: 'Products explored — browse the shop when ready' },
          { icon: '✅', text: 'Referral link ready to share' },
          { icon: '✅', text: goal ? `Income goal set: ${goal.toLocaleString()} MLMT/month` : 'Income goal: set it in Business Plan' },
          { icon: '✅', text: 'Training program unlocked — Module 1 ready' },
        ].map(item => (
          <div key={item.text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>{item.text}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, maxWidth: 480, margin: '0 auto 28px' }}>
        {[
          { icon: '🛍️', label: 'Browse Shop', to: '/shop' },
          { icon: '🌳', label: 'My Tree', to: '/dashboard/tree' },
          { icon: '🎓', label: 'Start Training', to: '/dashboard/training' },
          { icon: '🏠', label: 'Dashboard', to: '/dashboard' },
        ].map(item => (
          <Link key={item.to} to={item.to} style={{
            padding: '14px 12px', background: 'var(--navy3)', border: '1px solid var(--border)',
            borderRadius: 10, textDecoration: 'none', textAlign: 'center',
            color: 'var(--text1)', transition: 'border-color 0.2s',
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Main Onboarding Page ─────────────────────────────────────────────────────

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState(2000)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (user) {
      const done = localStorage.getItem(ONBOARD_KEY(user.userId))
      if (done) setCompleted(true)
    }
  }, [user])

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      markDone()
    }
  }

  function prev() {
    if (step > 0) setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function markDone() {
    if (user) {
      try { localStorage.setItem(ONBOARD_KEY(user.userId), '1') } catch {}
    }
    setCompleted(true)
    navigate('/dashboard')
  }

  const isLast = step === STEPS.length - 1

  const stepContent = [
    <WelcomeStep user={user} />,
    <ProfileStep user={user} />,
    <ProductsStep />,
    <ReferralStep user={user} />,
    <GoalStep goal={goal} setGoal={setGoal} />,
    <TrainingStep />,
    <DoneStep user={user} goal={goal} />,
  ]

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>🚀 Member Setup</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Let's get you up and running in 5 minutes.</p>
        </div>

        <ProgressBar step={step} total={STEPS.length} />
        <StepNav steps={STEPS} current={step} onClick={setStep} />

        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 24px', marginBottom: 24 }}>
          {stepContent[step]}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={prev}
            disabled={step === 0}
            style={{
              padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)',
              color: step === 0 ? 'var(--text2)' : 'var(--text1)', borderRadius: 8, cursor: step === 0 ? 'default' : 'pointer', fontSize: 14,
            }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            {!isLast && (
              <button
                onClick={markDone}
                style={{ padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 13 }}
              >
                Skip setup
              </button>
            )}
            <button
              onClick={next}
              style={{
                padding: '10px 24px', background: isLast ? '#22c55e' : 'var(--gold)',
                color: '#0a0d14', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'background 0.2s',
              }}
            >
              {isLast ? '🏆 Go to Dashboard' : 'Next →'}
            </button>
          </div>
        </div>

        {completed && (
          <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: 13, color: '#22c55e' }}>
            ✓ Setup already completed. You can revisit any step or go back to your dashboard.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
