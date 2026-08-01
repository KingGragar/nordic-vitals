import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getChallenges, createChallenge, updateChallenge, deleteChallenge, getChallengeLeaderboard,
} from '../../api/mlmApi'

const METRICS = [
  { value: 'new_recruits', label: 'New Recruits', unit: 'members' },
  { value: 'personal_pv',  label: 'Personal PV',  unit: 'PV' },
  { value: 'group_gv',     label: 'Group Volume',  unit: 'GV' },
  { value: 'orders',       label: 'Orders Placed', unit: 'orders' },
]

const ELIGIBLE_RANKS = [
  { value: 'all',                      label: 'All Ranks' },
  { value: 'unranked,bronze',          label: 'Unranked & Bronze' },
  { value: 'bronze,silver',            label: 'Bronze & Silver' },
  { value: 'silver,gold,platinum',     label: 'Silver, Gold & Platinum' },
  { value: 'gold,platinum',            label: 'Gold & Platinum' },
]

const STATUS_CFG = {
  active:   { label: 'Active',    bg: '#14532d', color: '#4ade80' },
  upcoming: { label: 'Upcoming',  bg: '#1e3a5f', color: '#60a5fa' },
  ended:    { label: 'Ended',     bg: '#3f1d1d', color: '#f87171' },
  draft:    { label: 'Draft',     bg: '#334155', color: '#94a3b8' },
}

const RANK_EMOJI = { platinum: '💎', gold: '🥇', silver: '🥈', bronze: '🥉', unranked: '⬜' }
const MEDALS = ['🥇', '🥈', '🥉']

const STATUS_TABS = ['all', 'active', 'upcoming', 'ended', 'draft']

const EMPTY_FORM = {
  name: '', description: '', metric: 'new_recruits', target: 10,
  prize: '', prize_icon: '🏆', start_date: '', end_date: '',
  status: 'draft', eligible_ranks: 'all', created_by: 'gary@nordic',
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color,
    }}>{cfg.label}</span>
  )
}

