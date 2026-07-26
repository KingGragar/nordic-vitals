import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminAutoships, pauseAutoship, resumeAutoship, cancelAutoship } from '../../api/mlmApi'

const STATUS_OPTS = ['all', 'active', 'paused', 'cancelled']

const STATUS_BADGE = {
  active:    { label: 'Active',    color: '#4ade80', bg: 'rgba(34,197,94,0.15)' },
  paused:    { label: 'Paused',    color: '#facc15', bg: 'rgba(234,179,8,0.15)' },
  cancelled: { label: 'Cancelled', color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
}

function StatusBadge({ status }) {
  const b = STATUS_BADGE[status] || STATUS_BADGE.cancelled
  return (
    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: b.color, background: b.bg }}>
      {b.label}
    </span>
  )
}

function KpiCard({ label, value, sub, accent = '#6366f1' }) {
  return (
    <div style={{ background: 'var(--card-bg,rgba(255,255,255,0.05))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent }}>{value}</div>
      {sub && <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function AdminAutoships() {
  const [data, setData] = useState({ items: [], total: 0, active: 0, paused: 0, cancelled: 0, monthlyPv: 0, monthlyRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [toasting, setToasting] = useState('')
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminAutoships({ status, search, page, pageSize: PAGE_SIZE })
      setData(res)
    } catch {
      setToasting('Failed to load autoships')
    } finally {
      setLoading(false)
    }
  }, [status, search, page])

  useEffect(() => { setPage(1) }, [status, search])
  useEffect(() => { load() }, [load])

  const toast = msg => { setToasting(msg); setTimeout(() => setToasting(''), 3000) }

  const handlePause = async id => {
    try { await pauseAutoship(id); toast('Autoship paused'); load() }
    catch { toast('Failed to pause') }
  }
  const handleResume = async id => {
    try { await resumeAutoship(id); toast('Autoship resumed'); load() }
    catch { toast('Failed to resume') }
  }
  const handleCancel = async id => {
    if (!window.confirm('Cancel this autoship? This cannot be undone.')) return
    try { await cancelAutoship(id); toast('Autoship cancelled'); load() }
    catch { toast('Failed to cancel') }
  }

  const exportCsv = () => {
    const header = 'ID,Member,Product,Qty,Frequency,Monthly NOK,Monthly PV,Status,Next Ship,Created'
    const rows = data.items.map(a =>
      [a.id, a.memberName, a.productName, a.qty, a.frequency, a.memberPrice * a.qty, a.totalPv, a.status, a.nextShipDate || '', a.createdAt.split('T')[0]].join(',')
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `autoships-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(data.total / PAGE_SIZE)

  return (
    <AdminLayout>
      <div style={{ padding: '24px 0', maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>♻️ Autoships</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.6, fontSize: 14 }}>Manage recurring member subscriptions</p>
          </div>
          <button onClick={exportCsv} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'inherit', cursor: 'pointer', fontSize: 14 }}>
            ⬇ Export CSV
          </button>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 28 }}>
          <KpiCard label="Active Subscriptions" value={data.active} sub="generating PV monthly" accent="#4ade80" />
          <KpiCard label="Paused" value={data.paused} sub="no PV generated" accent="#facc15" />
          <KpiCard label="Cancelled" value={data.cancelled} sub="all time" accent="#f87171" />
          <KpiCard label="Monthly PV (active)" value={data.monthlyPv} sub="network auto-volume" accent="#818cf8" />
          <KpiCard label="Monthly Revenue (active)" value={`NOK ${data.monthlyRevenue.toLocaleString()}`} sub="autoship only" accent="#34d399" />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search member or product…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '9px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'inherit', fontSize: 14 }}
          />
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'inherit', fontSize: 14 }}
          >
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--card-bg,rgba(255,255,255,0.04))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                  {['Member', 'Product', 'Qty', 'Freq.', 'NOK/mo', 'PV/mo', 'Next Ship', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', fontWeight: 600, opacity: 0.7, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Loading…</td></tr>
                ) : data.items.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No autoships found</td></tr>
                ) : data.items.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{a.memberName}</div>
                      <div style={{ fontSize: 12, opacity: 0.5 }}>{a.memberId}</div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>{a.productName}</td>
                    <td style={{ padding: '11px 14px' }}>{a.qty}</td>
                    <td style={{ padding: '11px 14px', opacity: 0.7 }}>{a.frequency}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 600 }}>{(a.memberPrice * a.qty).toLocaleString()}</td>
                    <td style={{ padding: '11px 14px', color: '#818cf8', fontWeight: 600 }}>{a.totalPv}</td>
                    <td style={{ padding: '11px 14px', opacity: 0.7, whiteSpace: 'nowrap' }}>{a.nextShipDate || '—'}</td>
                    <td style={{ padding: '11px 14px' }}><StatusBadge status={a.status} /></td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {a.status === 'active' && (
                          <button onClick={() => handlePause(a.id)} style={{ padding: '4px 10px', background: 'rgba(234,179,8,0.15)', border: 'none', borderRadius: 6, color: '#facc15', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Pause</button>
                        )}
                        {a.status === 'paused' && (
                          <button onClick={() => handleResume(a.id)} style={{ padding: '4px 10px', background: 'rgba(34,197,94,0.15)', border: 'none', borderRadius: 6, color: '#4ade80', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Resume</button>
                        )}
                        {a.status !== 'cancelled' && (
                          <button onClick={() => handleCancel(a.id)} style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 13 }}>
              <span style={{ opacity: 0.6 }}>Page {page} of {totalPages} · {data.total} total</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: 'inherit', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>←</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: 'inherit', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>→</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toasting && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 24px', color: '#fff', fontWeight: 600, zIndex: 9999, fontSize: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          {toasting}
        </div>
      )}
    </AdminLayout>
  )
}
