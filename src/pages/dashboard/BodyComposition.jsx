import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberBodyComposition, logBodyCompositionEntry } from '../../api/mlmApi'

const METRICS = [
  { key: 'weight_kg',    label: 'Weight',        unit: 'kg',  color: '#a5b4fc' },
  { key: 'body_fat_pct', label: 'Body Fat',      unit: '%',   color: '#f87171' },
  { key: 'muscle_kg',   label: 'Muscle Mass',   unit: 'kg',  color: '#86efac' },
  { key: 'bmi',         label: 'BMI',            unit: '',    color: '#fbbf24' },
]

export default function DashBodyComposition() {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)
  const [metric, setMetric] = useState('weight_kg')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]    = useState({ weight_kg: '', body_fat_pct: '', muscle_kg: '', waist_cm: '', note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { getMemberBodyComposition().then(setData).finally(() => setLoad(false)) }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  async function handleLog() {
    setSaving(true)
    await logBodyCompositionEntry(form)
    const w = parseFloat(form.weight_kg); const bf = parseFloat(form.body_fat_pct)
    const bmi = w && data?.current?.height_m ? (w / (data.current.height_m ** 2)).toFixed(1) : null
    const entry = { date: new Date().toISOString().slice(0,10), ...form, bmi }
    setData(prev => ({
      ...prev,
      history: [entry, ...prev.history],
      current: { ...prev.current, ...form, bmi }
    }))
    setForm({ weight_kg: '', body_fat_pct: '', muscle_kg: '', waist_cm: '', note: '' })
    setShowAdd(false); setSaving(false)
  }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const activeMetric = METRICS.find(m => m.key === metric)
  const chartValues  = data.history.map(h => parseFloat(h[metric])||0).reverse()
  const maxV = Math.max(...chartValues, 1)
  const minV = Math.min(...chartValues)

  const delta = (current, baseline) => {
    const d = parseFloat(current) - parseFloat(baseline)
    return { val: Math.abs(d).toFixed(1), dir: d >= 0 ? '▲' : '▼', color: d >= 0 ? '#86efac' : '#f87171' }
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>⚖️ Body Composition</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Track weight, body fat, and muscle mass over time.</div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{
            padding: '9px 18px', borderRadius: 9, border: 'none', background: '#a5b4fc', color: '#1e1b4b',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>+ Log Check-in</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
          {METRICS.map(m => {
            const current = parseFloat(data.current?.[m.key]) || 0
            const baseline = parseFloat(data.baseline?.[m.key]) || current
            const d = delta(current, baseline)
            return (
              <div key={m.key} onClick={() => setMetric(m.key)} style={{ ...card, cursor: 'pointer', border: `1px solid ${metric===m.key ? m.color : 'var(--border)'}`, background: metric===m.key ? m.color+'11' : 'var(--card)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{current}{m.unit}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: d.color, marginTop: 4 }}>{d.dir} {d.val}{m.unit} vs baseline</div>
              </div>
            )
          })}
        </div>

        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{activeMetric?.label} Trend</div>
          {chartValues.length > 1 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                {chartValues.map((v, i) => {
                  const range = maxV - minV || 1
                  const h = Math.max(4, Math.round(((v - minV) / range) * 70) + 8)
                  return (
                    <div key={i} title={`${v}${activeMetric?.unit}`} style={{
                      flex: 1, height: h, background: activeMetric?.color || '#a5b4fc',
                      borderRadius: '3px 3px 0 0', minWidth: 0, opacity: 0.85,
                    }} />
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text2)', marginTop: 4 }}>
                <span>{data.history[data.history.length-1]?.date}</span>
                <span>{data.history[0]?.date}</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text2)', fontSize: 13 }}>Log at least 2 check-ins to see a trend.</div>
          )}
        </div>

        <div style={{ ...card }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Check-in History</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date','Weight (kg)','Body Fat (%)','Muscle (kg)','Waist (cm)','BMI'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.history.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{h.date}</td>
                    <td style={{ padding: '8px 10px' }}>{h.weight_kg || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>{h.body_fat_pct || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>{h.muscle_kg || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>{h.waist_cm || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>{h.bmi || '—'}</td>
                  </tr>
                ))}
                {data.history.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: 'var(--text2)' }}>No check-ins yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 400, maxWidth: '95vw' }}>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 18 }}>Log Body Check-in</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[
                  { label: 'Weight (kg)',    key: 'weight_kg' },
                  { label: 'Body Fat (%)',   key: 'body_fat_pct' },
                  { label: 'Muscle Mass (kg)', key: 'muscle_kg' },
                  { label: 'Waist (cm)',     key: 'waist_cm' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{f.label}</div>
                    <input type="number" step="0.1" value={form[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                      placeholder="—"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Note (optional)</div>
                <input value={form.note} onChange={e => setForm(p=>({...p,note:e.target.value}))} placeholder="e.g. Post-cycle measurement"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleLog} disabled={saving} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#86efac', color: '#14532d', fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving…' : 'Save Check-in'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
