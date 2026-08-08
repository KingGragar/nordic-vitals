import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberProductCatalogForComparison } from '../../api/mlmApi'

const MAX_COMPARE = 3

const ATTRS = [
  { key: 'price', label: 'Price', format: v => '€' + v.toFixed(2) },
  { key: 'memberPrice', label: 'Member Price', format: v => '€' + v.toFixed(2) },
  { key: 'pv', label: 'PV (Points Value)', format: v => v },
  { key: 'servings', label: 'Servings', format: v => v },
  { key: 'form', label: 'Form', format: v => v },
  { key: 'peptides', label: 'Peptide Content', format: v => v },
  { key: 'storage', label: 'Storage', format: v => v },
  { key: 'vegan', label: 'Vegan', format: v => v ? '✓ Yes' : '✗ No' },
  { key: 'glutenFree', label: 'Gluten Free', format: v => v ? '✓ Yes' : '✗ No' },
  { key: 'inStock', label: 'In Stock', format: v => v ? '✓ Yes' : '✗ No' },
  { key: 'rating', label: 'Rating', format: v => '★ ' + v + '/5' },
]

export default function DashProductComparison() {
  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    getMemberProductCatalogForComparison().then(setCatalog).finally(() => setLoading(false))
  }, [])

  const filtered = !catalog ? [] : catalog.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const compared = !catalog ? [] : catalog.filter(p => selected.includes(p.id))

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < MAX_COMPARE ? [...prev, id] : prev)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🔬 Product Comparison</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Select up to {MAX_COMPARE} products to compare side-by-side.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: compared.length > 0 ? '280px 1fr' : '1fr', gap: 20 }}>
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ width: '100%', padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
                {filtered.map(p => {
                  const isSelected = selected.includes(p.id)
                  const isDisabled = !isSelected && selected.length >= MAX_COMPARE
                  return (
                    <div key={p.id} onClick={() => !isDisabled && toggle(p.id)} style={{ ...card, padding: '12px 14px', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1, border: isSelected ? '1px solid var(--gold)' : '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 4, border: `2px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`, background: isSelected ? 'var(--gold)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#000' }}>
                        {isSelected && '✓'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>€{p.price?.toFixed(2)} · {p.category}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {compared.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, minWidth: 140 }}>Attribute</th>
                    {compared.map(p => (
                      <th key={p.id} style={{ padding: '10px 14px', textAlign: 'center', minWidth: 160 }}>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 400, marginTop: 2 }}>{p.category}</div>
                        <button onClick={() => toggle(p.id)} style={{ marginTop: 6, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: '#fca5a5', fontSize: 11, cursor: 'pointer' }}>Remove</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ATTRS.map(attr => (
                    <tr key={attr.key} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)', fontWeight: 500 }}>{attr.label}</td>
                      {compared.map(p => {
                        const val = p[attr.key]
                        const display = val !== undefined && val !== null ? attr.format(val) : '—'
                        const isYes = display === '✓ Yes'
                        const isNo = display === '✗ No'
                        return (
                          <td key={p.id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: attr.key === 'price' || attr.key === 'memberPrice' ? 700 : 400, color: isYes ? '#86efac' : isNo ? '#fca5a5' : 'var(--text)' }}>
                            {display}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {compared.map(p => (
                  <button key={p.id} style={{ flex: 1, minWidth: 140, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    Add to Cart — {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
