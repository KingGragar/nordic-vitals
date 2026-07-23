import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { PAYOUT_QUEUE } from '../../data/mock'
import { getPayoutQueue } from '../../api/mlmApi'

const PAGE_SIZE = 20

function Toast({ message, onClose }) {
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>×</button>
    </div>
  )
}

function exportCsv(rows, filename) {
  const headers = ['Request ID', 'Member', 'Member ID', 'Amount (MLMT)', 'Requested', 'Method', 'IBAN']
  const data = rows.map(p => [p.id, p.member, p.memberId, p.amount, p.requested, p.method, p.iban])
  const csv = [headers, ...data]
    .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '12px' }}>
      <button
        className="btn btn-outline btn-sm"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        style={{ opacity: page === 1 ? 0.4 : 1 }}
      >
        ‹ Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          className="btn btn-sm"
          onClick={() => onPage(p)}
          style={{
            background: p === page ? 'var(--navy3)' : 'transparent',
            border: `1px solid ${p === page ? 'var(--gold)' : 'var(--border)'}`,
            color: p === page ? 'var(--gold)' : 'var(--text2)',
            minWidth: '32px',
          }}
        >
          {p}
        </button>
      ))}
      <button
        className="btn btn-outline btn-sm"
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        style={{ opacity: page === totalPages ? 0.4 : 1 }}
      >
        Next ›
      </button>
    </div>
  )
}

