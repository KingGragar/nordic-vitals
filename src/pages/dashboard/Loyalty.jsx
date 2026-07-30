import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getLoyaltyPoints, redeemLoyaltyPoints } from '../../api/mlmApi'

const CAT_ICONS = { purchase: '🛒', recruit: '👥', autoship: '♻️', training: '🎓', rank: '📊', birthday: '🎂', discount: '🏷️', mlmt: '🪙', shipping: '📦', product: '🎁' }
const CAT_COLORS = { purchase: '#3b82f6', recruit: '#22c55e', autoship: '#8b5cf6', training: '#f59e0b', rank: '#ec4899', birthday: '#f97316', discount: '#ef4444', mlmt: '#a855f7', shipping: '#06b6d4', product: '#84cc16' }

const TIER_COLOR = { Bronze: '#cd7f32', Silver: '#94a3b8', Gold: '#f59e0b', Platinum: '#a855f7' }

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 22px' }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || '#f1f5f9' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function TierBadge({ tier }) {
  const c = TIER_COLOR[tier] || '#94a3b8'
  return (
    <span style={{ background: `${c}22`, color: c, border: `1px solid ${c}55`, borderRadius: 20, padding: '3px 14px', fontSize: 13, fontWeight: 700 }}>
      {tier}
    </span>
  )
}

function PointsBadge({ points, type }) {
  const earned = type === 'earned'
  return (
    <span style={{ fontWeight: 700, fontSize: 15, color: earned ? '#4ade80' : '#f87171' }}>
      {earned ? '+' : ''}{points.toLocaleString()}
    </span>
  )
}

