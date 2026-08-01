import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getMyChallenges, getChallengeLeaderboard } from '../../api/mlmApi'

const METRICS = {
  new_recruits: { label: 'New Recruits', unit: 'members', icon: '👥' },
  personal_pv:  { label: 'Personal PV',  unit: 'PV',      icon: '📦' },
  group_gv:     { label: 'Group Volume', unit: 'GV',       icon: '🌳' },
  orders:       { label: 'Orders',       unit: 'orders',   icon: '🛍️' },
}

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_EMOJI = { platinum: '💎', gold: '🥇', silver: '🥈', bronze: '🥉', unranked: '⬜' }

function daysLeft(endDate) {
  if (!endDate) return null
  const diff = Math.ceil((new Date(endDate + 'T23:59:59Z') - Date.now()) / 86400000)
  return diff
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function RingProgress({ pct, size = 64, stroke = 6, color = '#c9a84c' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(1, pct / 100))
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={pct >= 100 ? '#4ade80' : color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

function MiniLeaderboard({ challenge }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChallengeLeaderboard(challenge.id).then(data => { setEntries(data.slice(0, 5)); setLoading(false) })
  }, [challenge.id])

  const m = METRICS[challenge.metric] || METRICS.personal_pv

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Top 5</div>
      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--text2)', padding: '8px 0' }}>Loading…</div>
      ) : entries.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text2)', padding: '8px 0' }}>No entries yet — be the first!</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {entries.map((e, i) => (
            <div key={e.member_id} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr 60px', gap: 8, alignItems: 'center',
              padding: '5px 8px', borderRadius: 7,
              background: e.member_id === 'NV-10002' ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
              border: e.member_id === 'NV-10002' ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
            }}>
              <span style={{ fontSize: i < 3 ? 13 : 11, textAlign: 'center', fontWeight: 700, color: 'var(--text2)' }}>
                {i < 3 ? MEDALS[i] : `#${e.rank}`}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: e.member_id === 'NV-10002' ? 700 : 400 }}>
                {e.name} {RANK_EMOJI[e.member_rank] ?? ''}
                {e.member_id === 'NV-10002' && <span style={{ fontSize: 10, color: '#c9a84c', marginLeft: 4 }}>you</span>}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: e.progress_pct >= 100 ? '#4ade80' : 'var(--text2)', textAlign: 'right' }}>
                {e.value.toLocaleString()} <span style={{ fontSize: 10, fontWeight: 400 }}>{m.unit}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChallengeCard({ c, userId }) {
  const [expanded, setExpanded] = useState(false)
  const m = METRICS[c.metric] || METRICS.personal_pv
  const days = daysLeft(c.end_date)
  const pct = c.my_progress_pct ?? 0
  const done = pct >= 100
  const isUpcoming = c.status === 'upcoming'

  return (
    <div style={{
      background: 'var(--card)', border: done ? '1px solid rgba(74,222,128,0.3)' : '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      {done && (
        <div style={{ background: 'rgba(74,222,128,0.1)', borderBottom: '1px solid rgba(74,222,128,0.2)', padding: '6px 20px', fontSize: 12, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
          🎉 Target reached! Claim your prize from support.
        </div>
      )}

      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <RingProgress pct={pct} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {c.prize_icon}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.name}</span>
              {isUpcoming && <span style={{ fontSize: 11, background: '#1e3a5f', color: '#60a5fa', padding: '1px 8px', borderRadius: 10, fontWeight: 700 }}>Upcoming</span>}
              {done && <span style={{ fontSize: 11, background: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '1px 8px', borderRadius: 10, fontWeight: 700 }}>✓ Done</span>}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.5 }}>{c.description}</div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
              <span style={{ color: 'var(--text2)' }}>{m.icon} Target: <strong style={{ color: 'var(--text)' }}>{c.target.toLocaleString()} {m.unit}</strong></span>
              <span style={{ color: 'var(--text2)' }}>🏆 <strong style={{ color: '#c9a84c' }}>{c.prize}</strong></span>
              {!isUpcoming && days !== null && days > 0 && <span style={{ color: days <= 5 ? '#f87171' : 'var(--text2)' }}>⏱ {days}d left</span>}
              {!isUpcoming && days !== null && days <= 0 && <span style={{ color: 'var(--text2)' }}>⏱ Ended {fmtDate(c.end_date)}</span>}
              {isUpcoming && <span style={{ color: 'var(--text2)' }}>📅 Starts {fmtDate(c.start_date)}</span>}
              <span style={{ color: 'var(--text2)' }}>👥 {c.participant_count} participants</span>
            </div>
          </div>
        </div>

        {!isUpcoming && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'My Progress', value: `${c.my_value ?? 0} / ${c.target}`, sub: `${m.unit}`, color: done ? '#4ade80' : 'var(--accent)' },
              { label: 'My Rank',  value: c.my_rank ? `#${c.my_rank}` : '—', sub: 'position', color: 'var(--text)' },
              { label: 'Progress', value: `${Math.round(pct)}%`, sub: 'of target', color: done ? '#4ade80' : '#c9a84c' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text2)', marginBottom: 2 }}>{stat.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, lineHeight: 1.2 }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setExpanded(v => !v)} style={{
          marginTop: 14, display: 'block', background: 'transparent', border: 'none',
          color: 'var(--text2)', fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 600,
        }}>
          {expanded ? '▲ Hide leaderboard' : '▼ Show leaderboard'}
        </button>

        {expanded && <MiniLeaderboard challenge={c} />}
      </div>
    </div>
  )
}

export default function MemberChallenges() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')

  useEffect(() => {
    getMyChallenges(user?.id).then(data => { setChallenges(data); setLoading(false) })
  }, [user?.id])

  const active   = challenges.filter(c => c.status === 'active')
  const upcoming = challenges.filter(c => c.status === 'upcoming')
  const visible  = filter === 'active' ? active : upcoming
  const done     = active.filter(c => (c.my_progress_pct ?? 0) >= 100)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>🏅 Challenges & Contests</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text2)' }}>Compete with other members and win prizes for hitting targets</p>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Active', value: active.length, icon: '🟢' },
            { label: 'Upcoming', value: upcoming.length, icon: '📅' },
            { label: 'Completed', value: done.length, icon: '🎉' },
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>{k.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginTop: 4 }}>{k.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text2)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {[['active', '🟢 Active'], ['upcoming', '📅 Upcoming']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: filter === val ? 'var(--gold)' : 'transparent', color: filter === val ? '#1a1200' : 'var(--text2)',
            }}>{lbl} ({val === 'active' ? active.length : upcoming.length})</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)', fontSize: 14 }}>Loading challenges…</div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{filter === 'active' ? '🏁' : '📅'}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              {filter === 'active' ? 'No active challenges' : 'No upcoming challenges'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Check back soon — new contests are announced regularly.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {visible.map(c => <ChallengeCard key={c.id} c={c} userId={user?.id} />)}
          </div>
        )}

        <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, fontSize: 12, color: 'var(--text2)' }}>
          💡 Progress updates nightly. Contact{' '}
          <Link to="/dashboard/support" style={{ color: '#c9a84c' }}>support</Link>{' '}
          if your stats look off or to claim a prize once you've hit your target.
        </div>
      </div>
    </DashboardLayout>
  )
}
