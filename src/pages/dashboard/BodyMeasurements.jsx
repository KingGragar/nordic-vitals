import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberBodyMeasurements } from '../../api/mlmApi'

const METRICS = [
  { key: 'weight', label: 'Weight', unit: 'kg', color: '#818cf8' },
  { key: 'waist', label: 'Waist', unit: 'cm', color: '#f87171' },
  { key: 'hips', label: 'Hips', unit: 'cm', color: '#fbbf24' },
  { key: 'chest', label: 'Chest', unit: 'cm', color: '#86efac' },
  { key: 'bodyFat', label: 'Body Fat', unit: '%', color: '#fb923c' },
  { key: 'muscle', label: 'Muscle Mass', unit: 'kg', color: '#34d399' },
]

export default function DashBodyMeasurements() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLog, setShowLog] = useState(false)
  const [active, setActive] = useState('weight')

  useEffect(() => {
    setLoading(true)
    getMemberBodyMeasurements().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const history = data?.history || []
  const activeMetric = METRICS.find(m => m.key === active)

  function delta(key) {
    if (history.length < 2) return null
    const first = history[history.length - 1]?.[key]
    const last = history[0]?.[key]
    if (first == null || last == null) return null
    return (last - first).toFixed(1)
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Body Measurements</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Track your body composition and progress over time</p>
          </div>
          <button onClick={() => setShowLog(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ Log Measurements</button>
        </div>

        {/* metric tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 12, marginBottom: 22 }}>
          {METRICS.map(m => {
            const latest = history[0]?.[m.key]
            const d = delta(m.key)
            return (
              <div key={m.key} onClick={() => setActive(m.key)} style={{ ...card, cursor: 'pointer', border: active === m.key ? `2px solid ${m.color}` : '1px solid var(--border)', padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{loading ? '…' : (latest != null ? `${latest}${m.unit}` : '—')}</div>
                {d !== null && (
                  <div style={{ fontSize: 11, marginTop: 3, color: parseFloat(d) < 0 ? '#86efac' : '#f87171', fontWeight: 600 }}>
                    {parseFloat(d) > 0 ? '+' : ''}{d} {m.unit}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* simple history chart — bar representation */}
        <div style={{ ...card, marginBottom: 22 }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>{activeMetric?.label} History</div>
          {loading ? <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : history.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No measurements logged yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, minWidth: history.length * 56 }}>
                {[...history].reverse().map((entry, i) => {
                  const vals = history.map(e => e[active]).filter(v => v != null)
                  const min = Math.min(...vals), max = Math.max(...vals)
                  const range = max - min || 1
                  const pct = max === min ? 60 : 20 + ((entry[active] - min) / range) * 80
                  return (
                    <div key={i} style={{ flex: 1, minWidth: 40, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{entry[active] != null ? `${entry[active]}${activeMetric?.unit || ''}` : '—'}</div>
                      <div style={{ height: `${pct}px`, background: activeMetric?.color || '#818cf8', borderRadius: '4px 4px 0 0', opacity: .85 }} />
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, whiteSpace: 'nowrap' }}>{new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* log table */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Full Log</div>
          {loading ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                    {METRICS.map(m => <th key={m.key} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{m.label}</th>)}
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--row-alt,rgba(0,0,0,.03))' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>{new Date(entry.date).toLocaleDateString()}</td>
                      {METRICS.map(m => (
                        <td key={m.key} style={{ padding: '10px 12px', textAlign: 'right', color: entry[m.key] != null ? m.color : 'var(--text-muted)' }}>
                          {entry[m.key] != null ? `${entry[m.key]}${m.unit}` : '—'}
                        </td>
                      ))}
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>{entry.note || '—'}</td>
                    </tr>
                  ))}
                  {history.length === 0 && <tr><td colSpan={METRICS.length + 2} style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>No measurements logged yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showLog && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLog(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 460, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>Log Measurements</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                {METRICS.map(m => (
                  <div key={m.key}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{m.label} ({m.unit})</label>
                    <input type="number" step="0.1" placeholder="—" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 13 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Note (optional)</label>
                <input placeholder="e.g. After 4-week protocol" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowLog(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowLog(false)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
