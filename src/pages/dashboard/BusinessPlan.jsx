import { useState, useMemo } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'

const RANKS = [
  { name: 'Unranked', icon: '⬜', color: '#64748b', min_pv: 0,    min_leg_gv: 0,     active_recruits: 0,  comm_rate: 0.05 },
  { name: 'Bronze',   icon: '🥉', color: '#b45309', min_pv: 100,  min_leg_gv: 500,   active_recruits: 1,  comm_rate: 0.08 },
  { name: 'Silver',   icon: '🥈', color: '#6b7280', min_pv: 300,  min_leg_gv: 2000,  active_recruits: 3,  comm_rate: 0.10 },
  { name: 'Gold',     icon: '🥇', color: '#d97706', min_pv: 500,  min_leg_gv: 5000,  active_recruits: 5,  comm_rate: 0.10 },
  { name: 'Platinum', icon: '💎', color: '#7c3aed', min_pv: 1000, min_leg_gv: 15000, active_recruits: 10, comm_rate: 0.10 },
]

// Average PV per active member/month (conservative estimate)
const AVG_MEMBER_PV = 150
// Average months a recruit stays active
const AVG_MEMBER_RETENTION_MONTHS = 18
// Binary pairing rate
const PAIRING_RATE = 0.10

const card = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '20px 24px',
}

const label = { fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }

function SliderRow({ label: lbl, value, min, max, step = 1, onChange, format, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 14, color: 'var(--text1)', fontWeight: 500 }}>{lbl}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{format ? format(value) : value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      {hint && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{hint}</div>}
    </div>
  )
}

function StatTile({ label: lbl, value, sub, color = 'var(--accent)', icon }) {
  return (
    <div style={{ ...card, textAlign: 'center' }}>
      {icon && <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>}
      <div style={{ ...label }}>{lbl}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function ProgressBar({ value, max, color = 'var(--accent)', label: lbl, sublabel }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text1)' }}>{lbl}</span>
        <span style={{ fontSize: 13, color, fontWeight: 600 }}>{sublabel || `${value.toLocaleString()} / ${max.toLocaleString()}`}</span>
      </div>
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .3s' }} />
      </div>
    </div>
  )
}

