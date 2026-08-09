import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberWellnessGoals, updateMemberWellnessGoal } from '../../api/mlmApi'

const CAT_ICONS = { activity: '🏃', weight: '⚖️', sleep: '😴', nutrition: '🥗', health: '❤️' }
const TREND_ICONS = { up: '↑', down: '↓', stable: '→' }
const TREND_COLORS = { up: '#86efac', down: '#fca5a5', stable: '#fbbf24' }

export default function DashWellnessGoals() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getMemberWellnessGoals().then(setData).finally(() => setLoading(false))
  }, [])

  async function saveGoal(id) {
    const val = parseFloat(editVal)
    if (isNaN(val)) return
    setSaving(true)
    await updateMemberWellnessGoal(id, val)
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id !== id) return g
        const newPct = Math.round(Math.min(100, (val / g.target) * 100))
        return { ...g, current: val, pct: newPct }
      }),
    }))
    setEditId(null)
    setSaving(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🎯 Wellness Goals</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Track your personal health targets and log progress.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          <div style={card}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fbbf24' }}>{data.streak}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Day streak</div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#86efac' }}>{data.goalsHit}/{data.goalsTotal}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Goals on track</div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#a5b4fc' }}>{data.weeklyCheckIns.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Weeks logged</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {data.goals.map(g => (
            <div key={g.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{CAT_ICONS[g.category] || '🎯'}</span>
                <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{g.title}</span>
                <span style={{ fontSize: 13, color: TREND_COLORS[g.trend], fontWeight: 700 }}>{TREND_ICONS[g.trend]}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: g.pct >= 90 ? '#86efac' : g.pct >= 60 ? '#fbbf24' : '#fca5a5' }}>{g.pct}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${g.pct}%`, background: g.pct >= 90 ? '#166534' : g.pct >= 60 ? '#d97706' : '#991b1b', borderRadius: 4, transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
                <span>Target: <b style={{ color: 'var(--text)' }}>{g.target} {g.unit}</b></span>
                {editId === g.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="number"
                      value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      style={{ width: 80, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12 }}
                    />
                    <button onClick={() => saveGoal(g.id)} disabled={saving} style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: '#166534', color: '#86efac', fontSize: 11, cursor: 'pointer' }}>✓</button>
                    <button onClick={() => setEditId(null)} style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 11, cursor: 'pointer' }}>✗</button>
                  </div>
                ) : (
                  <button onClick={() => { setEditId(g.id); setEditVal(String(g.current)) }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer' }}>
                    Current: {g.current} {g.unit}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontWeight: 700, marginBottom: 12 }}>Weekly Check-ins</div>
        <div style={{ ...card, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {data.weeklyCheckIns.map(w => (
            <div key={w.week} style={{ textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#a5b4fc' }}>{w.achieved}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{w.week}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>goals hit</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
