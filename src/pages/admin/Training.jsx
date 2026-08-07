import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminTrainingModules,
  createAdminTrainingModule,
  updateAdminTrainingModule,
  deleteAdminTrainingModule,
  addAdminTrainingLesson,
  updateAdminTrainingLesson,
  deleteAdminTrainingLesson,
} from '../../api/mlmApi'

const RANKS = ['all', 'bronze', 'silver', 'gold', 'platinum']
const LESSON_TYPES = ['text', 'video', 'quiz']
const STATUS_STYLE = {
  active:   { bg: '#052e16', color: '#86efac', border: '#166534' },
  draft:    { bg: '#1c1c1c', color: '#a3a3a3', border: '#404040' },
  archived: { bg: '#1e1e3a', color: '#a5b4fc', border: '#3730a3' },
}

function Badge({ label, style }) {
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', border: `1px solid ${style.border}`, background: style.bg, color: style.color }}>{label}</span>
}

function RankBadge({ rank }) {
  const colors = { all: '#6b7280', bronze: '#cd7f32', silver: '#94a3b8', gold: '#f59e0b', platinum: '#a855f7' }
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', border: `1px solid ${colors[rank]}`, color: colors[rank] }}>{rank === 'all' ? 'All ranks' : rank}</span>
}

function Bar({ value, max = 100, color = '#6366f1' }) {
  return (
    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${Math.min(100, (value / max) * 100)}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
    </div>
  )
}

