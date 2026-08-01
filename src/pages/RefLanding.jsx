import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SocialProofTicker from '../components/SocialProofTicker'
import { getPublicMemberProfile } from '../api/mlmApi'
import { PRODUCTS } from '../data/mock'
import { useAuth } from '../context/AuthContext'

const RANK_COLORS = {
  Unranked:  'badge-ghost',
  Bronze:    'badge-warning',
  Silver:    'badge-info',
  Gold:      'badge-warning text-yellow-300',
  Platinum:  'badge-success',
}

const RANK_PERKS = {
  Unranked:  'Getting started',
  Bronze:    'Team leader',
  Silver:    'Regional leader',
  Gold:      'National leader',
  Platinum:  'Top earner',
}

const FEATURED_PRODUCTS = PRODUCTS.slice(0, 3)

function AvatarInitials({ name, size = 'lg' }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  const sizeClass = size === 'lg' ? 'text-4xl w-24 h-24' : 'text-2xl w-16 h-16'
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-primary-content ring-4 ring-base-100`}>
      {initials}
    </div>
  )
}

export default function RefLanding() {
  const { code } = useParams()
  const { user }  = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!code) return
    setLoading(true)
    getPublicMemberProfile(code)
      .then(setProfile)
      .catch(() => setError('Member not found.'))
      .finally(() => setLoading(false))
  }, [code])

  const joinUrl = `/join?ref=${code}`

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </>
    )
  }

  if (error || !profile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-error text-lg">{error || 'Referral link not found.'}</p>
          <Link to="/join" className="btn btn-primary">Join Nordic Vitals</Link>
        </div>
      </>
    )
  }

  const firstName = profile.name.split(' ')[0]

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="min-h-[60vh] bg-gradient-to-br from-base-200 to-base-300 flex items-center py-20 px-4">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Sponsor card */}
            <div className="card bg-base-100 shadow-xl w-full md:w-72 flex-shrink-0">
              <div className="card-body items-center text-center gap-4">
                <AvatarInitials name={profile.name} size="lg" />
                <div>
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                  <p className="text-sm text-base-content/60">{RANK_PERKS[profile.rank] ?? 'Team Member'}</p>
                  <div className="mt-2 flex flex-wrap gap-1 justify-center">
                    <span className={`badge ${RANK_COLORS[profile.rank] ?? 'badge-ghost'}`}>
                      {profile.rank}
                    </span>
                    <span className="badge badge-outline">{profile.country}</span>
                  </div>
                </div>
                <div className="stats stats-vertical shadow w-full text-sm">
                  <div className="stat py-2 px-3">
                    <div className="stat-title text-xs">Direct team</div>
                    <div className="stat-value text-lg">{profile.directTeam}</div>
                  </div>
                  <div className="stat py-2 px-3">
                    <div className="stat-title text-xs">Member since</div>
                    <div className="stat-value text-lg">
                      {new Date(profile.joinedDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <Link to={joinUrl} className="btn btn-primary btn-block">
                  Join {firstName}'s team →
                </Link>
              </div>
            </div>

            {/* Headline */}
            <div className="flex-1 text-center md:text-left">
              <div className="badge badge-primary badge-outline mb-4">Personal invitation</div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                {firstName} invited you to<br />
                <span className="text-primary">Nordic Vitals</span>
              </h1>
              <p className="text-lg text-base-content/70 mb-6">
                Nordic Vitals is a Scandinavian wellness brand with science-backed supplements
                and a rewarding network opportunity. Join {firstName}'s team and get started today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link to={joinUrl} className="btn btn-primary btn-lg">
                  Enroll now — it's free
                </Link>
                <Link to="/shop" className="btn btn-outline btn-lg">
                  Explore products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why join ── */}
      <section className="py-16 px-4 bg-base-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Why join Nordic Vitals?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '🧬', title: 'Premium quality', body: 'Third-party lab tested supplements made with clean, high-potency Nordic ingredients.' },
              { icon: '💰', title: 'Earn commissions', body: 'Get paid every time your team shops. Our binary plan rewards building a balanced downline.' },
              { icon: '🌍', title: 'Growing community', body: '5 000+ members across 28 countries. Real people, real results, real income.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="card bg-base-200 shadow">
                <div className="card-body items-center text-center gap-3">
                  <span className="text-4xl">{icon}</span>
                  <h3 className="font-bold">{title}</h3>
                  <p className="text-sm text-base-content/70">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured products ── */}
      <section className="py-16 px-4 bg-base-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Our top products</h2>
          <p className="text-center text-base-content/60 mb-10">
            Members get up to 20% off every order.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURED_PRODUCTS.map(p => (
              <div key={p.id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
                <div className={`h-32 rounded-t-2xl bg-gradient-to-br ${p.img} flex items-center justify-center`}>
                  <span className="text-4xl">🌿</span>
                </div>
                <div className="card-body p-4 gap-1">
                  <h3 className="font-bold text-sm">{p.name}</h3>
                  <p className="text-xs text-base-content/60 line-clamp-2">{p.tagline}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-base-content/40 line-through text-xs">NOK {p.price}</span>
                    <span className="font-bold text-primary text-sm">NOK {p.memberPrice}</span>
                    <span className="badge badge-primary badge-xs">Members</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/shop" className="btn btn-outline">View all products</Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials (reuse Landing's) ── */}
      <section className="py-16 px-4 bg-base-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">What members say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: 'Lars E.', country: 'Norway',  stars: 5, text: 'Nordic Vitals changed my daily routine. Omega-3 Arctic Pure is now non-negotiable.' },
              { name: 'Mia A.', country: 'Norway',  stars: 5, text: 'The collagen supplement is incredible — skin hydration is noticeably better after 4 weeks.' },
              { name: 'Anna L.', country: 'Sweden', stars: 5, text: 'Love the mission and the products. The income opportunity is a genuine bonus.' },
            ].map(({ name, country, stars, text }) => (
              <div key={name} className="card bg-base-200 shadow">
                <div className="card-body gap-2 text-left">
                  <div className="text-warning text-sm">{'★'.repeat(stars)}</div>
                  <p className="text-sm text-base-content/80 italic">"{text}"</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-8">
                        <span className="text-xs">{name.split(' ').map(w => w[0]).join('')}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-xs">{name}</div>
                      <div className="text-xs text-base-content/50">{country}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-4 bg-primary text-primary-content text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-4">
            Ready to join {firstName}'s team?
          </h2>
          <p className="mb-8 opacity-80">
            Enrollment is free. Start shopping at member prices and earn commissions from day one.
          </p>
          <Link to={joinUrl} className="btn btn-lg bg-base-100 text-primary hover:bg-base-200 border-none">
            Enroll now → free to join
          </Link>
          {user && (
            <p className="mt-4 text-sm opacity-70">
              Already a member?{' '}
              <Link to="/dashboard" className="underline">Go to your dashboard</Link>
            </p>
          )}
        </div>
      </section>

      {/* ── Footer note ── */}
      <footer className="py-6 px-4 bg-base-300 text-center text-xs text-base-content/50">
        <p>
          Nordic Vitals · Referred by {profile.name} ({profile.memberId}) ·{' '}
          <Link to="/terms" className="underline">Terms</Link> ·{' '}
          <Link to="/privacy" className="underline">Privacy</Link>
        </p>
        <p className="mt-1">
          Results vary. Nordic Vitals is a direct sales company regulated under Norwegian consumer law.{' '}
          <Link to="/compliance" className="underline">Income Disclosure</Link>
        </p>
      </footer>
    <SocialProofTicker />
    </>
  )
}
