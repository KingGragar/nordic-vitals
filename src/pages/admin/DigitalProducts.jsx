import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminDigitalProducts, createAdminDigitalProduct, updateAdminDigitalProduct, deleteAdminDigitalProduct } from '../../api/mlmApi'

const TYPE_ICON = { ebook: '📖', course: '🎓', bundle: '📦', template: '📄', software: '💿' }
const TYPE_COLOR = { ebook: { bg: '#1e3a5f', color: '#93c5fd' }, course: { bg: '#3b1f6e', color: '#c4b5fd' }, bundle: { bg: '#052e16', color: '#86efac' }, template: { bg: '#422006', color: '#fcd34d' }, software: { bg: '#1c1c1c', color: '#9ca3af' } }
const ACCESS_LABEL = { all: 'All visitors', member: 'Members', silver: 'Silver+', gold: 'Gold+', platinum: 'Platinum+', diamond: 'Diamond' }

function ProductModal({ product, onSave, onClose }) {
  const editing = !!product
  const [form, setForm] = useState({
    title: product?.title || '',
    type: product?.type || 'ebook',
    fileSize: product?.fileSize || '',
    format: product?.format || 'PDF',
    price: product?.price ?? 0,
    accessLevel: product?.accessLevel || 'member',
    status: product?.status || 'draft',
  })
  const [saving, setSaving] = useState(false)

  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
  const sel = { ...inp }
  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave({ ...form, price: Number(form.price) })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{editing ? 'Edit Digital Product' : 'Add Digital Product'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Nordic Nutrition Guide 2026" style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={sel}>
                {Object.keys(TYPE_ICON).map(t => <option key={t} value={t}>{TYPE_ICON[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Format</label>
              <select value={form.format} onChange={e => set('format', e.target.value)} style={sel}>
                {['PDF', 'MP4', 'ZIP', 'EPUB', 'MP3', 'EXE'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>File Size</label>
              <input value={form.fileSize} onChange={e => set('fileSize', e.target.value)} placeholder="e.g. 4.2 MB" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Price (NOK, 0 = free)</label>
              <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} style={inp} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Access Level</label>
            <select value={form.accessLevel} onChange={e => set('accessLevel', e.target.value)} style={sel}>
              {Object.entries(ACCESS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={sel}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDigitalProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    try { setProducts(await getAdminDigitalProducts()) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  async function handleSave(data) {
    if (modal?.id) { const u = await updateAdminDigitalProduct(modal.id, data); setProducts(p => p.map(x => x.id === modal.id ? u : x)) }
    else { const n = await createAdminDigitalProduct(data); setProducts(p => [...p, n]) }
  }

  async function handleDelete(id) {
    setDeleting(id)
    await deleteAdminDigitalProduct(id)
    setProducts(p => p.filter(x => x.id !== id))
    setDeleting(null)
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || p.type === typeFilter
    return matchSearch && matchType
  })

  const totalDownloads = products.reduce((s, p) => s + (p.downloads || 0), 0)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const btn = (bg, color) => ({ padding: '6px 14px', borderRadius: 6, border: 'none', background: bg, color, fontWeight: 600, fontSize: 13, cursor: 'pointer' })

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>💿 Digital Products</h1>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Manage downloadable eBooks, courses, and bundles</div>
          </div>
          <button onClick={() => setModal({})} style={{ ...btn('#22c55e', '#fff'), padding: '10px 20px' }}>+ Add Product</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[['📦', 'Total Products', products.length], ['⬇️', 'Total Downloads', totalDownloads.toLocaleString()], ['✅', 'Active', products.filter(p => p.status === 'active').length], ['📝', 'Draft', products.filter(p => p.status === 'draft').length]].map(([icon, label, val]) => (
            <div key={label} style={card}>
              <div style={{ fontSize: 22 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 22, marginTop: 6 }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ flex: 1, minWidth: 180, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', ...Object.keys(TYPE_ICON)].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', background: typeFilter === t ? 'var(--primary, #22c55e)' : 'var(--bg)', color: typeFilter === t ? '#fff' : 'var(--text)', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}>
                {t === 'all' ? 'All' : `${TYPE_ICON[t]} ${t}`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No products found.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filtered.map(p => {
              const tc = TYPE_COLOR[p.type] || TYPE_COLOR.template
              const statusColor = p.status === 'active' ? '#22c55e' : p.status === 'archived' ? '#6b7280' : '#fbbf24'
              return (
                <div key={p.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{TYPE_ICON[p.type] || '📄'}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: tc.color, marginTop: 2, textTransform: 'uppercase', fontWeight: 600 }}>{p.type}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, textTransform: 'uppercase' }}>{p.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[['Format', p.format], ['Size', p.fileSize], ['Price', p.price === 0 ? 'Free' : `NOK ${p.price}`]].map(([label, val]) => (
                      <div key={label} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{label}</div>
                        <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>⬇️ {(p.downloads || 0).toLocaleString()} downloads · {ACCESS_LABEL[p.accessLevel] || p.accessLevel}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setModal(p)} style={btn('var(--bg)', 'var(--text)')}>Edit</button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} style={{ ...btn('#2d0f0f', '#fca5a5'), opacity: deleting === p.id ? 0.5 : 1 }}>Del</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {modal !== null && <ProductModal product={modal?.id ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />}
    </AdminLayout>
  )
}
