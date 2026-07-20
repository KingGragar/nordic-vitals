import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { PAYOUT_QUEUE } from '../../data/mock'
import { getPayoutQueue } from '../../api/mlmApi'

function Toast({ message, onClose }) {
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>×</button>
    </div>
  )
}

export default function Payouts() {
  const [pending, setPending]     = useState(PAYOUT_QUEUE.map(p => ({ ...p, checked: false })))
  const [processed, setProcessed] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [toast, setToast]         = useState(null)

  useEffect(() => {
    getPayoutQueue()
      .then(d => { if (d?.queue?.length) setPending(d.queue.map(p => ({ ...p, checked: false }))) })
      .catch(() => {})
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function approve(id) {
    const item = pending.find(p => p.id === id)
    if (!item) return
    const processedDate = new Date().toISOString().slice(0, 10)
    setPending(prev => prev.filter(p => p.id !== id))
    setProcessed(prev => [...prev, { ...item, processedDate }])
    showToast(`Payment of ${item.amount.toLocaleString()} MLMT approved for ${item.member}`)
  }

  function reject(id) {
    const item = pending.find(p => p.id === id)
    if (!item) return
    setPending(prev => prev.filter(p => p.id !== id))
    showToast(`Payment rejected for ${item.member}`)
  }

  function toggleCheck(id) {
    setPending(prev => prev.map(p => p.id === id ? { ...p, checked: !p.checked } : p))
  }

  function selectAll() {
    const allChecked = pending.every(p => p.checked)
    setPending(prev => prev.map(p => ({ ...p, checked: !allChecked })))
  }

  function approveSelected() {
    const selected = pending.filter(p => p.checked)
    if (selected.length === 0) return
    const processedDate = new Date().toISOString().slice(0, 10)
    setPending(prev => prev.filter(p => !p.checked))
    setProcessed(prev => [...prev, ...selected.map(s => ({ ...s, processedDate }))])
    showToast(`${selected.length} payment${selected.length > 1 ? 's' : ''} approved`)
  }

  const checkedCount = pending.filter(p => p.checked).length

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cream)' }}>
          Payout Queue
        </h1>
        <span className="badge badge-yellow">{pending.length} pending</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button style={tabStyle(activeTab === 'pending')} onClick={() => setActiveTab('pending')}>
          Pending ({pending.length})
        </button>
        <button style={tabStyle(activeTab === 'processed')} onClick={() => setActiveTab('processed')}>
          Processed ({processed.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <>
          {/* Bulk actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={selectAll}
            >
              {pending.every(p => p.checked) && pending.length > 0 ? '☐ Deselect All' : '☑ Select All'}
            </button>
            <button
              className="btn btn-green btn-sm"
              onClick={approveSelected}
              disabled={checkedCount === 0}
              style={{ opacity: checkedCount === 0 ? 0.5 : 1 }}
            >
              Approve Selected ({checkedCount})
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto', marginBottom: '16px' }}>
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
                {pending.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>
                      No pending payouts.
                    </td>
                  </tr>
                )}
                {pending.map(p => (
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
                        <button className="btn btn-green btn-sm" onClick={() => approve(p.id)}>
                          ✓ Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => reject(p.id)}>
                          ✗ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline btn-sm" onClick={() => showToast('Exported')}>
              Export CSV
            </button>
          </div>
        </>
      )}

      {activeTab === 'processed' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
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
              {processed.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>
                    No processed payouts yet.
                  </td>
                </tr>
              )}
              {processed.map(p => (
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
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
