import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminCustomerJourneys } from '../../api/mlmApi'

const STAGE_COLORS = { awareness: '#a5b4fc', consideration: '#fbbf24', decision: '#86efac', onboarding: '#f9a8d4', retention: '#c4b5fd', advocacy: '#67e8f9' }

export default function AdminCustomerJourneyBuilder() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedJourney, setSelectedJourney] = useState(null)

  useEffect(() => {
    getAdminCustomerJourneys().then(d => { setData(d); setSelectedJourney(d.journeys[0]) }).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🗺️ Customer Journey Builder</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Map touchpoints, automations, and content across the member lifecycle.</div>
          </div>
          <button style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            + New Journey
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Journeys</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.journeys.map(j => (
                <div
                  key={j.id}
                  onClick={() => setSelectedJourney(j)}
                  style={{
                    ...card, cursor: 'pointer', padding: '12px 14px',
                    outline: selectedJourney?.id === j.id ? '2px solid var(--gold)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{j.name}</div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: j.status === 'active' ? '#05220e' : 'var(--border)',
                      color: j.status === 'active' ? '#86efac' : 'var(--text2)',
                    }}>{j.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{j.touchpoints} touchpoints · {j.enrolled.toLocaleString()} enrolled</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>CVR: {j.conversionRate}%</div>
                </div>
              ))}
            </div>
          </div>

          {selectedJourney && (
            <div>
              <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Enrolled',   value: selectedJourney.enrolled.toLocaleString() },
                    { label: 'Converted',  value: selectedJourney.converted.toLocaleString() },
                    { label: 'CVR',        value: `${selectedJourney.conversionRate}%` },
                    { label: 'Avg Days',   value: selectedJourney.avgDays },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--gold)' }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontWeight: 700, marginBottom: 12 }}>Journey Stages</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedJourney.stages.map((stage, i) => (
                  <div key={stage.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', border: `3px solid ${STAGE_COLORS[stage.type] || '#888'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 14, color: STAGE_COLORS[stage.type] || '#888', background: 'var(--card)',
                      }}>{i + 1}</div>
                      {i < selectedJourney.stages.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 20, background: 'var(--border)', margin: '4px 0' }} />
                      )}
                    </div>
                    <div style={{ ...card, flex: 1, padding: '12px 16px', borderLeft: `4px solid ${STAGE_COLORS[stage.type] || '#888'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{stage.name}</div>
                        <span style={{ fontSize: 11, color: STAGE_COLORS[stage.type] || '#888', fontWeight: 600, textTransform: 'capitalize' }}>{stage.type}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Trigger: <strong>{stage.trigger}</strong></span>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Delay: <strong>{stage.delayDays}d</strong></span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {stage.actions.map(act => (
                          <span key={act} style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, background: 'var(--border)', color: 'var(--text2)' }}>{act}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Completed: <strong style={{ color: '#86efac' }}>{stage.completed.toLocaleString()}</strong></span>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Drop-off: <strong style={{ color: '#f87171' }}>{stage.dropOff}%</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
