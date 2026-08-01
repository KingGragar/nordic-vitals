import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import usePageTitle from '../hooks/usePageTitle'

const RANKS = [
  { rank: 'Unranked', color: '#6b7280', pv: 0,   recruits: 0, leftGV: 0,    rightGV: 0,   perks: ['Access to member pricing', 'Personal referral link'] },
  { rank: 'Bronze',   color: '#92400e', pv: 100,  recruits: 2, leftGV: 500,  rightGV: 500,  perks: ['5% level commissions', 'Sponsor bonus unlocked', 'Member resources'] },
  { rank: 'Silver',   color: '#9ca3af', pv: 200,  recruits: 4, leftGV: 1500, rightGV: 1500, perks: ['6% pairing bonus', 'Training & certification', 'Priority support'] },
  { rank: 'Gold',     color: '#d97706', pv: 400,  recruits: 8, leftGV: 5000, rightGV: 5000, perks: ['7% pairing bonus', 'Leadership pool share', 'Annual retreat invitation'] },
  { rank: 'Platinum', color: '#c0c0c0', pv: 600,  recruits: 15, leftGV: 15000, rightGV: 15000, perks: ['8% pairing bonus', 'Global pool share', 'Dedicated account manager'] },
]

const BONUSES = [
  {
    icon: '🛒',
    title: 'Direct Sales Bonus',
    rate: '20% of PV',
    desc: 'Earn 20% of the Product Volume (PV) on every order you personally place or sell. Paid weekly.',
    example: 'Sell NOK 3,490 of Omega-3 → earn 35 PV → 7 MLMT direct bonus.',
    color: '#d97706',
  },
  {
    icon: '👥',
    title: 'Sponsor Bonus',
    rate: '10% of recruit PV',
    desc: 'When someone you personally recruited places an order, earn 10% of their PV as a sponsor bonus.',
    example: '5 recruits each order 100 PV → 50 MLMT sponsor bonus per commission run.',
    color: '#059669',
  },
  {
    icon: '🌐',
    title: 'Level Commissions',
    rate: '5% L2 · 3% L3',
    desc: 'Earn a percentage on every order placed by members in your downline, down to 3 levels deep.',
    example: 'L2 member orders 200 PV → 10 MLMT. L3 member orders 300 PV → 9 MLMT.',
    color: '#2563eb',
  },
  {
    icon: '⚖️',
    title: 'Binary Pairing Bonus',
    rate: '5–8% of weak-leg GV',
    desc: 'Build a left and right team. When both legs produce volume, you earn a pairing bonus on the weaker leg. Rate scales with rank (5% Bronze → 8% Platinum).',
    example: 'Silver rank, weak-leg GV 1,200 → 72 MLMT pairing bonus.',
    color: '#7c3aed',
  },
]

const SCENARIOS = [
  {
    label: 'Getting Started',
    monthly: '500–1,500 MLMT',
    rank: 'Unranked → Bronze',
    desc: '2–3 personal recruits, personal orders of ~200 PV/month. Primarily direct sales and sponsor bonuses.',
  },
  {
    label: 'Active Builder',
    monthly: '3,000–8,000 MLMT',
    rank: 'Silver',
    desc: '8–12 personally recruited members, balanced binary legs, 1,500 GV per side. All 4 bonus types active.',
  },
  {
    label: 'Team Leader',
    monthly: '15,000–40,000 MLMT',
    rank: 'Gold',
    desc: '20+ active team members across both legs, leadership pool participation, consistent 5,000+ leg GV balance.',
  },
  {
    label: 'Top Earner',
    monthly: '80,000+ MLMT',
    rank: 'Platinum',
    desc: 'Full binary team with deep organisational volume, 8% pairing rate, global pool + leadership bonuses.',
  },
]

