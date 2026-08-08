import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberTeamLeaderboard } from '../../api/mlmApi'

const RANK_COLOR = { Diamond: '#67e8f9', Platinum: '#c4b5fd', Gold: '#fbbf24', Silver: '#d1d5db', Bronze: '#cd7f32', Starter: '#9ca3af' }
const TREND_ICON = { up: '▲', down: '▼', stable: '●' }
const TREND_COLOR = { up: '#86efac', down: '#f87171', stable: '#9ca3af' }

const MEDALS = ['🥇','🥈','🥉']

export default function DashTeamLeaderboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [metric, setMetric] = useState('volume')

  useEffect(() => {
    setLoading(true)
    getMemberTeamLeaderboard(period, metric).then(setData).finally(() => setLoading(false))
  }, [period, metric])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Team Leaderboard</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>See how you rank against your team — updated daily</p>
        </div>

        {/* My rank highlight */}
        <div style={{ ...card, background: 'linear-gradient(135deg, rgba(99,102,241,.2), rgba(168,85,247,.1))', marginBottom: 22, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 40 }}>🏆</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your Current Rank</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#818cf8' }}>#{loading ? '…' : data?.myRank}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>out of {loading ? '…' : data?.totalParticipants} participants</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['week','month','quarter','year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: period === p ? '#6366f1' : 'var(--card)', color: period === p ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{p}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            {['volume','commissions','recruits'].map(m => (
              <button key={m} onClick={() => setMetric(m)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: metric === m ? '#818cf8' : 'var(--card)', color: metric === m ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{m}</button>
            ))}
          </div>
        </div>

        {/* Leaderboard table */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#','Member','Rank','Volume','Commissions','Recruits','Trend'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.entries || []).map((e, i) => (
                  <tr key={e.rank} style={{ borderBottom: '1px solid var(--border)', background: e.isMe ? 'rgba(99,102,241,.1)' : i % 2 === 0 ? 'transparent' : 'var(--row-alt, rgba(0,0,0,.02))' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 16 }}>
                      {e.rank <= 3 ? MEDALS[e.rank - 1] : <span style={{ color: 'var(--text-muted)' }}>#{e.rank}</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: e.isMe ? 700 : 500 }}>{e.name}</span>
                      {e.isMe && <span style={{ fontSize: 11, background: 'rgba(99,102,241,.3)', color: '#818cf8', borderRadius: 4, padding: '1px 6px', marginLeft: 6 }}>You</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ color: RANK_COLOR[e.rankTitle] ?? 'var(--text)', fontWeight: 600, fontSize: 13 }}>{e.rankTitle}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: metric === 'volume' ? 700 : 400, color: metric === 'volume' ? '#86efac' : 'var(--text)' }}>
                      €{e.volume.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: metric === 'commissions' ? 700 : 400, color: metric === 'commissions' ? '#fbbf24' : 'var(--text)' }}>
                      €{e.commissions.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: metric === 'recruits' ? 700 : 400, color: metric === 'recruits' ? '#93c5fd' : 'var(--text)' }}>
                      {e.recruits}
                    </td>
                    <td style={{ padding: '12px 14px', color: TREND_COLOR[e.trend], fontWeight: 600 }}>
                      {TREND_ICON[e.trend]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && data && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
            Showing top {data.entries.length} of {data.totalParticipants} participants · {data.period} · sorted by {data.metric}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
