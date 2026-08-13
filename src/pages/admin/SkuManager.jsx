import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSkuManager, updateSkuBarcode } from '../../api/mlmApi'

export default function AdminSkuManager() {
  const [data, setData]     = useState(null)
  const [loading, setLoad]  = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [edit, setEdit]     = useState(null)
  const [barcode, setBarcode] = useState('')

  useEffect(() => { getAdminSkuManager().then(setData).finally(() => setLoad(false)) }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const STATUS_COLOR = { active: '#86efac', discontinued: '#f87171', draft: '#fbbf24', seasonal: '#a5b4fc' }

  const rows = data.skus.filter(s => {
    const q = search.toLowerCase()
    const matchQ = !q || s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.barcode?.toLowerCase().includes(q)
    const matchF = filter === 'all' || s.status === filter
    return matchQ && matchF
  })

  async function saveBarcode() {
    await updateSkuBarcode(edit.id, barcode)
    setData(prev => ({ ...prev, skus: prev.skus.map(s => s.id === edit.id ? { ...s, barcode } : s) }))
    setEdit(null)
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📦 SKU Manager</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Manage product SKUs, barcodes, and catalog identifiers.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total SKUs',      value: data.summary.total,        color: '#a5b4fc' },
            { label: 'Active',          value: data.summary.active,       color: '#86efac' },
            { label: 'No Barcode',      value: data.summary.no_barcode,   color: '#fbbf24' },
            { label: 'Discontinued',    value: data.summary.discontinued, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU, name, barcode…"
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
          {['all','active','discontinued','draft','seasonal'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              border: `1px solid ${filter === f ? '#a5b4fc' : 'var(--border)'}`,
              background: filter === f ? '#a5b4fc22' : 'transparent',
              color: filter === f ? '#a5b4fc' : 'var(--text2)',
            }}>{f}</button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['SKU','Name','Barcode','Category','Price','Stock','Status',''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '9px 10px', fontWeight: 700, fontFamily: 'monospace', color: '#a5b4fc' }}>{s.sku}</td>
                  <td style={{ padding: '9px 10px', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: '9px 10px', fontFamily: 'monospace', color: s.barcode ? 'var(--text)' : '#f87171' }}>{s.barcode || '— missing'}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text2)' }}>{s.category}</td>
                  <td style={{ padding: '9px 10px' }}>${s.price.toFixed(2)}</td>
                  <td style={{ padding: '9px 10px', color: s.stock < 20 ? '#f87171' : 'var(--text)' }}>{s.stock}</td>
                  <td style={{ padding: '9px 10px' }}>
                    <span style={{ background: (STATUS_COLOR[s.status]||'#a5b4fc')+'22', color: STATUS_COLOR[s.status]||'#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '9px 10px' }}>
                    <button onClick={() => { setEdit(s); setBarcode(s.barcode || '') }} style={{
                      padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent',
                      color: 'var(--text2)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}>Edit Barcode</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>No SKUs match.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {edit && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 380, maxWidth: '95vw' }}>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Edit Barcode</div>
              <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 18 }}>{edit.sku} — {edit.name}</div>
              <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="EAN-13 or UPC-A barcode"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box', marginBottom: 20, fontFamily: 'monospace' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEdit(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveBarcode} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#86efac', color: '#14532d', fontWeight: 700, cursor: 'pointer' }}>Save Barcode</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
