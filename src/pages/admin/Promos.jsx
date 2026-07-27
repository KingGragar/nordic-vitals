import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminPromos, createPromoCode, togglePromoCode, deletePromoCode } from '../../api/mlmApi'

const BLANK = { code: '', description: '', type: 'percent', value: '', minOrder: '', maxUses: '', expiresAt: '' }

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Promos() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await getAdminPromos()
      setPromos(res.promos || [])
    } catch {}
    setLoading(false)
  }

  const filtered = promos.filter(p => {
    if (statusFilter === 'active' && !p.active) return false
    if (statusFilter === 'inactive' && p.active) return false
    if (search) {
      const q = search.toLowerCase()
      return p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    }
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const totalSaved = promos.reduce((s, p) => s + (p.totalSaved || 0), 0)
  const activeCount = promos.filter(p => p.active).length
  const totalUses   = promos.reduce((s, p) => s + (p.usedCount || 0), 0)

  function handleFormChange(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    setFormErrors(e => ({ ...e, [field]: '' }))
  }

  function validateForm() {
    const e = {}
    if (!form.code.trim()) e.code = 'Required'
    else if (!/^[A-Z0-9_-]{2,20}$/i.test(form.code.trim())) e.code = 'Code must be 2-20 alphanumeric characters'
    if (!form.value || isNaN(Number(form.value)) || Number(form.value) <= 0) e.value = 'Enter a positive number'
    if (form.type === 'percent' && Number(form.value) > 100) e.value = 'Percentage cannot exceed 100'
    return e
  }

  async function handleCreate(ev) {
    ev.preventDefault()
    const e = validateForm()
    if (Object.keys(e).length) { setFormErrors(e); return }
    setSaving(true)
    try {
      await createPromoCode({ ...form, code: form.code.toUpperCase().trim() })
      await load()
      setShowCreate(false)
      setForm(BLANK)
      setFormErrors({})
    } catch {}
    setSaving(false)
  }

  async function handleToggle(p) {
    try {
      await togglePromoCode(p.id, !p.active)
      setPromos(ps => ps.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
    } catch {}
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePromoCode(deleteTarget.id)
      setPromos(ps => ps.filter(p => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {}
    setDeleting(false)
  }

  const inp = (field, placeholder, type = 'text', extra = {}) => (
    <input
      type={type}
      className="input"
      placeholder={placeholder}
      value={form[field]}
      onChange={e => handleFormChange(field, e.target.value)}
      {...extra}
    />
  )

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--cream)', margin: 0 }}>Promo Codes</h1>
        <button className="btn btn-gold" onClick={() => { setShowCreate(true); setForm(BLANK); setFormErrors({}) }}>
          + Create Code
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Codes', value: promos.length, icon: '🏷️' },
          { label: 'Active Codes', value: activeCount, icon: '✅' },
          { label: 'Total Uses', value: totalUses.toLocaleString(), icon: '📊' },
          { label: 'Total Saved', value: `NOK ${totalSaved.toLocaleString()}`, icon: '💰' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{k.icon}</div>
            <div style={{ color: 'var(--cream)', fontWeight: '800', fontSize: '20px', marginBottom: '4px' }}>{k.value}</div>
            <div style={{ color: 'var(--text2)', fontSize: '12px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          placeholder="Search codes…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ flex: '1', minWidth: '180px' }}
        />
        <select className="input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: '130px' }}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>Loading…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>No promo codes found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Code', 'Description', 'Discount', 'Min Order', 'Uses', 'Expires', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text2)', fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--gold)', whiteSpace: 'nowrap' }}>{p.code}</td>
                  <td style={{ padding: '12px', color: 'var(--cream)', maxWidth: '200px' }}>{p.description || '—'}</td>
                  <td style={{ padding: '12px', color: 'var(--cream)', whiteSpace: 'nowrap' }}>
                    {p.type === 'percent' ? `${p.value}%` : `NOK ${p.value}`} off
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {p.minOrder > 0 ? `NOK ${p.minOrder}` : 'None'}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ''}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDate(p.expiresAt)}</td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                      background: p.active ? 'rgba(52,211,153,0.15)' : 'rgba(107,114,128,0.15)',
                      color: p.active ? '#34d399' : '#9ca3af',
                    }}>
                      {p.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => handleToggle(p)}
                      >
                        {p.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}
                        onClick={() => setDeleteTarget(p)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text2)', fontSize: '13px' }}>
              {filtered.length} code{filtered.length !== 1 ? 's' : ''} · Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: 'var(--cream)', fontWeight: '800', fontSize: '18px', marginBottom: '24px' }}>Create Promo Code</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '14px' }}>
                <label className="label-text">Code <span style={{ color: '#f87171' }}>*</span></label>
                {inp('code', 'e.g. SUMMER20')}
                {formErrors.code && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{formErrors.code}</div>}
                <div style={{ color: 'var(--text2)', fontSize: '11px', marginTop: '4px' }}>Alphanumeric, 2-20 characters. Will be uppercased.</div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="label-text">Description</label>
                {inp('description', 'e.g. Summer sale 20% off')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="label-text">Discount Type <span style={{ color: '#f87171' }}>*</span></label>
                  <select className="input" value={form.type} onChange={e => handleFormChange('type', e.target.value)}>
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (NOK)</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">{form.type === 'percent' ? 'Percentage' : 'Amount (NOK)'} <span style={{ color: '#f87171' }}>*</span></label>
                  {inp('value', form.type === 'percent' ? 'e.g. 10' : 'e.g. 100', 'number', { min: '0.01', step: '0.01' })}
                  {formErrors.value && <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>{formErrors.value}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="label-text">Minimum Order (NOK)</label>
                  {inp('minOrder', '0 = no minimum', 'number', { min: '0' })}
                </div>
                <div>
                  <label className="label-text">Max Uses</label>
                  {inp('maxUses', 'Blank = unlimited', 'number', { min: '1' })}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="label-text">Expiry Date</label>
                {inp('expiresAt', '', 'date')}
                <div style={{ color: 'var(--text2)', fontSize: '11px', marginTop: '4px' }}>Leave blank for no expiry.</div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={saving}>
                  {saving ? 'Creating…' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🗑️</div>
            <h2 style={{ color: 'var(--cream)', fontWeight: '800', fontSize: '18px', marginBottom: '12px' }}>Delete Promo Code?</h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '8px', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>{deleteTarget.code}</strong>?
            </p>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '24px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: deleting ? 0.7 : 1 }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
