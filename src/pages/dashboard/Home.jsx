import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCommissions, getUserTransactions, getAdminMembers, getDirectDownline } from '../../api/mlmApi'
import { COMMISSIONS } from '../../data/mock'
import DashboardLayout from '../../components/DashboardLayout'

const RANK_ORDER = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']

const RANK_EMOJI = {
  Unranked: '⬜',
  Bronze:   '🥉',
  Silver:   '🥈',
  Gold:     '🥇',
  Platinum: '💎',
}

const RANK_GOALS = {
  Bronze:   { min_pv: 100,  min_left_gv: 500,   min_right_gv: 500,   active_recruits: 1 },
  Silver:   { min_pv: 300,  min_left_gv: 2000,  min_right_gv: 2000,  active_recruits: 3 },
  Gold:     { min_pv: 500,  min_left_gv: 5000,  min_right_gv: 5000,  active_recruits: 5 },
  Platinum: { min_pv: 1000, min_left_gv: 15000, min_right_gv: 15000, active_recruits: 10 },
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function currentYearMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function buildActivityFeed(commissions, transactions) {
  const items = []
  const now = new Date()

  function relativeTime(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const diffMs = now - d
    const diffH = Math.floor(diffMs / 3_600_000)
    const diffD = Math.floor(diffMs / 86_400_000)
    if (diffH < 1) return 'just now'
    if (diffH < 24) return `${diffH}h ago`
    if (diffD === 1) return '1d ago'
    return `${diffD}d ago`
  }

  commissions.slice(0, 6).forEach(c => {
    const color = c.type?.toLowerCase().includes('pairing') ? 'var(--gold)'
      : c.type?.toLowerCase().includes('sponsor') ? 'var(--green-ok)' : '#c0c8d8'
    items.push({ text: `${c.type} ${c.amount?.toLocaleString()} MLMT${c.from && c.from !== '—' ? ` — from ${c.from}` : ''}`, time: relativeTime(c.date), color })
  })
  transactions.slice(0, 3).forEach(tx => {
    if (tx.event_type === 'withdrawal') {
      items.push({ text: `Withdrawal ${tx.amount?.toLocaleString()} MLMT processed`, time: relativeTime(tx.created_at || tx.date), color: '#64748b' })
    }
  })
  items.sort((a, b) => {
    const rank = t => t === 'just now' ? 0 : t.endsWith('h ago') ? parseInt(t) : parseInt(t) * 24
    return rank(a.time) - rank(b.time)
  })
  return items.slice(0, 6)
}

export default function Home() {
  const { user } = useAuth()
  const [commissions, setCommissions] = useState(COMMISSIONS)
  const [transactions, setTransactions] = useState([])
  const [availableBalance, setAvailableBalance] = useState(null)
  const [teamSize, setTeamSize] = useState(null)
  const [activeRecruits, setActiveRecruits] = useState(null)

  useEffect(() => {
    const uid = user?.userId || user?.memberId || 'NV-10042'
    getCommissions()
      .then(d => { if (d?.commissions?.length) setCommissions(d.commissions) })
      .catch(() => {})
    getUserTransactions(user?.memberId || 'NV-10042')
      .then(d => {
        const txs = d?.transactions || []
        setTransactions(txs)
        if (txs.length > 0 && txs[0].balance !== undefined) setAvailableBalance(txs[0].balance)
      })
      .catch(() => {})
    getAdminMembers()
      .then(d => { if (d?.members?.length) setTeamSize(d.members.length) })
      .catch(() => {})
    getDirectDownline(uid)
      .then(d => {
        const recruits = d?.recruits || []
        setActiveRecruits(recruits.filter(m => m.status === 'Active').length)
      })
      .catch(() => {})
  }, [user])

  const pv      = user?.pv      ?? 320
  const leftGV  = user?.leftGV  ?? 1840
  const rightGV = user?.rightGV ?? 1210
  const rank    = user?.rank    ?? 'Silver'

  const nextRankIndex = RANK_ORDER.indexOf(rank) + 1
  const nextRank = nextRankIndex < RANK_ORDER.length ? RANK_ORDER[nextRankIndex] : null
  const goals = nextRank ? RANK_GOALS[nextRank] : null

  const ym = currentYearMonth()
  const thisMonthEarnings = commissions
    .filter(c => c.date && c.date.startsWith(ym))
    .reduce((s, c) => s + (c.amount || 0), 0)

  const displayBalance = availableBalance ?? 1150
  const displayTeamSize = teamSize ?? 47

  const activityFeed = buildActivityFeed(commissions, transactions)

  const statCards = [
    {
      label: "This Month's Earnings",
      value: `${thisMonthEarnings.toLocaleString()} MLMT`,
      sub: 'Current month · all types',
      subColor: 'var(--green-ok)',
    },
    {
      label: 'Available Balance',
      value: `${displayBalance.toLocaleString()} MLMT`,
      sub: 'Ready to withdraw',
      subColor: null,
    },
    {
      label: 'Team Size',
      value: displayTeamSize.toString(),
      sub: teamSize ? 'Live member count' : '↑ 3 this week',
      subColor: 'var(--green-ok)',
    },
    {
      label: 'Personal Volume',
      value: `${pv.toLocaleString()} PV`,
      sub: goals ? `Goal: ${goals.min_pv.toLocaleString()} PV` : 'Max rank reached',
      subColor: null,
    },
    {
      label: 'Left Leg GV',
      value: leftGV.toLocaleString(),
      sub: 'Blue leg',
      subColor: '#3b82f6',
    },
    {
      label: 'Right Leg GV',
      value: rightGV.toLocaleString(),
      sub: 'Green leg',
      subColor: 'var(--green-ok)',
    },
  ]

  const rankBars = goals
    ? [
        { label: 'Personal Volume', current: pv,                     goal: goals.min_pv,          unit: 'PV' },
        { label: 'Active Recruits', current: activeRecruits ?? 3,     goal: goals.active_recruits, unit: '' },
        { label: 'Left Leg Volume', current: leftGV,                  goal: goals.min_left_gv,     unit: '' },
      ]
    : []

  const recentCommissions = commissions.slice(0, 8)

  return (
    <DashboardLayout>
      {/* Page title */}
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '24px' }}>
        {greeting()}, {user?.name?.split(' ')[0] ?? 'Lars'} 👋
      </h1>

      {/* 6 stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="label">{card.label}</div>
            <div className="value">{card.value}</div>
            <div className="sub" style={card.subColor ? { color: card.subColor } : {}}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', alignItems: 'flex-start' }}>

        {/* LEFT: Recent Commissions */}
        <div style={{ flex: 2, background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)' }}>Recent Commissions</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>From</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentCommissions.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{c.date}</td>
                  <td style={{ fontSize: '13px' }}>{c.type}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text2)' }}>{c.from}</td>
                  <td style={{ fontWeight: 600, color: 'var(--cream)' }}>{c.amount.toLocaleString()} MLMT</td>
                  <td>
                    <span className={`badge ${c.status === 'Paid' ? 'badge-green' : 'badge-yellow'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT: Rank Progress */}
        <div className="card" style={{ flex: 1 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)', marginBottom: '16px' }}>Rank Progress</h2>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#c0c8d8' }}>
              {RANK_EMOJI[rank] ?? '★'} {rank.toUpperCase()}
            </span>
          </div>
          {nextRank ? (
            <div style={{ fontSize: '14px', color: 'var(--gold)', marginBottom: '20px', fontWeight: 600 }}>
              → {nextRank.toUpperCase()}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--green-ok)', marginBottom: '20px', fontWeight: 600 }}>
              ✓ Maximum rank reached
            </div>
          )}

          {rankBars.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              {rankBars.map((bar) => {
                const pct = Math.min(100, Math.round((bar.current / bar.goal) * 100))
                return (
                  <div key={bar.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{bar.label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--cream)', fontWeight: 600 }}>
                        {bar.current.toLocaleString()} / {bar.goal.toLocaleString()}{bar.unit ? ` ${bar.unit}` : ''}
                      </span>
                    </div>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text2)', marginTop: '3px' }}>
                      {pct}%
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ fontSize: '12px', color: 'var(--text2)', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            {nextRank ? 'Est. rank-up: ~18 days at current pace 📈' : '🏆 Top performer'}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)', marginBottom: '18px' }}>Recent Activity</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {activityFeed.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 0',
                borderBottom: i < activityFeed.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: item.color,
                flexShrink: 0,
              }} />
              <span style={{ flex: 1, fontSize: '14px', color: 'var(--text)' }}>{item.text}</span>
              <span style={{ fontSize: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
