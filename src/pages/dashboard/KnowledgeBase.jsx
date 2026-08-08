import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberKnowledgeBase, markKbArticleHelpful } from '../../api/mlmApi'

const CAT_COLOR = { compensation: '#f59e0b', products: '#10b981', orders: '#3b82f6', recruitment: '#8b5cf6', compliance: '#ef4444', payments: '#ec4899' }
const CAT_ICON  = { compensation: '💰', products: '🧬', orders: '📦', recruitment: '👥', compliance: '⚖️', payments: '💳' }

export default function MemberKnowledgeBase() {
  const [articles, setArticles] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [voted, setVoted] = useState({})

  useEffect(() => {
    setLoading(true)
    getMemberKnowledgeBase('').then(d => { setArticles(d); if (d?.length) setSelected(d[0]) }).finally(() => setLoading(false))
  }, [])

  function handleSearch(q) {
    setQuery(q)
    if (!q) { getMemberKnowledgeBase('').then(setArticles); return }
    setLoading(true)
    getMemberKnowledgeBase(q).then(setArticles).finally(() => setLoading(false))
  }

  async function vote(id, helpful) {
    if (voted[id] !== undefined) return
    await markKbArticleHelpful(id, helpful)
    setVoted(prev => ({ ...prev, [id]: helpful }))
  }

  const all = articles || []
  const filtered = catFilter === 'all' ? all : all.filter(a => a.category === catFilter)
  const categories = [...new Set((articles || []).map(a => a.category))]

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📚 Knowledge Base</div>
        <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>Answers to common questions about compensation, products, orders, and more.</div>

        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)', fontSize: 16 }}>🔍</span>
          <input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search articles…"
            style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>

        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={() => setCatFilter('all')} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', background: catFilter === 'all' ? 'var(--gold)' : 'transparent', color: catFilter === 'all' ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: catFilter === 'all' ? 700 : 400 }}>
              All
            </button>
            {categories.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${CAT_COLOR[c] || 'var(--border)'}`, background: catFilter === c ? (CAT_COLOR[c] || 'var(--gold)') : 'transparent', color: catFilter === c ? '#fff' : (CAT_COLOR[c] || 'var(--text)'), fontSize: 13, cursor: 'pointer', fontWeight: catFilter === c ? 700 : 400, textTransform: 'capitalize' }}>
                {CAT_ICON[c] || '📄'} {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !filtered.length ? (
          <div style={{ ...card, textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No articles found for "{query}".</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(a => (
                <div key={a.id} onClick={() => setSelected(a)} style={{ ...card, cursor: 'pointer', border: selected?.id === a.id ? '1px solid var(--gold)' : '1px solid var(--border)', background: selected?.id === a.id ? 'var(--card)' : 'var(--bg)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, lineHeight: 1.4 }}>{a.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: (CAT_COLOR[a.category] || '#64748b') + '33', color: CAT_COLOR[a.category] || '#64748b', textTransform: 'capitalize' }}>{CAT_ICON[a.category]} {a.category}</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>👍 {a.helpful}%</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>👁 {a.views?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {selected ? (
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.4, marginBottom: 8 }}>{selected.title}</div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 20, background: (CAT_COLOR[selected.category] || '#64748b') + '33', color: CAT_COLOR[selected.category] || '#64748b', textTransform: 'capitalize' }}>{CAT_ICON[selected.category]} {selected.category}</span>
                      <span>👁 {selected.views?.toLocaleString()} views</span>
                      <span>👍 {selected.helpful}% helpful</span>
                      <span>Updated: {selected.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '16px 18px', fontSize: 14, lineHeight: 1.8, color: 'var(--text)', marginBottom: 20 }}>
                  {selected.excerpt}
                </div>

                {voted[selected.id] === undefined ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>Was this helpful?</span>
                    <button onClick={() => vote(selected.id, true)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>👍 Yes</button>
                    <button onClick={() => vote(selected.id, false)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>👎 No</button>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {voted[selected.id] ? '✅ Thanks for your feedback!' : '📝 We\'ll work on improving this article.'}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
