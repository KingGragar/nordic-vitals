import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberWellnessChallenges, joinWellnessChallenge } from '../../api/mlmApi'

const CAT_COLOR = { Hydration:'#67e8f9', Peptides:'#a5b4fc', Sleep:'#818cf8', Mindfulness:'#f9a8d4', Fitness:'#86efac', Recovery:'#fbbf24' }

export default function DashWellnessChallenges() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('active')
  const [joiningId, setJoiningId] = useState(null)

  useEffect(() => { getMemberWellnessChallenges().then(setData).finally(() => setLoading(false)) }, [])

  async function handleJoin(id) {
    setJoiningId(id)
    await joinWellnessChallenge(id)
    setData(prev => ({
      ...prev,
      upcoming: prev.upcoming.filter(c => c.id !== id),
      active: [...prev.active, { ...prev.upcoming.find(c => c.id === id), day: 0, my_pct: 0 }],
    }))
    setJoiningId(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign:'center', padding:80, color:'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🏅 Wellness Challenges</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Join community challenges to build healthy habits and earn XP.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Completed',      value: data.my_stats.completed,  color: '#86efac' },
            { label: 'In Progress',    value: data.my_stats.in_progress, color: '#fbbf24' },
            { label: 'Streak',         value: `${data.my_stats.streak} days`, color: '#a5b4fc' },
            { label: 'XP Earned',      value: data.my_stats.xp_earned.toLocaleString(), color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['active','upcoming','completed'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${tab === t ? '#a5b4fc' : 'var(--border)'}`,
              background: tab === t ? '#a5b4fc22' : 'transparent',
              color: tab === t ? '#a5b4fc' : 'var(--text2)', textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>

        {tab === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.active.map(c => (
              <div key={c.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{c.title}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ background: (CAT_COLOR[c.category]||'#a5b4fc')+'22', color: CAT_COLOR[c.category]||'#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{c.category}</span>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>Day {c.day}/{c.days} · Goal: {c.goal}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: 18 }}>{c.my_pct}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>✨ {c.xp} XP on completion</div>
                  </div>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 6, height: 8, marginBottom: 8 }}>
                  <div style={{ background: CAT_COLOR[c.category]||'#a5b4fc', width: `${c.my_pct}%`, height: '100%', borderRadius: 6, transition: 'width .4s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
                  <span>🏅 {c.prize}</span>
                  <span>👥 {c.participants.toLocaleString()} participants</span>
                </div>
              </div>
            ))}
            {data.active.length === 0 && <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No active challenges. Check upcoming ones!</div>}
          </div>
        )}

        {tab === 'upcoming' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.upcoming.map(c => (
              <div key={c.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{c.title}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: (CAT_COLOR[c.category]||'#a5b4fc')+'22', color: CAT_COLOR[c.category]||'#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{c.category}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{c.days} days · Starts {c.starts}</span>
                    <span style={{ fontSize: 12, color: '#fbbf24' }}>✨ {c.xp} XP · 🏅 {c.prize}</span>
                  </div>
                </div>
                <button onClick={() => handleJoin(c.id)} disabled={joiningId === c.id} style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none', background: '#a5b4fc', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{joiningId === c.id ? 'Joining…' : 'Join'}</button>
              </div>
            ))}
            {data.upcoming.length === 0 && <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No upcoming challenges right now.</div>}
          </div>
        )}

        {tab === 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.completed.map(c => (
              <div key={c.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.category} · Completed {c.completed_at}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#86efac' }}>+{c.xp_earned} XP</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>Ranked #{c.rank.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
