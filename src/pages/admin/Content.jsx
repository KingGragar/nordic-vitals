import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminContent, createContentAsset, updateContentAsset, deleteContentAsset } from '../../api/mlmApi'

const CATEGORIES = [
  { value: 'all',        label: 'All Categories' },
  { value: 'training',   label: 'Training' },
  { value: 'product',    label: 'Product Info' },
  { value: 'marketing',  label: 'Marketing' },
  { value: 'brand',      label: 'Brand Assets' },
  { value: 'compliance', label: 'Compliance' },
]

const ACCESS_LEVELS = [
  { value: 'all',      label: 'All Members' },
  { value: 'silver',   label: 'Silver+' },
  { value: 'gold',     label: 'Gold+' },
  { value: 'platinum', label: 'Platinum+' },
  { value: 'diamond',  label: 'Diamond+' },
]

const FILE_ICONS = { pdf: '📄', mp4: '🎬', zip: '🗜️', png: '🖼️', jpg: '🖼️', webp: '🖼️', xlsx: '📊', csv: '📊', pptx: '📋', docx: '📝' }
const CAT_COLORS = { training: { bg: '#052e16', color: '#86efac', border: '#166534' }, product: { bg: '#1e1b4b', color: '#a5b4fc', border: '#3730a3' }, marketing: { bg: '#431407', color: '#fb923c', border: '#9a3412' }, brand: { bg: '#164e63', color: '#67e8f9', border: '#0e7490' }, compliance: { bg: '#1c1917', color: '#d6d3d1', border: '#57534e' } }

const BLANK = { title: '', description: '', category: 'training', fileType: 'pdf', fileSizeMb: '', access: 'all' }

function fileIcon(type) { return FILE_ICONS[type] || '📎' }
function fmtMb(mb) { return mb >= 1 ? `${Number(mb).toFixed(1)} MB` : `${Math.round(mb * 1024)} KB` }
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }

function CatBadge({ cat }) {
  const s = CAT_COLORS[cat] || {}
  const label = CATEGORIES.find(c => c.value === cat)?.label || cat
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{label}</span>
}

