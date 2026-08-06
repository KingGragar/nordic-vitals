import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberGoals, createMemberGoal, updateMemberGoal, deleteMemberGoal } from '../../api/mlmApi'

const CATEGORIES = [
  { key: 'all',         label: 'All Categories', icon: '🎯' },
  { key: 'rank',        label: 'Rank',            icon: '🏅' },
  { key: 'recruitment', label: 'Recruitment',     icon: '👥' },
  { key: 'volume',      label: 'Volume',          icon: '📊' },
  { key: 'earnings',    label: 'Earnings',        icon: '💰' },
  { key: 'activity',    label: 'Activity',        icon: '📅' },
]

const STATUS_FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'missed',    label: 'Missed' },
]

const CAT_COLOR = {
  rank:        '#fcd34d',
  recruitment: '#93c5fd',
  volume:      '#86efac',
  earnings:    '#f9a8d4',
  activity:    '#c4b5fd',
}

const STATUS_STYLE = {
  active:    { bg: '#052e16', color: '#86efac', border: '#166534' },
  completed: { bg: '#1e3a5f', color: '#93c5fd', border: '#1e40af' },
  missed:    { bg: '#450a0a', color: '#fca5a5', border: '#991b1b' },
}

function daysUntil(deadline) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000)
  return diff
}

