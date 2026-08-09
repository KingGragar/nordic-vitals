import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberProgressPhotos } from '../../api/mlmApi'

const VIEW_LABELS = { front: 'Front', side: 'Side', back: 'Back' }

export default function DashProgressPhotos() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLog, setShowLog] = useState(false)
  const [view, setView] = useState('front')
  const [compare, setCompare] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMemberProgressPhotos().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const entries = (data?.entries || []).filter(e => e.view === view || !e.view)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Progress Photos</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Track your visual transformation — log check-ins and compare across time</p>
          </div>
          <button onClick={() => setShowLog(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ Log Check-In</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Check-Ins', value: data?.entries?.length || 0, color: '#93c5fd' },
            { label: 'First Entry', value: data?.entries?.length ? new Date(data.entries[data.entries.length - 1].date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—', color: '#fbbf24' },
            { label: 'Latest', value: data?.entries?.length ? new Date(data.entries[0].date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—', color: '#86efac' },
            { label: 'Streak', value: `${data?.streakWeeks || 0}wk`, color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* View filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {Object.entries(VIEW_LABELS).map(([v, lbl]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 16px', borderRadius: 7, border: '1px solid var(--border)', background: view === v ? '#6366f1' : 'var(--card)', color: view === v ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13 }}>{lbl} View</button>
          ))}
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : entries.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 52 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📸</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No check-ins yet</div>
            <div style={{ fontSize: 14 }}>Log your first check-in to start tracking your progress.</div>
          </div>
        ) : (
          <div>
            {/* Photo grid — using placeholder cards since no real uploads */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginBottom: 22 }}>
              {entries.map((entry, i) => (
                <div key={entry.id} style={{ ...card, padding: 0, overflow: 'hidden' }}>
                  <div style={{ background: `linear-gradient(135deg,${i % 2 === 0 ? '#6366f122,#818cf822' : '#34d39922,#86efac22'})`, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, color: 'var(--text-muted)' }}>
                    📸
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{VIEW_LABELS[entry.view] || entry.view} · Week {entry.week}</div>
                    {entry.weight && <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 3 }}>{entry.weight} kg</div>}
                    {entry.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>{entry.notes}</div>}
                    <button onClick={() => setCompare(entry)} style={{ marginTop: 10, fontSize: 11, padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', width: '100%' }}>Compare</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Compare panel */}
            {compare && (
              <div style={{ ...card, background: 'rgba(99,102,241,.08)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontWeight: 600 }}>Comparing: {new Date(compare.date).toLocaleDateString()} vs. latest</span>
                  <button onClick={() => setCompare(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[compare, entries[0]].map((e, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ background: 'var(--border)', height: 200, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, marginBottom: 8 }}>📸</div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{i === 0 ? 'Selected' : 'Latest'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(e.date).toLocaleDateString()} · {e.weight ? `${e.weight}kg` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showLog && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLog(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 440, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>Log Check-In</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Photo View</label>
                  <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                    {Object.entries(VIEW_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Upload Photo</label>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '28px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
                    Tap to select photo
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Weight (kg)</label>
                    <input type="number" step="0.1" placeholder="—" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Week #</label>
                    <input type="number" placeholder="1" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Notes</label>
                  <input placeholder="How you're feeling, key changes, etc." style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowLog(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowLog(false)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Save Check-In</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
