import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberLoyaltyTiers } from '../../api/mlmApi'

const TIER_COLOR = { Diamond: '#93c5fd', Platinum: '#e2e8f0', Gold: '#fbbf24', Silver: '#94a3b8', Bronze: '#fb923c' }
const TIER_ICON = { Diamond: '💎', Platinum: '⚪', Gold: '🥇', Silver: '🥈', Bronze: '🥉' }

export default function DashLoyaltyTiers() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMemberLoyaltyTiers().then(d => {
      setData(d)
      if (d?.currentTier) setSelectedTier(d.currentTier)
    }).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '7px 16px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  const tiers = data?.tiers || []
  const currentTier = data?.currentTier
  const currentTierData = tiers.find(t => t.name === currentTier)
  const nextTierData = tiers[tiers.findIndex(t => t.name === currentTier) + 1]

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Loyalty Tiers</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Track your tier progression, unlock benefits, and see what's next</p>
        </div>

        {!loading && currentTierData && (
          <div style={{ ...card, background: `linear-gradient(135deg, var(--card), ${TIER_COLOR[currentTier] || '#818cf8'}11)`, borderColor: TIER_COLOR[currentTier] || 'var(--border)', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 48 }}>{TIER_ICON[currentTier] || '⭐'}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: TIER_COLOR[currentTier] || '#818cf8' }}>{currentTier}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Current tier · {data?.pointsBalance?.toLocaleString()} pts</div>
              </div>
              {nextTierData && (
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Next: {nextTierData.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TIER_COLOR[nextTierData.name] || '#818cf8' }}>{data?.pointsToNext?.toLocaleString()} pts to go</div>
                </div>
              )}
            </div>
            {nextTierData && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span>{currentTierData.minPoints?.toLocaleString()} pts</span>
                  <span style={{ fontWeight: 700, color: TIER_COLOR[nextTierData.name] }}>{nextTierData.minPoints?.toLocaleString()} pts</span>
                </div>
                <div style={{ height: 12, borderRadius: 6, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${data?.progressPct || 0}%`, background: TIER_COLOR[currentTier] || '#818cf8', borderRadius: 6, transition: 'width .4s' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>{data?.progressPct || 0}% to {nextTierData.name}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {tiers.map(t => (
            <button key={t.name} onClick={() => setSelectedTier(t.name)} style={{
              padding: '7px 16px', borderRadius: 8, border: `1px solid ${selectedTier === t.name ? TIER_COLOR[t.name] || '#6366f1' : 'var(--border)'}`,
              cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              background: selectedTier === t.name ? `${TIER_COLOR[t.name] || '#6366f1'}22` : 'var(--card)',
              color: selectedTier === t.name ? TIER_COLOR[t.name] || '#6366f1' : 'var(--text-muted)'
            }}>
              {TIER_ICON[t.name] || '⭐'} {t.name}
              {t.name === currentTier && <span style={{ fontSize: 10, fontWeight: 700, color: TIER_COLOR[t.name], background: `${TIER_COLOR[t.name]}33`, borderRadius: 4, padding: '1px 5px' }}>YOU</span>}
            </button>
          ))}
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Loading…</div> : (() => {
          const tier = tiers.find(t => t.name === selectedTier)
          if (!tier) return null
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={card}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: TIER_COLOR[tier.name] || '#818cf8' }}>{TIER_ICON[tier.name]} {tier.name} Benefits</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(tier.benefits || []).map(b => (
                    <div key={b.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: TIER_COLOR[tier.name] || '#818cf8', flexShrink: 0, fontSize: 16 }}>✓</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</div>
                        {b.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{b.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={card}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Requirements</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Minimum Points', value: tier.minPoints?.toLocaleString() },
                      { label: 'Monthly PV', value: tier.monthlyPv ? `${tier.monthlyPv} PV` : 'None' },
                      { label: 'Direct Members', value: tier.directCount || 'None' },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                        <span style={{ fontWeight: 700 }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={card}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Points Multiplier</h3>
                  <div style={{ fontSize: 28, fontWeight: 800, color: TIER_COLOR[tier.name] || '#818cf8' }}>{tier.multiplier}x</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Earned on every purchase at this tier</div>
                </div>

                {tier.name !== currentTier && tier.name > currentTier && (
                  <div style={{ ...card, background: `${TIER_COLOR[tier.name] || '#818cf8'}08`, borderColor: `${TIER_COLOR[tier.name] || '#818cf8'}44`, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Points needed</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: TIER_COLOR[tier.name] || '#818cf8' }}>{Math.max(0, (tier.minPoints || 0) - (data?.pointsBalance || 0)).toLocaleString()}</div>
                    <button style={{ ...btn(`${TIER_COLOR[tier.name] || '#818cf8'}`), marginTop: 10, fontSize: 12 }}>How to earn faster</button>
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </DashboardLayout>
  )
}
