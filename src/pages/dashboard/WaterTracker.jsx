import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberWaterTracker, logMemberWaterIntake } from '../../api/mlmApi'

const CUPS = [150, 250, 350, 500, 750]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function DashWaterTracker() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState(false)
  const [customAmt, setCustomAmt] = useState('')

  useEffect(() => { getMemberWaterTracker().then(setData).finally(() => setLoading(false)) }, [])

  async function handleLog(ml) {
    if (logging) return
    setLogging(true)
    await logMemberWaterIntake({ ml })
    setData(prev => ({
      ...prev,
      today: { ...prev.today, intake: Math.min(prev.today.intake + ml, prev.today.goal) },
      log: [{ id: Date.now(), time: new Date().toTimeString().slice(0, 5), ml, source: 'water' }, ...prev.log],
    }))
    setLogging(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const pct = Math.min(Math.round((data.today.intake / data.today.goal) * 100), 100)
  const remaining = Math.max(0, data.today.goal - data.today.intake)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💧 Water Tracker</div>
        <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>Track your daily hydration and stay on top of your wellness goals.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ ...card, textAlign: 'center', paddingTop: 28, paddingBottom: 28 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="none" stroke="var(--border)" strokeWidth="14" />
                <circle
                  cx="80" cy="80" r="68" fill="none"
                  stroke="#0ea5e9" strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 427} 427`}
                  strokeDashoffset="107"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
                <text x="80" y="74" textAnchor="middle" fontSize="30" fontWeight="800" fill="var(--text)">💧</text>
                <text x="80" y="98" textAnchor="middle" fontSize="20" fontWeight="800" fill="#0ea5e9">{pct}%</text>
                <text x="80" y="116" textAnchor="middle" fontSize="11" fill="var(--text2)">of daily goal</text>
              </svg>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0ea5e9', marginBottom: 4 }}>{data.today.intake} ml</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Goal: {data.today.goal} ml · {remaining > 0 ? `${remaining} ml to go` : '🎉 Goal reached!'}</div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Log Intake</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {CUPS.map(ml => (
                <button key={ml} onClick={() => handleLog(ml)} disabled={logging} style={{
                  padding: '12px 8px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 20 }}>{ml <= 200 ? '🥛' : ml <= 400 ? '🥤' : '🍶'}</span>
                  <span>{ml} ml</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number" placeholder="Custom ml…" value={customAmt} onChange={e => setCustomAmt(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
              />
              <button
                onClick={() => { if (customAmt) { handleLog(Number(customAmt)); setCustomAmt('') } }}
                disabled={!customAmt || logging}
                style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: '#0ea5e9', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >Log</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Today', value: `${data.today.intake} ml`, color: '#0ea5e9' },
            { label: '7-Day Avg', value: data.stats.weekAvg, color: '#86efac' },
            { label: 'Current Streak', value: `${data.stats.streak} days`, color: '#fbbf24' },
            { label: 'Best Day', value: data.stats.best, color: '#a5b4fc' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Hourly Intake Today</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
              {HOURS.filter(h => h >= 6 && h <= 22).map(h => {
                const entry = data.hourly[h] || 0
                const barH = entry ? Math.max(8, (entry / 500) * 80) : 4
                return (
                  <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: '100%', height: barH, background: entry ? '#0ea5e9' : 'var(--border)', borderRadius: 2, transition: 'height 0.3s' }} title={`${h}:00 — ${entry} ml`} />
                    {[6, 9, 12, 15, 18, 21].includes(h) && <div style={{ fontSize: 9, color: 'var(--text2)' }}>{h}</div>}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Today's Log</div>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.log.length === 0 && <div style={{ color: 'var(--text2)', fontSize: 13 }}>No entries yet today.</div>}
              {data.log.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 18 }}>💧</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{l.ml} ml</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{l.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, gridColumn: '1 / -1' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>💊 Hydration Tip</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{data.tip}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
