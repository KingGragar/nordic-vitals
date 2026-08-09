import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberSleepTracker, addMemberSleepEntry } from '../../api/mlmApi'

const QUALITY_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'OK', 4: 'Good', 5: 'Excellent' }
const QUALITY_COLORS = { 1: '#fca5a5', 2: '#fdba74', 3: '#fbbf24', 4: '#86efac', 5: '#34d399' }

export default function DashSleepTracker() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ date: '', bedtime: '22:30', wakeTime: '06:30', quality: 4, wakeUps: 0, note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getMemberSleepTracker().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    const [bh, bm] = form.bedtime.split(':').map(Number)
    const [wh, wm] = form.wakeTime.split(':').map(Number)
    let dur = (wh + wm / 60) - (bh + bm / 60)
    if (dur < 0) dur += 24
    const entry = { ...form, duration: Math.round(dur * 100) / 100, quality: +form.quality, wakeUps: +form.wakeUps, products: [], id: 'sl_new' }
    await addMemberSleepEntry(entry)
    setData(prev => ({ ...prev, entries: [entry, ...prev.entries] }))
    setShowAdd(false)
    setSaving(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const inp = { padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, width: '100%', boxSizing: 'border-box' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const maxDur = Math.max(...data.weekChart.map(d => d.duration), 9)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>😴 Sleep Tracker</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Log sleep sessions, quality ratings, and weekly trends.</div>
          </div>
          <button onClick={() => setShowAdd(s => !s)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {showAdd ? '✕ Cancel' : '+ Log Sleep'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Avg Duration', value: `${data.stats.avgDuration}h`, color: '#a5b4fc' },
            { label: 'Avg Quality',  value: `${data.stats.avgQuality}/5`, color: '#fbbf24' },
            { label: 'Log Streak',   value: `${data.stats.streak}d`,      color: '#86efac' },
            { label: 'Best Night',   value: `${data.stats.bestNight}h`,   color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} style={{ ...card, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Log Sleep Session</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Bedtime</label>
                <input type="time" value={form.bedtime} onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))} required style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Wake Time</label>
                <input type="time" value={form.wakeTime} onChange={e => setForm(f => ({ ...f, wakeTime: e.target.value }))} required style={inp} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Quality (1–5)</label>
                <select value={form.quality} onChange={e => setForm(f => ({ ...f, quality: e.target.value }))} style={inp}>
                  {[1,2,3,4,5].map(q => <option key={q} value={q}>{q} — {QUALITY_LABELS[q]}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Wake-ups</label>
                <input type="number" min="0" max="10" value={form.wakeUps} onChange={e => setForm(f => ({ ...f, wakeUps: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Note</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional…" style={inp} />
              </div>
            </div>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1e1b4b', color: '#a5b4fc', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Save Entry'}
            </button>
          </form>
        )}

        <div style={{ fontWeight: 700, marginBottom: 12 }}>Weekly Duration</div>
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
            {data.weekChart.map(d => {
              const h = Math.round((d.duration / maxDur) * 90)
              return (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div title={`${d.duration}h`} style={{ width: '100%', height: h, background: '#a5b4fc', borderRadius: 3, cursor: 'default' }} />
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>{d.day}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ fontWeight: 700, marginBottom: 12 }}>Sleep Log</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.entries.map(e => {
            const qc = QUALITY_COLORS[e.quality] || '#fbbf24'
            return (
              <div key={e.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 80 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{e.date}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 11 }}>{e.bedtime} → {e.wakeTime}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#a5b4fc', minWidth: 50 }}>{e.duration}h</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: qc, border: `1px solid ${qc}`, borderRadius: 20, padding: '2px 10px' }}>
                  {QUALITY_LABELS[e.quality]}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>↑ {e.wakeUps}×</span>
                {e.note && <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1, fontStyle: 'italic' }}>"{e.note}"</span>}
                {e.products.map(p => <span key={p} style={{ fontSize: 11, color: '#a5b4fc', background: '#1e1b4b', border: '1px solid #3730a3', borderRadius: 20, padding: '2px 8px' }}>💊 {p}</span>)}
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
