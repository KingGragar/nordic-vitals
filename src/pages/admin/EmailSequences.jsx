import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminEmailSequences } from '../../api/mlmApi'

const STATUS_COLOR = { active: '#86efac', paused: '#fbbf24', draft: '#93c5fd', archived: '#a1a1aa' }
const TRIGGER_ICON = { signup: '🆕', rank_up: '⬆️', purchase: '🛒', inactivity: '💤', birthday: '🎂', custom: '⚙️' }

export default function AdminEmailSequences() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAdminEmailSequences().then(d => { setData(d); if (d?.sequences?.length) setSelected(d.sequences[0].id) }).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const seq = data?.sequences?.find(s => s.id === selected)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Email Sequences</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Automated drip campaigns triggered by member behaviour</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '9px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>+ New Sequence</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Sequences', value: data?.totalSequences ?? '—', color: '#93c5fd' },
            { label: 'Active', value: data?.activeCount ?? '—', color: '#86efac' },
            { label: 'Emails Sent (30d)', value: (data?.emailsSent30d || 0).toLocaleString(), color: '#fbbf24' },
            { label: 'Avg Open Rate', value: data?.avgOpenRate ? `${data.avgOpenRate}%` : '—', color: '#818cf8' },
            { label: 'Avg Click Rate', value: data?.avgClickRate ? `${data.avgClickRate}%` : '—', color: '#f0abfc' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? <div style={{ color: 'var(--text-muted)', padding: 16 }}>Loading…</div> : (data?.sequences || []).map(s => (
              <div key={s.id} onClick={() => setSelected(s.id)} style={{ ...card, cursor: 'pointer', borderColor: selected === s.id ? '#6366f1' : 'var(--border)', borderWidth: selected === s.id ? 2 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[s.status], background: `${STATUS_COLOR[s.status]}22`, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize' }}>{s.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>{TRIGGER_ICON[s.trigger]} {s.trigger.replace('_', ' ')}</span>
                  <span>·</span>
                  <span>{s.stepCount} emails</span>
                  <span>·</span>
                  <span>{s.enrolled} enrolled</span>
                </div>
              </div>
            ))}
          </div>

          <div>
            {seq ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{seq.name}</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ padding: '6px 14px', background: 'var(--border)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
                      <button style={{ padding: '6px 14px', background: seq.status === 'active' ? '#fbbf2422' : '#86efac22', color: seq.status === 'active' ? '#fbbf24' : '#86efac', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        {seq.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                    {[
                      { label: 'Trigger', value: `${TRIGGER_ICON[seq.trigger]} ${seq.trigger.replace('_', ' ')}` },
                      { label: 'Enrolled', value: seq.enrolled.toLocaleString() },
                      { label: 'Completed', value: seq.completed.toLocaleString() },
                      { label: 'Unsubscribed', value: seq.unsubscribed.toLocaleString() },
                    ].map(k => (
                      <div key={k.label}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{k.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <h3 style={{ margin: '4px 0 8px', fontSize: 14, fontWeight: 700 }}>Email Steps</h3>
                {(seq.steps || []).map((step, i) => (
                  <div key={step.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366f122', border: '2px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#6366f1' }}>{i + 1}</div>
                      {i < seq.steps.length - 1 && <div style={{ width: 2, height: 24, background: 'var(--border)', margin: '4px 0' }} />}
                    </div>
                    <div style={{ ...card, flex: 1, marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{step.subject}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Day +{step.delayDays}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>Open: <strong style={{ color: 'var(--text)' }}>{step.openRate}%</strong></span>
                        <span>Click: <strong style={{ color: 'var(--text)' }}>{step.clickRate}%</strong></span>
                        <span>Unsub: <strong style={{ color: 'var(--text)' }}>{step.unsubRate}%</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ ...card, color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Select a sequence to view steps</div>
            )}
          </div>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...card, width: 420, maxWidth: '90vw' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>New Email Sequence</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Sequence Name</label>
                  <input placeholder="e.g. New Member Welcome" style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Trigger</label>
                  <select style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14 }}>
                    {Object.keys(TRIGGER_ICON).map(t => <option key={t} value={t}>{TRIGGER_ICON[t]} {t.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', background: 'var(--border)', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