export default function CompensationPlan() {
  usePageTitle('Compensation Plan | Nordic Vitals', 'Learn how to earn with Nordic Vitals — 4 bonus types, 5 rank levels, and a transparent binary commission plan.')
  const [activeRank, setActiveRank] = useState(1)

  const rank = RANKS[activeRank]

  return (
    <>
      <Navbar />
      <div style={{ background: 'var(--navy)', color: 'var(--text)', minHeight: '100vh' }}>

        {/* ── HERO ── */}
        <section style={{
          background: 'radial-gradient(ellipse at 50% 30%, #0d2d44 0%, var(--navy) 70%)',
          textAlign: 'center',
          padding: '80px 24px 64px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '20px' }}>
            Compensation Plan · 2026
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '800', color: 'var(--cream)', marginBottom: '20px', lineHeight: 1.15 }}>
            How You Earn with<br />Nordic Vitals
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--text2)', maxWidth: '580px', margin: '0 auto 36px', lineHeight: 1.7 }}>
            A transparent binary plan with 4 income streams. Share Nordic products, grow your team, and earn MLMT tokens every commission run.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/join" className="btn btn-gold" style={{ fontSize: '15px', padding: '12px 28px' }}>
              Start Earning Free →
            </Link>
            <a href="#bonuses" className="btn btn-outline" style={{ fontSize: '15px', padding: '12px 28px' }}>
              See Bonus Types
            </a>
          </div>

          {/* Quick KPIs */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            marginTop: '56px',
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'Income Streams', value: '4' },
              { label: 'Rank Levels', value: '5' },
              { label: 'Max Pairing Rate', value: '8%' },
              { label: 'Weekly Payouts', value: '✓' },
            ].map(k => (
              <div key={k.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--gold)' }}>{k.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px', letterSpacing: '0.5px' }}>{k.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--cream)', marginBottom: '12px' }}>
              The Binary Structure
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: 1.7 }}>
              Every member has two legs — Left and Right. You place new recruits in either leg to build balanced team volume. The plan rewards leg balance: stronger legs earn more.
            </p>
          </div>

          {/* Binary diagram */}
          <div style={{
            background: 'var(--navy2)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '40px 24px',
            textAlign: 'center',
          }}>
            {/* You */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px', height: '80px',
              borderRadius: '50%',
              background: 'var(--gold)',
              color: 'var(--navy)',
              fontSize: '13px',
              fontWeight: '800',
              marginBottom: '8px',
            }}>YOU</div>
            <div style={{ color: 'var(--text2)', fontSize: '12px', marginBottom: '24px' }}>Member NV-XXXXX</div>

            {/* Connector lines */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '80px', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '2px', height: '32px', background: 'var(--border)',
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', flexWrap: 'wrap' }}>
              {['Left Leg', 'Right Leg'].map((leg, i) => (
                <div key={leg} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '2px', height: '32px',
                    background: i === 0 ? '#2563eb' : '#7c3aed',
                    margin: '0 auto 8px',
                  }} />
                  <div style={{
                    background: i === 0 ? 'rgba(37,99,235,0.15)' : 'rgba(124,58,237,0.15)',
                    border: `1px solid ${i === 0 ? '#2563eb' : '#7c3aed'}`,
                    borderRadius: '12px',
                    padding: '20px 32px',
                    minWidth: '160px',
                  }}>
                    <div style={{ fontSize: '22px', marginBottom: '8px' }}>{i === 0 ? '🔵' : '🟣'}</div>
                    <div style={{ fontWeight: '700', color: 'var(--cream)', marginBottom: '4px' }}>{leg}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Team + recruits</div>
                  </div>
                  <div style={{ color: 'var(--text2)', fontSize: '12px', marginTop: '12px' }}>
                    Unlimited depth
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '32px',
              background: 'rgba(217,119,6,0.1)',
              border: '1px solid rgba(217,119,6,0.3)',
              borderRadius: '10px',
              padding: '16px 24px',
              display: 'inline-block',
              fontSize: '14px',
              color: 'var(--cream)',
            }}>
              ⚖️ <strong>Pairing Bonus</strong> = {'{'}rate{'}'} × weaker-leg GV each commission run
            </div>
          </div>
        </section>

        {/* ── 4 BONUS TYPES ── */}
        <section id="bonuses" style={{ padding: '40px 24px 80px', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--cream)', marginBottom: '12px' }}>
                4 Ways to Earn
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: '15px' }}>
                Every bonus type stacks — the more you build, the more income streams activate.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
            }}>
              {BONUSES.map(b => (
                <div key={b.title} style={{
                  background: 'var(--navy2)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '28px 24px',
                  borderTop: `3px solid ${b.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ fontSize: '30px' }}>{b.icon}</div>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--cream)', fontSize: '16px', marginBottom: '4px' }}>{b.title}</div>
                    <div style={{ fontWeight: '800', color: b.color, fontSize: '18px' }}>{b.rate}</div>
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: 1.6 }}>{b.desc}</p>
                  <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '12px',
                    color: 'var(--text2)',
                    fontStyle: 'italic',
                    borderLeft: `3px solid ${b.color}`,
                  }}>
                    {b.example}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RANK LADDER ── */}
        <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--cream)', marginBottom: '12px' }}>
              5 Rank Levels
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '15px' }}>
              Unlock higher commission rates and perks as your team grows.
            </p>
          </div>

          {/* Rank selector tabs */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
            {RANKS.map((r, i) => (
              <button
                key={r.rank}
                onClick={() => setActiveRank(i)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '24px',
                  border: `2px solid ${activeRank === i ? r.color : 'var(--border)'}`,
                  background: activeRank === i ? `${r.color}22` : 'transparent',
                  color: activeRank === i ? r.color : 'var(--text2)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
              >
                {r.rank}
              </button>
            ))}
          </div>

          {/* Rank detail card */}
          <div style={{
            background: 'var(--navy2)',
            border: `1px solid ${rank.color}55`,
            borderRadius: '16px',
            padding: '32px',
            borderLeft: `4px solid ${rank.color}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color: rank.color }}>{rank.rank}</div>
              {activeRank > 0 && (
                <div style={{ fontSize: '13px', color: 'var(--text2)', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px 12px' }}>
                  Pairing rate: <strong style={{ color: rank.color }}>{4 + activeRank}%</strong>
                </div>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}>
              {[
                { label: 'Personal PV / month', value: rank.pv > 0 ? `${rank.pv} PV` : '—' },
                { label: 'Direct Recruits', value: rank.recruits > 0 ? `${rank.recruits}` : '—' },
                { label: 'Left Leg GV', value: rank.leftGV > 0 ? `${rank.leftGV.toLocaleString()} GV` : '—' },
                { label: 'Right Leg GV', value: rank.rightGV > 0 ? `${rank.rightGV.toLocaleString()} GV` : '—' },
              ].map(m => (
                <div key={m.label} style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: rank.color, marginBottom: '4px' }}>{m.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '12px' }}>
                Perks
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {rank.perks.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text)' }}>
                    <span style={{ color: rank.color, fontWeight: '700', flexShrink: 0 }}>✓</span>
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rank progress bar */}
          <div style={{ display: 'flex', gap: '0', marginTop: '20px', borderRadius: '8px', overflow: 'hidden' }}>
            {RANKS.map((r, i) => (
              <div
                key={r.rank}
                onClick={() => setActiveRank(i)}
                style={{
                  flex: 1,
                  height: '8px',
                  background: i <= activeRank ? r.color : 'var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              />
            ))}
          </div>
        </section>

        {/* ── SAMPLE EARNINGS ── */}
        <section style={{ padding: '40px 24px 80px', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--cream)', marginBottom: '12px' }}>
                Earnings Scenarios
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: '15px' }}>
                Illustrative monthly ranges. Actual earnings depend entirely on your personal effort and team activity.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
            }}>
              {SCENARIOS.map((s, i) => (
                <div key={s.label} style={{
                  background: 'var(--navy2)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '24px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '48px', height: '48px',
                    background: `rgba(217,119,6,${0.05 * (i + 1)})`,
                    borderBottomLeftRadius: '48px',
                  }} />
                  <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{s.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--gold)', marginBottom: '4px' }}>{s.monthly}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px' }}>MLMT / month</div>
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(217,119,6,0.12)',
                    border: '1px solid rgba(217,119,6,0.3)',
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '12px',
                    color: 'var(--gold)',
                    marginBottom: '12px',
                  }}>{s.rank}</div>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>

            {/* IDS disclaimer */}
            <div style={{
              marginTop: '32px',
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.3)',
              borderRadius: '12px',
              padding: '20px 24px',
              fontSize: '13px',
              color: 'var(--text2)',
              lineHeight: 1.7,
            }}>
              <strong style={{ color: 'var(--cream)' }}>Income Disclosure:</strong> The figures above are illustrative scenarios only. Most members earn primarily from personal product use and modest referral activity. A minority of members earn significant income from team building. Nordic Vitals provides a full Income Disclosure Statement (IDS) in the <Link to="/admin/compliance" style={{ color: 'var(--gold)' }}>Compliance Centre</Link> (member login required) and in the <Link to="/faq" style={{ color: 'var(--gold)' }}>FAQ</Link>. Earnings are paid in MLMT tokens. Past performance does not guarantee future results. This document does not constitute a financial projection.
            </div>
          </div>
        </section>

        {/* ── FAQ STRIP ── */}
        <section style={{ padding: '60px 24px', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--cream)', textAlign: 'center', marginBottom: '36px' }}>
            Common Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { q: 'Is there a cost to join?', a: 'No membership fee. Joining is free. You only pay for products you personally order.' },
              { q: 'When are commissions paid?', a: 'Commission runs are triggered periodically by the admin team. Once processed, MLMT tokens are credited to your wallet within 48 hours.' },
              { q: 'What is MLMT?', a: 'MLMT (Multi-Level Marketing Token) is Nordic Vitals\' internal reward token. You can withdraw MLMT as NOK via bank transfer, SEPA, or crypto once you reach the minimum withdrawal threshold.' },
              { q: 'How is leg GV calculated?', a: 'Group Volume (GV) is the sum of all PV generated by every member in a given leg, regardless of depth. There is no cap on how deep your team can go.' },
              { q: 'Do I need to maintain PV every month?', a: 'You need to meet the PV requirement for your rank to qualify for rank-specific bonuses in a given commission run. Members below the PV threshold still earn Direct Sales and Sponsor bonuses.' },
            ].map(faq => (
              <details key={faq.q} style={{
                background: 'var(--navy2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px 20px',
              }}>
                <summary style={{
                  fontWeight: '600',
                  color: 'var(--cream)',
                  fontSize: '15px',
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  userSelect: 'none',
                }}>
                  {faq.q}
                  <span style={{ color: 'var(--gold)', fontSize: '20px', fontWeight: '400', flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.7, marginTop: '12px' }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{
          textAlign: 'center',
          padding: '80px 24px',
          background: 'radial-gradient(ellipse at 50% 80%, #0d2d44 0%, var(--navy) 70%)',
        }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '800', color: 'var(--cream)', marginBottom: '16px' }}>
            Ready to Start?
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: '16px', marginBottom: '36px', maxWidth: '480px', margin: '0 auto 36px' }}>
            Join free, order what you already believe in, and earn as you share.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/join" className="btn btn-gold" style={{ fontSize: '16px', padding: '14px 36px' }}>
              Join Nordic Vitals →
            </Link>
            <Link to="/shop" className="btn btn-outline" style={{ fontSize: '16px', padding: '14px 36px' }}>
              Browse Products
            </Link>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '20px' }}>
            No fee · No minimum order · Cancel anytime
          </p>
        </section>
      </div>
    </>
  )
}
