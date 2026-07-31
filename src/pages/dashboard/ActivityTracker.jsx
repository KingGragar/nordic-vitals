import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getActivityLog, saveActivityDay, getActivityGoals, saveActivityGoals } from '../../api/mlmApi'

const ACTIVITY_TYPES = [
  { key: 'calls',          label: 'Calls',         icon: '📞', color: '#3b82f6', desc: 'Prospect or follow-up calls made' },
  { key: 'presentations',  label: 'Presentations', icon: '📊', color: '#8b5cf6', desc: 'Product or business presentations' },
  { key: 'followUps',      label: 'Follow-ups',    icon: '🔄', color: '#f59e0b', desc: 'Planned follow-ups completed' },
  { key: 'prospectsAdded', label: 'Prospects',     icon: '🎯', color: '#ec4899', desc: 'New prospects added to pipeline' },
  { key: 'enrollments',    label: 'Enrollments',   icon: '✅', color: '#22c55e', desc: 'New members enrolled' },
  { key: 'shares',         label: 'Shares',        icon: '📣', color: '#c9a84c', desc: 'Social media or referral link shares' },
]

const TODAY = new Date().toISOString().slice(0, 10)

function pad(n) { return String(n).padStart(2, '0') }
function dateLabel(iso) {
  const d = new Date(iso + 'T12:00:00Z')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
function isToday(iso) { return iso === TODAY }
function totalForDay(day) {
  return (day.calls || 0) + (day.presentations || 0) + (day.followUps || 0) +
    (day.prospectsAdded || 0) + (day.enrollments || 0) + (day.shares || 0)
}
function heatColor(value, max) {
  if (!value) return 'var(--border)'
  const intensity = Math.min(value / Math.max(max, 1), 1)
  const alpha = 0.25 + intensity * 0.75
  return `rgba(201,168,76,${alpha.toFixed(2)})`
}

function GoalEditModal({ goals, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...goals })
  function set(key, val) { setDraft(d => ({ ...d, [key]: Math.max(0, Number(val) || 0) })) }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:28, width:'100%', maxWidth:380, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
        <h3 style={{ margin:'0 0 20px', fontSize:16, color:'var(--text)' }}>Daily Goals</h3>
        {ACTIVITY_TYPES.map(t => (
          <label key={t.key} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <span style={{ fontSize:18 }}>{t.icon}</span>
            <span style={{ flex:1, fontSize:13, color:'var(--text)' }}>{t.label}</span>
            <input
              type="number" min="0" max="99" value={draft[t.key] ?? 0}
              onChange={e => set(t.key, e.target.value)}
              style={{ width:60, padding:'4px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', textAlign:'center', fontSize:13 }}
            />
          </label>
        ))}
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text2)', cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={() => onSave(draft)} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'none', background:'var(--gold)', color:'#1a1200', fontWeight:700, cursor:'pointer', fontSize:13 }}>Save Goals</button>
        </div>
      </div>
    </div>
  )
}