function MilestoneRow({ month, milestone, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
      <div style={{
        minWidth: 36, height: 36, borderRadius: '50%',
        background: done ? '#22c55e22' : 'var(--border)',
        border: `2px solid ${done ? '#22c55e' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: done ? '#22c55e' : 'var(--text2)',
      }}>
        {done ? '✓' : month}
      </div>
      <div>
        <div style={{ fontSize: 14, color: 'var(--text1)', fontWeight: 500 }}>{milestone.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{milestone.detail}</div>
      </div>
    </div>
  )
}

function RankBadge({ rank }) {
  const r = RANKS.find(x => x.name === rank) || RANKS[0]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999,
      background: r.color + '22', color: r.color,
      fontSize: 12, fontWeight: 700,
    }}>
      {r.icon} {r.name}
    </span>
  )
}

export default function BusinessPlan() {
  const { user } = useAuth()
  const currentPv       = user?.pv || 320
  const currentLeftGV   = user?.leftGV || 1840
  const currentRightGV  = user?.rightGV || 1210
  const currentRankName = user?.rank || 'Silver'
  const currentRankIdx  = RANKS.findIndex(r => r.name === currentRankName)

  // User inputs
  const [goalMlmt, setGoalMlmt]         = useState(5000)
  const [timelineMonths, setTimelineMonths] = useState(12)
  const [avgPvPerMember, setAvgPvPerMember] = useState(AVG_MEMBER_PV)
  const [scenario, setScenario]           = useState('binary')

  const plan = useMemo(() => {
    // ── Binary scenario ──
    // Monthly income = min(leftGV, rightGV) × PAIRING_RATE
    // Required weaker leg GV = goalMlmt / PAIRING_RATE
    const reqWeakLeg     = Math.ceil(goalMlmt / PAIRING_RATE)
    const currentWeakLeg = Math.min(currentLeftGV, currentRightGV)
    const gvGap          = Math.max(0, reqWeakLeg - currentWeakLeg)

    // Which rank is needed to earn that much?
    let targetRankIdx = RANKS.length - 1
    for (let i = 0; i < RANKS.length; i++) {
      const potIncome = RANKS[i].min_leg_gv * PAIRING_RATE
      if (potIncome >= goalMlmt) { targetRankIdx = i; break }
    }
    // Actually: req income potential at target rank check
    // Use the greater of: rank needed by GV reqs vs rank needed by PV reqs
    const rankByGv = RANKS.findIndex(r => r.min_leg_gv >= reqWeakLeg)
    const targetRankByGv = rankByGv >= 0 ? rankByGv : RANKS.length - 1
    const targetRankFinal = Math.max(currentRankIdx, targetRankByGv)
    const targetRank = RANKS[Math.min(targetRankFinal, RANKS.length - 1)]

    // Monthly GV growth needed
    const gvPerMonth = timelineMonths > 0 ? Math.ceil(gvGap / timelineMonths) : gvGap

    // Recruits needed per month (each recruit contributes avgPvPerMember GV to leg)
    const recruitsPerMonth = gvPerMonth > 0 ? Math.ceil(gvPerMonth / avgPvPerMember) : 0

    // Total new recruits over the timeline
    const totalNewRecruits = recruitsPerMonth * timelineMonths

    // PV gap
    const pvGap = Math.max(0, targetRank.min_pv - currentPv)
    const pvGapMonthly = Math.ceil(pvGap / timelineMonths)

    // Current income estimate (binary)
    const currentIncome = Math.round(currentWeakLeg * PAIRING_RATE)

    // Projected income at goal
    const projIncome = goalMlmt

    // Monthly milestones
    const milestones = []
    const rankOrder = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']
    const pathRanks = rankOrder.slice(currentRankIdx + 1, targetRankFinal + 1)

    if (pvGap > 0) {
      milestones.push({
        month: 1,
        title: `Boost personal PV to ${targetRank.min_pv}`,
        detail: `Increase your monthly orders by NOK ${pvGapMonthly * 30} — current: ${currentPv} PV, target: ${targetRank.min_pv} PV`,
      })
    }
    if (recruitsPerMonth > 0) {
      milestones.push({
        month: 1,
        title: `Recruit ${recruitsPerMonth} new member${recruitsPerMonth > 1 ? 's' : ''}/month`,
        detail: `Each active recruit generates ~${avgPvPerMember} PV/month in GV. You need ${gvPerMonth.toLocaleString()} additional GV/month.`,
      })
    }
    pathRanks.forEach((rankName, i) => {
      const r = RANKS.find(x => x.name === rankName)
      const monthEst = Math.round(((i + 1) / (pathRanks.length + 1)) * timelineMonths)
      milestones.push({
        month: monthEst || 1,
        title: `Achieve ${rankName} rank ${r.icon}`,
        detail: `Requires ${r.min_pv} PV/month, ${r.min_leg_gv.toLocaleString()} GV per leg, ${r.active_recruits} active direct recruit${r.active_recruits !== 1 ? 's' : ''}`,
      })
    })
    milestones.push({
      month: timelineMonths,
      title: `Reach ${goalMlmt.toLocaleString()} MLMT/month income 🎯`,
      detail: `Binary leg volume of ${reqWeakLeg.toLocaleString()} GV on weaker leg × 10% pairing = ${goalMlmt.toLocaleString()} MLMT`,
    })
    milestones.sort((a, b) => a.month - b.month)

    // Quarterly breakdown
    const quarters = []
    for (let q = 1; q * 3 <= timelineMonths; q++) {
      const endMonth = q * 3
      const cumGv    = Math.min(currentWeakLeg + gvPerMonth * endMonth, reqWeakLeg)
      const cumInc   = Math.round(cumGv * PAIRING_RATE)
      quarters.push({ q, endMonth, cumGv, cumInc })
    }

    return {
      targetRank,
      reqWeakLeg,
      currentWeakLeg,
      gvGap,
      gvPerMonth,
      recruitsPerMonth,
      totalNewRecruits,
      pvGap,
      pvGapMonthly,
      currentIncome,
      projIncome,
      milestones,
      quarters,
    }
  }, [goalMlmt, timelineMonths, avgPvPerMember, currentPv, currentLeftGV, currentRightGV, currentRankIdx, scenario])

  const incomeProgress = Math.min(100, plan.currentIncome > 0 ? (plan.currentIncome / goalMlmt) * 100 : 0)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text1)' }}>📋 Business Plan</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text2)', fontSize: 14 }}>
            Set your income goal and get a personalized roadmap to achieve it.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
          {/* Input panel */}
          <div style={{ ...card, gridColumn: 'span 1' }}>
            <div style={{ ...label, marginBottom: 20 }}>Your Goal Settings</div>
            <SliderRow
              label="Monthly Income Goal"
              value={goalMlmt}
              min={500} max={50000} step={500}
              onChange={setGoalMlmt}
              format={v => `${v.toLocaleString()} MLMT`}
              hint="Target binary commission income per month"
            />
            <SliderRow
              label="Timeline"
              value={timelineMonths}
              min={3} max={36} step={3}
              onChange={setTimelineMonths}
              format={v => `${v} months`}
              hint="How many months to reach your goal"
            />
            <SliderRow
              label="Avg. PV per Recruit"
              value={avgPvPerMember}
              min={50} max={500} step={25}
              onChange={setAvgPvPerMember}
              format={v => `${v} PV/mo`}
              hint="Expected average monthly PV contribution per active member"
            />
          </div>

          {/* Current vs Goal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...card, flex: 1 }}>
              <div style={{ ...label, marginBottom: 12 }}>Current Position</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>RANK</div>
                  <RankBadge rank={currentRankName} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>EST. INCOME</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text1)' }}>{plan.currentIncome.toLocaleString()} <span style={{ fontSize: 12, color: 'var(--text2)' }}>MLMT/mo</span></div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Progress to goal</div>
                <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${incomeProgress}%`, height: '100%', background: incomeProgress >= 100 ? '#22c55e' : 'var(--accent)', borderRadius: 5, transition: 'width .3s' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{incomeProgress.toFixed(1)}% of {goalMlmt.toLocaleString()} MLMT/mo</div>
              </div>
            </div>
            <div style={{ ...card, flex: 1 }}>
              <div style={{ ...label, marginBottom: 8 }}>Target to Reach Goal</div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>TARGET RANK</div>
                  <RankBadge rank={plan.targetRank.name} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>WEAKER LEG GV</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: plan.targetRank.color }}>{plan.reqWeakLeg.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
          <StatTile icon="📅" label="Months to Goal" value={timelineMonths} sub="your timeline" />
          <StatTile icon="👤" label="New Recruits/Month" value={plan.recruitsPerMonth} sub={`${plan.totalNewRecruits} total`} color={plan.recruitsPerMonth > 5 ? '#f59e0b' : '#22c55e'} />
          <StatTile icon="📦" label="GV Needed/Month" value={plan.gvPerMonth.toLocaleString()} sub="leg volume growth" color="#3b82f6" />
          <StatTile icon="💰" label="Income at Goal" value={`${goalMlmt.toLocaleString()}`} sub="MLMT/month" color="#22c55e" />
          <StatTile icon="🔼" label="GV Gap" value={plan.gvGap.toLocaleString()} sub="still to build" color={plan.gvGap === 0 ? '#22c55e' : 'var(--accent)'} />
        </div>

        {/* GV Progress bars */}
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ ...label, marginBottom: 16 }}>Current Binary Leg Status</div>
          <ProgressBar
            label="Left Leg GV" value={currentLeftGV} max={plan.reqWeakLeg}
            color="#6366f1"
            sublabel={`${currentLeftGV.toLocaleString()} / ${plan.reqWeakLeg.toLocaleString()} GV needed`}
          />
          <ProgressBar
            label="Right Leg GV" value={currentRightGV} max={plan.reqWeakLeg}
            color="#f59e0b"
            sublabel={`${currentRightGV.toLocaleString()} / ${plan.reqWeakLeg.toLocaleString()} GV needed`}
          />
          <ProgressBar
            label="Personal PV" value={currentPv} max={plan.targetRank.min_pv || 100}
            color="#22c55e"
            sublabel={`${currentPv} / ${plan.targetRank.min_pv || 100} PV (${plan.targetRank.name} requirement)`}
          />
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8 }}>
            💡 <strong>Binary tip:</strong> Your income is limited by your <em>weaker</em> leg. Focus {plan.currentLeftGV <= plan.currentRightGV ? 'left' : 'right'} leg recruiting to maximize earnings.
          </div>
        </div>

        {/* Quarterly projection */}
        {plan.quarters.length > 0 && (
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ ...label, marginBottom: 16 }}>Quarterly Income Projection</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontSize: 12, fontWeight: 600 }}>Quarter</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text2)', fontSize: 12, fontWeight: 600 }}>End of Month</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text2)', fontSize: 12, fontWeight: 600 }}>Weaker Leg GV</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text2)', fontSize: 12, fontWeight: 600 }}>Est. Income (MLMT)</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text2)', fontSize: 12, fontWeight: 600 }}>% of Goal</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.quarters.map(q => {
                    const pct = Math.min(100, (q.cumInc / goalMlmt) * 100)
                    return (
                      <tr key={q.q} style={{ borderBottom: '1px solid var(--border)', background: pct >= 100 ? '#22c55e11' : 'transparent' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>Q{q.q}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text2)' }}>Month {q.endMonth}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{q.cumGv.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: pct >= 100 ? '#22c55e' : 'var(--accent)' }}>{q.cumInc.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: pct >= 100 ? '#22c55e22' : 'var(--border)', color: pct >= 100 ? '#22c55e' : 'var(--text2)' }}>
                            {pct.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Roadmap */}
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ ...label, marginBottom: 16 }}>Your Action Roadmap</div>
          {plan.milestones.map((m, i) => (
            <MilestoneRow key={i} month={m.month} milestone={m} done={false} />
          ))}
        </div>

        {/* Action checklist */}
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ ...label, marginBottom: 16 }}>This Month's Priority Actions</div>
          {[
            plan.recruitsPerMonth > 0 && {
              icon: '👥', action: `Recruit ${plan.recruitsPerMonth} new member${plan.recruitsPerMonth > 1 ? 's' : ''}`,
              detail: `Share your referral link and invite ${plan.recruitsPerMonth} person${plan.recruitsPerMonth > 1 ? 's' : ''} to join Nordic Vitals`,
            },
            plan.pvGap > 0 && {
              icon: '📦', action: `Increase personal PV to ${plan.targetRank.min_pv}`,
              detail: `Place an order of ~${plan.pvGapMonthly * 30} NOK to close the PV gap for ${plan.targetRank.name} rank`,
            },
            currentRankIdx < RANKS.length - 2 && {
              icon: '📣', action: 'Activate your weaker leg',
              detail: `Your ${currentLeftGV <= currentRightGV ? 'left' : 'right'} leg needs attention — coach new recruits to place their first order`,
            },
            {
              icon: '🤝', action: 'Help one downline member rank up',
              detail: 'Coaching a Bronze member to Silver adds ~2 000 GV to your leg and multiplies your income',
            },
            {
              icon: '♻️', action: 'Set up or review your autoship',
              detail: 'Consistent personal orders ensure you never miss PV requirements for your rank',
            },
          ].filter(Boolean).map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 22, minWidth: 32, textAlign: 'center' }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)' }}>{item.action}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', padding: '0 16px 24px' }}>
          Income projections are estimates based on binary plan assumptions. Actual results depend on your team's activity, market conditions,
          and Nordic Vitals platform performance. This tool is for planning purposes only — not a guarantee of earnings.
        </div>

      </div>
    </DashboardLayout>
  )
}