function ProgressBar({ pct, color = '#c9a84c' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.5s' }} />
    </div>
  )
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ChallengeModal({ challenge, onSave, onClose }) {
  const [form, setForm] = useState(challenge ? { ...challenge } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave() {
    if (!form.name.trim() || !form.prize.trim() || !form.start_date || !form.end_date) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const inp = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
    fontSize: 13, boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 17, color: 'var(--text)' }}>{challenge ? 'Edit Challenge' : 'New Challenge'}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
            Challenge Name *
            <input style={{ ...inp, marginTop: 4 }} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. August Recruitment Sprint" />
          </label>

          <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
            Description
            <textarea style={{ ...inp, marginTop: 4, resize: 'vertical', minHeight: 72 }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Explain the challenge rules and how progress is measured…" />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
              Metric *
              <select style={{ ...inp, marginTop: 4 }} value={form.metric} onChange={e => {
                const m = METRICS.find(x => x.value === e.target.value)
                set('metric', e.target.value)
                set('metric_label', m?.label)
                set('metric_unit', m?.unit)
              }}>
                {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
              Target ({METRICS.find(m => m.value === form.metric)?.unit ?? ''}) *
              <input style={{ ...inp, marginTop: 4 }} type="number" min="1" value={form.target} onChange={e => set('target', Number(e.target.value))} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
              Icon
              <input style={{ ...inp, marginTop: 4, textAlign: 'center', fontSize: 18 }} value={form.prize_icon} onChange={e => set('prize_icon', e.target.value)} maxLength={2} />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
              Prize Description *
              <input style={{ ...inp, marginTop: 4 }} value={form.prize} onChange={e => set('prize', e.target.value)} placeholder="e.g. NOK 2 000 cash bonus + Silver fast-track" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
              Start Date *
              <input style={{ ...inp, marginTop: 4 }} type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
              End Date *
              <input style={{ ...inp, marginTop: 4 }} type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
              Status
              <select style={{ ...inp, marginTop: 4 }} value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
              Eligible Ranks
              <select style={{ ...inp, marginTop: 4 }} value={form.eligible_ranks} onChange={e => set('eligible_ranks', e.target.value)}>
                {ELIGIBLE_RANKS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '9px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#1a1200', fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Challenge'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LeaderboardPanel({ challenge, onClose }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChallengeLeaderboard(challenge.id).then(data => { setEntries(data); setLoading(false) })
  }, [challenge.id])

  const metricCfg = METRICS.find(m => m.value === challenge.metric) || METRICS[0]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, marginBottom: 2 }}>{challenge.prize_icon}</div>
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>{challenge.name}</h3>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
              Target: {challenge.target.toLocaleString()} {metricCfg.unit} · {challenge.participant_count} participants
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text2)', fontSize: 14 }}>No participants yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.map((e, i) => (
              <div key={e.member_id} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 80px', gap: 10, alignItems: 'center',
                padding: '10px 14px', borderRadius: 10,
                background: e.winner ? 'rgba(201,168,76,0.12)' : i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: e.winner ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
              }}>
                <div style={{ textAlign: 'center', fontSize: i < 3 ? 18 : 13, fontWeight: 700, color: 'var(--text2)' }}>
                  {i < 3 ? MEDALS[i] : `#${e.rank}`}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {e.name}
                    {RANK_EMOJI[e.member_rank] && <span style={{ fontSize: 11 }}>{RANK_EMOJI[e.member_rank]}</span>}
                    {e.winner && <span style={{ fontSize: 11, background: 'rgba(201,168,76,0.2)', color: '#fcd34d', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>WINNER</span>}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <ProgressBar pct={e.progress_pct} color={e.progress_pct >= 100 ? '#4ade80' : '#c9a84c'} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: e.progress_pct >= 100 ? '#4ade80' : 'var(--text)' }}>
                  {e.value.toLocaleString()} <span style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 400 }}>{metricCfg.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Challenges() {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(null)
  const [showLeaderboard, setShowLeaderboard] = useState(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getChallenges().then(data => { setChallenges(data); setLoading(false) })
  }, [])

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    let list = challenges
    if (statusTab !== 'all') list = list.filter(c => c.status === statusTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.prize.toLowerCase().includes(q))
    }
    return list
  }, [challenges, statusTab, search])

  const kpi = useMemo(() => ({
    total:     challenges.length,
    active:    challenges.filter(c => c.status === 'active').length,
    upcoming:  challenges.filter(c => c.status === 'upcoming').length,
    ended:     challenges.filter(c => c.status === 'ended').length,
    total_participants: challenges.reduce((s, c) => s + (c.participant_count || 0), 0),
  }), [challenges])

  async function handleSave(form) {
    if (showModal?.id) {
      const updated = await updateChallenge(showModal.id, form)
      setChallenges(prev => prev.map(c => c.id === showModal.id ? { ...c, ...updated } : c))
      flash('Challenge updated')
    } else {
      const created = await createChallenge(form)
      setChallenges(prev => [created, ...prev])
      flash('Challenge created')
    }
    setShowModal(null)
  }

  async function handleDelete(id) {
    await deleteChallenge(id)
    setChallenges(prev => prev.filter(c => c.id !== id))
    setShowConfirmDelete(null)
    flash('Challenge deleted')
  }

  const card = {
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px',
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {toast && (
          <div style={{ position: 'fixed', top: 16, right: 16, background: '#166534', color: '#4ade80', border: '1px solid #166534', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
            ✓ {toast}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>🏅 Challenges & Contests</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text2)' }}>Create and manage member competitions to drive engagement and sales</p>
          </div>
          <button onClick={() => setShowModal({})} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: 'var(--gold)', color: '#1a1200', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + New Challenge
          </button>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: kpi.total, icon: '📋' },
            { label: 'Active', value: kpi.active, icon: '🟢' },
            { label: 'Upcoming', value: kpi.upcoming, icon: '📅' },
            { label: 'Ended', value: kpi.ended, icon: '🏁' },
            { label: 'Participants', value: kpi.total_participants.toLocaleString(), icon: '👥' },
          ].map(k => (
            <div key={k.label} style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>{k.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginTop: 4 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {STATUS_TABS.map(t => (
              <button key={t} onClick={() => setStatusTab(t)} style={{
                padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: statusTab === t ? 'var(--gold)' : 'transparent', color: statusTab === t ? '#1a1200' : 'var(--text2)',
              }}>
                {t === 'all' ? 'All' : STATUS_CFG[t]?.label}
              </button>
            ))}
          </div>
          <input
            placeholder="Search challenges…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, width: 200 }}
          />
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)', fontSize: 14 }}>No challenges found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(c => {
              const metricCfg = METRICS.find(m => m.value === c.metric) || METRICS[0]
              return (
                <div key={c.id} style={{ ...card, display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 16, alignItems: 'start' }}>
                  <div style={{ fontSize: 36, lineHeight: 1, textAlign: 'center', paddingTop: 4 }}>{c.prize_icon}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.name}</span>
                      <StatusBadge status={c.status} />
                      {c.winner_announced && <span style={{ fontSize: 11, background: 'rgba(201,168,76,0.15)', color: '#fcd34d', padding: '1px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid rgba(201,168,76,0.3)' }}>WINNER ANNOUNCED</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, lineHeight: 1.5 }}>{c.description?.slice(0, 120)}{c.description?.length > 120 ? '…' : ''}</div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text2)' }}>
                      <span>🎯 {c.target.toLocaleString()} {metricCfg.unit}</span>
                      <span>🏆 {c.prize}</span>
                      <span>📅 {fmtDate(c.start_date)} – {fmtDate(c.end_date)}</span>
                      <span>👥 {c.participant_count} participants</span>
                      <span>👑 {ELIGIBLE_RANKS.find(r => r.value === c.eligible_ranks)?.label ?? c.eligible_ranks}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 100 }}>
                    {(c.status === 'active' || c.status === 'ended') && (
                      <button onClick={() => setShowLeaderboard(c)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>📊 Leaderboard</button>
                    )}
                    <button onClick={() => setShowModal(c)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>✏️ Edit</button>
                    <button onClick={() => setShowConfirmDelete(c)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>🗑️ Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal !== null && <ChallengeModal challenge={showModal?.id ? showModal : null} onSave={handleSave} onClose={() => setShowModal(null)} />}
      {showLeaderboard && <LeaderboardPanel challenge={showLeaderboard} onClose={() => setShowLeaderboard(null)} />}

      {showConfirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text)' }}>Delete Challenge?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
              "{showConfirmDelete.name}" will be permanently removed. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowConfirmDelete(null)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={() => handleDelete(showConfirmDelete.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
