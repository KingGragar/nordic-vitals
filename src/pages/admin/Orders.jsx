import { useState, useMemo, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminOrders, updateOrderStatus, getAdminOrderDetail, addOrderNote } from '../../api/mlmApi'

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

export default function AdminOrders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort]       = useState({ col: 'date', dir: 'desc' })
  const [page, setPage]       = useState(1)
  const [toast, setToast]     = useState(null)
  const [drawerOrderId, setDrawerOrderId] = useState(null)

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
          <button
            onClick={() => exportCsv(filtered)}
            style={{ background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            ⬇ Export CSV
          </button>
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
    </AdminLayout>
  )
}
