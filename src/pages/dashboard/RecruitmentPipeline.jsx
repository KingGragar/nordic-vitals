import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberRecruitmentPipeline, addMemberProspect, updateMemberProspectStage } from '../../api/mlmApi'

const STAGES = ['lead', 'contacted', 'interested', 'trial', 'enrolled']
const STAGE_ICON  = { lead: '👤', contacted: '📧', interested: '🤔', trial: '🧪', enrolled: '🎉' }
const STAGE_COLOR = { lead: '#6b7280', contacted: '#3b82f6', interested: '#f59e0b', trial: '#8b5cf6', enrolled: '#22c55e' }
const STAGE_BG    = { lead: '#1f2937', contacted: '#1e3a5f', interested: '#78350f', trial: '#3b0764', enrolled: '#14532d' }
const BLANK = { name: '', email: '', phone: '', source: 'personal', notes: '' }

export default function DashRecruitmentPipeline() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [moving, setMoving] = useState(null)

  useEffect(() => {
    getMemberRecruitmentPipeline().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    if (!form.name) return
    setSaving(true)
    const created = await addMemberProspect(form)
    setData(prev => ({ ...prev, prospects: [created, ...(prev?.prospects || [])] }))
    setModal(false)
    setForm(BLANK)
    setSaving(false)
  }

  async function moveStage(id, direction) {
    const prospects = data?.prospects || []
    const p = prospects.find(x => x.id === id)
    if (!p) return
    const idx = STAGES.indexOf(p.stage)
    const next = STAGES[idx + direction]
    if (!next) return
    setMoving(id)
    await updateMemberProspectStage(id, next)
    setData(prev => ({ ...prev, prospects: prev.prospects.map(x => x.id === id ? { ...x, stage: next } : x) }))
    setMoving(null)
  }

  const prospects = data?.prospects || []
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const inp  = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  const stats = [
    { label: 'Total Prospects', value: prospects.length, color: 'var(--text)' },
    { label: 'Interested', value: prospects.filter(p => p.stage === 'interested').length, color: '#fbbf24' },
    { label: 'In Trial', value: prospects.filter(p => p.stage === 'trial').length, color: '#a78bfa' },
    { label: 'Enrolled', value: prospects.filter(p => p.stage === 'enrolled').length, color: '#86efac' },
  ]

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🔀 My Recruitment Pipeline</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Track prospects from first contact to enrolment.</div>
          </div>
          <button onClick={() => setModal(true)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Add Prospect
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 22 }}>
          {stats.map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {STAGES.map(stage => {
              const stagePros = prospects.filter(p => p.stage === stage)
              return (
                <div key={stage} style={{ ...card, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{STAGE_ICON[stage]} {stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
                    <span style={{ padding: '2px 7px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: STAGE_BG[stage], color: STAGE_COLOR[stage] }}>{stagePros.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stagePros.map(p => {
                      const stageIdx = STAGES.indexOf(p.stage)
                      return (
                        <div key={p.id} style={{ background: 'var(--bg)', borderRadius: 8, padding: '9px 10px', border: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                          {p.email && <div style={{ color: 'var(--text2)', fontSize: 11, marginTop: 1 }}>{p.email}</div>}
                          <div style={{ color: 'var(--text2)', fontSize: 11, textTransform: 'capitalize' }}>{p.source} · Day {p.dayInFunnel}</div>
                          {p.notes && <div style={{ color: 'var(--text2)', fontSize: 11, marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 4 }}>{p.notes}</div>}
                          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                            {stageIdx > 0 && (
                              <button disabled={moving === p.id} onClick={() => moveStage(p.id, -1)} style={{ flex: 1, padding: '4px 0', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 11, cursor: 'pointer' }}>← Back</button>
                            )}
                            {stageIdx < STAGES.length - 1 && (
                              <button disabled={moving === p.id} onClick={() => moveStage(p.id, 1)} style={{ flex: 1, padding: '4px 0', borderRadius: 5, border: 'none', background: STAGE_BG[STAGES[stageIdx + 1]], color: STAGE_COLOR[STAGES[stageIdx + 1]], fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
                                {moving === p.id ? '…' : 'Advance →'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {!stagePros.length && <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 12, padding: '10px 0' }}>Empty</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 420 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Add Prospect</div>
              {[
                { label: 'Name *', key: 'name', placeholder: 'e.g. Maria Lindqvist' },
                { label: 'Email', key: 'email', placeholder: 'maria@example.com' },
                { label: 'Phone', key: 'phone', placeholder: '+47 9xx xx xxx' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{f.label}</div>
                  <input value={form[f.key]} placeholder={f.placeholder} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Source</div>
                <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} style={inp}>
                  {['personal', 'social media', 'referral', 'event', 'online ad', 'other'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Notes</div>
                <textarea value={form.notes} rows={2} placeholder="Any relevant context…" onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleAdd} disabled={saving || !form.name} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Adding…' : 'Add Prospect'}
                </button>
                <button onClick={() => setModal(false)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