function AccessBadge({ access }) {
  const label = ACCESS_LEVELS.find(a => a.value === access)?.label || access
  const isAll = access === 'all'
  return <span style={{ background: isAll ? '#052e16' : '#1c1917', color: isAll ? '#86efac' : '#fcd34d', border: `1px solid ${isAll ? '#166534' : '#92400e'}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{label}</span>
}

export default function AdminContent() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('all')
  const [accessFilter, setAccessFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 12

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const res = await getAdminContent(); setAssets(res.assets || []) } catch {}
    setLoading(false)
  }

  const filtered = assets.filter(a => {
    if (catFilter !== 'all' && a.category !== catFilter) return false
    if (accessFilter !== 'all' && a.access !== accessFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    }
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const totalDownloads = assets.reduce((s, a) => s + a.downloads, 0)
  const activeCount = assets.filter(a => a.active).length
  const totalSizeMb = assets.reduce((s, a) => s + (a.fileSizeMb || 0), 0)

  function openCreate() { setEditTarget(null); setForm(BLANK); setFormErrors({}); setShowForm(true) }
  function openEdit(a) { setEditTarget(a); setForm({ title: a.title, description: a.description, category: a.category, fileType: a.fileType, fileSizeMb: String(a.fileSizeMb), access: a.access }); setFormErrors({}); setShowForm(true) }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.fileSizeMb || isNaN(Number(form.fileSizeMb)) || Number(form.fileSizeMb) <= 0) e.fileSizeMb = 'Enter a positive size'
    return e
  }

  async function handleSave(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setFormErrors(e); return }
    setSaving(true)
    try {
      const payload = { ...form, fileSizeMb: Number(form.fileSizeMb) }
      if (editTarget) await updateContentAsset(editTarget.id, payload)
      else await createContentAsset(payload)
      await load(); setShowForm(false)
    } catch {}
    setSaving(false)
  }

  async function handleToggle(a) {
    setTogglingId(a.id)
    try { await updateContentAsset(a.id, { active: !a.active }); await load() } catch {}
    setTogglingId(null)
  }

  async function handleDelete() {
    setDeleting(true)
    try { await deleteContentAsset(deleteTarget.id); await load(); setDeleteTarget(null) } catch {}
    setDeleting(false)
  }

  function handleChange(field, val) { setForm(f => ({ ...f, [field]: val })); setFormErrors(e => ({ ...e, [field]: '' })) }

  const inp = { background: 'var(--input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '8px 10px', width: '100%', boxSizing: 'border-box', fontSize: 13 }
  const lbl = { display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }

  return (
    <AdminLayout>
      <div style={{ padding: '28px 24px', maxWidth: 1200 }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📁 Content Library</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text2)' }}>Manage training materials, brand assets, and downloadable resources</p>
          </div>
          <button onClick={openCreate} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Upload Asset</button>
        </div>

        {/* stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Assets', val: assets.length, icon: '📁' },
            { label: 'Active', val: activeCount, icon: '✅' },
            { label: 'Total Downloads', val: totalDownloads.toLocaleString(), icon: '⬇️' },
            { label: 'Storage Used', val: fmtMb(totalSizeMb), icon: '💾' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search assets…" style={{ ...inp, width: 200 }} />
          <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }} style={{ ...inp, width: 170 }}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={accessFilter} onChange={e => { setAccessFilter(e.target.value); setPage(1) }} style={{ ...inp, width: 150 }}>
            <option value="all">All Access</option>
            {ACCESS_LEVELS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>

        {/* grid */}
        {loading ? (
          <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Loading…</p>
        ) : visible.length === 0 ? (
          <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>No assets found.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>
            {visible.map(a => (
              <div key={a.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', opacity: a.active ? 1 : 0.55, transition: 'opacity .2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{fileIcon(a.fileType)}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--hover)', borderRadius: 4, padding: '2px 6px' }}>.{a.fileType} · {fmtMb(a.fileSizeMb)}</span>
                    <button onClick={() => handleToggle(a)} disabled={togglingId === a.id} title={a.active ? 'Disable' : 'Enable'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text2)' }}>{a.active ? '🟢' : '⚫'}</button>
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{a.title}</div>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{a.description}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <CatBadge cat={a.category} />
                  <AccessBadge access={a.access} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text2)' }}>
                  <span>⬇️ {a.downloads.toLocaleString()} downloads · {fmtDate(a.addedAt)}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontSize: 12 }}>Edit</button>
                    <button onClick={() => setDeleteTarget(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 12 }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{ background: page === i + 1 ? '#2563eb' : 'var(--card)', color: page === i + 1 ? '#fff' : 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>{i + 1}</button>
            ))}
          </div>
        )}

        {/* create/edit modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowForm(false)}>
            <form onClick={e => e.stopPropagation()} onSubmit={handleSave} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 500, width: '100%' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 17 }}>{editTarget ? 'Edit Asset' : 'Upload Asset'}</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={lbl}>Title *</label>
                  <input value={form.title} onChange={e => handleChange('title', e.target.value)} style={inp} placeholder="e.g. Brand Guidelines 2026" />
                  {formErrors.title && <span style={{ color: '#f87171', fontSize: 11 }}>{formErrors.title}</span>}
                </div>
                <div>
                  <label style={lbl}>Description</label>
                  <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="Short description visible to members" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lbl}>Category</label>
                    <select value={form.category} onChange={e => handleChange('category', e.target.value)} style={inp}>
                      {CATEGORIES.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>File Type</label>
                    <select value={form.fileType} onChange={e => handleChange('fileType', e.target.value)} style={inp}>
                      {['pdf', 'mp4', 'zip', 'pptx', 'docx', 'xlsx', 'png', 'jpg'].map(t => <option key={t} value={t}>.{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lbl}>File Size (MB) *</label>
                    <input type="number" min="0.01" step="0.01" value={form.fileSizeMb} onChange={e => handleChange('fileSizeMb', e.target.value)} style={inp} placeholder="e.g. 4.2" />
                    {formErrors.fileSizeMb && <span style={{ color: '#f87171', fontSize: 11 }}>{formErrors.fileSizeMb}</span>}
                  </div>
                  <div>
                    <label style={lbl}>Access Level</label>
                    <select value={form.access} onChange={e => handleChange('access', e.target.value)} style={inp}>
                      {ACCESS_LEVELS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 18px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Asset'}</button>
              </div>
            </form>
          </div>
        )}

        {/* delete confirm */}
        {deleteTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setDeleteTarget(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 420, width: '100%' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>Delete Asset?</h2>
              <p style={{ color: 'var(--text2)', margin: '0 0 20px', fontSize: 13 }}><strong>{deleteTarget.title}</strong> will be permanently removed and members will lose access.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleteTarget(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 18px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.7 : 1 }}>{deleting ? 'Deleting…' : 'Delete'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