export default function Payouts() {
  const [allPending, setAllPending] = useState(PAYOUT_QUEUE.map(p => ({ ...p, checked: false })))
  const [processed, setProcessed]   = useState([])
  const [activeTab, setActiveTab]   = useState('pending')
  const [toast, setToast]           = useState(null)

  const [search, setSearch]         = useState('')
  const [methodFilter, setMethodFilter] = useState('All')
  const [pendingPage, setPendingPage]   = useState(1)
  const [processedPage, setProcessedPage] = useState(1)

  useEffect(() => {
    getPayoutQueue()
      .then(d => { if (d?.queue?.length) setAllPending(d.queue.map(p => ({ ...p, checked: false }))) })
      .catch(() => {})
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function approve(id) {
    const item = allPending.find(p => p.id === id)
    if (!item) return
    const processedDate = new Date().toISOString().slice(0, 10)
    setAllPending(prev => prev.filter(p => p.id !== id))
    setProcessed(prev => [...prev, { ...item, processedDate }])
    showToast(`Payment of ${item.amount.toLocaleString()} MLMT approved for ${item.member}`)
  }

  function reject(id) {
    const item = allPending.find(p => p.id === id)
    if (!item) return
    setAllPending(prev => prev.filter(p => p.id !== id))
    showToast(`Payment rejected for ${item.member}`)
  }

  function toggleCheck(id) {
    setAllPending(prev => prev.map(p => p.id === id ? { ...p, checked: !p.checked } : p))
  }

  function selectAllVisible() {
    const visibleIds = new Set(filteredPending.map(p => p.id))
    const allChecked = filteredPending.every(p => p.checked)
    setAllPending(prev => prev.map(p => visibleIds.has(p.id) ? { ...p, checked: !allChecked } : p))
  }

  function approveSelected() {
    const selected = allPending.filter(p => p.checked)
    if (selected.length === 0) return
    const processedDate = new Date().toISOString().slice(0, 10)
    setAllPending(prev => prev.filter(p => !p.checked))
    setProcessed(prev => [...prev, ...selected.map(s => ({ ...s, processedDate }))])
    showToast(`${selected.length} payment${selected.length > 1 ? 's' : ''} approved`)
  }

  // Filtering
  const filteredPending = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allPending.filter(p => {
      const matchSearch = !q
        || p.member.toLowerCase().includes(q)
        || p.memberId.toLowerCase().includes(q)
        || p.id.toLowerCase().includes(q)
      const matchMethod = methodFilter === 'All' || p.method === methodFilter
      return matchSearch && matchMethod
    })
  }, [allPending, search, methodFilter])

  const filteredProcessed = useMemo(() => {
    const q = search.trim().toLowerCase()
    return processed.filter(p => {
      const matchSearch = !q
        || p.member.toLowerCase().includes(q)
        || p.memberId.toLowerCase().includes(q)
        || p.id.toLowerCase().includes(q)
      const matchMethod = methodFilter === 'All' || p.method === methodFilter
      return matchSearch && matchMethod
    })
  }, [processed, search, methodFilter])

  // Pagination for pending
  const pendingTotalPages = Math.max(1, Math.ceil(filteredPending.length / PAGE_SIZE))
  const pendingPage_clamped = Math.min(pendingPage, pendingTotalPages)
  const pendingSlice = filteredPending.slice((pendingPage_clamped - 1) * PAGE_SIZE, pendingPage_clamped * PAGE_SIZE)

  // Pagination for processed
  const processedTotalPages = Math.max(1, Math.ceil(filteredProcessed.length / PAGE_SIZE))
  const processedPage_clamped = Math.min(processedPage, processedTotalPages)
  const processedSlice = filteredProcessed.slice((processedPage_clamped - 1) * PAGE_SIZE, processedPage_clamped * PAGE_SIZE)

  const checkedCount = allPending.filter(p => p.checked).length
  const visibleAllChecked = filteredPending.length > 0 && filteredPending.every(p => p.checked)

  const methods = ['All', ...Array.from(new Set(allPending.map(p => p.method).filter(Boolean)))]

  const tabStyle = active => ({
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 600,
    background: active ? 'var(--navy3)' : 'transparent',
    border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
    color: active ? 'var(--gold)' : 'var(--text2)',
    borderRadius: '8px',
    cursor: 'pointer',
  })

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cream)' }}>Payout Queue</h1>
          <span className="badge badge-yellow">{allPending.length} pending</span>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            const rows = activeTab === 'pending' ? filteredPending : filteredProcessed
            const date = new Date().toISOString().slice(0, 10)
            exportCsv(rows, `nordic-vitals-payouts-${activeTab}-${date}.csv`)
          }}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button style={tabStyle(activeTab === 'pending')} onClick={() => { setActiveTab('pending'); setPendingPage(1) }}>
          Pending ({allPending.length})
        </button>
        <button style={tabStyle(activeTab === 'processed')} onClick={() => { setActiveTab('processed'); setProcessedPage(1) }}>
          Processed ({processed.length})
        </button>
      </div>

      {/* Search + filter row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          style={{ maxWidth: '280px' }}
          placeholder="Search name, ID, or request…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPendingPage(1); setProcessedPage(1) }}
        />
        <select
          className="input"
          style={{ maxWidth: '180px' }}
          value={methodFilter}
          onChange={e => { setMethodFilter(e.target.value); setPendingPage(1); setProcessedPage(1) }}
        >
          {methods.map(m => <option key={m} value={m}>{m === 'All' ? 'All Methods' : m}</option>)}
        </select>
        {(search || methodFilter !== 'All') && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => { setSearch(''); setMethodFilter('All'); setPendingPage(1); setProcessedPage(1) }}
          >
            Clear filters
          </button>
        )}
      </div>

      {activeTab === 'pending' && (
        <>
          {/* Bulk actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={selectAllVisible}>
              {visibleAllChecked ? '☐ Deselect All' : '☑ Select All'}
            </button>
            <button
              className="btn btn-green btn-sm"
              onClick={approveSelected}
              disabled={checkedCount === 0}
              style={{ opacity: checkedCount === 0 ? 0.5 : 1 }}
            >
              Approve Selected ({checkedCount})
            </button>
            {filteredPending.length !== allPending.length && (
              <span style={{ fontSize: '12px', color: 'var(--text2)' }}>
                Showing {filteredPending.length} of {allPending.length}
              </span>
            )}
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto', marginBottom: '8px' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Member</th>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Requested</th>
                  <th>Method</th>
                  <th>IBAN</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingSlice.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>
                      {search || methodFilter !== 'All' ? 'No payouts match your filter.' : 'No pending payouts.'}
                    </td>
                  </tr>
                )}
                {pendingSlice.map(p => (
                  <tr key={p.id} style={{ background: p.checked ? 'rgba(201,168,76,0.05)' : undefined }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={p.checked}
                        onChange={() => toggleCheck(p.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--gold)' }}
                      />
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--cream)' }}>{p.member}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text2)' }}>{p.memberId}</td>
                    <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{p.amount.toLocaleString()} MLMT</td>
                    <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{p.requested}</td>
                    <td style={{ fontSize: '13px' }}>{p.method}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text2)' }}>{p.iban}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-green btn-sm" onClick={() => approve(p.id)}>✓ Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => reject(p.id)}>✗ Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={pendingPage_clamped} totalPages={pendingTotalPages} onPage={setPendingPage} />
        </>
      )}

      {activeTab === 'processed' && (
        <>
          <div className="card" style={{ padding: 0, overflowX: 'auto', marginBottom: '8px' }}>
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Requested</th>
                  <th>Processed</th>
                  <th>Method</th>
                  <th>IBAN</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {processedSlice.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>
                      {search || methodFilter !== 'All' ? 'No payouts match your filter.' : 'No processed payouts yet.'}
                    </td>
                  </tr>
                )}
                {processedSlice.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--cream)' }}>{p.member}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text2)' }}>{p.memberId}</td>
                    <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{p.amount.toLocaleString()} MLMT</td>
                    <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{p.requested}</td>
                    <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{p.processedDate}</td>
                    <td style={{ fontSize: '13px' }}>{p.method}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text2)' }}>{p.iban}</td>
                    <td><span className="badge badge-green">Paid</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={processedPage_clamped} totalPages={processedTotalPages} onPage={setProcessedPage} />
        </>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
