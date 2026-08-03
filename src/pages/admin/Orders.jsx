import { useState, useMemo, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminOrders, updateOrderStatus, getAdminOrderDetail, addOrderNote, createManualOrder, getAdminMembers } from '../../api/mlmApi'

const PAGE_SIZE = 20
const ALL_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

const STATUS_COLORS = {
  Pending:    { bg: '#78350f22', color: '#fbbf24' },
  Processing: { bg: '#1e3a5f',   color: '#60a5fa' },
  Shipped:    { bg: '#14532d22', color: '#34d399' },
  Delivered:  { bg: '#16a34a33', color: '#4ade80' },
  Cancelled:  { bg: '#7f1d1d22', color: '#f87171' },
}

const TIMELINE_ICONS = { Pending: '🕐', Processing: '⚙️', Shipped: '📦', Delivered: '✅', Cancelled: '❌' }

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#333', color: '#aaa' }
  return (
    <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

function Toast({ message, type = 'success', onClose }) {
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: type === 'error' ? '#7f1d1d' : undefined }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>×</button>
    </div>
  )
}

function exportCsv(orders) {
  const rows = [
    ['Order ID', 'Member', 'Member ID', 'Date', 'Items', 'Total (NOK)', 'PV', 'Status', 'Country'],
    ...orders.map(o => [o.id, o.member, o.memberId, o.date, o.items.join(' | '), o.total, o.pv, o.status, o.shippingCountry]),
  ]
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function OrderDetailDrawer({ orderId, onClose, onStatusChange }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [localNotes, setLocalNotes] = useState([])

  useEffect(() => {
    setLoading(true)
    setDetail(null)
    getAdminOrderDetail(orderId)
      .then(d => { setDetail(d); setNewStatus(d.status); setLocalNotes(d.notes || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  async function handleStatusSave() {
    if (!newStatus || newStatus === detail.status) return
    setUpdating(true)
    try {
      await updateOrderStatus(orderId, newStatus)
      setDetail(d => ({ ...d, status: newStatus }))
      onStatusChange(orderId, newStatus)
    } catch {}
    setUpdating(false)
  }

  async function handleAddNote() {
    if (!note.trim()) return
    setSavingNote(true)
    try {
      const { note: saved } = await addOrderNote(orderId, note.trim())
      setLocalNotes(n => [saved, ...n])
      setNote('')
    } catch {}
    setSavingNote(false)
  }

  const drawerStyle = {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 'min(680px, 100vw)',
    background: 'var(--navy)',
    borderLeft: '1px solid var(--border)',
    zIndex: 1000,
    display: 'flex', flexDirection: 'column',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
    overflowY: 'auto',
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }}
      />
      <div style={drawerStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--navy)', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>Order Detail</div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--cyan)' }}>{orderId}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        {loading && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text2)' }}>Loading…</div>
        )}

        {!loading && detail && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Member info + status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>Member</div>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{detail.member}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '2px' }}>{detail.memberId}</div>
                {detail.memberRank && <div style={{ fontSize: '12px', color: 'var(--gold)' }}>★ {detail.memberRank}</div>}
                {detail.email && <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>{detail.email}</div>}
                {detail.phone && <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{detail.phone}</div>}
              </div>
              <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>Order Info</div>
                <div style={{ marginBottom: '6px' }}><StatusBadge status={detail.status} /></div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>📅 {detail.date}</div>
                <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 700 }}>NOK {detail.total.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: 'var(--cyan)' }}>{detail.pv} PV earned</div>
              </div>
            </div>

            {/* Line Items */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px' }}>Items</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--navy3)', color: 'var(--text2)' }}>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Unit Price</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>PV</th>
                    <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600 }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lineItems.map((item, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--cream)' }}>{item.name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text2)' }}>×{item.qty}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text2)' }}>NOK {item.unitPrice}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--cyan)', fontSize: '12px' }}>{item.pvSubtotal}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>NOK {item.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--navy3)' }}>
                    <td colSpan={3} style={{ padding: '10px 16px', color: 'var(--text2)', fontSize: '12px' }}>Order total</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--cyan)', fontWeight: 700 }}>{detail.pv} PV</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, fontSize: '15px', color: 'var(--cream)' }}>NOK {detail.total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Shipping + Payment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>📍 Shipping Address</div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text)' }}>
                  <div style={{ fontWeight: 600 }}>{detail.shipping.name}</div>
                  <div>{detail.shipping.address1}</div>
                  <div>{detail.shipping.postalCode} {detail.shipping.city}</div>
                  <div>{detail.shipping.country}</div>
                </div>
              </div>
              <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>💳 Payment</div>
                <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '4px', fontWeight: 600 }}>{detail.paymentMethod}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'monospace' }}>{detail.paymentRef}</div>
              </div>
            </div>

            {/* Status Timeline */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '14px' }}>Status Timeline</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {detail.events.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: ev.status === 'Cancelled' ? '#7f1d1d' : 'rgba(34,197,94,0.15)', border: '2px solid ' + (ev.status === 'Cancelled' ? '#f87171' : '#22c55e'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', zIndex: 1 }}>
                        {TIMELINE_ICONS[ev.status] || '•'}
                      </div>
                      {i < detail.events.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 20, background: 'var(--border)' }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < detail.events.length - 1 ? '16px' : '0', paddingTop: '4px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{ev.status}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{ev.timestamp}</div>
                      {ev.note && <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{ev.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Actions */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '14px' }}>Admin Actions</div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Update Status</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    style={{ flex: 1, background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', color: 'var(--text)', fontSize: '13px' }}
                  >
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={handleStatusSave}
                    disabled={updating || newStatus === detail.status}
                    style={{ background: newStatus !== detail.status ? 'var(--cyan)' : 'var(--navy3)', border: 'none', borderRadius: '6px', padding: '8px 18px', color: newStatus !== detail.status ? '#000' : 'var(--text2)', fontWeight: 600, cursor: newStatus !== detail.status ? 'pointer' : 'default', fontSize: '13px', opacity: updating ? 0.6 : 1 }}
                  >
                    {updating ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Internal Note</div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note visible only to admins…"
                  rows={3}
                  style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', color: 'var(--text)', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <div style={{ textAlign: 'right', marginTop: '6px' }}>
                  <button
                    onClick={handleAddNote}
                    disabled={savingNote || !note.trim()}
                    style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 16px', color: 'var(--text)', fontSize: '13px', cursor: 'pointer', opacity: !note.trim() ? 0.5 : 1 }}
                  >
                    {savingNote ? 'Saving…' : 'Add Note'}
                  </button>
                </div>
              </div>
              {localNotes.length > 0 && (
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Notes ({localNotes.length})</div>
                  {localNotes.map((n, i) => (
                    <div key={i} style={{ background: 'var(--navy3)', borderRadius: '6px', padding: '8px 12px', marginBottom: '6px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text)' }}>{n.note}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>{n.author} · {n.timestamp}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  )
}

const MANUAL_ORDER_PRODUCTS = [
  { id: 1, name: 'Omega-3 Arctic Pure',     price: 349, memberPrice: 279, pv: 35 },
  { id: 2, name: 'Nordic Collagen Complex', price: 429, memberPrice: 339, pv: 43 },
  { id: 3, name: 'Vitamin D3 + K2',         price: 249, memberPrice: 199, pv: 25 },
  { id: 4, name: 'Arctic Shilajit',         price: 599, memberPrice: 479, pv: 60 },
  { id: 5, name: 'Nordic Greens Blend',     price: 379, memberPrice: 299, pv: 38 },
  { id: 6, name: 'Focus Formula',           price: 459, memberPrice: 369, pv: 46 },
]

const PAYMENT_METHODS = ['Bank Transfer', 'Card', 'Vipps', 'Klarna', 'Cash on Delivery']
const COUNTRIES = ['Norway', 'Sweden', 'Denmark', 'Finland', 'Germany', 'Netherlands', 'United Kingdom']
const STEPS = ['Member', 'Products', 'Shipping', 'Payment', 'Confirm']

function NewOrderModal({ onClose, onCreated }) {
  const [step, setStep] = useState(0)
  const [memberSearch, setMemberSearch] = useState('')
  const [allMembers, setAllMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [quantities, setQuantities] = useState({})
  const [shipping, setShipping] = useState({ name: '', address: '', city: '', postcode: '', country: 'Norway' })
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminMembers().then(d => setAllMembers(Array.isArray(d) ? d : (d.members || [])))
  }, [])

  const filteredMembers = useMemo(() => {
    const q = memberSearch.toLowerCase()
    const list = q
      ? allMembers.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
      : allMembers
    return list.slice(0, 8)
  }, [allMembers, memberSearch])

  function setQty(id, delta) {
    setQuantities(prev => {
      const next = Math.max(0, (prev[id] || 0) + delta)
      const copy = { ...prev }
      if (next === 0) delete copy[id]
      else copy[id] = next
      return copy
    })
  }

  const cartItems = MANUAL_ORDER_PRODUCTS.filter(p => (quantities[p.id] || 0) > 0).map(p => ({
    ...p,
    qty: quantities[p.id],
    unitPrice: p.memberPrice,
  }))
  const cartTotal = cartItems.reduce((s, i) => s + i.memberPrice * i.qty, 0)
  const cartPV    = cartItems.reduce((s, i) => s + i.pv * i.qty, 0)

  const canNext = step === 0 ? !!selectedMember
    : step === 1 ? cartItems.length > 0
    : step === 2 ? shipping.name.trim() && shipping.city.trim() && shipping.country
    : step === 3 ? !!paymentMethod
    : true

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const items = cartItems.map(i => ({ name: i.name, qty: i.qty, price: i.memberPrice, pv: i.pv }))
      const { order } = await createManualOrder({
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        items,
        shippingAddress: shipping,
        paymentMethod,
      })
      onCreated(order)
      onClose()
    } catch (e) {
      setError('Failed to create order. Please try again.')
    }
    setSubmitting(false)
  }

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }
  const modal   = { background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
  const inp     = { width: '100%', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }
  const label   = { fontSize: '12px', color: 'var(--text2)', marginBottom: '4px', display: 'block' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '17px', marginBottom: '12px' }}>New Manual Order</div>
            {/* Step indicators */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700,
                    background: i < step ? 'var(--gold)' : i === step ? 'var(--cyan)' : 'var(--navy3)',
                    color: i <= step ? '#000' : 'var(--text2)',
                    border: i === step ? '2px solid var(--cyan)' : '1px solid var(--border)',
                  }}>{i < step ? '✓' : i + 1}</div>
                  <span style={{ fontSize: '11px', color: i === step ? 'var(--cyan)' : 'var(--text2)', whiteSpace: 'nowrap' }}>{s}</span>
                  {i < STEPS.length - 1 && <div style={{ width: 16, height: 1, background: 'var(--border)', marginLeft: 2 }} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, marginTop: '-4px' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Step 0: Member */}
          {step === 0 && (
            <>
              <input
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Search by name or member ID…"
                autoFocus
                style={inp}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
                {filteredMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMember(m); if (shipping.name === '') setShipping(s => ({ ...s, name: m.name })) }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                      background: selectedMember?.id === m.id ? 'rgba(34,197,94,0.12)' : 'var(--navy2)',
                      border: selectedMember?.id === m.id ? '1px solid #22c55e' : '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '14px' }}>{m.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{m.id} · {m.rank} · {m.country}</div>
                    </div>
                    {selectedMember?.id === m.id && <span style={{ color: '#22c55e', fontSize: '18px' }}>✓</span>}
                  </button>
                ))}
                {filteredMembers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text2)', fontSize: '13px' }}>No members found</div>
                )}
              </div>
            </>
          )}

          {/* Step 1: Products */}
          {step === 1 && (
            <>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>
                Member pricing applied for <strong style={{ color: 'var(--gold)' }}>{selectedMember?.name}</strong>
              </div>
              {MANUAL_ORDER_PRODUCTS.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--cream)' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}>NOK {p.memberPrice} · {p.pv} PV/unit</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={() => setQty(p.id, -1)} style={{ width: 28, height: 28, borderRadius: '6px', background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: '15px', color: (quantities[p.id] || 0) > 0 ? 'var(--gold)' : 'var(--text2)' }}>
                      {quantities[p.id] || 0}
                    </span>
                    <button onClick={() => setQty(p.id, 1)} style={{ width: 28, height: 28, borderRadius: '6px', background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              ))}
              {cartItems.length > 0 && (
                <div style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid var(--gold)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text2)', fontSize: '13px' }}>{cartItems.length} product{cartItems.length !== 1 ? 's' : ''}, {cartItems.reduce((s,i) => s+i.qty,0)} units</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--gold)' }}>NOK {cartTotal.toLocaleString()}</span>
                    <span style={{ fontSize: '12px', color: 'var(--cyan)', marginLeft: '8px' }}>{cartPV} PV</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={label}>Full Name *</span>
                <input style={inp} value={shipping.name} onChange={e => setShipping(s => ({ ...s, name: e.target.value }))} placeholder="Lars Eriksen" />
              </div>
              <div>
                <span style={label}>Street Address</span>
                <input style={inp} value={shipping.address} onChange={e => setShipping(s => ({ ...s, address: e.target.value }))} placeholder="Karl Johans gate 12" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={label}>City *</span>
                  <input style={inp} value={shipping.city} onChange={e => setShipping(s => ({ ...s, city: e.target.value }))} placeholder="Oslo" />
                </div>
                <div>
                  <span style={label}>Postcode</span>
                  <input style={inp} value={shipping.postcode} onChange={e => setShipping(s => ({ ...s, postcode: e.target.value }))} placeholder="0150" />
                </div>
              </div>
              <div>
                <span style={label}>Country *</span>
                <select style={inp} value={shipping.country} onChange={e => setShipping(s => ({ ...s, country: e.target.value }))}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>Select payment method</div>
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                    background: paymentMethod === m ? 'rgba(96,165,250,0.12)' : 'var(--navy2)',
                    border: paymentMethod === m ? '1px solid var(--cyan)' : '1px solid var(--border)',
                    color: 'var(--text)', fontWeight: paymentMethod === m ? 600 : 400, fontSize: '14px',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>
                    { m === 'Bank Transfer' ? '🏦' : m === 'Card' ? '💳' : m === 'Vipps' ? '📱' : m === 'Klarna' ? '🛍️' : '💵' }
                  </span>
                  {m}
                  {paymentMethod === m && <span style={{ marginLeft: 'auto', color: 'var(--cyan)' }}>✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>Member</div>
                <div style={{ fontWeight: 700, color: 'var(--cream)' }}>{selectedMember?.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{selectedMember?.id} · {selectedMember?.rank}</div>
              </div>
              <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>Items</div>
                {cartItems.map(i => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>{i.name} ×{i.qty}</span>
                    <span style={{ color: 'var(--gold)' }}>NOK {(i.memberPrice * i.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--gold)' }}>NOK {cartTotal.toLocaleString()} <span style={{ color: 'var(--cyan)', fontWeight: 400, fontSize: '12px' }}>· {cartPV} PV</span></span>
                </div>
              </div>
              <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px' }}>Shipping & Payment</div>
                <div style={{ fontSize: '13px', color: 'var(--text)' }}>{shipping.name}, {shipping.city}, {shipping.country}</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                  { paymentMethod === 'Bank Transfer' ? '🏦' : paymentMethod === 'Card' ? '💳' : paymentMethod === 'Vipps' ? '📱' : paymentMethod === 'Klarna' ? '🛍️' : '💵' }
                  {' '}{paymentMethod}
                </div>
              </div>
              {error && <div style={{ background: '#7f1d1d33', border: '1px solid #f87171', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '13px' }}>{error}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <button
            onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}
            style={{ background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              style={{ background: canNext ? 'var(--gold)' : 'var(--navy3)', border: 'none', color: canNext ? '#000' : 'var(--text2)', padding: '9px 24px', borderRadius: '8px', cursor: canNext ? 'pointer' : 'default', fontSize: '14px', fontWeight: 600, opacity: canNext ? 1 : 0.5 }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ background: 'var(--gold)', border: 'none', color: '#000', padding: '9px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'Creating…' : '✓ Create Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort]       = useState({ col: 'date', dir: 'desc' })
  const [page, setPage]       = useState(1)
  const [toast, setToast]     = useState(null)
  const [drawerOrderId, setDrawerOrderId] = useState(null)
  const [showNewOrder, setShowNewOrder]   = useState(false)

  useEffect(() => {
    setLoading(true)
    getAdminOrders().then(d => { setOrders(d.orders || []); setLoading(false) })
  }, [])

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleStatusChange = useCallback((orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    showToast(`Order ${orderId} updated to ${newStatus}`)
  }, [])

  const handleOrderCreated = useCallback((order) => {
    setOrders(prev => [order, ...prev])
    showToast(`Order ${order.id} created for ${order.member}`)
    setDrawerOrderId(order.id)
  }, [])

  const filtered = useMemo(() => {
    let list = orders
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.member.toLowerCase().includes(q) ||
        o.memberId.toLowerCase().includes(q) ||
        (o.shippingCountry || '').toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      let av = a[sort.col], bv = b[sort.col]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
  }, [orders, search, statusFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageOrders = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(col) {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })
    setPage(1)
  }

  function SortTh({ col, label, align = 'left' }) {
    const active = sort.col === col
    return (
      <th onClick={() => toggleSort(col)} style={{ textAlign: align, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
        {label} {active ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
      </th>
    )
  }

  const totalOrders  = filtered.length
  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0)
  const totalPV      = filtered.reduce((s, o) => s + o.pv, 0)
  const pendingCount = filtered.filter(o => ['Pending', 'Processing'].includes(o.status)).length

  return (
    <AdminLayout>
      <div style={{ padding: '24px', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Orders</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowNewOrder(true)}
              style={{ background: 'var(--gold)', border: 'none', color: '#000', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}
            >
              + New Order
            </button>
            <button
              onClick={() => exportCsv(filtered)}
              style={{ background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
            >
              ⬇ Export CSV
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Orders',               value: totalOrders },
            { label: 'Revenue (NOK)',               value: `NOK ${totalRevenue.toLocaleString()}` },
            { label: 'Total PV',                   value: totalPV.toLocaleString() },
            { label: 'Active (Pending/Processing)', value: pendingCount },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cyan)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search order ID, member…"
            style={{ flex: '1 1 220px', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontSize: '14px' }}
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontSize: '14px' }}
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--navy3)', color: 'var(--text2)' }}>
                  <SortTh col="id"              label="Order ID" />
                  <SortTh col="member"          label="Member" />
                  <th>Items</th>
                  <SortTh col="date"            label="Date" />
                  <SortTh col="total"           label="Total" align="right" />
                  <SortTh col="pv"              label="PV" align="right" />
                  <SortTh col="status"          label="Status" />
                  <SortTh col="shippingCountry" label="Country" />
                  <th style={{ textAlign: 'center' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Loading…</td></tr>
                )}
                {!loading && pageOrders.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>No orders match your filters.</td></tr>
                )}
                {!loading && pageOrders.map((order, i) => (
                  <tr
                    key={order.id}
                    onClick={() => setDrawerOrderId(order.id)}
                    style={{ borderTop: '1px solid var(--border)', background: i % 2 === 1 ? 'var(--navy3)' : undefined, cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 1 ? 'var(--navy3)' : ''}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--cyan)', whiteSpace: 'nowrap' }}>{order.id}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{order.member}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{order.memberId}</div>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{order.items.join(', ')}</div>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: 'var(--text2)' }}>{order.date}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600 }}>NOK {order.total.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--cyan)' }}>{order.pv}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={order.status} /></td>
                    <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: '13px' }}>{order.shippingCountry}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setDrawerOrderId(order.id) }}
                        style={{ background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--cyan)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text2)' }}>
              <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', borderRadius: '6px', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                  ‹
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ background: p === page ? 'var(--cyan)' : 'var(--navy3)', border: '1px solid var(--border)', color: p === page ? '#000' : 'var(--text)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                      {p}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', borderRadius: '6px', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>

      {drawerOrderId && (
        <OrderDetailDrawer
          orderId={drawerOrderId}
          onClose={() => setDrawerOrderId(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          onCreated={handleOrderCreated}
        />
      )}
    </AdminLayout>
  )
}
