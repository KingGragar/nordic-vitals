import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getLeaderboard } from '../../api/mlmApi'
import DashboardLayout from '../../components/DashboardLayout'

const RANK_EMOJI = { Platinum: '💎', Gold: '🥇', Silver: '🥈', Bronze: '🥉', Unranked: '⬜' }
const MEDALS = ['🥇', '🥈', '🥉']
const PERIODS = [
  { value: 'monthly',   label: 'This Month' },
  { value: 'quarterly', label: 'This Quarter' },
  { value: 'alltime',   label: 'All Time' },
]
const TABS = ['Top Earners', 'Top Recruiters', 'Network Leaders']

function ChangeChip({ change }) {
  if (change === 0) return <span style={{ fontSize: '11px', color: 'var(--text2)' }}>—</span>
  const up = change > 0
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 700,
      color: up ? '#22c55e' : '#ef4444',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
    }}>
      {up ? '▲' : '▼'} {Math.abs(change)}
    </span>
  )
}

function Row({ pos, name, rank, sub, subLabel, isSelf, change }) {
  const medal = pos <= 3 ? MEDALS[pos - 1] : null
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1fr auto 60px',
      alignItems: 'center',
      gap: '12px',
      padding: '13px 16px',
      borderRadius: '10px',
      background: isSelf ? '#c9a84c14' : pos % 2 === 0 ? 'var(--navy3)' : 'transparent',
      border: isSelf ? '1px solid #c9a84c55' : '1px solid transparent',
      transition: 'background 0.15s',
    }}>
      {/* Position */}
      <div style={{
        textAlign: 'center',
        fontSize: medal ? '20px' : '14px',
        fontWeight: 700,
        color: medal ? undefined : 'var(--text2)',
        lineHeight: 1,
      }}>
        {medal ?? `#${pos}`}
      </div>

      {/* Name + rank */}
      <div>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: isSelf ? '#c9a84c' : 'var(--cream)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          {name}
          {isSelf && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#c9a84c',
              background: '#c9a84c22',
              border: '1px solid #c9a84c55',
              borderRadius: '4px',
              padding: '1px 5px',
              letterSpacing: '0.05em',
            }}>YOU</span>
          )}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>
          {RANK_EMOJI[rank] ?? '⬜'} {rank}
        </div>
      </div>

      {/* Metric */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)' }}>{sub}</div>
        <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '1px' }}>{subLabel}</div>
      </div>

      {/* Change */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {change !== undefined ? <ChangeChip change={change} /> : null}
      </div>
    </div>
  )
}

function YourselfStatCard({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--navy2)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '18px 20px',
      flex: '1 1 150px',
      minWidth: 0,
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cream)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('monthly')
  const [tab, setTab] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getLeaderboard({ period })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const myId = user?.memberId

  function myPosition(rows, idKey = 'user_id') {
    const idx = rows.findIndex(r => r[idKey] === myId)
    return idx >= 0 ? idx + 1 : null
  }

  const earners     = data?.earners    || []
  const recruiters  = data?.recruiters || []
  const network     = data?.network    || []

  const myEarnerPos    = myPosition(earners)
  const myRecruiterPos = myPosition(recruiters)
  const myNetworkPos   = myPosition(network)

  const myEarner   = earners.find(r => r.user_id === myId)
  const myRecruit  = recruiters.find(r => r.user_id === myId)
  const myNetwork  = network.find(r => r.user_id === myId)

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>
          Leaderboard
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text2)' }}>
          Where you stand in the Nordic Vitals network
        </p>
      </div>

      {/* Period selector */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap',
        marginBottom: '20px',
      }}>
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              border: period === p.value ? '1px solid #c9a84c' : '1px solid var(--border)',
              background: period === p.value ? '#c9a84c22' : 'var(--navy2)',
              color: period === p.value ? '#c9a84c' : 'var(--text2)',
              fontSize: '12px',
              fontWeight: period === p.value ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Your rank snapshot */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <YourselfStatCard
          label="Earner Rank"
          value={myEarnerPos ? `#${myEarnerPos}` : '—'}
          sub={myEarner ? `${myEarner.total_mlmt.toLocaleString()} MLMT` : undefined}
        />
        <YourselfStatCard
          label="Recruiter Rank"
          value={myRecruiterPos ? `#${myRecruiterPos}` : '—'}
          sub={myRecruit ? `${myRecruit.recruits} recruit${myRecruit.recruits !== 1 ? 's' : ''} this period` : undefined}
        />
        <YourselfStatCard
          label="Network Rank"
          value={myNetworkPos ? `#${myNetworkPos}` : '—'}
          sub={myNetwork ? `${myNetwork.gv.toLocaleString()} GV` : undefined}
        />
        <YourselfStatCard
          label="Your Rank"
          value={user?.rank ?? '—'}
          sub={`PV: ${user?.pv ?? 0}`}
        />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: '16px',
        gap: '4px',
      }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: tab === i ? '2px solid #c9a84c' : '2px solid transparent',
              color: tab === i ? '#c9a84c' : 'var(--text2)',
              fontSize: '13px',
              fontWeight: tab === i ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto 60px',
        gap: '12px',
        padding: '6px 16px',
        marginBottom: '4px',
      }}>
        <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>
          #
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Member
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>
          {tab === 0 ? 'Earned' : tab === 1 ? 'Recruits' : 'Network GV'}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>
          Chg
        </div>
      </div>

      {/* Rows */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text2)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tab === 0 && earners.map((row, i) => (
            <Row
              key={row.user_id}
              pos={i + 1}
              name={row.name}
              rank={row.rank}
              sub={`${row.total_mlmt.toLocaleString()} MLMT`}
              subLabel="earned"
              isSelf={row.user_id === myId}
              change={row.change}
            />
          ))}
          {tab === 1 && recruiters.map((row, i) => (
            <Row
              key={row.user_id}
              pos={i + 1}
              name={row.name}
              rank={row.rank}
              sub={row.recruits}
              subLabel={row.recruits === 1 ? 'recruit' : 'recruits'}
              isSelf={row.user_id === myId}
              change={row.change}
            />
          ))}
          {tab === 2 && network.map((row, i) => (
            <Row
              key={row.user_id}
              pos={i + 1}
              name={row.name}
              rank={row.rank}
              sub={`${row.gv.toLocaleString()} GV`}
              subLabel={`PV: ${row.pv}`}
              isSelf={row.user_id === myId}
            />
          ))}
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '12px 16px',
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        fontSize: '11px',
        color: 'var(--text2)',
      }}>
        Rankings refresh after each commission run. Live positions load when{' '}
        <code style={{ fontSize: '11px', color: 'var(--cream)', background: 'var(--navy3)', padding: '1px 4px', borderRadius: '3px' }}>
          GET /v1/mlm/leaderboard
        </code>{' '}
        ships on the Arctico backend.
      </div>
    </DashboardLayout>
  )
}
