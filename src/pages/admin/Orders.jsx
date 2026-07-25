import { useState, useMemo, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminOrders, updateOrderStatus } from '../../api/mlmApi'

const PAGE_SIZE = 20

const ALL_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

const STATUS_COLORS = {
  Pending:    { bg: '#78350f22', color: '#fbbf24' },
  Processing: { bg: '#1e3a5f',  color: '#60a5fa' },
  Shipped:    { bg: '#14532d22', color: '#34d399' },
  Delivered:  { bg: '#16a34a33', color: '#4ade80' },
  Cancelled:  { bg: '#7f1d1d22', color: '#f87171' },
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#333', color: '#aaa' }
  return (
    <span style={{
      padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
      background: s.bg, color: s.color,
    }}>{status}</span>
  )
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

function exportCsv(orders) {
  const rows = [
    ['Order ID', 'Member', 'Member ID', 'Date', 'Items', 'Total (NOK)', 'PV', 'Status', 'Country'],
    ...orders.map(o => [
      o.id, o.member, o.memberId, o.date,
      o.items.join(' | '), o.total, o.pv, o.status, o.shippingCountry,
    ]),
  ]
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export default function AdminOrders() {
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort]         = useState({ col: 'date', dir: 'desc' })
  const [page, setPage]         = useState(1)
  const [toast, setToast]       = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    setLoading(true)
    getAdminOrders().then(d => { setOrders(d.orders || []); setLoading(false) })
  }, [])

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleStatusChange(orderId, newStatus) {
    setUpdatingId(orderId)
    try {
      const { order } = await updateOrderStatus(orderId, newStatus)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: order.status } : o))
      showToast(`Order ${orderId} updated to ${newStatus}`)
    } catch {
      showToast('Failed to update order status', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

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

  // KPI totals over full filtered set
  const totalOrders   = filtered.length
  const totalRevenue  = filtered.reduce((s, o) => s + o.total, 0)
  const totalPV       = filtered.reduce((s, o) => s + o.pv, 0)
  const pendingCount  = filtered.filter(o => ['Pending', 'Processing'].includes(o.status)).length

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
            { label: 'Total Orders',   value: totalOrders },
            { label: 'Revenue (NOK)',  value: `NOK ${totalRevenue.toLocaleString()}` },
            { label: 'Total PV',       value: totalPV.toLocaleString() },
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
                  <SortTh col="id"     label="Order ID" />
                  <SortTh col="member" label="Member" />
                  <th>Items</th>
                  <SortTh col="date"   label="Date" />
                  <SortTh col="total"  label="Total" align="right" />
                  <SortTh col="pv"     label="PV" align="right" />
                  <SortTh col="status" label="Status" />
                  <SortTh col="shippingCountry" label="Country" />
                  <th>Update Status</th>
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
                  <tr key={order.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 1 ? 'var(--navy3)' : undefined }}>
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
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        style={{
                          background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '6px',
                          padding: '4px 8px', color: 'var(--text)', fontSize: '12px', cursor: 'pointer',
                          opacity: updatingId === order.id ? 0.5 : 1,
                        }}
                      >
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
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

        {/* Result count */}
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text2)' }}>
          {filtered.length} order{filtered.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
