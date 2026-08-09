import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminComplianceWatchlist, updateAdminComplianceWatchlist } from '../../api/mlmApi'

const RISK_STYLES = {
  high:   { bg: '#2d1515', color: '#fca5a5', border: '#991b1b' },
  medium: { bg: '#3b2500', color: '#fbbf24', border: '#d97706' },
  low:    { bg: '#1e1b4b', color: '#a5b4fc', border: '#3730a3' },
}

export default function AdminComplianceWatchlist() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [editId, setEditId] = useState(null)
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminComplianceWatchlist().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function saveEdit(id) {
    setSaving(true)
    await updateAdminComplianceWatchlist(id, { notes: editNotes })
    setData(prev => ({ ...prev, members: prev.members.map(m => m.id === id ? { ...m, notes: editNotes } : m) }))
    setEditId(null)
    setSaving(false)
  }

  async function clearMember(id) {
    await updateAdminComplianceWatchlist(id, { cleared: true })
    setData(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id), cleared: prev.cleared + 1, total: prev.total - 1 }))
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const filtered = !data ? [] : filter === 'all' ? data.members : data.members.filter(m => m.risk === filter)

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  return (
    <AdminLayout>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🚨 Compliance Watchlist</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Flagged members under compliance review — risk levels, triggers, and resolution notes.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Flagged', value: data.total,     color: '#fbbf24' },
            { label: 'High Risk',     value: data.highRisk,  color: '#fca5a5' },
            { label: 'Reviewing',     value: data.reviewing, color: '#a5b4fc' },
            { label: 'Cleared',       value: data.cleared,   color: '#86efac' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'high', 'medium', 'low'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f === 'all' ? 'All' : `${f.charAt(0).toUpperCase() + f.slice(1)} Risk`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No members in this category.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(m => {
              const rs = RISK_STYLES[m.risk] || RISK_STYLES.low
              return (
                <div key={m.id} style={card}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{m.memberId}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, borderRadius: 12, padding: '2px 8px', textTransform: 'capitalize' }}>{m.risk} risk</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>⚡ {m.trigger}</div>
                      {m.reviewer && <div style={{ fontSize: 12, color: 'var(--text2)' }}>Reviewer: {m.reviewer}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Flagged: {m.flaggedAt}</div>
                    </div>
                    <div style={{ flex: '1 1 220px' }}>
                      {editId === m.id ? (
                        <div>
                          <textarea
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            rows={3}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                            <button onClick={() => saveEdit(m.id)} disabled={saving} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: '#166534', color: '#86efac', fontSize: 12, cursor: 'pointer' }}>Save</button>
                            <button onClick={() => setEditId(null)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 13, color: m.notes ? 'var(--text)' : 'var(--text2)', fontStyle: m.notes ? 'normal' : 'italic', marginBottom: 8, minHeight: 40 }}>
                            {m.notes || 'No notes yet.'}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { setEditId(m.id); setEditNotes(m.notes) }} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>Edit notes</button>
                            <button onClick={() => clearMember(m.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #166534', background: 'transparent', color: '#86efac', fontSize: 12, cursor: 'pointer' }}>✓ Clear</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