function ModuleModal({ mod, onSave, onClose }) {
  const [form, setForm] = useState(mod ? {
    title: mod.title, icon: mod.icon, description: mod.description,
    reward: mod.reward, requiredRank: mod.requiredRank, status: mod.status,
  } : { title: '', icon: '📚', description: '', reward: 50, requiredRank: 'all', status: 'draft' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 520, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{mod ? 'Edit Module' : 'New Module'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: '0 0 80px' }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Icon</label>
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 20, textAlign: 'center' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Module Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Getting Started"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Completion Reward (pts)</label>
              <input type="number" min={0} value={form.reward} onChange={e => setForm(f => ({ ...f, reward: Number(e.target.value) }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Required Rank</label>
              <select value={form.requiredRank} onChange={e => setForm(f => ({ ...f, requiredRank: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}>
                {RANKS.map(r => <option key={r} value={r}>{r === 'all' ? 'All ranks' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn btn-primary btn-sm">
              {saving ? 'Saving…' : 'Save Module'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LessonModal({ lesson, onSave, onClose }) {
  const [form, setForm] = useState(lesson ? {
    title: lesson.title, type: lesson.type, duration: lesson.duration, content: lesson.content || '',
  } : { title: '', type: 'text', duration: 5, content: '' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 600, width: '100%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{lesson ? 'Edit Lesson' : 'Add Lesson'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Lesson Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Welcome to Nordic Vitals"
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}>
                {LESSON_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Duration (min)</label>
              <input type="number" min={1} max={120} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Content / Script</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8}
              placeholder={form.type === 'video' ? 'Paste video URL or embed code…' : 'Lesson text or quiz questions…'}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn btn-primary btn-sm">
              {saving ? 'Saving…' : lesson ? 'Update Lesson' : 'Add Lesson'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirm({ label, onConfirm, onClose }) {
  const [saving, setSaving] = useState(false)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Delete "{label}"?</div>
        <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>This action cannot be undone.</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
          <button onClick={async () => { setSaving(true); await onConfirm(); setSaving(false) }} disabled={saving}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

const LESSON_TYPE_ICON = { text: '📄', video: '🎬', quiz: '✅' }

function ModuleDetail({ mod, onBack, onRefresh }) {
  const [lessonModal, setLessonModal] = useState(null)
  const [deleteLesson, setDeleteLesson] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleAddLesson(form) {
    setSaving(true)
    await addAdminTrainingLesson(mod.id, form)
    setSaving(false)
    setLessonModal(null)
    onRefresh()
  }

  async function handleEditLesson(lesson, form) {
    await updateAdminTrainingLesson(mod.id, lesson.id, form)
    setLessonModal(null)
    onRefresh()
  }

  async function handleDeleteLesson(lessonId) {
    await deleteAdminTrainingLesson(mod.id, lessonId)
    setDeleteLesson(null)
    onRefresh()
  }

  const totalMins = (mod.lessons || []).reduce((s, l) => s + (l.duration || 0), 0)

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}>← Back to Modules</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 36 }}>{mod.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{mod.title}</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>{mod.description}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <Badge label={mod.status} style={STATUS_STYLE[mod.status] || STATUS_STYLE.draft} />
              <RankBadge rank={mod.requiredRank} />
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>🏅 {mod.reward} pts on completion</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>⏱ {totalMins} min total</span>
            </div>
          </div>
        </div>
        <button onClick={() => setLessonModal({ mode: 'new' })} className="btn btn-primary btn-sm">+ Add Lesson</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Completions', value: mod.completions ?? 0, icon: '✅' },
          { label: 'Avg. Completion Rate', value: `${mod.avgCompletionRate ?? 0}%`, icon: '📊' },
          { label: 'Lessons', value: mod.lessons?.length ?? 0, icon: '📄' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {(!mod.lessons || mod.lessons.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text2)', border: '1px dashed var(--border)', borderRadius: 10 }}>
          No lessons yet. Click <strong>+ Add Lesson</strong> to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mod.lessons.map((l, idx) => (
            <div key={l.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--text2)', fontSize: 12, width: 20, textAlign: 'center' }}>{idx + 1}</span>
              <span style={{ fontSize: 18 }}>{LESSON_TYPE_ICON[l.type] || '📄'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{l.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'capitalize' }}>{l.type} · {l.duration} min</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setLessonModal({ mode: 'edit', lesson: l })}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => setDeleteLesson(l)}
                  style={{ background: 'none', border: '1px solid #7f1d1d', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#f87171', cursor: 'pointer' }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lessonModal && lessonModal.mode === 'new' && (
        <LessonModal onSave={handleAddLesson} onClose={() => setLessonModal(null)} />
      )}
      {lessonModal && lessonModal.mode === 'edit' && (
        <LessonModal lesson={lessonModal.lesson} onSave={form => handleEditLesson(lessonModal.lesson, form)} onClose={() => setLessonModal(null)} />
      )}
      {deleteLesson && (
        <DeleteConfirm label={deleteLesson.title} onConfirm={() => handleDeleteLesson(deleteLesson.id)} onClose={() => setDeleteLesson(null)} />
      )}
    </div>
  )
}

export default function AdminTraining() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRank, setFilterRank] = useState('all')
  const [modModal, setModModal] = useState(null)
  const [deleteMod, setDeleteMod] = useState(null)
  const [detailMod, setDetailMod] = useState(null)

  async function load() {
    setLoading(true)
    const data = await getAdminTrainingModules().catch(() => [])
    setModules(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreateModule(form) {
    await createAdminTrainingModule(form)
    setModModal(null)
    load()
  }

  async function handleEditModule(form) {
    await updateAdminTrainingModule(modModal.mod.id, form)
    setModModal(null)
    load()
  }

  async function handleDeleteModule() {
    await deleteAdminTrainingModule(deleteMod.id)
    setDeleteMod(null)
    load()
  }

  const filtered = modules.filter(m => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || m.status === filterStatus
    const matchRank = filterRank === 'all' || m.requiredRank === filterRank
    return matchSearch && matchStatus && matchRank
  })

  const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length ?? 0), 0)
  const totalCompletions = modules.reduce((s, m) => s + (m.completions ?? 0), 0)
  const avgRate = modules.length ? Math.round(modules.reduce((s, m) => s + (m.avgCompletionRate ?? 0), 0) / modules.length) : 0

  if (detailMod) {
    const live = modules.find(m => m.id === detailMod.id) || detailMod
    return (
      <AdminLayout>
        <ModuleDetail mod={live} onBack={() => setDetailMod(null)} onRefresh={load} />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Training Manager</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 13 }}>Manage training modules and track member completion</p>
        </div>
        <button onClick={() => setModModal({ mode: 'new' })} className="btn btn-primary">+ New Module</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Modules', value: modules.length, icon: '📚' },
          { label: 'Total Lessons', value: totalLessons, icon: '📄' },
          { label: 'Total Completions', value: totalCompletions.toLocaleString(), icon: '✅' },
          { label: 'Avg Completion Rate', value: `${avgRate}%`, icon: '📊' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search modules…"
          style={{ flex: '1 1 200px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13 }}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select value={filterRank} onChange={e => setFilterRank(e.target.value)}
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13 }}>
          <option value="all">All ranks</option>
          {RANKS.map(r => <option key={r} value={r}>{r === 'all' ? 'All ranks' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)', border: '1px dashed var(--border)', borderRadius: 10 }}>
          No modules match your filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(m => {
            const totalMins = (m.lessons || []).reduce((s, l) => s + (l.duration || 0), 0)
            return (
              <div key={m.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 32, flexShrink: 0 }}>{m.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{m.title}</span>
                      <Badge label={m.status} style={STATUS_STYLE[m.status] || STATUS_STYLE.draft} />
                      <RankBadge rank={m.requiredRank} />
                    </div>
                    <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 10 }}>{m.description}</div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap', marginBottom: 8 }}>
                      <span>📄 {m.lessons?.length ?? 0} lessons · ⏱ {totalMins} min</span>
                      <span>🏅 {m.reward} pts reward</span>
                      <span>✅ {m.completions ?? 0} completions</span>
                      <span>📅 Updated {m.updatedAt}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, maxWidth: 240 }}>
                        <Bar value={m.avgCompletionRate ?? 0} color={m.avgCompletionRate >= 60 ? '#22c55e' : m.avgCompletionRate >= 30 ? '#f59e0b' : '#ef4444'} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{m.avgCompletionRate ?? 0}% avg completion</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignSelf: 'flex-start' }}>
                    <button onClick={() => setDetailMod(m)} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>Lessons</button>
                    <button onClick={() => setModModal({ mode: 'edit', mod: m })} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>Edit</button>
                    <button onClick={() => setDeleteMod(m)}
                      style={{ background: 'none', border: '1px solid #7f1d1d', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#f87171', cursor: 'pointer' }}>Del</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modModal && modModal.mode === 'new' && (
        <ModuleModal onSave={handleCreateModule} onClose={() => setModModal(null)} />
      )}
      {modModal && modModal.mode === 'edit' && (
        <ModuleModal mod={modModal.mod} onSave={handleEditModule} onClose={() => setModModal(null)} />
      )}
      {deleteMod && (
        <DeleteConfirm label={deleteMod.title} onConfirm={handleDeleteModule} onClose={() => setDeleteMod(null)} />
      )}
    </AdminLayout>
  )
}
