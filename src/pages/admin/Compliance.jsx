import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getComplianceStats, getComplianceChecklist,
  updateChecklistItem, getComplianceDocs, deleteComplianceDoc,
} from '../../api/mlmApi'

const STATUS_META = {
  done:    { label: 'Done',    color: '#22c55e', bg: '#f0fdf4' },
  pending: { label: 'Pending', color: '#f59e0b', bg: '#fffbeb' },
  review:  { label: 'Review',  color: '#3b82f6', bg: '#eff6ff' },
  failed:  { label: 'Failed',  color: '#ef4444', bg: '#fef2f2' },
}

const DOC_CAT_COLOR = {
  IDS: '#8b5cf6', Legal: '#3b82f6', GDPR: '#10b981', Product: '#f59e0b', Financial: '#ef4444',
}

const CATEGORIES = ['All', 'Documentation', 'Marketing', 'Operations', 'Financial', 'Regulatory']

function KpiCard({ label, value, sub, color = '#6366f1' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '18px 22px', minWidth: 160 }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function TierBar({ tier, maxPct }) {
  const barW = `${(tier.pctParticipants / maxPct) * 100}%`
  const color = tier.pctParticipants > 30 ? '#6366f1' : tier.pctParticipants > 10 ? '#8b5cf6' : '#a78bfa'
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: '#374151', fontWeight: 500 }}>{tier.label}</span>
        <span style={{ color: '#6b7280' }}>{tier.pctParticipants}% of participants · Avg {tier.avgNok.toLocaleString()} NOK</span>
      </div>
      <div style={{ background: '#f3f4f6', borderRadius: 4, height: 10, overflow: 'hidden' }}>
        <div style={{ width: barW, background: color, height: '100%', borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

export default function Compliance() {
  const [tab, setTab] = useState('ids')
  const [stats, setStats] = useState(null)
  const [checklist, setChecklist] = useState([])
  const [docs, setDocs] = useState([])
  const [catFilter, setCatFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [docCatFilter, setDocCatFilter] = useState('All')
  const [editItem, setEditItem] = useState(null)
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState('done')
  const [deleteDocId, setDeleteDocId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getComplianceStats().then(setStats)
    getComplianceChecklist().then(setChecklist)
    getComplianceDocs().then(setDocs)
  }, [])

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function saveEdit() {
    setSaving(true)
    try {
      const updated = await updateChecklistItem(editItem.id, { status: editStatus, notes: editNotes })
      setChecklist(prev => prev.map(i => i.id === editItem.id ? { ...i, ...updated } : i))
      setEditItem(null)
      showToast('Item updated')
    } catch {
      showToast('Save failed', false)
    } finally { setSaving(false) }
  }

  async function confirmDeleteDoc() {
    try {
      await deleteComplianceDoc(deleteDocId)
      setDocs(prev => prev.filter(d => d.id !== deleteDocId))
      setDeleteDocId(null)
      showToast('Document removed')
    } catch {
      showToast('Delete failed', false)
    }
  }

  function exportChecklist() {
    const rows = [['ID', 'Category', 'Item', 'Status', 'Notes']]
    checklist.forEach(i => rows.push([i.id, i.category, i.label, i.status, i.notes]))
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `compliance-checklist-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const doneCnt    = checklist.filter(i => i.status === 'done').length
  const pendingCnt = checklist.filter(i => i.status === 'pending').length
  const reviewCnt  = checklist.filter(i => i.status === 'review').length
  const failedCnt  = checklist.filter(i => i.status === 'failed').length
  const score      = checklist.length ? Math.round((doneCnt / checklist.length) * 100) : 0

  const filteredChecklist = checklist
    .filter(i => catFilter === 'All' || i.category === catFilter)
    .filter(i => statusFilter === 'all' || i.status === statusFilter)

  const docCats = ['All', ...Array.from(new Set(docs.map(d => d.category)))]
  const filteredDocs = docs.filter(d => docCatFilter === 'All' || d.category === docCatFilter)

  const maxPct = stats ? Math.max(...stats.incomeTiers.map(t => t.pctParticipants)) : 1

  const TABS = [
    { id: 'ids',       label: '📊 Income Disclosure' },
    { id: 'checklist', label: '✅ Compliance Checklist' },
    { id: 'docs',      label: '📁 Document Vault' },
  ]

  return (
    <AdminLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>⚖️ Compliance Center</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
            Income Disclosure Statement · Regulatory checklist · Document vault
          </p>
        </div>

        {/* KPI row */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Compliance Score"   value={`${score}%`}       sub={`${doneCnt} of ${checklist.length} items done`} color={score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'} />
          <KpiCard label="Pending Items"      value={pendingCnt}        sub="awaiting action"    color="#f59e0b" />
          <KpiCard label="Under Review"       value={reviewCnt}         sub="in progress"        color="#3b82f6" />
          <KpiCard label="Failed / Overdue"   value={failedCnt}         sub="need attention"     color="#ef4444" />
          <KpiCard label="Documents on File"  value={docs.length}       sub="in vault"           color="#8b5cf6" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#6366f1' : '#6b7280',
              borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent',
              fontSize: 14, marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Income Disclosure Statement ── */}
        {tab === 'ids' && stats && (
          <div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Income Disclosure Statement</h2>
                  <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Period: {stats.reportPeriod} · {stats.totalParticipants.toLocaleString()} total participants</div>
                </div>
                <button onClick={() => window.print()} style={{
                  padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                }}>🖨️ Print / Export PDF</button>
              </div>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 18px', flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Active Earners</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.activeEarners.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{((stats.activeEarners / stats.totalParticipants) * 100).toFixed(1)}% of participants</div>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 18px', flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Median Annual Earnings</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.medianAnnualEarnings.toLocaleString()} NOK</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>among active earners</div>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 18px', flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Average Annual Earnings</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.avgAnnualEarnings.toLocaleString()} NOK</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>among active earners</div>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 18px', flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Top 1% Earnings</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.topPercentEarnings.toLocaleString()} NOK</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>gross annual</div>
                </div>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Earnings Distribution</h3>
              {stats.incomeTiers.map(tier => (
                <TierBar key={tier.label} tier={tier} maxPct={maxPct} />
              ))}

              <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#854d0e' }}>
                ⚠️ <strong>Required Disclaimer:</strong> {stats.disclaimer}
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, fontSize: 13, color: '#166534' }}>
              <strong>Legal note:</strong> This IDS must be updated at least annually and referenced in all recruitment materials per Norwegian Forbrukerrådet guidance and the EU Unfair Commercial Practices Directive. Publish the current version at <code>/income-disclosure</code> on the public site.
            </div>
          </div>
        )}

        {/* ── Compliance Checklist ── */}
        {tab === 'checklist' && (
          <div>
            {/* Summary bar */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Overall progress</div>
                <div style={{ background: '#f3f4f6', borderRadius: 999, height: 10, width: 240, overflow: 'hidden' }}>
                  <div style={{ width: `${score}%`, background: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444', height: '100%', borderRadius: 999, transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{score}% complete</div>
              </div>
              {Object.entries(STATUS_META).map(([key, { label, color }]) => {
                const cnt = checklist.filter(i => i.status === key).length
                return <div key={key} style={{ fontSize: 13 }}><span style={{ color, fontWeight: 700 }}>{cnt}</span> <span style={{ color: '#6b7280' }}>{label}</span></div>
              })}
              <button onClick={exportChecklist} style={{ marginLeft: 'auto', padding: '7px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>⬇️ Export CSV</button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)} style={{
                    padding: '5px 12px', borderRadius: 999, border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 12,
                    background: catFilter === c ? '#6366f1' : '#f9fafb', color: catFilter === c ? '#fff' : '#374151',
                  }}>{c}</button>
                ))}
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, marginLeft: 'auto' }}>
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_META).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredChecklist.map(item => {
                const sm = STATUS_META[item.status] || STATUS_META.pending
                return (
                  <div key={item.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 9, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ minWidth: 8, width: 8, height: 8, borderRadius: '50%', background: sm.color, marginTop: 6 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 2 }}>{item.label}</div>
                      {item.notes && <div style={{ fontSize: 12, color: '#6b7280' }}>{item.notes}</div>}
                    </div>
                    <span style={{ background: sm.bg, color: sm.color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{sm.label}</span>
                    <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '3px 10px', borderRadius: 999, fontSize: 12, whiteSpace: 'nowrap' }}>{item.category}</span>
                    <button onClick={() => { setEditItem(item); setEditStatus(item.status); setEditNotes(item.notes) }} style={{
                      padding: '4px 10px', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
                    }}>Edit</button>
                  </div>
                )
              })}
              {filteredChecklist.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>No items match your filters.</div>
              )}
            </div>
          </div>
        )}

        {/* ── Document Vault ── */}
        {tab === 'docs' && (
          <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {docCats.map(c => (
                  <button key={c} onClick={() => setDocCatFilter(c)} style={{
                    padding: '5px 12px', borderRadius: 999, border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 12,
                    background: docCatFilter === c ? '#6366f1' : '#f9fafb', color: docCatFilter === c ? '#fff' : '#374151',
                  }}>{c}</button>
                ))}
              </div>
              <button style={{ marginLeft: 'auto', padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                ⬆️ Upload Document
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
              {filteredDocs.map(doc => (
                <div key={doc.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ fontSize: 28 }}>{doc.name.endsWith('.pdf') ? '📄' : doc.name.endsWith('.docx') ? '📝' : '📎'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', wordBreak: 'break-word', marginBottom: 4 }}>{doc.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{doc.size} · {doc.uploadedAt}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Uploaded by {doc.uploader}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                    <span style={{
                      background: DOC_CAT_COLOR[doc.category] ? DOC_CAT_COLOR[doc.category] + '20' : '#f3f4f6',
                      color: DOC_CAT_COLOR[doc.category] || '#374151',
                      padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    }}>{doc.category}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 12, textDecoration: 'none', color: '#374151' }}>⬇️ Download</a>
                      <button onClick={() => setDeleteDocId(doc.id)} style={{ padding: '5px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#ef4444' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredDocs.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>No documents in this category.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit checklist item modal */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Edit Compliance Item</h3>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 14 }}>{editItem.label}</div>
            <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>Status</label>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 14, marginBottom: 14 }}>
              {Object.entries(STATUS_META).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>Notes</label>
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditItem(null)} style={{ padding: '8px 18px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={saveEdit} disabled={saving} style={{ padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete doc confirm modal */}
      {deleteDocId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Delete Document?</h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px' }}>This action cannot be undone. The document will be permanently removed from the vault.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteDocId(null)} style={{ padding: '8px 18px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={confirmDeleteDoc} style={{ padding: '8px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 14 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, background: toast.ok ? '#22c55e' : '#ef4444', color: '#fff', padding: '12px 20px', borderRadius: 9, fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </AdminLayout>
  )
}