export default function ActivityTracker() {
  const { user } = useAuth()
  const [log, setLog] = useState([])
  const [goals, setGoals] = useState({})
  const [todayCounts, setTodayCounts] = useState({ calls:0, presentations:0, followUps:0, prospectsAdded:0, enrollments:0, shares:0 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([getActivityLog(user.userId), getActivityGoals(user.userId)])
      .then(([data, g]) => {
        const sorted = [...data.log].sort((a, b) => b.date.localeCompare(a.date))
        setLog(sorted)
        const today = sorted.find(d => d.date === TODAY)
        if (today) setTodayCounts({ calls: today.calls||0, presentations: today.presentations||0, followUps: today.followUps||0, prospectsAdded: today.prospectsAdded||0, enrollments: today.enrollments||0, shares: today.shares||0 })
        setGoals(g)
      })
      .finally(() => setLoading(false))
  }, [user])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await saveActivityDay(user.userId, TODAY, todayCounts)
      setLog(prev => {
        const idx = prev.findIndex(d => d.date === TODAY)
        if (idx !== -1) { const next = [...prev]; next[idx] = { ...next[idx], ...todayCounts }; return next }
        return [{ date: TODAY, ...todayCounts }, ...prev]
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }, [user, todayCounts])

  const handleGoalSave = useCallback(async (newGoals) => {
    await saveActivityGoals(user.userId, newGoals)
    setGoals(newGoals)
    setShowGoalModal(false)
  }, [user])

  function adjust(key, delta) {
    setTodayCounts(c => ({ ...c, [key]: Math.max(0, (c[key] || 0) + delta) }))
    setSaved(false)
  }

  // Compute streak
  const streak = (() => {
    let count = 0
    const sorted = [...log].sort((a, b) => b.date.localeCompare(a.date))
    for (const d of sorted) {
      if (d.date === TODAY && totalForDay(d) === 0) continue
      if (totalForDay(d) > 0) count++
      else break
    }
    return count
  })()

  // Weekly totals (last 7 days including today)
  const last7 = log.slice(0, 7)
  const weeklyTotals = {}
  ACTIVITY_TYPES.forEach(t => {
    weeklyTotals[t.key] = last7.reduce((sum, d) => sum + (d[t.key] || 0), 0)
  })

  // Monthly totals (last 30 days)
  const last30 = log.slice(0, 30)
  const monthlyTotals = {}
  ACTIVITY_TYPES.forEach(t => {
    monthlyTotals[t.key] = last30.reduce((sum, d) => sum + (d[t.key] || 0), 0)
  })

  // Personal bests
  const bests = {}
  ACTIVITY_TYPES.forEach(t => {
    bests[t.key] = Math.max(0, ...log.map(d => d[t.key] || 0))
  })

  const maxDayTotal = Math.max(1, ...log.map(d => totalForDay(d)))

  return (
    <DashboardLayout>
      <div style={{ padding:'24px 28px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'var(--text)' }}>📅 Daily Activity Tracker</h1>
            <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--text2)' }}>Log your daily MLM activities and build consistent momentum.</p>
          </div>
          <button onClick={() => setShowGoalModal(true)} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text2)', cursor:'pointer', fontSize:13 }}>
            🎯 Set Goals
          </button>
        </div>

        {loading ? (
          <p style={{ color:'var(--text2)', textAlign:'center', padding:'60px 0' }}>Loading…</p>
        ) : (
          <>
            {/* KPI strip */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24 }}>
              {[
                { label:'Streak', value:`${streak} day${streak!==1?'s':''}`, icon:'🔥', sub:'consecutive active days' },
                { label:'This Week', value:Object.values(weeklyTotals).reduce((a,b)=>a+b,0), icon:'📅', sub:'total activities (7d)' },
                { label:'This Month', value:Object.values(monthlyTotals).reduce((a,b)=>a+b,0), icon:'📆', sub:'total activities (30d)' },
                { label:'Enrollments', value:monthlyTotals.enrollments||0, icon:'✅', sub:'new members this month' },
              ].map(k => (
                <div key={k.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{k.icon}</div>
                  <div style={{ fontSize:22, fontWeight:700, color:'var(--gold)' }}>{k.value}</div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{k.label}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', opacity:0.7 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Today's entry */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--gold)', borderRadius:12, padding:22, marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:8 }}>
                <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'var(--text)' }}>
                  Today — {dateLabel(TODAY)}
                </h2>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'var(--gold)', color:'#1a1200', fontWeight:700, cursor:saving?'wait':'pointer', fontSize:13, opacity:saving?0.7:1 }}
                >
                  {saving ? 'Saving…' : saved ? '✅ Saved' : 'Save Day'}
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
                {ACTIVITY_TYPES.map(t => {
                  const val = todayCounts[t.key] || 0
                  const goal = goals[t.key] || 0
                  const pct = goal ? Math.min(100, Math.round(val / goal * 100)) : 0
                  const done = goal && val >= goal
                  return (
                    <div key={t.key} style={{ background:'var(--bg)', border:`1px solid ${done ? t.color : 'var(--border)'}`, borderRadius:10, padding:'12px 14px', transition:'border-color 0.2s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                        <span style={{ fontSize:18 }}>{t.icon}</span>
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>{t.label}</span>
                        {done && <span style={{ marginLeft:'auto', fontSize:10, color:t.color, fontWeight:700 }}>✓ Done</span>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:goal?8:0 }}>
                        <button onClick={() => adjust(t.key, -1)} style={{ width:28, height:28, borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer', fontSize:16, lineHeight:1 }}>−</button>
                        <span style={{ flex:1, textAlign:'center', fontSize:22, fontWeight:700, color: done ? t.color : 'var(--text)' }}>{val}</span>
                        <button onClick={() => adjust(t.key, 1)} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${t.color}`, background:'transparent', color:t.color, cursor:'pointer', fontSize:16, lineHeight:1 }}>+</button>
                      </div>
                      {goal > 0 && (
                        <div>
                          <div style={{ height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:t.color, borderRadius:2, transition:'width 0.3s' }} />
                          </div>
                          <div style={{ fontSize:10, color:'var(--text2)', marginTop:3 }}>Goal: {goal} ({pct}%)</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 30-day heat map */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:24 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color:'var(--text)' }}>30-Day Activity Heat Map</h3>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {[...log].sort((a,b) => a.date.localeCompare(b.date)).slice(-30).map(d => {
                  const total = totalForDay(d)
                  return (
                    <div key={d.date} title={`${dateLabel(d.date)}: ${total} activities`}
                      style={{
                        width:32, height:32, borderRadius:6,
                        background: heatColor(total, maxDayTotal),
                        border: isToday(d.date) ? '2px solid var(--gold)' : '1px solid transparent',
                        cursor:'default', display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:10, color:'var(--text2)', fontWeight:600
                      }}
                    >
                      {total > 0 ? total : ''}
                    </div>
                  )
                })}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
                <span style={{ fontSize:11, color:'var(--text2)' }}>Less</span>
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                  <div key={v} style={{ width:16, height:16, borderRadius:3, background:v===0?'var(--border)':`rgba(201,168,76,${0.25+v*0.75})` }} />
                ))}
                <span style={{ fontSize:11, color:'var(--text2)' }}>More</span>
              </div>
            </div>

            {/* Weekly + monthly breakdown */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
              {[
                { title:'This Week', totals: weeklyTotals, days: 7 },
                { title:'This Month', totals: monthlyTotals, days: 30 },
              ].map(({ title, totals, days }) => (
                <div key={title} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
                  <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color:'var(--text)' }}>{title}</h3>
                  {ACTIVITY_TYPES.map(t => {
                    const val = totals[t.key] || 0
                    const weeklyGoal = (goals[t.key] || 0) * days
                    const pct = weeklyGoal ? Math.min(100, Math.round(val / weeklyGoal * 100)) : 0
                    return (
                      <div key={t.key} style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <span style={{ fontSize:12, color:'var(--text)' }}>{t.icon} {t.label}</span>
                          <span style={{ fontSize:12, color:'var(--text2)', fontWeight:600 }}>{val}{weeklyGoal > 0 ? ` / ${weeklyGoal}` : ''}</span>
                        </div>
                        {weeklyGoal > 0 && (
                          <div style={{ height:5, background:'var(--border)', borderRadius:3 }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:t.color, borderRadius:3 }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Personal bests */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18, marginBottom:24 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color:'var(--text)' }}>🏆 Personal Bests (single day)</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10 }}>
                {ACTIVITY_TYPES.map(t => (
                  <div key={t.key} style={{ background:'var(--bg)', borderRadius:8, padding:'10px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:18 }}>{t.icon}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:t.color, margin:'4px 0 2px' }}>{bests[t.key] || 0}</div>
                    <div style={{ fontSize:11, color:'var(--text2)' }}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent log */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700, color:'var(--text)' }}>Recent Activity Log</h3>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid var(--border)' }}>
                      <th style={{ textAlign:'left', padding:'6px 10px', color:'var(--text2)', fontWeight:600 }}>Date</th>
                      {ACTIVITY_TYPES.map(t => (
                        <th key={t.key} style={{ textAlign:'center', padding:'6px 8px', color:'var(--text2)', fontWeight:600 }}>{t.icon}</th>
                      ))}
                      <th style={{ textAlign:'center', padding:'6px 8px', color:'var(--text2)', fontWeight:600 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.slice(0, 14).map(d => {
                      const total = totalForDay(d)
                      return (
                        <tr key={d.date} style={{ borderBottom:'1px solid var(--border)', opacity: total === 0 ? 0.5 : 1 }}>
                          <td style={{ padding:'7px 10px', color:'var(--text)', fontWeight: isToday(d.date) ? 700 : 400 }}>
                            {isToday(d.date) ? '📍 Today' : dateLabel(d.date)}
                          </td>
                          {ACTIVITY_TYPES.map(t => (
                            <td key={t.key} style={{ textAlign:'center', padding:'7px 8px', color: (d[t.key]||0) > 0 ? 'var(--text)' : 'var(--text2)' }}>
                              {d[t.key] || 0}
                            </td>
                          ))}
                          <td style={{ textAlign:'center', padding:'7px 8px', fontWeight:700, color: total > 0 ? 'var(--gold)' : 'var(--text2)' }}>{total}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {showGoalModal && (
        <GoalEditModal goals={goals} onSave={handleGoalSave} onClose={() => setShowGoalModal(false)} />
      )}
    </DashboardLayout>
  )
}
