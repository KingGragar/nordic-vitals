import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminTaxRules } from '../../api/mlmApi'

const TYPE_COLOR = { standard: '#93c5fd', reduced: '#86efac', zero: '#fbbf24', exempt: '#818cf8' }

export default function AdminTaxRules() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getAdminTaxRules().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '6px 14px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  const rules = (data?.rules || []).filter(r => {
    const matchType = filterType === 'all' || r.type === filterType
    const matchSearch = !search || r.country.toLowerCase().includes(search.toLowerCase()) || r.region?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Tax Rules</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Configure VAT/GST rates per country, region, and product category</p>
          </div>
          <button onClick={() => setShowModal(true)} style={btn('#6366f1')}>+ Add Rule</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Rules', value: (data?.rules || []).length, color: '#93c5fd' },
            { label: 'Countries', value: data?.countryCount || 0, color: '#86efac' },
            { label: 'Avg Rate', value: `${data?.avgRate || 0}%`, color: '#fbbf24' },
            { label: 'Tax Collected (MTD)', value: data?.collectedMtd || '—', color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search country or region…" style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, minWidth: 200 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'standard', 'reduced', 'zero', 'exempt'].map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', textTransform: 'capitalize', fontSize: 13, fontWeight: 600, background: filterType === t ? '#6366f1' : 'var(--border)', color: filterType === t ? '#fff' : 'var(--text-muted)' }}>{t}</button>
            ))}
          </div>
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Loading…</div> : (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--border)' }}>
                    {['Country', 'Region', 'Category', 'Type', 'Rate', 'Applies To', 'Effective', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--border)08' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.flag} {r.country}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{r.region || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{r.category}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[r.type] || '#93c5fd', background: `${TYPE_COLOR[r.type] || '#93c5fd'}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>{r.type}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#fbbf24' }}>{r.rate}%</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{r.appliesTo}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{r.effectiveDate}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={btn('#6366f111', '#6366f1')}>Edit</button>
                          <button style={btn('#f8717122', '#f87171')}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rules.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No tax rules match your filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 500, width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>Add Tax Rule</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                  {[['Country', 'e.g. Norway'], ['Region / State', 'optional']].map(([label, ph]) => (
                    <div key={label}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{label}</label>
                      <input placeholder={ph} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Tax Type</label>
                    <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                      {['standard', 'reduced', 'zero', 'exempt'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Rate (%)</label>
                    <input type="number" placeholder="25" min="0" max="100" step="0.1" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Product Category</label>
                  <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                    {['All Products', 'Peptides', 'Supplements', 'Topicals', 'Digital Products', 'Memberships'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Effective Date</label>
                  <input type="date" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={btn('#6366f1')}>Add Rule</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
