import { useState, useEffect } from 'react'
import { getPlanConfig } from '../../api/mlmApi'

const PAIRING_RATE = 0.10   // 10% binary pairing on weaker leg

const BREAKAWAY_GROUP_RATES = [
  { min_gpv: 0,     rate: 0.20 },
  { min_gpv: 2000,  rate: 0.25 },
  { min_gpv: 5000,  rate: 0.30 },
  { min_gpv: 15000, rate: 0.35 },
  { min_gpv: 40000, rate: 0.40 },
]
const BREAKAWAY_OVERRIDE_RATE = 0.05  // 5% override on broken-away leg GV

function Slider({ label, value, min, max, step = 50, onChange, suffix = ' PV' }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</label>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
          {value.toLocaleString()}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  )
}

function ResultCard({ label, value, highlight }) {
  return (
    <div style={{
      background: highlight ? 'var(--accent)' : 'var(--navy3)',
      borderRadius: 10,
      padding: '14px 18px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: highlight ? 'rgba(255,255,255,0.8)' : 'var(--text2)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: highlight ? 22 : 18, fontWeight: 700, color: highlight ? '#fff' : 'var(--text1)' }}>
        {typeof value === 'string' ? value : value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' MLMT'}
      </div>
    </div>
  )
}

function BarRow({ label, value, max, color = 'var(--accent)' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--text1)' }}>{value.toLocaleString(undefined, { maximumFractionDigits: 0 })} MLMT</span>
      </div>
      <div style={{ height: 8, background: 'var(--navy3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

// ── Binary Calculator ────────────────────────────────────────────────
function BinaryCalc({ planConfig }) {
  const [pv, setPv] = useState(300)
  const [leftGv, setLeftGv] = useState(3000)
  const [rightGv, setRightGv] = useState(2000)

  const ranks = planConfig?.ranks || []
  const currentRank = [...ranks].reverse().find(r =>
    pv >= r.min_pv && leftGv >= r.min_left_gv && rightGv >= r.min_right_gv
  ) || ranks[0] || { rank: 'Unranked', pairing_cap: 100, sponsor_bonus: 5 }

  const weakerLeg = Math.min(leftGv, rightGv)
  const grossPairing = weakerLeg * PAIRING_RATE
  const pairingBonus = Math.min(grossPairing, currentRank.pairing_cap || 100)
  const sponsorBonus = pv * ((currentRank.sponsor_bonus || 5) / 100)
  const total = pairingBonus + sponsorBonus
  const maxBar = Math.max(total, currentRank.pairing_cap || 100) * 1.2 || 1

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Inputs */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text1)' }}>Your Activity</h3>
          <Slider label="Personal PV" value={pv} min={0} max={1000} step={10} onChange={setPv} />
          <Slider label="Left Leg Volume" value={leftGv} min={0} max={20000} step={500} onChange={setLeftGv} suffix=" GV" />
          <Slider label="Right Leg Volume" value={rightGv} min={0} max={20000} step={500} onChange={setRightGv} suffix=" GV" />
          <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--navy3)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
            <strong style={{ color: 'var(--text1)' }}>How it works:</strong> You earn {Math.round(PAIRING_RATE * 100)}% of your
            weaker leg volume each cycle, capped by your rank's pairing cap.
            Plus a sponsor bonus on your personal PV.
          </div>
        </div>

        {/* Results */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text1)' }}>Estimated Earnings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            <ResultCard label="Current Rank" value={currentRank.rank} />
            <ResultCard label="Weekly Total" value={total} highlight />
          </div>
          <BarRow label={`Pairing Bonus (${Math.round(PAIRING_RATE * 100)}% of ${weakerLeg.toLocaleString()} GV, cap ${currentRank.pairing_cap?.toLocaleString()})`} value={pairingBonus} max={maxBar} />
          <BarRow label={`Sponsor Bonus (${currentRank.sponsor_bonus}% of ${pv} PV)`} value={sponsorBonus} max={maxBar} color="#10b981" />
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--navy3)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Rank thresholds (Binary)</div>
            {ranks.map(r => (
              <div key={r.rank} style={{
                display: 'flex', justifyContent: 'space-between', fontSize: 11,
                color: r.rank === currentRank.rank ? 'var(--accent)' : 'var(--text3)',
                fontWeight: r.rank === currentRank.rank ? 700 : 400,
                padding: '2px 0',
              }}>
                <span>{r.rank}</span>
                <span>{r.min_pv} PV · {r.min_left_gv?.toLocaleString()}/{r.min_right_gv?.toLocaleString()} GV</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Unilevel Calculator ───────────────────────────────────────────────
function UniCalc({ planConfig }) {
  const [pv, setPv] = useState(300)
  const [lvls, setLvls] = useState([2000, 1500, 1000, 500, 250])
  const levels = planConfig?.levels || [
    { level: 'L1', rate: 5 }, { level: 'L2', rate: 3 }, { level: 'L3', rate: 2 },
    { level: 'L4', rate: 1 }, { level: 'L5', rate: 0.5 },
  ]

  const commissions = levels.map((l, i) => ({
    ...l,
    pv: lvls[i] || 0,
    amount: (lvls[i] || 0) * (l.rate / 100),
  }))
  const total = commissions.reduce((s, c) => s + c.amount, 0)
  const maxBar = Math.max(...commissions.map(c => c.amount), 1) * 1.2

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text1)' }}>Downline Volume by Level</h3>
          <Slider label="Personal PV" value={pv} min={0} max={1000} step={10} onChange={setPv} />
          {levels.map((l, i) => (
            <Slider
              key={l.level}
              label={`${l.level} Downline Volume (${l.rate}%)`}
              value={lvls[i] || 0}
              min={0}
              max={10000}
              step={100}
              onChange={v => setLvls(prev => { const n = [...prev]; n[i] = v; return n })}
              suffix=" GV"
            />
          ))}
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text1)' }}>Commission Breakdown</h3>
          <div style={{ marginBottom: 18 }}>
            <ResultCard label="Monthly Total" value={total} highlight />
          </div>
          {commissions.map(c => (
            <BarRow key={c.level} label={`${c.level}: ${c.rate}% × ${c.pv.toLocaleString()} GV`} value={c.amount} max={maxBar} />
          ))}
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--navy3)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
            <strong style={{ color: 'var(--text1)' }}>How it works:</strong> You earn a percentage of every member's PV in your
            first 5 levels, every commission run.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Breakaway Calculator ──────────────────────────────────────────────
function BreakawayCalc() {
  const [pv, setPv] = useState(500)
  const [groupGv, setGroupGv] = useState(8000)
  const [brokenLegs, setBrokenLegs] = useState(2)
  const [legGv, setLegGv] = useState(5000)

  const groupRate = [...BREAKAWAY_GROUP_RATES].reverse().find(r => groupGv >= r.min_gpv) || BREAKAWAY_GROUP_RATES[0]
  const groupComm = groupGv * groupRate.rate
  const overrideComm = brokenLegs * legGv * BREAKAWAY_OVERRIDE_RATE
  const total = groupComm + overrideComm

  const maxBar = Math.max(groupComm, overrideComm, 1) * 1.2

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text1)' }}>Your Group Activity</h3>
          <Slider label="Personal PV" value={pv} min={0} max={2000} step={50} onChange={setPv} />
          <Slider label="Personal Group Volume" value={groupGv} min={0} max={60000} step={1000} onChange={setGroupGv} suffix=" GV" />
          <Slider label="Broken-away Legs (count)" value={brokenLegs} min={0} max={10} step={1} onChange={setBrokenLegs} suffix="" />
          <Slider label="Avg Volume per Broken Leg" value={legGv} min={0} max={30000} step={500} onChange={setLegGv} suffix=" GV" />
          <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--navy3)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
            <strong style={{ color: 'var(--text1)' }}>How it works:</strong> You earn {Math.round(groupRate.rate * 100)}% of your personal group volume,
            plus {Math.round(BREAKAWAY_OVERRIDE_RATE * 100)}% override on each leg that has "broken away" beyond your group.
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text1)' }}>Commission Breakdown</h3>
          <div style={{ marginBottom: 18 }}>
            <ResultCard label="Monthly Total" value={total} highlight />
          </div>
          <BarRow
            label={`Group Commission (${Math.round(groupRate.rate * 100)}% of ${groupGv.toLocaleString()} GV)`}
            value={groupComm}
            max={maxBar}
          />
          <BarRow
            label={`Override (${Math.round(BREAKAWAY_OVERRIDE_RATE * 100)}% × ${brokenLegs} leg${brokenLegs !== 1 ? 's' : ''} × ${legGv.toLocaleString()} GV)`}
            value={overrideComm}
            max={maxBar}
            color="#10b981"
          />
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--navy3)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Group rate by group volume</div>
            {BREAKAWAY_GROUP_RATES.map(r => (
              <div key={r.min_gpv} style={{
                display: 'flex', justifyContent: 'space-between', fontSize: 11,
                color: r === groupRate ? 'var(--accent)' : 'var(--text3)',
                fontWeight: r === groupRate ? 700 : 400,
                padding: '2px 0',
              }}>
                <span>≥ {r.min_gpv.toLocaleString()} GV</span>
                <span>{Math.round(r.rate * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────
const PLANS = ['Binary', 'Unilevel', 'Breakaway']

export default function Calculator() {
  const [plan, setPlan] = useState('Binary')
  const [planConfig, setPlanConfig] = useState(null)

  useEffect(() => {
    getPlanConfig().then(cfg => setPlanConfig(cfg)).catch(() => {})
  }, [])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)', margin: 0 }}>🧮 Commission Calculator</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
          Estimate your weekly/monthly earnings based on your network and activity. Results are illustrative.
        </p>
      </div>

      {/* Plan tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {PLANS.map(p => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              background: plan === p ? 'var(--accent)' : 'var(--navy2)',
              color: plan === p ? '#fff' : 'var(--text2)',
              transition: 'background 0.2s',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Calculator panel */}
      <div style={{
        background: 'var(--navy2)',
        borderRadius: 14,
        padding: '28px 24px',
        border: '1px solid var(--navy3)',
      }}>
        {plan === 'Binary'    && <BinaryCalc planConfig={planConfig} />}
        {plan === 'Unilevel'  && <UniCalc planConfig={planConfig} />}
        {plan === 'Breakaway' && <BreakawayCalc />}
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 16, textAlign: 'center' }}>
        Estimates use live plan configuration. Actual payouts are subject to the X-factor cap and commission run results.
        Past performance does not guarantee future earnings.
      </p>
    </div>
  )
}
