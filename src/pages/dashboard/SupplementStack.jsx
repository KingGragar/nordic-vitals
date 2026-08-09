import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberSupplementStack } from '../../api/mlmApi'

const TIMING_COLOR = { Morning: '#fbbf24', Midday: '#86efac', Evening: '#818cf8', 'Pre-workout': '#f87171', 'Post-workout': '#34d399', 'Before bed': '#c4b5fd' }

export default function DashSupplementStack() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editStack, setEditStack] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMemberSupplementStack().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  const byTiming = {}
  for (const item of (data?.stack || [])) {
    if (!byTiming[item.timing]) byTiming[item.timing] = []
    byTiming[item.timing].push(item)
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>My Supplement Stack</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Your personal peptide and supplement protocol — dosage, timing, and notes</p>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ Add to Stack</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Products in Stack', value: data?.stack?.length || 0, color: '#93c5fd' },
            { label: 'Daily Doses', value: (data?.stack || []).reduce((s, i) => s + i.dosesPerDay, 0), color: '#86efac' },
            { label: 'Protocol Active', value: data?.protocolActive ? 'Yes' : 'No', color: data?.protocolActive ? '#86efac' : '#f87171' },
            { label: 'Days Running', value: `${data?.daysRunning || 0}d`, color: '#fbbf24' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
          Object.keys(byTiming).length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💊</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Your stack is empty</div>
              <div style={{ fontSize: 14 }}>Add products to build your personal protocol.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {Object.entries(byTiming).map(([timing, items]) => (
                <div key={timing}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: TIMING_COLOR[timing] || '#818cf8' }} />
                    <span style={{ fontWeight: 700, fontSize: 15, color: TIMING_COLOR[timing] || '#818cf8' }}>{timing}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({items.length} product{items.length !== 1 ? 's' : ''})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map(item => (
                      <div key={item.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '12px 16px' }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: `${TIMING_COLOR[timing] || '#818cf8'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.emoji || '💊'}</div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{item.productName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.dosage} · {item.dosesPerDay}× daily</div>
                          {item.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontStyle: 'italic' }}>{item.notes}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                          <button onClick={() => setEditStack(item)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Edit</button>
                          <button style={{ fontSize: 12, padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: '#f87171', cursor: 'pointer' }}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {(showAdd || editStack) && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowAdd(false); setEditStack(null) }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 440, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>{editStack ? 'Edit Stack Item' : 'Add to Stack'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Product</label>
                  <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                    <option>BPC-157 Complex</option>
                    <option>TB-500 Recovery</option>
                    <option>GHK-Cu Serum</option>
                    <option>KPV Anti-Inflammatory</option>
                    <option>Epitalon Longevity</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Dosage</label>
                    <input defaultValue={editStack?.dosage || ''} placeholder="e.g. 250mcg" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Timing</label>
                    <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                      {Object.keys(TIMING_COLOR).map(t => <option key={t} selected={editStack?.timing === t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Notes</label>
                  <input defaultValue={editStack?.notes || ''} placeholder="Optional notes (take with food, inject subcutaneously, etc.)" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => { setShowAdd(false); setEditStack(null) }} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => { setShowAdd(false); setEditStack(null) }} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