function RedeemModal({ option, balance, onConfirm, onClose, loading, result }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%' }}>
        {result ? (
          <>
            <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ textAlign: 'center', color: '#f1f5f9', marginBottom: 8 }}>Redeemed!</h3>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 16 }}>
              Your redemption code: <strong style={{ color: '#60a5fa' }}>{result.redemptionCode}</strong>
            </p>
            <p style={{ color: '#64748b', textAlign: 'center', fontSize: 13, marginBottom: 24 }}>
              New balance: <strong style={{ color: '#f1f5f9' }}>{result.newBalance.toLocaleString()} pts</strong>
            </p>
            <button onClick={onClose} style={{ width: '100%', padding: '10px 0', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Done
            </button>
          </>
        ) : (
          <>
            <h3 style={{ color: '#f1f5f9', marginBottom: 8 }}>{option.icon} {option.name}</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>{option.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Cost</span>
              <span style={{ color: '#fcd34d', fontWeight: 700 }}>{option.pointsCost.toLocaleString()} pts</span>
            </div>
            {balance < option.pointsCost && (
              <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                ⚠️ You need {(option.pointsCost - balance).toLocaleString()} more points for this.
              </p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || balance < option.pointsCost}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: balance >= option.pointsCost ? '#3b82f6' : 'rgba(59,130,246,0.3)', color: '#fff', border: 'none', cursor: balance >= option.pointsCost ? 'pointer' : 'not-allowed', fontWeight: 600 }}
              >
                {loading ? 'Redeeming…' : 'Confirm Redeem'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Loyalty() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('history')
  const [histFilter, setHistFilter] = useState('all')
  const [redeemModal, setRedeemModal] = useState(null)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemResult, setRedeemResult] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getLoyaltyPoints(user?.memberId || 'NV-10042').then(setData).catch(() => {})
  }, [user])

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3200)
  }

  async function handleRedeem() {
    if (!redeemModal) return
    setRedeemLoading(true)
    try {
      const res = await redeemLoyaltyPoints(user?.memberId || 'NV-10042', redeemModal.id)
      setRedeemResult(res)
      setData(prev => prev ? { ...prev, currentPoints: res.newBalance, history: [
        { id: `lp-r-${Date.now()}`, date: new Date().toISOString().slice(0,10), type: 'redeemed', category: redeemModal.category, description: `Redeemed: ${redeemModal.name}`, points: -redeemModal.pointsCost },
        ...prev.history,
      ]} : prev)
    } catch (e) {
      showToast(e.message || 'Redemption failed', false)
      setRedeemModal(null)
    } finally {
      setRedeemLoading(false)
    }
  }

  function closeModal() {
    setRedeemModal(null)
    setRedeemResult(null)
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading loyalty data…</div>
      </DashboardLayout>
    )
  }

  const currentTierDef = data.tierThresholds.find(t => t.tier === data.tier) || data.tierThresholds[0]
  const nextTierDef = data.tierThresholds[data.tierThresholds.findIndex(t => t.tier === data.tier) + 1]
  const progressToNext = nextTierDef
    ? Math.min(100, Math.round((data.lifetimePoints - currentTierDef.min) / (nextTierDef.min - currentTierDef.min) * 100))
    : 100

  const filteredHistory = histFilter === 'all'
    ? data.history
    : data.history.filter(h => h.type === histFilter)

  const earnActivities = [
    { icon: '🛒', label: 'Shop Purchase',     desc: '10 pts per NOK spent (members: 12.5 pts)' },
    { icon: '♻️', label: 'Autoship Order',    desc: '1.5× standard earn rate' },
    { icon: '👥', label: 'New Recruit',        desc: '500 pts when your direct recruit places first order' },
    { icon: '📊', label: 'Rank Promotion',    desc: '1 000 pts per rank advance (Bronze → Platinum)' },
    { icon: '🎓', label: 'Training Module',    desc: '200 pts per module completed' },
    { icon: '🎂', label: 'Birthday Bonus',     desc: `${currentTierDef.tier}-tier: ${currentTierDef.perks.find(p => p.includes('Birthday')) || '250pts'}` },
    { icon: '📣', label: 'Review a Product',   desc: '50 pts per verified purchase review (max 1/product)' },
    { icon: '🎫', label: 'Refer a Support',    desc: '100 pts when you help a team member via support (admin awards)' },
  ]

  return (
    <DashboardLayout>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 2000, background: toast.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: 10, padding: '12px 20px', color: toast.ok ? '#4ade80' : '#f87171', fontWeight: 600, fontSize: 14 }}>
          {toast.msg}
        </div>
      )}

      {redeemModal && (
        <RedeemModal
          option={redeemModal}
          balance={data.currentPoints}
          onConfirm={handleRedeem}
          onClose={closeModal}
          loading={redeemLoading}
          result={redeemResult}
        />
      )}

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: 26, fontWeight: 700 }}>⭐ Loyalty Points</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Earn points on every purchase and activity. Redeem for discounts, MLMT tokens, and more.</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <TierBadge tier={data.tier} />
          </div>
        </div>

        {/* Expiry warning */}
        {data.expiringPoints && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 18px', marginBottom: 20, color: '#fcd34d', fontSize: 13 }}>
            ⚠️ <strong>{data.expiringPoints.amount.toLocaleString()} points</strong> expire on {data.expiringPoints.date}. Redeem them before they're gone!
          </div>
        )}

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
          <KpiCard label="Available Points" value={data.currentPoints.toLocaleString()} sub="Ready to redeem" color="#fcd34d" />
          <KpiCard label="Lifetime Points" value={data.lifetimePoints.toLocaleString()} sub="All time earned" color="#94a3b8" />
          <KpiCard label="Current Tier" value={data.tier} sub={nextTierDef ? `${(nextTierDef.min - data.lifetimePoints).toLocaleString()} pts to ${nextTierDef.tier}` : 'Max tier reached'} color={TIER_COLOR[data.tier]} />
          <KpiCard label="Tier Progress" value={`${progressToNext}%`} sub={nextTierDef ? `Toward ${nextTierDef.tier}` : 'Platinum 🏆'} color="#60a5fa" />
        </div>

        {/* Tier progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 22px', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>Tier Ladder</span>
            {nextTierDef && (
              <span style={{ color: '#64748b', fontSize: 13 }}>
                {data.lifetimePoints.toLocaleString()} / {nextTierDef.min.toLocaleString()} pts to <strong style={{ color: TIER_COLOR[nextTierDef.tier] }}>{nextTierDef.tier}</strong>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', height: 10, marginBottom: 14 }}>
            {data.tierThresholds.map((t, i) => {
              const next = data.tierThresholds[i + 1]
              const tierMax = next ? next.min : data.lifetimePoints + 1
              const tierMin = t.min
              const fill = data.lifetimePoints >= tierMax ? 100 : data.lifetimePoints > tierMin ? Math.round((data.lifetimePoints - tierMin) / (tierMax - tierMin) * 100) : 0
              return (
                <div key={t.tier} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, width: `${fill}%`, background: t.color, transition: 'width 0.6s ease' }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {data.tierThresholds.map(t => (
              <div key={t.tier} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: t.color }} />
                <span style={{ fontSize: 12, color: t.tier === data.tier ? '#f1f5f9' : '#64748b', fontWeight: t.tier === data.tier ? 700 : 400 }}>{t.tier}</span>
              </div>
            ))}
          </div>
          {/* Current tier perks */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 6px' }}>Your {data.tier} perks:</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {currentTierDef.perks.map(p => (
                <span key={p} style={{ background: `${TIER_COLOR[data.tier]}18`, color: TIER_COLOR[data.tier], border: `1px solid ${TIER_COLOR[data.tier]}44`, borderRadius: 20, padding: '2px 12px', fontSize: 12 }}>{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['history', 'redeem', 'earn'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: tab === t ? '#3b82f6' : 'rgba(255,255,255,0.06)',
              color: tab === t ? '#fff' : '#94a3b8',
            }}>
              {t === 'history' ? '📜 History' : t === 'redeem' ? '🎁 Redeem' : '💡 How to Earn'}
            </button>
          ))}
        </div>

        {/* History tab */}
        {tab === 'history' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['all', 'earned', 'redeemed'].map(f => (
                <button key={f} onClick={() => setHistFilter(f)} style={{
                  padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: histFilter === f ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                  color: histFilter === f ? '#fff' : '#94a3b8',
                }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {filteredHistory.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No transactions for this filter.</div>
            ) : (
              <div>
                {filteredHistory.map((entry, i) => (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < filteredHistory.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${CAT_COLORS[entry.category] || '#3b82f6'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {CAT_ICONS[entry.category] || '⭐'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</div>
                      <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{entry.date}</div>
                    </div>
                    <PointsBadge points={entry.points} type={entry.type} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Redeem tab */}
        {tab === 'redeem' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 14 }}>
            {data.redeemOptions.map(opt => {
              const canAfford = data.currentPoints >= opt.pointsCost
              return (
                <div key={opt.id} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${canAfford ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 28 }}>{opt.icon}</div>
                  <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15 }}>{opt.name}</div>
                  <div style={{ color: '#64748b', fontSize: 13, flex: 1 }}>{opt.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fcd34d', fontWeight: 700, fontSize: 14 }}>{opt.pointsCost.toLocaleString()} pts</span>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>= {opt.value}</span>
                  </div>
                  <button
                    onClick={() => { setRedeemModal(opt); setRedeemResult(null) }}
                    style={{ padding: '9px 0', borderRadius: 8, border: 'none', cursor: canAfford ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13, background: canAfford ? '#3b82f6' : 'rgba(59,130,246,0.2)', color: canAfford ? '#fff' : '#475569' }}
                  >
                    {canAfford ? 'Redeem' : `Need ${(opt.pointsCost - data.currentPoints).toLocaleString()} more pts`}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* How to Earn tab */}
        {tab === 'earn' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            {earnActivities.map((a, i) => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < earnActivities.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{a.icon}</span>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{a.label}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
