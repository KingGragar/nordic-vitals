import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberInvoiceHistory } from '../../api/mlmApi'

const TYPE_ICONS = { order: '📦', membership: '🪙', credit: '💳', misc: '📄' }
const STATUS_STYLES = {
  paid:    { bg: '#052e16', color: '#86efac', border: '#166534' },
  pending: { bg: '#1c1917', color: '#fbbf24', border: '#92400e' },
  overdue: { bg: '#3b0a0a', color: '#fca5a5', border: '#7f1d1d' },
}

export default function DashInvoiceHistory() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getMemberInvoiceHistory().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const filtered = filter === 'all' ? data.invoices : data.invoices.filter(inv => inv.status === filter || inv.type === filter)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🧾 Invoice History</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Downloadable invoice archive — orders, memberships, and billing history.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total Invoices', value: data.stats.totalInvoices, color: '#a5b4fc' },
            { label: 'Total Amount',   value: data.stats.totalAmount,   color: '#fbbf24' },
            { label: 'YTD Amount',     value: data.stats.ytdAmount,     color: '#86efac' },
            { label: 'Pending',        value: data.stats.pending,       color: '#fca5a5' },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'paid', 'pending', 'order', 'membership'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 12, fontWeight: filter === f ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(inv => {
            const ss = STATUS_STYLES[inv.status] || STATUS_STYLES.pending
            return (
              <div key={inv.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22 }}>{TYPE_ICONS[inv.type] || '📄'}</span>
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{inv.invoiceNo}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12 }}>{inv.description}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 11, marginTop: 2 }}>{inv.date}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#fbbf24', minWidth: 70, textAlign: 'right' }}>
                  €{inv.amount.toFixed(2)}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: 20, padding: '3px 10px', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {inv.status}
                </span>
                <button
                  onClick={() => {}}
                  style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  ⬇ PDF
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
