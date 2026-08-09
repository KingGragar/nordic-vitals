import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberSubscriptionUpgrade, upgradeMemberSubscription } from '../../api/mlmApi'

const PLAN_COLORS = {
  starter:    '#71717a',
  pro:        '#a5b4fc',
  elite:      '#fbbf24',
  enterprise: '#f9a8d4',
}

export default function DashSubscriptionUpgrade() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    getMemberSubscriptionUpgrade().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleUpgrade(planId) {
    if (planId === data.current) return
    setUpgrading(planId)
    await upgradeMemberSubscription(planId)
    setData(prev => ({ ...prev, current: planId }))
    setSuccess(planId)
    setUpgrading(null)
    setTimeout(() => setSuccess(null), 3000)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>⬆️ Subscription Plans</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Compare plans and upgrade or downgrade your membership at any time.</div>
        </div>

        {success && (
          <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: 8, padding: '10px 16px', marginBottom: 18, color: '#86efac', fontSize: 13, fontWeight: 600 }}>
            ✓ Plan upgraded successfully!
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          {data.plans.map(plan => {
            const isCurrent = plan.id === data.current
            const color = PLAN_COLORS[plan.id] || '#71717a'
            const planIndex = data.plans.findIndex(p => p.id === plan.id)
            const currentIndex = data.plans.findIndex(p => p.id === data.current)
            const isUpgrade = planIndex > currentIndex
            const isDowngrade = planIndex < currentIndex

            return (
              <div key={plan.id} style={{
                ...card,
                border: isCurrent ? `2px solid ${color}` : '1px solid var(--border)',
                position: 'relative',
              }}>
                {isCurrent && (
                  <div style={{ position: 'absolute', top: -10, left: 16, background: color, color: '#000', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '2px 10px' }}>
                    CURRENT
                  </div>
                )}
                <div style={{ color, fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
                  <span style={{ fontSize: 28, fontWeight: 800 }}>€{plan.price}</span>
                  <span style={{ color: 'var(--text2)', fontSize: 13 }}>/mo</span>
                  <span style={{ color: 'var(--text2)', fontSize: 12, marginLeft: 6 }}>{plan.pv} PV</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 6 }}>
                      <span style={{ color }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading === plan.id}
                    style={{
                      width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                      background: isUpgrade ? color : 'var(--border)',
                      color: isUpgrade ? '#000' : 'var(--text2)',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {upgrading === plan.id ? 'Processing…' : isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
