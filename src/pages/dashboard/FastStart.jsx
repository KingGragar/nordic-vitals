import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getFastStartProgress, claimFastStartBonus, getFastStartLeaderboard } from '../../api/mlmApi'

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysFromJoin(joinedAt) {
  const joined = new Date(joinedAt + 'T00:00:00Z')
  return Math.floor((Date.now() - joined.getTime()) / 86400000)
}

function daysUntil(joinedAt, deadlineDays) {
  const joined = new Date(joinedAt + 'T00:00:00Z')
  const deadline = new Date(joined.getTime() + deadlineDays * 86400000)
  return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000))
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function pct(val, max) {
  return Math.min(100, Math.round((val / Math.max(1, max)) * 100))
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = '#c9a84c', label }) {
  const p = pct(value, max)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: p >= 100 ? '#4ade80' : 'var(--text1)' }}>
          {value} / {max}{p >= 100 ? ' ✓' : ''}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${p}%`,
          background: p >= 100 ? '#4ade80' : color,
          borderRadius: 4,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

function CountdownBadge({ daysLeft, color }) {
  if (daysLeft <= 0) return <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 10 }}>Expired</span>
  const urgent = daysLeft <= 7
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: urgent ? '#ef4444' : color, background: urgent ? 'rgba(239,68,68,0.12)' : 'rgba(201,168,76,0.12)', padding: '2px 8px', borderRadius: 10 }}>
      {urgent ? '⚠️ ' : ''}{daysLeft}d left
    </span>
  )
}

function TierCard({ tier, tierProgress, progress, onClaim, claiming }) {
  const { joinedAt, currentPv, directRecruits, activeTeamMembers } = progress
  const { requirements, bonusMlmt, color, emoji, name, deadlineDays, description } = tier

  const daysPast = daysFromJoin(joinedAt)
  const dLeft = daysUntil(joinedAt, deadlineDays)
  const isExpired = daysPast > deadlineDays

  const meetsReqs = currentPv >= requirements.pv
    && directRecruits >= requirements.directRecruits
    && activeTeamMembers >= requirements.activeTeamMembers

  const status = tierProgress?.status ?? (isExpired ? 'expired' : meetsReqs ? 'earned' : 'active')

  const statusMeta = {
    claimed:  { label: 'Claimed ✓',   bg: 'rgba(74,222,128,0.1)',  textColor: '#4ade80',  border: 'rgba(74,222,128,0.3)'  },
    earned:   { label: 'Ready to Claim!', bg: 'rgba(201,168,76,0.12)', textColor: color, border: color },
    active:   { label: 'In Progress', bg: 'rgba(255,255,255,0.03)', textColor: 'var(--text2)', border: 'var(--border)' },
    expired:  { label: 'Expired',      bg: 'rgba(239,68,68,0.06)', textColor: '#ef4444', border: 'rgba(239,68,68,0.2)' },
    upcoming: { label: 'Upcoming',     bg: 'rgba(255,255,255,0.03)', textColor: 'var(--text2)', border: 'var(--border)' },
  }
  const sm = statusMeta[status] ?? statusMeta.active

  return (
    <div style={{
      border: `1.5px solid ${sm.border}`,
      borderRadius: 12,
      padding: 20,
      background: sm.bg,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text1)' }}>{name}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Complete within {deadlineDays} days of joining</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {status === 'active' && !isExpired && <CountdownBadge daysLeft={dLeft} color={color} />}
          <span style={{ fontSize: 11, fontWeight: 700, color: sm.textColor, background: `${sm.textColor}18`, padding: '3px 10px', borderRadius: 10 }}>
            {sm.label}
          </span>
        </div>
      </div>

      {/* Bonus */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(201,168,76,0.08)', borderRadius: 8, border: '1px solid rgba(201,168,76,0.15)' }}>
        <span style={{ fontSize: 18 }}>🪙</span>
        <span style={{ fontSize: 14, color: '#c9a84c', fontWeight: 700 }}>{bonusMlmt.toLocaleString()} MLMT bonus</span>
        {status === 'claimed' && <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 'auto' }}>Paid {formatDate(tierProgress?.claimedAt)}</span>}
      </div>

      {/* Description */}
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{description}</div>

      {/* Progress bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ProgressBar value={currentPv} max={requirements.pv} color={color} label="Personal Volume (PV)" />
        <ProgressBar value={directRecruits} max={requirements.directRecruits} color={color} label="Direct Recruits" />
        {requirements.activeTeamMembers > 0 && (
          <ProgressBar value={activeTeamMembers} max={requirements.activeTeamMembers} color={color} label="Active Team Members" />
        )}
      </div>

      {/* Actions */}
      {status === 'earned' && (
        <button
          onClick={() => onClaim(tier.id)}
          disabled={claiming}
          style={{
            marginTop: 4,
            padding: '10px 0',
            background: color,
            color: '#000',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            cursor: claiming ? 'wait' : 'pointer',
            opacity: claiming ? 0.7 : 1,
          }}
        >
          {claiming ? 'Claiming…' : `Claim ${bonusMlmt.toLocaleString()} MLMT`}
        </button>
      )}
      {status === 'claimed' && tierProgress?.earnedAt && (
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          Earned: {formatDate(tierProgress.earnedAt)}
        </div>
      )}
    </div>
  )
}

function ClaimSuccessModal({ tier, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{tier.emoji}</div>
        <div style={{ fontWeight: 700, fontSize: 22, color: '#c9a84c', marginBottom: 8 }}>Bonus Claimed!</div>
        <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 20 }}>
          <strong style={{ color: '#c9a84c', fontSize: 18 }}>{tier.bonusMlmt.toLocaleString()} MLMT</strong> has been added to your wallet for completing <strong>{tier.name}</strong>.
        </div>
        <button
          onClick={onClose}
          style={{ padding: '10px 32px', background: '#c9a84c', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          Great!
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FastStart() {
  const { user } = useAuth()
  const [tiers, setTiers] = useState([])
  const [progress, setProgress] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)
  const [claimedTier, setClaimedTier] = useState(null)

  useEffect(() => {
    Promise.all([
      getFastStartProgress(user?.userId),
      getFastStartLeaderboard(),
    ]).then(([fsData, lb]) => {
      setTiers(fsData.tiers)
      setProgress(fsData.progress)
      setLeaderboard(lb)
      setLoading(false)
    })
  }, [user?.userId])

  const daysPast = useMemo(() => progress ? daysFromJoin(progress.joinedAt) : 0, [progress])
  const isActive = daysPast <= 90

  const totalPotential = tiers.reduce((s, t) => s + t.bonusMlmt, 0)
  const totalEarned = useMemo(() => {
    if (!progress) return 0
    return progress.tiers
      .filter(t => t.status === 'claimed' || t.status === 'earned')
      .reduce((s, t) => {
        const tier = tiers.find(tt => tt.id === t.tierId)
        return s + (tier?.bonusMlmt ?? 0)
      }, 0)
  }, [progress, tiers])

  async function handleClaim(tierId) {
    setClaiming(tierId)
    try {
      await claimFastStartBonus(user?.userId, tierId)
      const updated = await getFastStartProgress(user?.userId)
      setTiers(updated.tiers)
      setProgress(updated.progress)
      const claimed = tiers.find(t => t.id === tierId)
      setClaimedTier(claimed)
    } finally {
      setClaiming(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text2)' }}>
          Loading Fast Start data…
        </div>
      </DashboardLayout>
    )
  }

  const joinDate = progress?.joinedAt
  const programEndDate = joinDate
    ? new Date(new Date(joinDate + 'T00:00:00Z').getTime() + 90 * 86400000).toISOString().slice(0, 10)
    : null

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 4px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)', margin: 0 }}>⚡ Fast Start Bonus</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', margin: '4px 0 0' }}>
            {isActive
              ? `You're in your Fast Start window! Earn up to ${totalPotential.toLocaleString()} MLMT in enhanced bonuses by hitting milestones early.`
              : 'Your Fast Start period has ended. Here is your final result.'}
          </p>
        </div>

        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Day of Program', value: `${daysPast} / 90`, sub: isActive ? `${90 - daysPast}d remaining` : 'Completed', icon: '📅' },
            { label: 'Joined', value: formatDate(joinDate), sub: `Ends ${formatDate(programEndDate)}`, icon: '🗓️' },
            { label: 'MLMT Earned', value: `${totalEarned.toLocaleString()}`, sub: `of ${totalPotential.toLocaleString()} possible`, icon: '🪙' },
            { label: 'Your PV', value: progress?.currentPv ?? 0, sub: 'personal volume', icon: '📦' },
            { label: 'Recruits', value: progress?.directRecruits ?? 0, sub: 'direct this period', icon: '👥' },
          ].map(({ label, value, sub, icon }) => (
            <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text1)' }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Progress Timeline */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>90-Day Timeline</div>
          <div style={{ position: 'relative', height: 8, background: 'var(--border)', borderRadius: 4, margin: '16px 0 20px' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(100, (daysPast / 90) * 100)}%`, background: daysPast >= 90 ? '#4ade80' : '#c9a84c', borderRadius: 4, transition: 'width 0.8s ease' }} />
            {[30, 60, 90].map((d, i) => {
              const tierDef = tiers[i]
              const passed = daysPast >= d
              return (
                <div key={d} style={{ position: 'absolute', left: `${(d / 90) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: passed ? '#4ade80' : 'var(--card)', border: `2px solid ${passed ? '#4ade80' : tierDef?.color ?? '#c9a84c'}`, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 10, color: 'var(--text2)', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700 }}>Day {d}</div>
                      <div>{tierDef?.emoji} {tierDef?.name}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div style={{ position: 'absolute', left: `${Math.min(98, (daysPast / 90) * 100)}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
              <div title="Today" style={{ width: 10, height: 10, borderRadius: '50%', background: '#c9a84c', border: '2px solid #000' }} />
            </div>
          </div>
        </div>

        {/* Tier Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
          {tiers.map((tier) => {
            const tp = progress?.tiers?.find(t => t.tierId === tier.id)
            return (
              <TierCard
                key={tier.id}
                tier={tier}
                tierProgress={tp}
                progress={progress}
                onClaim={handleClaim}
                claiming={claiming === tier.id}
              />
            )
          })}
        </div>

        {/* Tips Section */}
        {isActive && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>💡 Fast Start Tips</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '🛒', text: 'Set up an Autoship to lock in your monthly PV automatically.' },
                { icon: '🔗', text: 'Share your referral link with your warm market — friends and family convert best early.' },
                { icon: '📣', text: 'Use Team Broadcast to motivate your downline to order and stay active.' },
                { icon: '🎯', text: 'Use the Prospect Tracker to follow up within 48 hours of first contact.' },
                { icon: '📊', text: 'Monitor your Binary Leg Balance to maximise Pairing Bonus on your Gold Start push.' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text2)', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1 }}>
            🏆 Fast Start Leaderboard (New Members this Period)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                  {['Rank', 'Member', 'PV', 'Recruits', 'Tier'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(row => (
                  <tr key={row.rank} style={{
                    borderBottom: '1px solid var(--border)',
                    background: row.isYou ? 'rgba(201,168,76,0.06)' : 'transparent',
                  }}>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: row.rank <= 3 ? '#c9a84c' : 'var(--text2)' }}>
                      {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : `#${row.rank}`}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text1)', fontWeight: row.isYou ? 700 : 400 }}>
                      {row.country} {row.name} {row.isYou && <span style={{ fontSize: 10, color: '#c9a84c', fontWeight: 700, background: 'rgba(201,168,76,0.15)', padding: '1px 6px', borderRadius: 6, marginLeft: 4 }}>YOU</span>}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{row.pv}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{row.recruits}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 12 }}>{row.emoji} {row.tier}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {claimedTier && (
        <ClaimSuccessModal tier={claimedTier} onClose={() => setClaimedTier(null)} />
      )}
    </DashboardLayout>
  )
}
