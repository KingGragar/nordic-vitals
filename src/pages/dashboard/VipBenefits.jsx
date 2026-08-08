import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberVipBenefits } from '../../api/mlmApi'

const TIER_COLORS = {
  Silver: { bg: '#1c1c2a', border: '#475569', color: '#cbd5e1', accent: '#94a3b8' },
  Gold: { bg: '#1c1900', border: '#854d0e', color: '#fde68a', accent: '#fbbf24' },
  Platinum: { bg: '#1a1a2e', border: '#4c1d95', color: '#c4b5fd', accent: '#a78bfa' },
  Diamond: { bg: '#001c1c', border: '#0e7490', color: '#a5f3fc', accent: '#22d3ee' },
}

function TierCard({ tier, current }) {
  const tc = TIER_COLORS[tier.name] || TIER_COLORS.Silver
  const isActive = tier.name === current
  return (
    <div style={{ background: tc.bg, border: `2px solid ${isActive ? tc.accent : tc.border}`, borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden' }}>
      {isActive && (
        <div style={{ position: 'absolute', top: 10, right: 10, background: tc.accent, color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>CURRENT</div>
      )}
      <div style={{ fontSize: 28, marginBottom: 6 }}>{tier.icon}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: tc.color, marginBottom: 2 }}>{tier.name}</div>
      <div style={{ fontSize: 12, color: tc.accent, marginBottom: 14 }}>{tier.requirement}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {tier.perks.map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 13 }}>
            <span style={{ color: tc.accent, marginTop: 1 }}>✓</span>
            <span style={{ color: tc.color, opacity: 0.9 }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VipBenefits() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMemberVipBenefits().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>👑 VIP Benefits</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Exclusive perks and privileges for top-tier members.</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !data ? null : (
          <>
            {data.nextTier && (
              <div style={{ ...card, background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)', borderColor: '#4c1d95' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Progress to {data.nextTier.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{data.nextTier.remaining} more PV needed this month</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>{data.nextTier.progress}%</div>
                </div>
                <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${data.nextTier.progress}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 5, transition: 'width 0.6s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginTop: 6 }}>
                  <span>Current: {data.currentTierPv.toLocaleString()} PV</span>
                  <span>Target: {data.nextTier.requiredPv.toLocaleString()} PV</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
              {data.tiers.map(tier => <TierCard key={tier.name} tier={tier} current={data.currentTier} />)}
            </div>

            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Active Exclusive Offers</div>
              {data.exclusiveOffers.length === 0 ? (
                <div style={{ color: 'var(--text2)', fontSize: 14 }}>No exclusive offers available right now — check back soon.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.exclusiveOffers.map(offer => (
                    <div key={offer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderRadius: 8, padding: '14px 16px', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{offer.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{offer.description}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Expires: {offer.expiresAt}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold)' }}>{offer.discount}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8, marginTop: 2 }}>{offer.tier} only</div>
                        <button style={{ padding: '6px 14px', background: 'var(--gold)', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Claim</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
