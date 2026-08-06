import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMySubscription, getSubscriptionPlans, changeMyPlan } from '../../api/mlmApi'

const NOK = v => 'NOK ' + Number(v).toLocaleString('nb-NO', { maximumFractionDigits: 0 })

const STATUS_META = {
  active:    { label: 'Active',    color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  past_due:  { label: 'Past Due',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  cancelled: { label: 'Cancelled', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  paused:    { label: 'Paused',    color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

function PlanCard({ plan, current, onSelect, selectedId, cycle }) {
  const isCurrent = plan.id === current?.planId
  const isSelected = plan.id === selectedId
  const price = cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice
  const label = cycle === 'annual' ? '/year' : '/mo'
  const annualSave = plan.monthlyPrice > 0
    ? Math.round((1 - plan.annualPrice / (plan.monthlyPrice * 12)) * 100)
    : 0

  return (
    <div onClick={() => !isCurrent && onSelect(plan.id)} style={{
      background: 'var(--navy2)', borderRadius: 14, padding: 22, cursor: isCurrent ? 'default' : 'pointer',
      border: isCurrent ? `2px solid ${plan.color}` : isSelected ? `2px solid ${plan.color}80` : '1px solid var(--border)',
      opacity: plan.status === 'archived' ? 0.5 : 1,
      position: 'relative', overflow: 'hidden', transition: 'border 0.2s',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: plan.color, borderRadius: '14px 14px 0 0' }} />

      {isCurrent && (
        <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 10, fontWeight: 700, color: plan.color, background: `${plan.color}18`, padding: '2px 8px', borderRadius: 6 }}>
          CURRENT PLAN
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          {plan.icon}
        </div>
        <div>
          <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 17 }}>{plan.name}</div>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 1 }}>{plan.description}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: plan.color }}>{NOK(price)}</span>
        <span style={{ fontSize: 13, color: 'var(--text2)', marginLeft: 4 }}>{label}</span>
        {cycle === 'annual' && annualSave > 0 && (
          <span style={{ marginLeft: 8, fontSize: 11, color: '#34d399', fontWeight: 700 }}>Save {annualSave}%</span>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        {plan.features?.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, fontSize: 13, color: 'var(--text2)' }}>
            <span style={{ color: plan.color, fontWeight: 700 }}>✓</span> {f}
          </div>
        ))}
      </div>

      {plan.pvIncluded > 0 && (
        <div style={{ background: 'var(--navy3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#34d399', fontWeight: 600, marginBottom: 12 }}>
          {plan.pvIncluded} PV included / month
        </div>
      )}

      {plan.rankRequired && (
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>
          Requires rank: <strong style={{ color: 'var(--cream)' }}>{plan.rankRequired}</strong>
        </div>
      )}
    </div>
  )
}

