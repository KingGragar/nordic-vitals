import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberTeamPerformance } from '../../api/mlmApi'

export default function DashTeamPerformance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [sortBy, setSortBy] = useState('volume')

  useEffect(() => {
    setLoading(true)
    getMemberTeamPerformance(period).then(setData).finally(() => setLoading(false))
  }, [period])

  const sorted = !data?.members ? [] : [...data.members].sort((a, b) => {
    if (sortBy === 'volume') return b.volume - a.volume
    if (sortBy === 'orders') return b.orders - a.orders
    if (sortBy === 'recruits') return b.recruits - a.recruits
    return 0
  })

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📊 Team Performance</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Track your team's sales, orders, and recruitment metrics.</div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['week', 'month', 'quarter', 'year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: period === p ? 'var(--gold)' : 'var(--card)', color: period === p ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: period === p ? 700 : 400, textTransform: 'capitalize' }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 22 }}>
            {[
              { label: 'Team Volume', value: '€' + data.teamVolume?.toLocaleString(), color: 'var(--gold)' },
              { label: 'Total Orders', value: data.teamOrders, color: '#60a5fa' },
              { label: 'New Recruits', value: data.newRecruits, color: '#86efac' },
              { label: 'Active Members', value: data.activeMembers + '/' + data.totalMembers, color: '#a78bfa' },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Team Members</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['volume', 'orders', 'recruits'].map(s => (
                <button key={s} onClick={() => setSortBy(s)} style={{ padding: '5px 12px', borderRadius: 16, border: '1px solid var(--border)', background: sortBy === s ? 'var(--gold)' : 'transparent', color: sortBy === s ? '#000' : 'var(--text2)', fontSize: 12, cursor: 'pointer', fontWeight: sortBy === s ? 700 : 400, textTransform: 'capitalize' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading…</div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No team data available.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Member', 'Rank', 'Volume', 'Orders', 'Recruits', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: h === '#' || h === 'Volume' || h === 'Orders' || h === 'Recruits' ? 'center' : 'left', color: 'var(--text2)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>Joined {m.joinedAt}</div>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--gold)', fontWeight: 600 }}>{m.rank}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>€{m.volume?.toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{m.orders}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{m.recruits}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: m.active ? '#052e16' : '#1e2030', color: m.active ? '#86efac' : '#94a3b8' }}>
                          {m.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
