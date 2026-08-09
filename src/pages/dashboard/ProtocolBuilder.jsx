import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberProtocolBuilder } from '../../api/mlmApi'

const TIMING_COLOR = { morning: '#fbbf24', evening: '#818cf8', preworkout: '#f87171', postworkout: '#86efac', bedtime: '#93c5fd', anytime: '#fb923c' }

export default function DashProtocolBuilder() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeProtocol, setActiveProtocol] = useState(null)
  const [editItem, setEditItem] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMemberProtocolBuilder().then(d => {
      setData(d)
      if (d?.protocols?.length) setActiveProtocol(d.protocols[0].id)
    }).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '7px 16px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  const protocol = (data?.protocols || []).find(p => p.id === activeProtocol)

  const TIMINGS = ['morning', 'preworkout', 'postworkout', 'evening', 'bedtime', 'anytime']

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Protocol Builder</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Build and manage personalized peptide protocols with timing and dosage</p>
          </div>
          <button onClick={() => setShowModal(true)} style={btn('#6366f1')}>+ New Protocol</button>
        </div>

        {(data?.protocols || []).length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {data.protocols.map(p => (
              <button key={p.id} onClick={() => setActiveProtocol(p.id)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeProtocol === p.id ? '#6366f1' : 'var(--card)', color: activeProtocol === p.id ? '#fff' : 'var(--text-muted)', border: activeProtocol === p.id ? 'none' : '1px solid var(--border)' }}>{p.name}</button>
            ))}
          </div>
        )}

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Loading…</div> : protocol ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Goal', value: protocol.goal, color: '#818cf8' },
                { label: 'Cycle', value: protocol.cycle, color: '#93c5fd' },
                { label: 'Total Peptides', value: protocol.items.length, color: '#86efac' },
                { label: 'Daily Cost', value: protocol.dailyCost, color: '#fbbf24' },
              ].map(k => (
                <div key={k.label} style={card}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: k.color }}>{k.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {TIMINGS.filter(t => protocol.items.some(i => i.timing === t)).map(timing => (
                <div key={timing} style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: TIMING_COLOR[timing] || '#93c5fd', display: 'inline-block' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'capitalize', color: TIMING_COLOR[timing] || '#93c5fd' }}>{timing}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {protocol.items.filter(i => i.timing === timing).map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--border)18', flexWrap: 'wrap' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${TIMING_COLOR[timing] || '#93c5fd'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💊</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{item.peptide}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.dosage} · {item.route} · {item.frequency}</div>
                          {item.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>{item.notes}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setEditItem(item)} style={btn('#6366f111', '#6366f1')}>Edit</button>
                          <button style={btn('#f8717122', '#f87171')}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={btn('#6366f1')}>+ Add Peptide</button>
              <button style={btn('#86efac22', '#86efac')}>Share Protocol</button>
              <button style={btn('var(--border)', 'var(--text-muted)')}>Duplicate</button>
              <button style={{ ...btn('#f8717122', '#f87171'), marginLeft: 'auto' }}>Delete Protocol</button>
            </div>
          </>
        ) : (
          <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔬</div>
            <div style={{ fontWeight: 700 }}>No protocols yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Build your first personalized peptide protocol.</div>
            <button onClick={() => setShowModal(true)} style={{ ...btn('#6366f1'), marginTop: 14 }}>Create First Protocol</button>
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 480, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>New Protocol</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {[['Protocol Name', 'e.g. Recovery Stack'], ['Goal', 'e.g. Tendon healing, muscle growth']].map(([label, ph]) => (
                  <div key={label}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{label}</label>
                    <input placeholder={ph} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Cycle Length</label>
                  <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                    {['4 weeks', '8 weeks', '12 weeks', '16 weeks', '6 months', 'Ongoing'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={btn('#6366f1')}>Create Protocol</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
