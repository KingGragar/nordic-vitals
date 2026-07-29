import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminEvents, createAdminEvent, updateAdminEvent, deleteAdminEvent } from '../../api/mlmApi'

const TYPE_OPTIONS = [
  { value: 'webinar', label: 'Webinar' },
  { value: 'training', label: 'Training' },
  { value: 'team-call', label: 'Team Call' },
  { value: 'product-launch', label: 'Product Launch' },
  { value: 'conference', label: 'Conference' },
]

const STATUS_COLORS = { upcoming: '#22c55e', live: '#f59e0b', past: '#6b7280' }
const TYPE_COLORS = {
  webinar: '#3b82f6', training: '#22c55e', 'team-call': '#a855f7',
  'product-launch': '#f59e0b', conference: '#ec4899',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const BLANK_FORM = {
  title: '', type: 'webinar', description: '', speaker: '', speakerRole: '',
  date: '', duration_min: 60, capacity: 200, mlmt_reward: 0, recording_url: '',
}

function EventModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || BLANK_FORM)
  const isEdit = !!initial?.id

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    onSave({ ...form, recording_url: form.recording_url || null })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cream)', margin: 0 }}>
            {isEdit ? 'Edit Event' : 'Create Event'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Title *', key: 'title', type: 'text', placeholder: 'Event title' },
            { label: 'Speaker', key: 'speaker', type: 'text', placeholder: 'Speaker name' },
            { label: 'Speaker Role', key: 'speakerRole', type: 'text', placeholder: 'e.g. Diamond Leader' },
          ].map(({ label, key, type, placeholder }) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>{label}</span>
              <input
                type={type}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                required={key === 'title'}
                style={{
                  background: 'var(--navy3)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '8px 12px', color: 'var(--cream)',
                  fontSize: '13px', outline: 'none',
                }}
              />
            </label>
          ))}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>Type</span>
            <select
              value={form.type}
              onChange={e => set('type', e.target.value)}
              style={{
                background: 'var(--navy3)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 12px', color: 'var(--cream)', fontSize: '13px',
              }}
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>Description</span>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Event description…"
              style={{
                background: 'var(--navy3)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 12px', color: 'var(--cream)',
                fontSize: '13px', resize: 'vertical', outline: 'none', fontFamily: 'inherit',
              }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>Date & Time (UTC) *</span>
              <input
                type="datetime-local"
                value={form.date ? form.date.slice(0, 16) : ''}
                onChange={e => set('date', e.target.value ? new Date(e.target.value).toISOString() : '')}
                required
                style={{
                  background: 'var(--navy3)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '8px 12px', color: 'var(--cream)', fontSize: '13px',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>Duration (min)</span>
              <input
                type="number" min={15} max={480}
                value={form.duration_min}
                onChange={e => set('duration_min', Number(e.target.value))}
                style={{
                  background: 'var(--navy3)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '8px 12px', color: 'var(--cream)', fontSize: '13px',
                }}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>Capacity</span>
              <input
                type="number" min={1}
                value={form.capacity}
                onChange={e => set('capacity', Number(e.target.value))}
                style={{
                  background: 'var(--navy3)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '8px 12px', color: 'var(--cream)', fontSize: '13px',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>MLMT Reward</span>
              <input
                type="number" min={0}
                value={form.mlmt_reward}
                onChange={e => set('mlmt_reward', Number(e.target.value))}
                style={{
                  background: 'var(--navy3)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '8px 12px', color: 'var(--cream)', fontSize: '13px',
                }}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 600 }}>Recording URL (past events)</span>
            <input
              type="url"
              value={form.recording_url || ''}
              onChange={e => set('recording_url', e.target.value)}
              placeholder="https://…"
              style={{
                background: 'var(--navy3)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 12px', color: 'var(--cream)', fontSize: '13px',
              }}
            />
          </label>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [fetching, setFetching] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchEvents() {
    setFetching(true)
    try {
      const { events: list } = await getAdminEvents({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      setEvents(list)
    } catch {
      //
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { fetchEvents() }, [typeFilter, statusFilter])

  async function handleSave(data) {
    setSaving(true)
    try {
      if (data.id) {
        const { event } = await updateAdminEvent(data.id, data)
        setEvents(prev => prev.map(e => e.id === data.id ? event : e))
        showToast('Event updated.')
      } else {
        const { event } = await createAdminEvent(data)
        setEvents(prev => [event, ...prev])
        showToast('Event created.')
      }
      setModal(null)
    } catch (err) {
      showToast(err.message || 'Save failed', false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAdminEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
      setConfirmDelete(null)
      showToast('Event deleted.')
    } catch (err) {
      showToast(err.message || 'Delete failed', false)
    }
  }

  const upcoming = events.filter(e => e.status === 'upcoming').length
  const past = events.filter(e => e.status === 'past').length
  const totalRegistered = events.filter(e => e.status === 'upcoming').reduce((s, e) => s + e.registered, 0)

  return (
    <AdminLayout>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
          background: toast.ok ? '#166534' : '#7f1d1d',
          border: `1px solid ${toast.ok ? '#22c55e' : '#ef4444'}`,
          color: '#fff', borderRadius: '10px', padding: '12px 20px',
          fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {modal && (
        <EventModal
          initial={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{
            background: 'var(--navy2)', border: '1px solid #ef444440', borderRadius: '14px',
            padding: '28px', maxWidth: '400px', width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ color: 'var(--cream)', margin: '0 0 8px', fontSize: '16px' }}>Delete this event?</h3>
            <p style={{ color: 'var(--text2)', fontSize: '13px', margin: '0 0 20px' }}>
              "{confirmDelete.title}" will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn btn-sm"
                onClick={() => handleDelete(confirmDelete.id)}
                style={{ background: '#ef4444', color: '#fff', border: 'none' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', margin: '0 0 4px' }}>Events & Webinars</h1>
          <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0 }}>Create and manage member events, webinars, and recordings</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}>+ New Event</button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Events', value: events.length, icon: '📅' },
          { label: 'Upcoming', value: upcoming, icon: '🗓️' },
          { label: 'Past', value: past, icon: '📼' },
          { label: 'Registrations', value: totalRegistered.toLocaleString(), icon: '👤' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{
            background: 'var(--navy2)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cream)' }}>{value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            background: 'var(--navy2)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '7px 12px', color: 'var(--cream)', fontSize: '13px',
          }}
        >
          <option value="all">All Types</option>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            background: 'var(--navy2)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '7px 12px', color: 'var(--cream)', fontSize: '13px',
          }}
        >
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
      </div>

      {/* Table */}
      {fetching ? (
        <div style={{ color: 'var(--text2)', textAlign: 'center', padding: '40px' }}>Loading…</div>
      ) : events.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📅</div>
          <div style={{ fontSize: '14px', color: 'var(--cream)' }}>No events yet</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>Click "+ New Event" to create one</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {events.map(ev => {
            const pct = Math.round((ev.registered / ev.capacity) * 100)
            const fillColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e'
            return (
              <div key={ev.id} style={{
                background: 'var(--navy2)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
              }}>
                {/* Type badge */}
                <span style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  background: (TYPE_COLORS[ev.type] || '#6b7280') + '22',
                  color: TYPE_COLORS[ev.type] || '#6b7280',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {TYPE_OPTIONS.find(t => t.value === ev.type)?.label || ev.type}
                </span>

                {/* Title + date */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)', marginBottom: '2px' }}>{ev.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    {formatDate(ev.date)} · {formatTime(ev.date)} · {ev.duration_min} min
                  </div>
                </div>

                {/* Speaker */}
                <div style={{ minWidth: '130px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--cream)', fontWeight: 500 }}>{ev.speaker || '—'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{ev.speakerRole || ''}</div>
                </div>

                {/* Registrations */}
                <div style={{ minWidth: '100px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text2)', marginBottom: '3px' }}>
                    <span>{ev.registered}/{ev.capacity}</span>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--navy3)', borderRadius: '2px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: fillColor, borderRadius: '2px' }} />
                  </div>
                </div>

                {/* Status */}
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px',
                  background: (STATUS_COLORS[ev.status] || '#6b7280') + '20',
                  color: STATUS_COLORS[ev.status] || '#6b7280',
                  whiteSpace: 'nowrap',
                }}>
                  {ev.status}
                </span>

                {/* MLMT */}
                {ev.mlmt_reward > 0 && (
                  <span style={{ fontSize: '11px', color: '#c9a84c', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    +{ev.mlmt_reward} MLMT
                  </span>
                )}

                {/* Recording */}
                {ev.recording_url && (
                  <a href={ev.recording_url} target="_blank" rel="noreferrer"
                    style={{ fontSize: '11px', color: '#3b82f6', whiteSpace: 'nowrap' }}>
                    ▶ Recording
                  </a>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setModal(ev)}
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => setConfirmDelete(ev)}
                    style={{ fontSize: '12px', padding: '5px 10px', background: '#ef444422', color: '#ef4444', border: '1px solid #ef444440' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
