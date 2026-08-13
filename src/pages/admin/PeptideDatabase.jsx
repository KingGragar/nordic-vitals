import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminPeptideDatabase, updatePeptideStatus } from '../../api/mlmApi'

const STATUS_COLOR = { active: '#86efac', pending_review: '#fbbf24', restricted: '#f87171' }
const STATUS_LABEL = { active: 'Active', pending_review: 'Pending Review', restricted: 'Restricted' }
const CLASS_COLOR  = { 'Growth Factor': '#a5b4fc', 'Peptide Hormone': '#86efac', Neuropeptide: '#f9a8d4', Antimicrobial: '#fbbf24' }
const CLASSES = ['All', 'Growth Factor', 'Peptide Hormone', 'Neuropeptide', 'Antimicrobial']

export default function AdminPeptideDatabase() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [classF, setClassF] = useState('All')
  const [statusF, setStatusF] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { getAdminPeptideDatabase().then(setData).finally(() => setLoading(false)) }, [])

  async function handleStatus(id, status) {
    await updatePeptideStatus(id, status)
    setData(prev => ({ ...prev, compounds: prev.compounds.map(c => c.id === id ? { ...c, status } : c) }))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign:'center', padding:80, color:'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const filtered = data.compounds.filter(c =>
    (classF === 'All' || c.class === classF) &&
    (statusF === 'all' || c.status === statusF) &&
    (search === '' || c.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🧬 Peptide Database</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Compound catalog with molecular data, class, and jurisdiction status.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Compounds',  value: data.total,          color: '#a5b4fc' },
            { label: 'Active',           value: data.active,         color: '#86efac' },
            { label: 'Pending Review',   value: data.pending_review, color: '#fbbf24' },
            { label: 'Restricted',       value: data.restricted,     color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search compound…"
            style={{ flex: 1, minWidth: 180, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {['all','active','pending_review','restricted'].map(s => (
              <button key={s} onClick={() => setStatusF(s)} style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${statusF === s ? '#a5b4fc' : 'var(--border)'}`,
                background: statusF === s ? '#a5b4fc22' : 'transparent',
                color: statusF === s ? '#a5b4fc' : 'var(--text2)',
              }}>{s === 'all' ? 'All' : STATUS_LABEL[s]}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {CLASSES.map(c => (
              <button key={c} onClick={() => setClassF(c)} style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${classF === c ? '#86efac' : 'var(--border)'}`,
                background: classF === c ? '#86efac22' : 'transparent',
                color: classF === c ? '#86efac' : 'var(--text2)',
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 20 }}>
          <div style={{ ...card, padding: 0, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
                  {['Name','Class','MW (Da)','Refs','US','EU','AU','CA','Status',''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => setSelected(c)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selected?.id === c.id ? 'var(--border)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>{c.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: (CLASS_COLOR[c.class] || '#a5b4fc') + '22', color: CLASS_COLOR[c.class] || '#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{c.class}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{c.mw}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{c.references}</td>
                    {['us','eu','au','ca'].map(j => (
                      <td key={j} style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ color: c.jurisdictions[j] ? '#86efac' : '#f87171', fontSize: 14 }}>{c.jurisdictions[j] ? '✓' : '✗'}</span>
                      </td>
                    ))}
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: (STATUS_COLOR[c.status] || '#a5b4fc') + '22', color: STATUS_COLOR[c.status] || '#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{STATUS_LABEL[c.status]}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={e => { e.stopPropagation(); setSelected(c) }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>No compounds match filter.</div>}
          </div>

          {selected && (
            <div style={{ ...card, alignSelf: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{selected.name}</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 18, cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                {[
                  ['Class', selected.class],
                  ['Molecular Weight', `${selected.mw} Da`],
                  ['Sequence', <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.sequence}</span>],
                  ['References', selected.references],
                  ['Last Updated', selected.last_updated],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ color: 'var(--text2)', fontSize: 11, marginBottom: 2 }}>{l}</div>
                    <div style={{ fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
                <div>
                  <div style={{ color: 'var(--text2)', fontSize: 11, marginBottom: 6 }}>Jurisdiction Legal Status</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {['us','eu','au','ca'].map(j => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <span style={{ color: selected.jurisdictions[j] ? '#86efac' : '#f87171', fontSize: 14 }}>{selected.jurisdictions[j] ? '✓' : '✗'}</span>
                        <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 12 }}>{j}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text2)', fontSize: 11, marginBottom: 6 }}>Change Status</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['active','pending_review','restricted'].map(s => (
                      <button key={s} onClick={() => handleStatus(selected.id, s)} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${selected.status === s ? STATUS_COLOR[s] : 'var(--border)'}`,
                        background: selected.status === s ? STATUS_COLOR[s] + '22' : 'transparent',
                        color: selected.status === s ? STATUS_COLOR[s] : 'var(--text2)',
                      }}>{STATUS_LABEL[s]}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
