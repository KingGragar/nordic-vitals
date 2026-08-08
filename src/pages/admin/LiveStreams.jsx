import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminLiveStreams, createAdminLiveStream, updateAdminLiveStream, deleteAdminLiveStream } from '../../api/mlmApi'

const STATUS_STYLE = {
  live:      { bg: '#2d0f0f', color: '#f87171', border: '#7f1d1d', label: '🔴 Live' },
  scheduled: { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8', label: '🗓 Scheduled' },
  ended:     { bg: '#1c1c1c', color: '#9ca3af', border: '#374151', label: '✅ Ended' },
}

const BLANK = { title: '', host: '', scheduledAt: '', platform: 'YouTube', status: 'scheduled' }

function StreamModal({ stream, onSave, onClose }) {
  const [form, setForm] = useState(stream || BLANK)
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }
  const lbl = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{stream ? 'Edit Stream' : 'Schedule Live Stream'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Stream Title *</label><input required value={form.title} onChange={set('title')} style={inp} placeholder="e.g. Monthly Product Launch" /></div>
          <div><label style={lbl}>Host Name *</label><input required value={form.host} onChange={set('host')} style={inp} placeholder="Host name" /></div>
          <div><label style={lbl}>Scheduled Date & Time *</label><input required type="datetime-local" value={form.scheduledAt?.slice(0,16)} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value + ':00Z' }))} style={inp} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Platform</label>
              <select value={form.platform} onChange={set('platform')} style={inp}>
                {['YouTube', 'Zoom', 'Facebook', 'Instagram', 'TikTok', 'Other'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={form.status} onChange={set('status')} style={inp}>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ padding: '10px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : stream ? 'Save Changes' : 'Schedule Stream'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLiveStreams() {
  const [streams, setStreams] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminLiveStreams().then(setStreams).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    if (modal?.id) {
      const updated = await updateAdminLiveStream(modal.id, form)
      setStreams(s => s.map(x => x.id === modal.id ? { ...x, ...updated } : x))
    } else {
      const created = await createAdminLiveStream(form)
      setStreams(s => [created, ...s])
    }
  }

  async function handleDelete(s) {
    if (!window.confirm(`Delete "${s.title}"?`)) return
    await deleteAdminLiveStream(s.id)
    setStreams(prev => prev.filter(x => x.id !== s.id))
  }

  const filtered = !streams ? [] : filter === 'all' ? streams : streams.filter(s => s.status === filter)
  const liveCount = (streams || []).filter(s => s.status === 'live').length
  const totalViewers = (streams || []).reduce((sum, s) => sum + s.viewers, 0)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🎥 Live Streams</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Manage live shopping events, training streams, and product launches.</div>
          </div>
          <button onClick={() => setModal({})} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Schedule Stream
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Live Now', value: liveCount, accent: liveCount > 0 },
            { label: 'Scheduled', value: (streams || []).filter(s => s.status === 'scheduled').length },
            { label: 'Total Viewers (all time)', value: totalViewers.toLocaleString() },
            { label: 'Total Registrations', value: (streams || []).reduce((s, x) => s + x.registrations, 0).toLocaleString() },
          ].map(s => (
            <div key={s.label} style={{ ...card, borderColor: s.accent ? '#ef4444' : 'var(--border)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.accent ? '#f87171' : 'var(--text)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'live', 'scheduled', 'ended'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {STATUS_STYLE[f]?.label || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No streams found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(s => {
              const st = STATUS_STYLE[s.status] || STATUS_STYLE.ended
              return (
                <div key={s.id} style={{ ...card, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                      Host: {s.host} · {s.platform} · {new Date(s.scheduledAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    {s.status === 'live' && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#f87171' }}>{s.viewers.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>viewers</div>
                      </div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{s.registrations.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>registered</div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: 'nowrap' }}>{st.label}</span>
                    <button onClick={() => setModal(s)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(s)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: '#f87171', fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal !== null && <StreamModal stream={modal?.id ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />}
    </AdminLayout>
  )
}
