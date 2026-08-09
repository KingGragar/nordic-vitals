import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminOnboardingFlows } from '../../api/mlmApi'

const TYPE_COLOR = { welcome: '#93c5fd', kyc: '#fbbf24', training: '#86efac', activation: '#818cf8', product: '#fb923c' }

export default function AdminOnboardingFlows() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAdminOnboardingFlows().then(d => { setData(d); if (d?.flows?.length) setSelected(d.flows[0].id) }).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '6px 14px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  const selectedFlow = (data?.flows || []).find(f => f.id === selected)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Onboarding Flows</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Configure step-by-step onboarding sequences for new members</p>
          </div>
          <button onClick={() => setShowModal(true)} style={btn('#6366f1')}>+ New Flow</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Active Flows', value: (data?.flows || []).filter(f => f.active).length, color: '#86efac' },
            { label: 'Avg Completion', value: `${data?.avgCompletion || 0}%`, color: '#93c5fd' },
            { label: 'Members In Flow', value: data?.inProgress || 0, color: '#fbbf24' },
            { label: 'Completed (30d)', value: data?.completed30d || 0, color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 18, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data?.flows || []).map(flow => (
                <div key={flow.id} onClick={() => setSelected(flow.id)} style={{ ...card, cursor: 'pointer', borderColor: selected === flow.id ? '#6366f1' : 'var(--border)', outline: selected === flow.id ? '2px solid #6366f144' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{flow.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: flow.active ? '#86efac' : '#f87171', background: flow.active ? '#86efac22' : '#f8717122', borderRadius: 5, padding: '2px 7px' }}>{flow.active ? 'Active' : 'Paused'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{flow.description}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{flow.steps?.length || 0} steps</span>
                    <span>{flow.completionRate}% complete</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedFlow && (
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedFlow.name}</h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{selectedFlow.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={btn('#6366f111', '#6366f1')}>Edit Flow</button>
                    <button style={btn(selectedFlow.active ? '#f8717122' : '#86efac22', selectedFlow.active ? '#f87171' : '#86efac')}>{selectedFlow.active ? 'Pause' : 'Activate'}</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(selectedFlow.steps || []).map((step, i) => (
                    <div key={step.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366f122', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, background: 'var(--bg,#f8fafc)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{step.title}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[step.type] || '#93c5fd', background: `${TYPE_COLOR[step.type] || '#93c5fd'}22`, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize' }}>{step.type}</span>
                          {step.required && <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', background: '#f8717122', borderRadius: 5, padding: '2px 7px' }}>Required</span>}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{step.description}</div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Completion: <strong style={{ color: '#86efac' }}>{step.completionRate}%</strong></span>
                          <span>Avg time: <strong style={{ color: 'var(--text)' }}>{step.avgMinutes}m</strong></span>
                          {step.skipAllowed && <span style={{ color: '#fbbf24' }}>Skippable</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 440, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>New Onboarding Flow</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {['Flow Name', 'Description', 'Target Audience'].map(f => (
                  <div key={f}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{f}</label>
                    <input placeholder={f} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={btn('#6366f1')}>Create Flow</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