function fmtDeadline(deadline) {
  if (!deadline) return '—'
  return new Date(deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function progress(g) {
  if (!g.target) return 0
  return Math.min(100, Math.round((g.current / g.target) * 100))
}

function ProgressBar({ pct, color, status }) {
  const bg = status === 'missed' ? '#991b1b' : (status === 'completed' ? '#1e40af' : (color || '#3b82f6'))
  return (
    <div style={{ background: 'var(--navy3)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
      <div style={{ background: bg, width: `${pct}%`, height: '100%', borderRadius: '6px', transition: 'width 0.4s' }} />
    </div>
  )
}

function GoalCard({ goal, onComplete, onDelete, onEdit }) {
  const pct = progress(goal)
  const days = daysUntil(goal.deadline)
  const catInfo = CATEGORIES.find(c => c.key === goal.category) || CATEGORIES[0]
  const color = CAT_COLOR[goal.category] || '#93c5fd'
  const ss = STATUS_STYLE[goal.status] || {}
  const urgentDeadline = days !== null && days <= 7 && goal.status === 'active'

  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}`, marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>{goal.title}</span>
            <span className="badge" style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontSize: '10px', textTransform: 'capitalize' }}>
              {goal.status}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text2)' }}>
            {catInfo.icon} {catInfo.label}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {goal.status === 'active' && (
            <>
              <button className="btn-sm" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => onEdit(goal)}>✏️</button>
              <button className="btn-sm" style={{ fontSize: '10px', padding: '3px 8px', background: '#052e16', borderColor: '#166534', color: '#86efac' }}
                onClick={() => onComplete(goal.id)}>✅</button>
            </>
          )}
          <button className="btn-sm" style={{ fontSize: '10px', padding: '3px 8px', background: '#450a0a', borderColor: '#991b1b', color: '#fca5a5' }}
            onClick={() => onDelete(goal.id)}>🗑</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
        <span style={{ color: 'var(--cream)', fontWeight: 600 }}>
          {goal.current?.toLocaleString()} / {goal.target?.toLocaleString()} {goal.unit}
        </span>
        <span style={{ color: pct >= 100 ? '#86efac' : 'var(--cream)', fontWeight: 600 }}>{pct}%</span>
      </div>

      <ProgressBar pct={pct} color={color} status={goal.status} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text2)' }}>
        <span>Deadline: <span style={{ color: urgentDeadline ? '#fca5a5' : 'var(--text2)', fontWeight: urgentDeadline ? 700 : 400 }}>{fmtDeadline(goal.deadline)}</span></span>
        {days !== null && goal.status === 'active' && (
          <span style={{ color: urgentDeadline ? '#fca5a5' : 'var(--text2)', fontWeight: urgentDeadline ? 700 : 400 }}>
            {days > 0 ? `${days}d left` : days === 0 ? 'Due today' : `${Math.abs(days)}d overdue`}
          </span>
        )}
      </div>
    </div>
  )
}

function GoalModal({ goal, onClose, onSave }) {
  const isEdit = !!goal
  const [form, setForm] = useState(goal ? {
    title: goal.title, category: goal.category, target: goal.target, current: goal.current, unit: goal.unit, deadline: goal.deadline
  } : {
    title: '', category: 'rank', target: '', current: 0, unit: '', deadline: ''
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.target) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const catInfo = CATEGORIES.filter(c => c.key !== 'all')
  const unitPlaceholders = { rank: 'rank tier', recruitment: 'members', volume: 'PV', earnings: '€', activity: 'days' }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '480px', maxWidth: '96vw' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{isEdit ? '✏️ Edit Goal' : '🎯 New Goal'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="form-label">Goal Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Recruit 10 members this quarter" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, unit: unitPlaceholders[e.target.value] || '' }))}>
                {catInfo.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Unit *</label>
              <input className="form-input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} required
                placeholder={unitPlaceholders[form.category] || 'unit'} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Target *</label>
              <input className="form-input" type="number" min={1} value={form.target}
                onChange={e => setForm(f => ({ ...f, target: +e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Current Progress</label>
              <input className="form-input" type="number" min={0} value={form.current}
                onChange={e => setForm(f => ({ ...f, current: +e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Deadline</label>
            <input className="form-input" type="date" value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" className="btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-sm" style={{ background: 'var(--gold)', color: '#000', borderColor: 'var(--gold)' }} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DashGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [showModal, setShowModal] = useState(false)
  const [editGoal, setEditGoal] = useState(null)

  async function load() {
    setLoading(true)
    const data = await getMemberGoals({ category: catFilter, status: statusFilter })
    setGoals(data.goals || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [catFilter, statusFilter])

  async function handleSave(form) {
    if (editGoal) {
      await updateMemberGoal(editGoal.id, form)
    } else {
      await createMemberGoal(form)
    }
    load()
  }

  async function handleComplete(id) {
    await updateMemberGoal(id, { status: 'completed', current: goals.find(g => g.id === id)?.target })
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this goal?')) return
    await deleteMemberGoal(id)
    load()
  }

  const allGoals = goals
  const active = allGoals.filter(g => g.status === 'active').length
  const completed = allGoals.filter(g => g.status === 'completed').length
  const missed = allGoals.filter(g => g.status === 'missed').length
  const urgentGoals = allGoals.filter(g => g.status === 'active' && daysUntil(g.deadline) !== null && daysUntil(g.deadline) <= 7)

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 className="page-title">🎯 Goal Planner</h1>
          <p className="page-sub">Set personal targets and track your progress toward MLM milestones</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditGoal(null); setShowModal(true) }}>+ New Goal</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="label">Active Goals</div>
          <div className="value" style={{ fontSize: '22px', color: '#86efac' }}>{active}</div>
          <div className="sub">In progress</div>
        </div>
        <div className="stat-card">
          <div className="label">Completed</div>
          <div className="value" style={{ fontSize: '22px', color: '#93c5fd' }}>{completed}</div>
          <div className="sub">Goals achieved</div>
        </div>
        <div className="stat-card">
          <div className="label">Due This Week</div>
          <div className="value" style={{ fontSize: '22px', color: urgentGoals.length > 0 ? '#fca5a5' : 'var(--cream)' }}>{urgentGoals.length}</div>
          <div className="sub">{urgentGoals.length > 0 ? 'Need attention!' : 'Nothing urgent'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Missed</div>
          <div className="value" style={{ fontSize: '22px', color: missed > 0 ? '#fca5a5' : 'var(--cream)' }}>{missed}</div>
          <div className="sub">Past deadline</div>
        </div>
      </div>

      {urgentGoals.length > 0 && statusFilter !== 'missed' && statusFilter !== 'completed' && (
        <div className="card" style={{ background: '#450a0a', border: '1px solid #991b1b', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, color: '#fca5a5', fontSize: '13px' }}>{urgentGoals.length} goal{urgentGoals.length > 1 ? 's' : ''} due within 7 days</div>
            <div style={{ fontSize: '12px', color: '#fca5a5', opacity: 0.8 }}>{urgentGoals.map(g => g.title).join(' · ')}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(s => (
            <button key={s.key} className="btn-sm"
              style={statusFilter === s.key ? { background: 'var(--gold)', color: '#000', borderColor: 'var(--gold)' } : {}}
              onClick={() => setStatusFilter(s.key)}>{s.label}</button>
          ))}
        </div>
        <select className="form-input" style={{ maxWidth: '170px' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Loading goals…</div>
      ) : goals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
          No goals found.{statusFilter === 'active' ? (
            <> <button className="btn-sm" style={{ marginLeft: '8px' }} onClick={() => { setEditGoal(null); setShowModal(true) }}>Add your first goal</button></>
          ) : null}
        </div>
      ) : (
        goals.map(g => (
          <GoalCard key={g.id} goal={g}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onEdit={g => { setEditGoal(g); setShowModal(true) }}
          />
        ))
      )}

      {showModal && (
        <GoalModal
          goal={editGoal}
          onClose={() => { setShowModal(false); setEditGoal(null) }}
          onSave={handleSave}
        />
      )}
    </DashboardLayout>
  )
}
