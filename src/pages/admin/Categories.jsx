import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../../api/mlmApi'

const BLANK = { name: '', slug: '', parentId: null, description: '', sortOrder: 1, active: true }

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

function CategoryModal({ cat, parents, onSave, onClose }) {
  const [form, setForm] = useState(cat
    ? { name: cat.name, slug: cat.slug, parentId: cat.parentId, description: cat.description, sortOrder: cat.sortOrder, active: cat.active }
    : BLANK)
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleNameChange(v) {
    setForm(f => ({ ...f, name: v, slug: cat ? f.slug : slugify(v) }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({ ...form, sortOrder: parseInt(form.sortOrder) || 1 })
    setSaving(false)
  }

  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 520, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{cat ? 'Edit Category' : 'New Category'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Category Name *</label>
            <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Omega & Fish Oils" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Slug</label>
            <input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="e.g. omega-fish-oils" style={{ ...inp, fontFamily: 'monospace' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Parent Category</label>
            <select value={form.parentId || ''} onChange={e => set('parentId', e.target.value || null)} style={inp}>
              <option value="">— None (top-level) —</option>
              {parents.filter(p => !cat || p.id !== cat.id).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Brief description shown on storefront…" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value)} min={1} style={inp} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
                Active (visible on storefront)
              </label>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            style={{ flex: 1, background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : (cat ? 'Save Changes' : 'Create Category')}
          </button>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function Categories() {
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { getAdminCategories().then(setCats).finally(() => setLoading(false)) }, [])

  async function handleSave(form) {
    if (modal === 'new') {
      const n = await createAdminCategory(form)
      setCats(p => [...p, n])
    } else {
      await updateAdminCategory(modal.id, form)
      setCats(p => p.map(x => x.id === modal.id ? { ...x, ...form } : x))
    }
    setModal(null)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category? Products will be uncategorised.')) return
    setDeleting(id)
    await deleteAdminCategory(id)
    setCats(p => p.filter(x => x.id !== id))
    setDeleting(null)
  }

  async function toggleActive(cat) {
    await updateAdminCategory(cat.id, { active: !cat.active })
    setCats(p => p.map(x => x.id === cat.id ? { ...x, active: !x.active } : x))
  }

  const topLevel = cats.filter(c => !c.parentId)
  const byParent = id => cats.filter(c => c.parentId === id)

  let visible = cats
  if (filter === 'active') visible = cats.filter(c => c.active)
  if (filter === 'inactive') visible = cats.filter(c => !c.active)
  if (search) {
    const q = search.toLowerCase()
    visible = visible.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
  }
  visible = [...visible].sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99))

  const totalProducts = cats.reduce((s, c) => s + c.productCount, 0)

  return (
    <AdminLayout>
      {modal && (
        <CategoryModal
          cat={modal === 'new' ? null : modal}
          parents={topLevel}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>📂 Product Categories</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Organise your catalogue into categories and sub-categories.</div>
          </div>
          <button onClick={() => setModal('new')}
            style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>
            + New Category
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { icon: '📂', label: 'Total Categories', val: cats.length, sub: `${topLevel.length} top-level` },
            { icon: '✅', label: 'Active', val: cats.filter(c => c.active).length, sub: 'visible on store' },
            { icon: '🛍️', label: 'Total Products', val: totalProducts, sub: 'across all categories' },
            { icon: '🔀', label: 'Subcategories', val: cats.filter(c => c.parentId).length, sub: 'nested under parent' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 22 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--bg)', color: filter === f ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories…"
            style={{ marginLeft: 'auto', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text)', fontSize: 13, width: 200 }} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.map(cat => {
              const children = byParent(cat.id)
              const parentName = cat.parentId ? (cats.find(c => c.id === cat.parentId)?.name || '?') : null
              return (
                <div key={cat.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', opacity: cat.active ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        {parentName && <span style={{ fontSize: 11, color: 'var(--text2)' }}>{parentName} /</span>}
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{cat.name}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{cat.slug}</span>
                        {!cat.active && <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 99, background: '#2d1f00', color: '#fbbf24', border: '1px solid #92400e' }}>inactive</span>}
                        {children.length > 0 && <span style={{ fontSize: 11, color: 'var(--text2)' }}>{children.length} sub-cat{children.length !== 1 ? 's' : ''}</span>}
                      </div>
                      {cat.description && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{cat.description}</div>}
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                        🛍️ {cat.productCount} products · sort: {cat.sortOrder}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => toggleActive(cat)}
                        style={{ padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>
                        {cat.active ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => setModal(cat)}
                        style={{ padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(cat.id)} disabled={deleting === cat.id}
                        style={{ padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
                        {deleting === cat.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No categories match.</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
