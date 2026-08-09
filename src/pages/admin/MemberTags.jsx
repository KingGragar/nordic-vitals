import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminMemberTags } from '../../api/mlmApi'

const CATEGORY_COLOR = { behavioral: '#93c5fd', lifecycle: '#86efac', product: '#fbbf24', risk: '#f87171', custom: '#818cf8' }

export default function AdminMemberTags() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getAdminMemberTags().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '6px 14px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  const CATEGORIES = ['all', 'behavioral', 'lifecycle', 'product', 'risk', 'custom']

  const filtered = (data?.tags || []).filter(t =>
    (filter === 'all' || t.category === filter) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Member Tags</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Create and manage behavioral and attribute tags for member segmentation</p>
          </div>
          <button onClick={() => setShowModal(true)} style={btn('#6366f1')}>+ New Tag</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Tags', value: (data?.tags || []).length, color: '#93c5fd' },
            { label: 'Auto-Assigned', value: (data?.tags || []).filter(t => t.autoAssign).length, color: '#86efac' },
            { label: 'Tagged Members', value: data?.taggedMembers || 0, color: '#fbbf24' },
            { label: 'Avg Tags/Member', value: data?.avgTagsPerMember || '—', color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tags…"
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{ padding: '6px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', textTransform: 'capitalize', fontSize: 13, fontWeight: 600, background: filter === c ? '#6366f1' : 'var(--border)', color: filter === c ? '#fff' : 'var(--text-muted)' }}>{c}</button>
            ))}
          </div>
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
            {filtered.map(tag => (
              <div key={tag.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: tag.color || 'var(--text)' }}>#{tag.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: CATEGORY_COLOR[tag.category] || '#93c5fd', background: `${CATEGORY_COLOR[tag.category] || '#93c5fd'}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>{tag.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={btn('#6366f111', '#6366f1')}>Edit</button>
                    <button style={btn('#f8717122', '#f87171')}>Delete</button>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{tag.description}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 10, flexWrap: 'wrap' }}>
                  <span>Members: <strong style={{ color: 'var(--text)' }}>{tag.memberCount.toLocaleString()}</strong></span>
                  {tag.autoAssign && <span style={{ color: '#86efac', fontWeight: 600 }}>Auto-assign</span>}
                  {tag.rule && <span>Rule: <strong style={{ color: '#fbbf24' }}>{tag.rule}</strong></span>}
                  <span>Created {tag.createdAt}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1', padding: 40 }}>No tags match your search.</div>
            )}
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 460, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>New Member Tag</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {['Tag Name', 'Description'].map(f => (
                  <div key={f}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{f}</label>
                    <input placeholder={f} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Category</label>
                    <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                      {['behavioral', 'lifecycle', 'product', 'risk', 'custom'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Color</label>
                    <input type="color" defaultValue="#6366f1" style={{ width: '100%', height: 40, borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Auto-assign Rule (optional)</label>
                  <input placeholder="e.g. joined &gt; 90 days AND orders = 0" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={btn('#6366f1')}>Create Tag</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
