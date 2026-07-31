import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getLaunchChecklist, updateLaunchItem } from '../../api/mlmApi'

const CATEGORIES = [
  { key: 'infrastructure', label: 'Infrastructure', icon: '🖥️' },
  { key: 'api',            label: 'API & Integrations', icon: '🔌' },
  { key: 'legal',          label: 'Legal & Compliance', icon: '⚖️' },
  { key: 'products',       label: 'Products & Inventory', icon: '🛍️' },
  { key: 'commission',     label: 'Commission & Payouts', icon: '💸' },
  { key: 'member',         label: 'Member Experience', icon: '👥' },
  { key: 'marketing',      label: 'Marketing', icon: '📣' },
]

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
  in_progress:  { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  done:         { label: 'Done',        color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  blocked:      { label: 'Blocked',     color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
}

const OWNER_LABELS = { gary: 'Gary', bjorn: 'Bjørn', both: 'Both' }

export default function LaunchChecklist() {
  const navigate = useNavigate()
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [filterOwner, setFilterOwner] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [notesModal, setNotesModal]   = useState(null)
  const [notesDraft, setNotesDraft]   = useState('')
  const [saving, setSaving]           = useState(null)

  useEffect(() => {
    getLaunchChecklist().then(d => { setItems(d || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function handleStatusChange(id, status) {
    setSaving(id)
    const updated = items.map(i => i.id === id ? { ...i, status } : i)
    setItems(updated)
    await updateLaunchItem(id, { status }).catch(() => {})
    setSaving(null)
  }

  async function handleSaveNotes() {
    if (!notesModal) return
    setSaving(notesModal.id)
    const updated = items.map(i => i.id === notesModal.id ? { ...i, notes: notesDraft } : i)
    setItems(updated)
    await updateLaunchItem(notesModal.id, { notes: notesDraft }).catch(() => {})
    setSaving(null)
    setNotesModal(null)
  }

  function openNotes(item) {
    setNotesDraft(item.notes || '')
    setNotesModal(item)
  }

  const totalItems = items.length
  const doneCount  = items.filter(i => i.status === 'done').length
  const blockedCount = items.filter(i => i.status === 'blocked').length
  const inProgressCount = items.filter(i => i.status === 'in_progress').length
  const readinessPct = totalItems ? Math.round((doneCount / totalItems) * 100) : 0

  const gaugeColor = readinessPct >= 80 ? '#22c55e' : readinessPct >= 50 ? '#f59e0b' : '#ef4444'
  const gaugeLabel = readinessPct >= 80 ? '🟢 Launch Ready' : readinessPct >= 50 ? '🟡 Almost There' : '🔴 Not Ready'

  const filtered = items.filter(i => {
    if (filterCat !== 'all'    && i.category !== filterCat)   return false
    if (filterOwner !== 'all'  && i.owner    !== filterOwner)  return false
    if (filterStatus !== 'all' && i.status   !== filterStatus) return false
    return true
  })

  function catProgress(catKey) {
    const cat = items.filter(i => i.category === catKey)
    if (!cat.length) return 0
    return Math.round((cat.filter(i => i.status === 'done').length / cat.length) * 100)
  }

  function downloadCsv() {
    const header = ['Category', 'Item', 'Owner', 'Status', 'Notes']
    const rows = items.map(i => [
      CATEGORIES.find(c => c.key === i.category)?.label || i.category,
      `"${i.label}"`,
      OWNER_LABELS[i.owner] || i.owner,
      STATUS_CONFIG[i.status]?.label || i.status,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `launch-checklist-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <AdminLayout>
      <p style={{ color: 'var(--text2)', padding: '40px', textAlign: 'center' }}>Loading…</p>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', margin: 0 }}>
          🚀 Launch Checklist
        </h1>
        <button className="btn btn-outline btn-sm" onClick={downloadCsv}>⬇ Export CSV</button>
      </div>

      {/* Readiness gauge */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>Overall Launch Readiness</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: gaugeColor }}>{readinessPct}%</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: gaugeColor, marginTop: '2px' }}>{gaugeLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Items', val: totalItems, c: 'var(--cream)' },
              { label: 'Done', val: doneCount, c: '#22c55e' },
              { label: 'In Progress', val: inProgressCount, c: '#f59e0b' },
              { label: 'Blocked', val: blockedCount, c: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: s.c }}>{s.val}</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--navy3)', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${readinessPct}%`,
            background: `linear-gradient(90deg, ${gaugeColor}bb, ${gaugeColor})`,
            borderRadius: '8px',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Category progress bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {CATEGORIES.map(cat => {
          const pct = catProgress(cat.key)
          const catItems = items.filter(i => i.category === cat.key)
          const done = catItems.filter(i => i.status === 'done').length
          const catColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
          return (
            <div
              key={cat.key}
              className="card"
              onClick={() => setFilterCat(filterCat === cat.key ? 'all' : cat.key)}
              style={{ cursor: 'pointer', border: filterCat === cat.key ? '1px solid #c9a84c55' : '1px solid var(--border)', padding: '14px 16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)' }}>{cat.icon} {cat.label}</span>
                <span style={{ fontSize: '13px', color: catColor, fontWeight: 700 }}>{done}/{catItems.length}</span>
              </div>
              <div style={{ background: 'var(--navy3)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: catColor, borderRadius: '4px', transition: 'width 0.3s' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="input" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 'auto', minWidth: '170px' }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
        </select>
        <select className="input" value={filterOwner} onChange={e => setFilterOwner(e.target.value)} style={{ width: 'auto', minWidth: '130px' }}>
          <option value="all">All Owners</option>
          <option value="gary">Gary</option>
          <option value="bjorn">Bjørn</option>
          <option value="both">Both</option>
        </select>
        <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: '140px' }}>
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize: '12px', color: 'var(--text2)', marginLeft: 'auto' }}>{filtered.length} items</span>
      </div>

      {/* Items table */}
      <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text2)', fontSize: '13px' }}>No items match your filters.</td></tr>
            ) : filtered.map(item => {
              const cat = CATEGORIES.find(c => c.key === item.category)
              const sc  = STATUS_CONFIG[item.status] || STATUS_CONFIG.not_started
              return (
                <tr key={item.id}>
                  <td style={{ maxWidth: '280px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '13px' }}>{item.label}</div>
                    {item.description && <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{item.description}</div>}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{cat?.icon} {cat?.label}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{OWNER_LABELS[item.owner] || item.owner}</td>
                  <td>
                    <select
                      value={item.status}
                      disabled={saving === item.id}
                      onChange={e => handleStatusChange(item.id, e.target.value)}
                      style={{
                        background: sc.bg,
                        color: sc.color,
                        border: `1px solid ${sc.color}55`,
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        minWidth: '110px',
                      }}
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k} style={{ background: '#1a2942', color: '#e2e8f0' }}>{v.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openNotes(item)}
                      style={{ fontSize: '11px', padding: '3px 10px', whiteSpace: 'nowrap' }}
                    >
                      {item.notes ? '✏️ Edit' : '+ Note'}
                    </button>
                    {item.notes && (
                      <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    {item.link && (
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(item.link)} style={{ fontSize: '11px', padding: '3px 10px', whiteSpace: 'nowrap' }}>
                        → Go
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Notes modal */}
      {notesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
            <h3 style={{ color: 'var(--cream)', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Notes</h3>
            <p style={{ color: 'var(--text2)', fontSize: '12px', marginBottom: '14px' }}>{notesModal.label}</p>
            <textarea
              className="input"
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              rows={5}
              placeholder="Add context, blockers, next steps…"
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setNotesModal(null)}>Cancel</button>
              <button className="btn btn-gold btn-sm" onClick={handleSaveNotes} disabled={saving === notesModal.id}>
                {saving === notesModal.id ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
