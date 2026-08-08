import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminTaxDocs, sendAdminTaxDoc, bulkSendAdminTaxDocs } from '../../api/mlmApi'

const STATUS_STYLE = {
  sent:    { bg: '#052e16', color: '#86efac', border: '#166534', label: 'Sent' },
  draft:   { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8', label: 'Draft' },
  pending: { bg: '#2d2200', color: '#fbbf24', border: '#92400e', label: 'Pending' },
}

export default function AdminTaxDocs() {
  const [docs, setDocs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(2025)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminTaxDocs(year).then(setDocs).finally(() => setLoading(false))
  }, [year])

  useEffect(() => { load() }, [load])

  async function handleSend(doc) {
    if (!window.confirm(`Send ${doc.type} to ${doc.memberName}?`)) return
    await sendAdminTaxDoc(doc.id)
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'sent', sentAt: new Date().toISOString().slice(0,10) } : d))
  }

  async function handleBulkSend() {
    if (!window.confirm(`Send all draft/pending 1099-NEC documents for ${year}? This will email every eligible member.`)) return
    setBulkSending(true)
    const result = await bulkSendAdminTaxDocs(year, '1099-NEC')
    setBulkResult(result)
    setBulkSending(false)
    load()
  }

  const filtered = !docs ? [] : docs.filter(d =>
    (typeFilter === 'all' || d.type === typeFilter) &&
    (statusFilter === 'all' || d.status === statusFilter)
  )

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const sentCount = (docs || []).filter(d => d.status === 'sent').length
  const pendingCount = (docs || []).filter(d => d.status !== 'sent').length
  const totalAmount = (docs || []).filter(d => d.amount).reduce((s, d) => s + d.amount, 0)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🗂 Tax Documents</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Manage 1099-NEC, W-9, and annual earnings statements for members.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '8px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}>
              {[2025, 2024, 2023].map(y => <option key={y}>{y}</option>)}
            </select>
            <button onClick={handleBulkSend} disabled={bulkSending} style={{ padding: '9px 16px', background: '#b45309', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: bulkSending ? 'not-allowed' : 'pointer', opacity: bulkSending ? 0.7 : 1 }}>
              {bulkSending ? 'Sending…' : '📧 Bulk Send 1099s'}
            </button>
          </div>
        </div>

        {bulkResult && (
          <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: 8, padding: '12px 16px', color: '#86efac', fontSize: 14, marginBottom: 18 }}>
            ✅ Bulk send complete — {bulkResult.sent} sent, {bulkResult.failed} failed.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Documents', value: (docs || []).length },
            { label: 'Sent', value: sentCount },
            { label: 'Pending / Draft', value: pendingCount },
            { label: `Total Reported (${year})`, value: 'kr ' + totalAmount.toLocaleString() },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', '1099-NEC', 'W-9', 'earnings'].map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: typeFilter === f ? 'var(--gold)' : 'var(--card)', color: typeFilter === f ? '#000' : 'var(--text)', fontSize: 12, cursor: 'pointer', fontWeight: typeFilter === f ? 700 : 400 }}>
              {f === 'all' ? 'All Types' : f}
            </button>
          ))}
          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
          {['all', 'sent', 'draft', 'pending'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: statusFilter === f ? '#1e3a5f' : 'var(--card)', color: statusFilter === f ? '#93c5fd' : 'var(--text)', fontSize: 12, cursor: 'pointer', fontWeight: statusFilter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f === 'all' ? 'All Status' : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No documents found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--text2)', borderBottom: '2px solid var(--border)' }}>
                  {['Member', 'Type', 'Year', 'Amount', 'Sent Date', 'Downloaded', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const st = STATUS_STYLE[d.status] || STATUS_STYLE.pending
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 600 }}>{d.memberName}</td>
                      <td style={{ padding: '10px 10px' }}><span style={{ padding: '2px 8px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700 }}>{d.type}</span></td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{d.taxYear}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600 }}>{d.amount ? `kr ${d.amount.toLocaleString()}` : '—'}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{d.sentAt || '—'}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>{d.downloaded ? '✅' : '—'}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        {d.status !== 'sent' && (
                          <button onClick={() => handleSend(d)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}>Send</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
