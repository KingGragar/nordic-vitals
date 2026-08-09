import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberReferralContests } from '../../api/mlmApi'

const PRIZE_COLOR = { '1st': '#fbbf24', '2nd': '#d1d5db', '3rd': '#cd7f32' }
const MEDALS = { '1st': '🥇', '2nd': '🥈', '3rd': '🥉' }
const ST_COLOR = { active: '#86efac', upcoming: '#93c5fd', ended: '#9ca3af' }

export default function DashReferralContest() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')

  useEffect(() => {
    setLoading(true)
    getMemberReferralContests().then(setData).finally(() => setLoading(false))
  }, [])

  const contests = (data?.contests||[]).filter(c => c.status === tab)

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  function timeLeft(endDate) {
    const diff = new Date(endDate) - new Date()
    if (diff <= 0) return 'Ended'
    const d = Math.floor(diff/86400000)
    const h = Math.floor((diff%86400000)/3600000)
    if (d > 0) return `${d}d ${h}h left`
    return `${h}h left`
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Referral Contests</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Compete for prizes by referring new members — check your standing and prizes</p>
        </div>

        {/* My stats */}
        <div style={{ ...card, background:'linear-gradient(135deg,rgba(99,102,241,.15),rgba(168,85,247,.1))', marginBottom:22, display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontSize:36 }}>🏆</div>
          <div>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>Your Active Contest Rank</div>
            <div style={{ fontSize:30, fontWeight:800, color:'#818cf8' }}>#{loading?'…':data?.myActiveRank||'—'}</div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:20, flexWrap:'wrap' }}>
            {[
              { label:'Total Referrals (this month)', value: data?.monthlyReferrals||0, color:'#93c5fd' },
              { label:'Prizes Won (all time)', value: data?.totalPrizesWon||0, color:'#fbbf24' },
            ].map(k => (
              <div key={k.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:700, color:k.color }}>{loading?'…':k.value}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:18 }}>
          {['active','upcoming','ended'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'7px 18px', borderRadius:7, border:'1px solid var(--border)', background: tab===t ? '#6366f1' : 'var(--card)', color: tab===t ? '#fff' : 'var(--text)', cursor:'pointer', fontSize:13, textTransform:'capitalize' }}>{t}</button>
          ))}
        </div>

        {loading ? <div style={{ ...card, textAlign:'center', color:'var(--text-muted)' }}>Loading…</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {contests.map(contest => (
              <div key={contest.id} style={card}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:14 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:17 }}>{contest.name}</span>
                      <span style={{ fontSize:12, color:ST_COLOR[contest.status], background:'rgba(0,0,0,.2)', borderRadius:5, padding:'2px 8px', textTransform:'capitalize' }}>{contest.status}</span>
                    </div>
                    <div style={{ fontSize:13, color:'var(--text-muted)' }}>{new Date(contest.startDate).toLocaleDateString()} – {new Date(contest.endDate).toLocaleDateString()}</div>
                    {contest.status==='active' && <div style={{ fontSize:13, color:'#fbbf24', marginTop:2, fontWeight:600 }}>{timeLeft(contest.endDate)}</div>}
                    <p style={{ margin:'8px 0 0', fontSize:13, color:'var(--text-muted)' }}>{contest.description}</p>
                  </div>
                  {contest.status==='active' && (
                    <div style={{ textAlign:'center', background:'rgba(99,102,241,.15)', borderRadius:10, padding:'10px 18px' }}>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>Your Rank</div>
                      <div style={{ fontSize:28, fontWeight:800, color:'#818cf8' }}>#{contest.myRank}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{contest.myReferrals} referrals</div>
                    </div>
                  )}
                </div>

                {/* Prizes */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Prizes</div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {contest.prizes.map(p => (
                      <div key={p.place} style={{ background:`${PRIZE_COLOR[p.place]||'#6366f1'}22`, border:`1px solid ${PRIZE_COLOR[p.place]||'#6366f1'}44`, borderRadius:8, padding:'8px 14px', minWidth:100 }}>
                        <div style={{ fontSize:18 }}>{MEDALS[p.place]||p.place}</div>
                        <div style={{ fontWeight:700, fontSize:13, color:PRIZE_COLOR[p.place]||'#818cf8' }}>{p.prize}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>needs {p.minReferrals} refs</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leaderboard */}
                <div>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Leaderboard</div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid var(--border)' }}>
                          {['#','Member','Referrals','Status'].map(h => <th key={h} style={{ padding:'7px 12px', textAlign:'left', color:'var(--text-muted)', fontWeight:600 }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {(contest.leaderboard||[]).map((entry, i) => (
                          <tr key={entry.rank} style={{ borderBottom:'1px solid var(--border)', background: entry.isMe ? 'rgba(99,102,241,.1)' : 'transparent' }}>
                            <td style={{ padding:'8px 12px', fontWeight:700 }}>{MEDALS[['1st','2nd','3rd'][i]]||`#${entry.rank}`}</td>
                            <td style={{ padding:'8px 12px' }}>
                              <span style={{ fontWeight: entry.isMe?700:400 }}>{entry.name}</span>
                              {entry.isMe && <span style={{ fontSize:11, background:'rgba(99,102,241,.3)', color:'#818cf8', borderRadius:4, padding:'1px 6px', marginLeft:6 }}>You</span>}
                            </td>
                            <td style={{ padding:'8px 12px', fontWeight:600, color:'#93c5fd' }}>{entry.referrals}</td>
                            <td style={{ padding:'8px 12px', color: PRIZE_COLOR[['1st','2nd','3rd'][i]]||'var(--text-muted)', fontSize:12 }}>
                              {i < contest.prizes.length ? `${contest.prizes[i].prize}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
            {contests.length === 0 && (
              <div style={{ ...card, textAlign:'center', color:'var(--text-muted)', padding:40 }}>
                No {tab} referral contests at the moment.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
