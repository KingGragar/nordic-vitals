import { useState, useMemo, useEffect, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminProducts, createProduct, updateProduct, toggleProductActive } from '../../api/mlmApi'

const PAGE_SIZE = 20

const CATEGORIES = ['Omega & Fish Oil', 'Vitamins', 'Beauty & Skin', 'Energy', 'Greens', 'Focus']

const EMPTY_FORM = {
  name: '', tagline: '', category: 'Vitamins', price: '', memberPrice: '', pv: '',
  stock: '', desc: '', ingredients: '',
}

function Toast({ message, type = 'success', onClose }) {
  return (
    <div className="toast" style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      background: type === 'error' ? '#7f1d1d' : undefined,
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>×</button>
    </div>
  )
}

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product
    ? { ...product, ingredients: Array.isArray(product.ingredients) ? product.ingredients.join(', ') : (product.ingredients || '') }
    : { ...EMPTY_FORM }
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const isEdit = !!product

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.category) e.category = 'Required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Must be a positive number'
    if (!form.memberPrice || isNaN(Number(form.memberPrice)) || Number(form.memberPrice) <= 0) e.memberPrice = 'Must be a positive number'
    if (Number(form.memberPrice) >= Number(form.price)) e.memberPrice = 'Must be less than retail price'
    if (!form.pv || isNaN(Number(form.pv)) || Number(form.pv) < 0) e.pv = 'Must be ≥ 0'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    const payload = {
      ...form,
      price: Number(form.price),
      memberPrice: Number(form.memberPrice),
      pv: Number(form.pv),
      stock: Number(form.stock) || 0,
      ingredients: form.ingredients.split(',').map(s => s.trim()).filter(Boolean),
    }
    try {
      if (isEdit) {
        await updateProduct(product.id, payload)
      } else {
        await createProduct(payload)
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'var(--navy)', border: '1px solid var(--border)',
    borderRadius: '6px', padding: '8px 10px', color: 'var(--cream)',
    fontSize: '13px', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px', display: 'block' }
  const errorStyle = { fontSize: '11px', color: '#f87171', marginTop: '3px' }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer' }}>×</button>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>
          {isEdit ? 'Edit Product' : 'Add Product'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Product Name *</label>
              <input style={{ ...inputStyle, borderColor: errors.name ? '#f87171' : undefined }} value={form.name} onChange={set('name')} placeholder="e.g. Arctic Omega-3" />
              {errors.name && <div style={errorStyle}>{errors.name}</div>}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Tagline</label>
              <input style={inputStyle} value={form.tagline} onChange={set('tagline')} placeholder="Short selling point" />
            </div>

            <div>
              <label style={labelStyle}>Category *</label>
              <select style={inputStyle} value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Stock (units)</label>
              <input style={inputStyle} type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="0" />
            </div>

            <div>
              <label style={labelStyle}>Retail Price (NOK) *</label>
              <input style={{ ...inputStyle, borderColor: errors.price ? '#f87171' : undefined }} type="number" min="1" step="1" value={form.price} onChange={set('price')} placeholder="349" />
              {errors.price && <div style={errorStyle}>{errors.price}</div>}
            </div>

            <div>
              <label style={labelStyle}>Member Price (NOK) *</label>
              <input style={{ ...inputStyle, borderColor: errors.memberPrice ? '#f87171' : undefined }} type="number" min="1" step="1" value={form.memberPrice} onChange={set('memberPrice')} placeholder="279" />
              {errors.memberPrice && <div style={errorStyle}>{errors.memberPrice}</div>}
            </div>

            <div>
              <label style={labelStyle}>PV (Personal Volume) *</label>
              <input style={{ ...inputStyle, borderColor: errors.pv ? '#f87171' : undefined }} type="number" min="0" step="1" value={form.pv} onChange={set('pv')} placeholder="35" />
              {errors.pv && <div style={errorStyle}>{errors.pv}</div>}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }} value={form.desc} onChange={set('desc')} placeholder="Product description…" />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Ingredients (comma-separated)</label>
              <input style={inputStyle} value={form.ingredients} onChange={set('ingredients')} placeholder="Fish oil, Vitamin E, Lemon flavour" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-sm" disabled={saving} style={{ background: 'var(--gold)', color: '#000', border: 'none' }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function exportCSV(products) {
  const headers = ['ID', 'Name', 'Category', 'Price (NOK)', 'Member Price (NOK)', 'PV', 'Stock', 'Status']
  const rows = products.map(p => [
    p.id, `"${p.name}"`, `"${p.category}"`, p.price, p.memberPrice, p.pv,
    p.stock ?? 'N/A', p.active ? 'Active' : 'Inactive',
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `nordic-vitals-products-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // null | 'add' | product object
  const [toast, setToast] = useState(null)
  const [toggling, setToggling] = useState(null)

  async function load() {
    try {
      const res = await getAdminProducts()
      setProducts(res.products || [])
    } catch {
      showToast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSave() {
    setModal(null)
    await load()
    showToast(modal === 'add' ? 'Product created' : 'Product updated')
  }

  async function handleToggle(product) {
    setToggling(product.id)
    try {
      await toggleProductActive(product.id)
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: !p.active } : p))
      showToast(`${product.name} ${product.active ? 'deactivated' : 'activated'}`)
    } catch {
      showToast('Toggle failed', 'error')
    } finally {
      setToggling(null)
    }
  }

  const filtered = useMemo(() => {
    let list = products
    if (catFilter !== 'All') list = list.filter(p => p.category === catFilter)
    if (statusFilter === 'Active') list = list.filter(p => p.active)
    if (statusFilter === 'Inactive') list = list.filter(p => !p.active)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q) || (p.tagline || '').toLowerCase().includes(q))
    }
    return list
  }, [products, catFilter, statusFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const activeCount = products.filter(p => p.active).length
  const totalPV = products.filter(p => p.active).reduce((s, p) => s + (p.pv || 0), 0)
  const avgPrice = products.filter(p => p.active).length
    ? Math.round(products.filter(p => p.active).reduce((s, p) => s + (p.price || 0), 0) / activeCount)
    : 0

  const kpis = [
    { label: 'Total Products', value: products.length },
    { label: 'Active', value: activeCount },
    { label: 'Avg Retail Price', value: `NOK ${avgPrice.toLocaleString()}` },
    { label: 'Total Active PV', value: totalPV },
  ]

  const thStyle = {
    padding: '10px 14px', fontSize: '11px', fontWeight: 600,
    color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px',
    borderBottom: '1px solid var(--border)', textAlign: 'left', whiteSpace: 'nowrap',
  }
  const tdStyle = {
    padding: '12px 14px', fontSize: '13px', color: 'var(--text)',
    borderBottom: '1px solid var(--border)',
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>Products</h1>
          <p style={{ fontSize: '13px', color: 'var(--text2)' }}>Manage the Viking Peptides product catalog</p>
        </div>
        <button
          className="btn btn-sm"
          style={{ background: 'var(--gold)', color: '#000', border: 'none', fontWeight: 700 }}
          onClick={() => setModal('add')}
        >
          + Add Product
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '14px', marginBottom: '24px' }}>
        {kpis.map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gold)', marginBottom: '4px' }}>{value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 18px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{
            flex: '1', minWidth: '180px', background: 'var(--navy)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '7px 10px', color: 'var(--cream)', fontSize: '13px',
          }}
          placeholder="Search products…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select
          style={{ background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--text)', fontSize: '13px' }}
          value={catFilter}
          onChange={e => { setCatFilter(e.target.value); setPage(1) }}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          style={{ background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--text)', fontSize: '13px' }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <span style={{ fontSize: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
        </span>
        <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => exportCSV(filtered)}>
          ↓ Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text2)' }}>Loading…</div>
        ) : pageData.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text2)' }}>
            No products match your filters.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Product', 'Category', 'Retail', 'Member', 'PV', 'Stock', 'Status', ''].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map(p => (
                <tr key={p.id} style={{ transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--navy2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{p.name}</div>
                    {p.tagline && <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{p.tagline}</div>}
                  </td>
                  <td style={tdStyle}>
                    <span className="badge" style={{ fontSize: '11px' }}>{p.category}</span>
                  </td>
                  <td style={tdStyle}>NOK {(p.price || 0).toLocaleString()}</td>
                  <td style={tdStyle}>NOK {(p.memberPrice || 0).toLocaleString()}</td>
                  <td style={tdStyle}>{p.pv}</td>
                  <td style={tdStyle}>{p.stock ?? '—'}</td>
                  <td style={tdStyle}>
                    <span className={p.active ? 'badge badge-green' : 'badge badge-red'}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => setModal(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '11px', padding: '4px 8px', opacity: toggling === p.id ? 0.5 : 1 }}
                      disabled={toggling === p.id}
                      onClick={() => handleToggle(p)}
                    >
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
            <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Page {page} / {totalPages}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
          </div>
        )}
      </div>

      {/* Modals */}
      {(modal === 'add' || (modal && typeof modal === 'object')) && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