export default function DashboardSubscription() {
  const [sub, setSub]       = useState(null)
  const [plans, setPlans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [cycle, setCycle]   = useState('monthly')
  const [selectedId, setSelectedId] = useState(null)
  const [changing, setChanging] = useState(false)
  const [toast, setToast]   = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    Promise.all([getMySubscription(), getSubscriptionPlans()]).then(([s, ps]) => {
      setSub(s)
      setPlans(ps.filter(p => p.status === 'active'))
      if (s) setCycle(s.billingCycle || 'monthly')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  async function handleChange() {
    if (!selectedId || selectedId === sub?.planId) return
    setChanging(true)
    try {
      const result = await changeMyPlan(selectedId, cycle)
      setSub(s => ({ ...s, planId: result.planId, planName: result.planName, billingCycle: cycle }))
      showToast(`Switched to ${result.planName} plan`)
      setSelectedId(null)
      setShowConfirm(false)
    } finally { setChanging(false) }
  }

  const selectedPlan = plans.find(p => p.id === selectedId)
  const currentPlan  = plans.find(p => p.id === sub?.planId)
  const status       = sub?.status || 'active'
  const statusMeta   = STATUS_META[status] || STATUS_META.active

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <div style={{ color: 'var(--text2)' }}>Loading subscription…</div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: 'var(--cream)', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>My Subscription</h1>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>Your current plan, billing details, and upgrade options</div>
        </div>

        {/* Current subscription card */}
        {sub && currentPlan ? (
          <div style={{
            background: 'var(--navy2)', borderRadius: 14, padding: 24,
            border: `1px solid ${currentPlan.color}40`, marginBottom: 28, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: currentPlan.color }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${currentPlan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                  {currentPlan.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Current Plan</div>
                  <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 20 }}>{currentPlan.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                    {sub.billingCycle === 'annual'
                      ? `${NOK(currentPlan.annualPrice)} / year`
                      : `${NOK(currentPlan.monthlyPrice)} / month`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flex: '0 0 auto', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Status</div>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: statusMeta.color, background: statusMeta.bg }}>
                    {statusMeta.label.toUpperCase()}
                  </span>
                </div>
                {sub.nextRenewal && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Next Renewal</div>
                    <div style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 14 }}>{sub.nextRenewal}</div>
                  </div>
                )}
                {currentPlan.pvIncluded > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Monthly PV</div>
                    <div style={{ color: '#34d399', fontWeight: 700, fontSize: 14 }}>{currentPlan.pvIncluded}</div>
                  </div>
                )}
              </div>
            </div>

            {status === 'past_due' && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, fontSize: 13, color: '#f59e0b' }}>
                ⚠️ Your last payment failed. Please update your payment method to avoid service interruption.
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '32px', textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 16 }}>No Active Subscription</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>Choose a plan below to get started.</div>
          </div>
        )}

        {/* Change plan section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <h2 style={{ color: 'var(--cream)', fontSize: 17, fontWeight: 700, margin: 0 }}>
              {sub ? 'Change Plan' : 'Choose a Plan'}
            </h2>

            {/* Billing toggle */}
            <div style={{ display: 'flex', background: 'var(--navy2)', borderRadius: 8, padding: 3, gap: 2 }}>
              {['monthly', 'annual'].map(c => (
                <button key={c} onClick={() => setCycle(c)} style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                  background: cycle === c ? 'var(--gold)' : 'transparent',
                  color: cycle === c ? '#000' : 'var(--text2)',
                }}>
                  {c === 'monthly' ? 'Monthly' : 'Annual · Save up to 17%'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                current={sub}
                selectedId={selectedId}
                cycle={cycle}
                onSelect={id => setSelectedId(id === selectedId ? null : id)}
              />
            ))}
          </div>
        </div>

        {/* Confirm change CTA */}
        {selectedId && selectedId !== sub?.planId && (
          <div style={{
            position: 'sticky', bottom: 24, background: 'var(--navy2)', border: '1px solid var(--gold)', borderRadius: 12,
            padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 15 }}>
                Switch to {selectedPlan?.icon} {selectedPlan?.name}
              </div>
              <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
                {cycle === 'annual' ? NOK(selectedPlan?.annualPrice) + ' / year' : NOK(selectedPlan?.monthlyPrice) + ' / month'}
                {' '}· billed {cycle}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelectedId(null)} style={{
                padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 13,
              }}>Cancel</button>
              <button onClick={handleChange} disabled={changing} style={{
                padding: '9px 24px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: changing ? 'not-allowed' : 'pointer', fontSize: 13,
              }}>
                {changing ? 'Switching…' : 'Confirm Switch'}
              </button>
            </div>
          </div>
        )}

        {/* Info notice */}
        <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', marginTop: 24 }}>
          <strong style={{ color: '#60a5fa' }}>Plan changes:</strong> Upgrades take effect immediately and you are billed the prorated difference. Downgrades take effect at your next renewal date. To cancel your subscription, contact support.
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#22c55e', color: '#000', fontWeight: 700, padding: '10px 20px', borderRadius: 8, zIndex: 300, fontSize: 14 }}>
          ✓ {toast}
        </div>
      )}
    </DashboardLayout>
  )
}
