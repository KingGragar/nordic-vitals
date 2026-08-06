import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberAddresses, createMemberAddress, updateMemberAddress, deleteMemberAddress, setDefaultAddress } from '../../api/mlmApi'

const COUNTRIES = ['Norway', 'Sweden', 'Denmark', 'Finland', 'Germany', 'Netherlands', 'United Kingdom', 'France', 'Spain', 'Italy', 'United States', 'Canada', 'Australia']

const EMPTY_FORM = { label: '', firstName: '', lastName: '', company: '', line1: '', line2: '', city: '', state: '', postcode: '', country: 'Norway', phone: '' }

function AddressCard({ addr, onEdit, onDelete, onSetDefault }) {
  const [delConfirm, setDelConfirm] = useState(false)
  return (
    <div style={{ background: 'var(--navy2)', border: `1px solid ${addr.isDefault ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 12, padding: 20, position: 'relative' }}>
      {addr.isDefault && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--gold)', color: '#000', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
          Default
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
        {addr.label || 'Address'}
      </div>
      <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7 }}>
        <div>{addr.firstName} {addr.lastName}</div>
        {addr.company && <div>{addr.company}</div>}
        <div>{addr.line1}</div>
        {addr.line2 && <div>{addr.line2}</div>}
        <div>{addr.postcode} {addr.city}{addr.state ? `, ${addr.state}` : ''}</div>
        <div>{addr.country}</div>
        {addr.phone && <div>📞 {addr.phone}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={() => onEdit(addr)} style={{ padding: '6px 14px', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          ✏️ Edit
        </button>
        {!addr.isDefault && (
          <button onClick={() => onSetDefault(addr.id)} style={{ padding: '6px 14px', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--gold)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            ★ Set Default
          </button>
        )}
        {!addr.isDefault && !delConfirm && (
          <button onClick={() => setDelConfirm(true)} style={{ padding: '6px 14px', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: 6, color: '#fca5a5', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            🗑 Delete
          </button>
        )}
        {delConfirm && (
          <>
            <button onClick={() => { onDelete(addr.id); setDelConfirm(false) }} style={{ padding: '6px 14px', background: '#3b0a0a', border: '1px solid #7f1d1d', borderRadius: 6, color: '#fca5a5', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Confirm Delete
            </button>
            <button onClick={() => setDelConfirm(false)} style={{ padding: '6px 14px', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function AddressForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.line1 || !form.city || !form.postcode || !form.country) return
    onSave(form)
  }

  const field = (label, key, placeholder, required = false, half = false) => (
    <div style={{ flex: half ? '1 1 calc(50% - 6px)' : '1 1 100%', minWidth: half ? 120 : 'auto' }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>{label}{required ? ' *' : ''}</label>
      <input
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '9px 12px', fontSize: 13, boxSizing: 'border-box' }}
      />
    </div>
  )

  return (
    <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>
        {initial?.id ? 'Edit Address' : 'Add New Address'}
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {field('Address Label', 'label', 'e.g. Home, Work, Holiday')}
          {field('First Name', 'firstName', 'First name', true, true)}
          {field('Last Name', 'lastName', 'Last name', true, true)}
          {field('Company', 'company', 'Company (optional)', false)}
          {field('Address Line 1', 'line1', 'Street address', true)}
          {field('Address Line 2', 'line2', 'Apt, suite, unit, etc. (optional)')}
          {field('City', 'city', 'City', true, true)}
          {field('State / Region', 'state', 'State or region', false, true)}
          {field('Postcode', 'postcode', 'Postcode / ZIP', true, true)}
          <div style={{ flex: '1 1 calc(50% - 6px)', minWidth: 120 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Country *</label>
            <select
              value={form.country}
              onChange={e => set('country', e.target.value)}
              required
              style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '9px 12px', fontSize: 13, boxSizing: 'border-box' }}
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {field('Phone', 'phone', '+47 xxx xx xxx', false)}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '10px 24px', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : '💾 Save Address'}
          </button>
          <button type="button" onClick={onCancel} style={{ padding: '10px 18px', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Addresses() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editAddr, setEditAddr] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const r = await getMemberAddresses()
      setAddresses(r.addresses || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave(form) {
    setSaving(true)
    try {
      if (editAddr?.id) {
        await updateMemberAddress(editAddr.id, form)
        setAddresses(prev => prev.map(a => a.id === editAddr.id ? { ...a, ...form } : a))
        showToast('Address updated')
      } else {
        const r = await createMemberAddress(form)
        setAddresses(prev => [...prev, r.address])
        showToast('Address added')
      }
      setShowForm(false)
      setEditAddr(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await deleteMemberAddress(id)
    setAddresses(prev => prev.filter(a => a.id !== id))
    showToast('Address deleted')
  }

  async function handleSetDefault(id) {
    await setDefaultAddress(id)
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
    showToast('Default address updated')
  }

  function startEdit(addr) {
    setEditAddr(addr)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowForm(false)
    setEditAddr(null)
  }

  return (
    <DashboardLayout>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#052e16', color: '#86efac', border: '1px solid #166534', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14 }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>📍 Address Book</h1>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Manage your saved shipping and billing addresses</div>
          </div>
          {!showForm && (
            <button
              onClick={() => { setEditAddr(null); setShowForm(true) }}
              style={{ padding: '10px 20px', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
            >
              + Add Address
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ marginBottom: 24 }}>
            <AddressForm initial={editAddr} onSave={handleSave} onCancel={cancelForm} saving={saving} />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>Loading addresses…</div>
        ) : addresses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No saved addresses yet</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>Add an address to speed up checkout</div>
            {!showForm && (
              <button onClick={() => setShowForm(true)} style={{ padding: '10px 24px', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                + Add Your First Address
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)).map(addr => (
              <AddressCard
                key={addr.id}
                addr={addr}
                onEdit={startEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}

        {addresses.length > 0 && (
          <div style={{ marginTop: 16, color: 'var(--text2)', fontSize: 13 }}>
            {addresses.length} address{addresses.length !== 1 ? 'es' : ''} saved · Default address is used at checkout automatically
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
