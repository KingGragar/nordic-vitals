import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import {
  getProspects, createProspect, updateProspect,
  deleteProspect, logProspectInteraction,
} from '../../api/mlmApi'

const STAGES = ['All', 'New', 'Interested', 'Presented', 'Enrolled', 'Declined']

const STAGE_BADGE = {
  New:        'badge-blue',
  Interested: 'badge-yellow',
  Presented:  'badge-gold',
  Enrolled:   'badge-green',
  Declined:   'badge-grey',
}

const CONTACT_METHODS = ['WhatsApp', 'Phone', 'Email', 'Instagram', 'Facebook', 'In Person', 'Other']

const SITE_BASE = import.meta.env.VITE_SITE_URL || 'https://nordic-vitals.vercel.app'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FORM = { name: '', contact: 'WhatsApp', phone: '', stage: 'New', followUp: '', notes: '' }

export default function Prospects() {
  const { user } = useAuth()
  const memberId = user?.memberId ?? 'NV-10042'
  const referralUrl = `${SITE_BASE}/ref/${memberId}`

  const [prospects, setProspects] = useState([])
  const [loading, setLoading]     = useState(true)
  const [stageTab, setStageTab]   = useState('All')
  const [search, setSearch]       = useState('')
  const [toast, setToast]         = useState(null)

  // Add / Edit modal
  const [modal, setModal]           = useState(null) // null | 'add' | 'edit'
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)

  // Log interaction modal
  const [logModal, setLogModal]     = useState(null) // prospect id or null
  const [logNote, setLogNote]       = useState('')

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    getProspects(memberId)
      .then(list => { setProspects(list || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [memberId])

  function showToast(msg, err = false) {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 2500)
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditTarget(null)
    setModal('add')
  }

  function openEdit(p) {
    setForm({
      name: p.name, contact: p.contact, phone: p.phone || '',
      stage: p.stage, followUp: p.followUp || '', notes: p.notes || '',
    })
    setEditTarget(p)
    setModal('edit')
  }

  async function handleSave() {
    if (!form.name.trim()) { showToast('Name is required', true); return }
    setSaving(true)
    try {
      if (modal === 'add') {
        const created = await createProspect(memberId, { ...form, lastContact: today() })
        setProspects(prev => [created, ...prev])
        showToast(`${form.name} added to prospects`)
      } else {
        const updated = await updateProspect(memberId, editTarget.id, form)
        setProspects(prev => prev.map(p => p.id === editTarget.id ? { ...p, ...updated } : p))
        showToast('Prospect updated')
      }
      setModal(null)
    } catch {
      showToast('Failed to save', true)
    } finally {
      setSaving(false)
    }
  }

  async function handleStageChange(prospectId, newStage) {
    try {
      await updateProspect(memberId, prospectId, { stage: newStage, lastContact: today() })
      setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, stage: newStage, lastContact: today() } : p))
    } catch {
      showToast('Failed to update stage', true)
    }
  }

  async function handleLogInteraction() {
    if (!logNote.trim()) { showToast('Add a note first', true); return }
    try {
      await logProspectInteraction(memberId, logModal, { note: logNote, date: today() })
      setProspects(prev => prev.map(p =>
        p.id === logModal
          ? { ...p, lastContact: today(), notes: `${today()}: ${logNote}\n${p.notes || ''}`.trim() }
          : p
      ))
      showToast('Interaction logged')
      setLogModal(null)
      setLogNote('')
    } catch {
      showToast('Failed to log interaction', true)
    }
  }

  async function handleDelete() {
    try {
      await deleteProspect(memberId, deleteTarget.id)
      setProspects(prev => prev.filter(p => p.id !== deleteTarget.id))
      showToast(`${deleteTarget.name} removed`)
      setDeleteTarget(null)
    } catch {
      showToast('Failed to delete', true)
    }
  }

  function handleWaShare(p) {
    const msg = encodeURIComponent(`Hey ${p.name.split(' ')[0]}! Here's my Nordic Vitals referral link – join my team and get started with premium supplements: ${referralUrl}`)
    window.open(`https://wa.me/${(p.phone || '').replace(/\s/g, '')}?text=${msg}`, '_blank')
  }

  const filtered = prospects
    .filter(p => stageTab === 'All' || p.stage === stageTab)
    .filter(p => {
      const q = search.toLowerCase()
      return !q || p.name.toLowerCase().includes(q) || (p.phone || '').includes(q) || (p.notes || '').toLowerCase().includes(q)
    })

  const total      = prospects.length
  const active     = prospects.filter(p => p.stage !== 'Declined' && p.stage !== 'Enrolled').length
  const enrolled   = prospects.filter(p => p.stage === 'Enrolled').length
  const declined   = prospects.filter(p => p.stage === 'Declined').length
  const convRate   = total > 0 ? Math.round((enrolled / total) * 100) : 0

  // follow-up due today or overdue
  const dueToday = prospects.filter(p => p.followUp && p.followUp <= today() && p.stage !== 'Enrolled' && p.stage !== 'Declined').length

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)' }}>Prospect Tracker</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '4px' }}>Track your leads and move them through the pipeline</p>
        </div>
        <button className="btn btn-gold" onClick={openAdd}>+ Add Prospect</button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="label">Total</div>
          <div className="value">{total}</div>
          <div className="sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="label">Active Pipeline</div>
          <div className="value" style={{ color: 'var(--gold)' }}>{active}</div>
          <div className="sub">In progress</div>
        </div>
        <div className="stat-card">
          <div className="label">Enrolled</div>
          <div className="value" style={{ color: '#86efac' }}>{enrolled}</div>
          <div className="sub">Converted</div>
        </div>
        <div className="stat-card">
          <div className="label">Conv. Rate</div>
          <div className="value" style={{ color: convRate >= 20 ? '#86efac' : 'var(--cream)' }}>{convRate}%</div>
          <div className="sub">{declined} declined</div>
        </div>
        <div className="stat-card" style={{ borderColor: dueToday > 0 ? 'var(--gold)' : 'var(--border)' }}>
          <div className="label">Follow-Ups Due</div>
          <div className="value" style={{ color: dueToday > 0 ? 'var(--gold)' : 'var(--cream)' }}>{dueToday}</div>
          <div className="sub">Today or overdue</div>
        </div>
      </div>

      {/* Search + stage tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          placeholder="Search prospects…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '280px' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {STAGES.map(s => (
            <button
              key={s}
              onClick={() => setStageTab(s)}
              className="btn btn-sm"
              style={{
                background: stageTab === s ? 'var(--gold)' : 'transparent',
                color: stageTab === s ? 'var(--navy)' : 'var(--text2)',
                border: `1px solid ${stageTab === s ? 'var(--gold)' : 'var(--border)'}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Prospect table */}
      <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)', fontSize: '14px' }}>
            {total === 0
              ? 'No prospects yet — click "Add Prospect" to start tracking your pipeline.'
              : 'No prospects match your filters.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Stage</th>
                  <th>Last Contact</th>
                  <th>Follow-Up</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const overdue = p.followUp && p.followUp < today() && p.stage !== 'Enrolled' && p.stage !== 'Declined'
                  const dueNow  = p.followUp && p.followUp === today() && p.stage !== 'Enrolled' && p.stage !== 'Declined'
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{p.name}</div>
                        {p.phone && <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{p.phone}</div>}
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{p.contact}</td>
                      <td>
                        <select
                          value={p.stage}
                          onChange={e => handleStageChange(p.id, e.target.value)}
                          style={{
                            background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '6px',
                            color: 'var(--cream)', fontSize: '12px', padding: '4px 8px', cursor: 'pointer',
                          }}
                        >
                          {STAGES.filter(s => s !== 'All').map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{p.lastContact || '—'}</td>
                      <td>
                        {p.followUp ? (
                          <span style={{ fontSize: '12px', color: overdue ? '#fca5a5' : dueNow ? 'var(--gold)' : 'var(--text2)', fontWeight: overdue || dueNow ? 700 : 400 }}>
                            {overdue ? '⚠ ' : dueNow ? '● ' : ''}{p.followUp}
                          </span>
                        ) : <span style={{ color: 'var(--text2)', fontSize: '12px' }}>—</span>}
                      </td>
                      <td style={{ maxWidth: '180px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text2)', whiteSpace: 'pre-wrap', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {p.notes || '—'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button className="btn btn-sm btn-outline" onClick={() => { setLogModal(p.id); setLogNote('') }} title="Log interaction">📝</button>
                          <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)} title="Edit">✏️</button>
                          {p.contact === 'WhatsApp' && p.phone && (
                            <button className="btn btn-sm btn-outline" onClick={() => handleWaShare(p)} title="Share via WhatsApp">📱</button>
                          )}
                          <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(p)} title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '10px' }}>
        Showing {filtered.length} of {total} prospects
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>
              {modal === 'add' ? 'Add New Prospect' : `Edit — ${editTarget?.name}`}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label-text">Full Name *</label>
                <input className="input" placeholder="e.g. Ingrid Solberg" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label-text">Contact Method</label>
                  <select className="input" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}>
                    {CONTACT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">Stage</label>
                  <select className="input" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                    {STAGES.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-text">Phone / WhatsApp</label>
                <input className="input" placeholder="+47 900 00 000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label-text">Follow-Up Date</label>
                <input className="input" type="date" value={form.followUp} onChange={e => setForm(f => ({ ...f, followUp: e.target.value }))} />
              </div>
              <div>
                <label className="label-text">Notes</label>
                <textarea className="input" rows={3} placeholder="What did you discuss? What are their interests?" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : modal === 'add' ? 'Add Prospect' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Log interaction modal */}
      {logModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '420px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)', marginBottom: '8px' }}>Log Interaction</h2>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
              Log a call, message, or meeting with {prospects.find(p => p.id === logModal)?.name}.
            </p>
            <textarea
              className="input"
              rows={4}
              placeholder="What happened? What did you discuss? Next steps?"
              value={logNote}
              onChange={e => setLogNote(e.target.value)}
              style={{ resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => { setLogModal(null); setLogNote('') }}>Cancel</button>
              <button className="btn btn-gold" onClick={handleLogInteraction}>Log & Update Last Contact</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '8px' }}>Remove Prospect?</h2>
            <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '20px' }}>
              Remove <strong style={{ color: 'var(--cream)' }}>{deleteTarget.name}</strong> from your prospect list? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" style={{ background: toast.err ? '#7f1d1d' : undefined }}>{toast.msg}</div>
      )}
    </DashboardLayout>
  )
}
