import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminPriceHistory } from '../../api/mlmApi'

export default function AdminPriceHistory() {
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback((q) => {
    setLoading(true)
    getAdminPriceHistory(q).then(setRows).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load('') }, [load])

  function handleSearch(e) {
    const v = e.target.value
    setSearch(v)
    load(v)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🏷 Price History</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Audit trail of every product price change with timestamp and reason.</div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search by SKU or product name…"
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, width: '100%', maxWidth: 360 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !rows || rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No records found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(r => {
              const delta = r.newPrice - r.oldPrice
              const isIncrease = delta > 0
              const isNoChange = delta === 0
              return (
                <div key={r.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 220px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>SKU: {r.sku}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
                    <span style={{ color: 'var(--text2)', fontSize: 14, textDecoration: 'line-through' }}>€{r.oldPrice.toFixed(2)}</span>
                    <span style={{ fontSize: 16 }}>→</span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>€{r.newPrice.toFixed(2)}</span>
                    {!isNoChange && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: isIncrease ? '#fca5a5' : '#86efac', background: isIncrease ? '#2d1515' : '#052e16', border: `1px solid ${isIncrease ? '#991b1b' : '#166534'}`, borderRadius: 12, padding: '2px 8px' }}>
                        {isIncrease ? '+' : ''}€{delta.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: '1 1 150px', color: 'var(--text2)', fontSize: 12 }}>
                    <div>{r.reason}</div>
                    <div style={{ marginTop: 2 }}>{r.changedBy}</div>
                  </div>
                  <div style={{ color: 'var(--text2)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {new Date(r.changedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
