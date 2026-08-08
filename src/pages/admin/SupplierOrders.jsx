import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminSupplierOrders, createAdminSupplierOrder,
  updateAdminSupplierOrderStatus, deleteAdminSupplierOrder,
} from '../../api/mlmApi'

const STATUS_COLORS = {
  draft:     { bg: '#1e2030', color: '#94a3b8', border: '#334155' },
  pending:   { bg: '#2a2010', color: '#fbbf24', border: '#d97706' },
  ordered:   { bg: '#0a1628', color: '#60a5fa', border: '#1d4ed8' },
  received:  { bg: '#052e16', color: '#86efac', border: '#166534' },
  cancelled: { bg: '#2d1515', color: '#fca5a5', border: '#991b1b' },
}

const BLANK = { vendorId: '', vendorName: '', expectedDate: '', notes: '', items: [] }

export default function AdminSupplierOrders() {
  const [orders, setOrders] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminSupplierOrders().then(setOrders).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = !orders ? [] : filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const totals = orders ? {
    draft: orders.filter(o => o.status === 'draft').length,
    pending: orders.filter(o => o.status === 'pending').length,
    ordered: orders.filter(o => o.status === 'ordered').length,
    received: orders.filter(o => o.status === 'received').length,
  } : {}

  async function handleCreate() {
    if (!form.vendorName) return
    setSaving(true)
    const created = await createAdminSupplierOrder(form)
    setOrders(prev => [created, ...(prev || [])])
    setModal(null)
    setForm(BLANK)
    setSaving(false)
  }

  async function changeStatus(id, status) {
    await updateAdminSupplierOrderStatus(id, status)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function remove(id) {
    await deleteAdminSupplierOrder(id)
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📦 Supplier Orders</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Create and track purchase orders sent to vendors.</div>
          </div>
          <button onClick={() => { setForm(BLANK); setModal('create') }} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + New PO
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Draft', value: totals.draft || 0, color: '#94a3b8' },
            { label: 'Pending', value: totals.pending || 0, color: '#fbbf24' },
            { label: 'Ordered', value: totals.ordered || 0, color: '#60a5fa' },
            { label: 'Received', value: totals.received || 0, color: '#86efac' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'draft', 'pending', 'ordered', 'received', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No orders found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(o => {
              const sc = STATUS_COLORS[o.status] || STATUS_COLORS.draft
              return (
                <div key={o.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 220px' }}>
                    <div style={{ fontWeight: 700 }}>PO-{o.poNumber} — {o.vendorName}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{o.itemCount} items · Expected {o.expectedDate}</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 90 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>€{o.totalValue?.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>Total</div>
                  </div>
                  <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, textTransform: 'capitalize' }}>{o.status}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {o.status === 'draft' && (
                      <button onClick={() => changeStatus(o.id, 'pending')} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#1d4ed8', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Send</button>
                    )}
                    {o.status === 'pending' && (
                      <button onClick={() => changeStatus(o.id, 'ordered')} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#166534', color: '#86efac', fontSize: 12, cursor: 'pointer' }}>Confirm</button>
                    )}
                    {o.status === 'ordered' && (
                      <button onClick={() => changeStatus(o.id, 'received')} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#166534', color: '#86efac', fontSize: 12, cursor: 'pointer' }}>Mark Received</button>
                    )}
                    {['draft', 'pending'].includes(o.status) && (
                      <button onClick={() => remove(o.id)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {modal === 'create' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>New Purchase Order</div>
              {[
                { label: 'Vendor Name', key: 'vendorName', placeholder: 'e.g. Nordic Pharma AS' },
                { label: 'Expected Delivery', key: 'expectedDate', placeholder: 'YYYY-MM-DD', type: 'date' },
                { label: 'Notes', key: 'notes', placeholder: 'Internal notes…' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{f.label}</div>
                  <input
                    type={f.type || 'text'}
                    value={form[f.key]}
                    placeholder={f.placeholder}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleCreate} disabled={saving || !form.vendorName} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Creating…' : 'Create PO'}
                </button>
                <button onClick={() => setModal(null)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
