import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSurveys, createSurvey, updateSurvey, deleteSurvey, getSurveyResponses } from '../../api/mlmApi'

const STATUS_STYLE = {
  active: { bg: '#052e16', color: '#86efac', border: '#166534' },
  draft:  { bg: '#1c1c1c', color: '#a3a3a3', border: '#404040' },
  closed: { bg: '#1e1e3a', color: '#a5b4fc', border: '#3730a3' },
}

const SEGMENT_LABELS = {
  all: 'All Members',
  new_members: 'New Members',
  active_members: 'Active Members',
  event_attendees: 'Event Attendees',
}

const Q_TYPES = [
  { value: 'rating',   label: 'Rating Scale (1–5)' },
  { value: 'multiple', label: 'Multiple Choice' },
  { value: 'text',     label: 'Open Text' },
]

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || {}
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
      {status}
    </span>
  )
}

function Stars({ value, max = 5 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < Math.round(value) ? '#f59e0b' : '#374151', fontSize: 14 }}>★</span>
      ))}
      <span style={{ marginLeft: 4, fontSize: 12, color: 'var(--text2)' }}>{Number(value).toFixed(1)}</span>
    </span>
  )
}

function ResponseModal({ survey, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSurveyResponses(survey.id).then(res => { setData(res); setLoading(false) }).catch(() => setLoading(false))
  }, [survey.id])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 680, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{survey.title}</div>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>{data?.totalResponses ?? survey.responseCount} responses · {survey.completionRate}% completion rate</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading responses…</div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Failed to load</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {survey.questions.map(q => {
              const s = data.summary[q.id]
              return (
                <div key={q.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>{q.text}</div>
                  {q.type === 'rating' && s && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Stars value={s.avg} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = s.distribution[star] || 0
                          const total = Object.values(s.distribution).reduce((a, b) => a + b, 0)
                          const pct = total ? Math.round((count / total) * 100) : 0
                          return (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                              <span style={{ width: 16, color: 'var(--text2)' }}>{star}★</span>
                              <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 8 }}>
                                <div style={{ width: `${pct}%`, background: '#f59e0b', borderRadius: 4, height: '100%', transition: 'width 0.4s' }} />
                              </div>
                              <span style={{ width: 32, color: 'var(--text2)', textAlign: 'right' }}>{pct}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {q.type === 'multiple' && s && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(s.distribution).sort((a, b) => b[1] - a[1]).map(([opt, cnt]) => {
                        const total = Object.values(s.distribution).reduce((a, b) => a + b, 0)
                        const pct = total ? Math.round((cnt / total) * 100) : 0
                        return (
                          <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                            <span style={{ width: 140, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt}</span>
                            <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 8 }}>
                              <div style={{ width: `${pct}%`, background: 'var(--gold)', borderRadius: 4, height: '100%', transition: 'width 0.4s' }} />
                            </div>
                            <span style={{ width: 36, color: 'var(--text2)', textAlign: 'right' }}>{pct}%</span>
                            <span style={{ width: 24, color: 'var(--text2)', textAlign: 'right' }}>({cnt})</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {q.type === 'text' && s && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Sample open-text responses:</div>
                      {(s.sampleAnswers || []).map((ans, i) => (
                        <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 13, color: 'var(--text1)', fontStyle: 'italic' }}>
                          "{ans}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const BLANK_SURVEY = {
  title: '', description: '', status: 'draft', pointsReward: 50,
  targetSegment: 'all', closesAt: '',
  questions: [{ id: `q-${Date.now()}`, type: 'multiple', text: '', options: ['', ''] }],
}

function SurveyFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => initial ? { ...initial, closesAt: initial.closesAt || '' } : JSON.parse(JSON.stringify(BLANK_SURVEY)))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  function addQuestion() {
    setForm(f => ({
      ...f,
      questions: [...f.questions, { id: `q-${Date.now()}`, type: 'multiple', text: '', options: ['', ''] }],
    }))
  }

  function removeQuestion(idx) {
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }))
  }

  function updateQ(idx, field, val) {
    setForm(f => {
      const qs = [...f.questions]
      qs[idx] = { ...qs[idx], [field]: val }
      if (field === 'type' && val !== 'multiple') delete qs[idx].options
      if (field === 'type' && val === 'multiple' && !qs[idx].options) qs[idx].options = ['', '']
      return { ...f, questions: qs }
    })
  }

  function updateOption(qIdx, oIdx, val) {
    setForm(f => {
      const qs = [...f.questions]
      const opts = [...(qs[qIdx].options || [])]
      opts[oIdx] = val
      qs[qIdx] = { ...qs[qIdx], options: opts }
      return { ...f, questions: qs }
    })
  }

  function addOption(qIdx) {
    setForm(f => {
      const qs = [...f.questions]
      qs[qIdx] = { ...qs[qIdx], options: [...(qs[qIdx].options || []), ''] }
      return { ...f, questions: qs }
    })
  }

  function removeOption(qIdx, oIdx) {
    setForm(f => {
      const qs = [...f.questions]
      qs[qIdx] = { ...qs[qIdx], options: qs[qIdx].options.filter((_, i) => i !== oIdx) }
      return { ...f, questions: qs }
    })
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.questions.length) e.questions = 'Add at least one question'
    form.questions.forEach((q, i) => {
      if (!q.text.trim()) e[`q_${i}`] = 'Question text required'
      if (q.type === 'multiple' && (!q.options || q.options.filter(o => o.trim()).length < 2)) e[`q_${i}_opts`] = 'Add at least 2 options'
    })
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        pointsReward: Number(form.pointsReward) || 0,
        closesAt: form.closesAt || null,
        questions: form.questions.map((q, i) => ({
          ...q,
          id: q.id || `q-${i + 1}`,
          options: q.type === 'multiple' ? q.options.filter(o => o.trim()) : undefined,
        })),
      }
      await onSave(payload)
    } finally { setSaving(false) }
  }

  const inp = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text1)', fontSize: 13, width: '100%', boxSizing: 'border-box' }
  const sel = { ...inp, cursor: 'pointer' }
  const err = { color: '#f87171', fontSize: 12, marginTop: 2 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}
      onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 720, width: '100%', marginTop: 24, marginBottom: 24 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{initial ? 'Edit Survey' : 'Create Survey'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Survey Title *</label>
              <input style={inp} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Product Satisfaction Q4 2026" />
              {errors.title && <div style={err}>{errors.title}</div>}
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Brief description shown to members" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Status</label>
              <select style={sel} value={form.status} onChange={e => setField('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Points Reward</label>
              <input type="number" min="0" style={inp} value={form.pointsReward} onChange={e => setField('pointsReward', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Target Segment</label>
              <select style={sel} value={form.targetSegment} onChange={e => setField('targetSegment', e.target.value)}>
                {Object.entries(SEGMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Closes At</label>
              <input type="date" style={inp} value={form.closesAt || ''} onChange={e => setField('closesAt', e.target.value)} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Questions</div>
              <button type="button" onClick={addQuestion}
                style={{ background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                + Add Question
              </button>
            </div>
            {errors.questions && <div style={{ ...err, marginBottom: 8 }}>{errors.questions}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {form.questions.map((q, qi) => (
                <div key={q.id || qi} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Question {qi + 1}</span>
                    {form.questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(qi)}
                        style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 13, cursor: 'pointer' }}>Remove</button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10 }}>
                    <input style={inp} value={q.text} onChange={e => updateQ(qi, 'text', e.target.value)} placeholder="Question text…" />
                    <select style={{ ...sel, width: 180 }} value={q.type} onChange={e => updateQ(qi, 'type', e.target.value)}>
                      {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  {errors[`q_${qi}`] && <div style={err}>{errors[`q_${qi}`]}</div>}
                  {q.type === 'multiple' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {(q.options || []).map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', gap: 6 }}>
                          <input style={{ ...inp, flex: 1 }} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} />
                          {(q.options || []).length > 2 && (
                            <button type="button" onClick={() => removeOption(qi, oi)}
                              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: '#f87171', padding: '0 10px', cursor: 'pointer' }}>✕</button>
                          )}
                        </div>
                      ))}
                      {errors[`q_${qi}_opts`] && <div style={err}>{errors[`q_${qi}_opts`]}</div>}
                      <button type="button" onClick={() => addOption(qi)}
                        style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 6, color: 'var(--text2)', padding: '6px', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
                        + Add option
                      </button>
                    </div>
                  )}
                  {q.type === 'rating' && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>Members will rate from 1 to 5 stars.</div>
                  )}
                  {q.type === 'text' && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>Members will enter a free-text response.</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <button type="button" onClick={onClose}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 18px', color: 'var(--text1)', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : (initial ? 'Save Changes' : 'Create Survey')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StatTile({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || 'var(--gold)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function Surveys() {
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [viewResponses, setViewResponses] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const res = await getAdminSurveys(); setSurveys(res.surveys || []) } catch {}
    setLoading(false)
  }

  const filtered = surveys.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalResponses = surveys.reduce((a, s) => a + (s.responseCount || 0), 0)
  const activeCount    = surveys.filter(s => s.status === 'active').length
  const avgCompletion  = surveys.length ? Math.round(surveys.reduce((a, s) => a + (s.completionRate || 0), 0) / surveys.length) : 0
  const totalPoints    = surveys.reduce((a, s) => a + (s.pointsReward || 0), 0)

  async function handleSave(data) {
    if (editTarget) {
      await updateSurvey(editTarget.id, data)
    } else {
      await createSurvey(data)
    }
    setShowForm(false)
    setEditTarget(null)
    await load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try { await deleteSurvey(deleteTarget.id); setDeleteTarget(null); await load() } catch {}
    setDeleting(false)
  }

  const btnBase = { border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }

  return (
    <AdminLayout>
      <div style={{ padding: '28px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Survey Manager</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14, margin: '4px 0 0' }}>Create member surveys, collect insights, and reward participation.</p>
          </div>
          <button onClick={() => { setEditTarget(null); setShowForm(true) }}
            style={{ ...btnBase, background: 'var(--gold)', color: '#000', padding: '9px 18px', fontSize: 13 }}>
            + New Survey
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatTile label="Total Surveys" value={surveys.length} />
          <StatTile label="Active" value={activeCount} color="#86efac" />
          <StatTile label="Total Responses" value={totalResponses.toLocaleString()} />
          <StatTile label="Avg Completion" value={`${avgCompletion}%`} color="#a5b4fc" />
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search surveys…"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 12px', color: 'var(--text1)', fontSize: 13, flex: 1, minWidth: 160 }} />
            {['all', 'active', 'draft', 'closed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ ...btnBase, background: statusFilter === s ? 'var(--gold)' : 'var(--bg)', color: statusFilter === s ? '#000' : 'var(--text1)', border: '1px solid var(--border)' }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading surveys…</div>
          ) : !filtered.length ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No surveys match your filters.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Survey', 'Status', 'Segment', 'Questions', 'Responses', 'Completion', 'Points', 'Closes', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text1)', marginBottom: 2 }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.description?.slice(0, 60)}{s.description?.length > 60 ? '…' : ''}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={s.status} /></td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>{SEGMENT_LABELS[s.targetSegment] || s.targetSegment}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>{s.questions?.length || 0}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{(s.responseCount || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, width: 60 }}>
                            <div style={{ width: `${s.completionRate || 0}%`, background: 'var(--gold)', borderRadius: 4, height: '100%' }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.completionRate || 0}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#fbbf24', fontWeight: 600 }}>{s.pointsReward} pts</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDate(s.closesAt)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {s.responseCount > 0 && (
                            <button onClick={() => setViewResponses(s)}
                              style={{ ...btnBase, background: '#1e1e3a', color: '#a5b4fc', border: '1px solid #3730a3' }}>
                              Responses
                            </button>
                          )}
                          <button onClick={() => { setEditTarget(s); setShowForm(true) }}
                            style={{ ...btnBase, background: 'var(--bg)', color: 'var(--text1)', border: '1px solid var(--border)' }}>
                            Edit
                          </button>
                          <button onClick={() => setDeleteTarget(s)}
                            style={{ ...btnBase, background: '#3b0a0a', color: '#fca5a5', border: '1px solid #7f1d1d' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <SurveyFormModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}

      {viewResponses && (
        <ResponseModal survey={viewResponses} onClose={() => setViewResponses(null)} />
      )}

      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setDeleteTarget(null)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 380, width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Delete Survey?</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
              "<strong>{deleteTarget.title}</strong>" and all its response data will be permanently deleted.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ ...btnBase, background: 'var(--bg)', color: 'var(--text1)', border: '1px solid var(--border)' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ ...btnBase, background: '#dc2626', color: '#fff', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
