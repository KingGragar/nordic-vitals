import { useState, useEffect } from 'react'
import DashLayout from '../../components/DashboardLayout'
import { getMemberCommunityFeed } from '../../api/mlmApi'

const TYPE_COLOR = { question: '#93c5fd', tip: '#86efac', win: '#fbbf24', review: '#f0abfc', general: '#a1a1aa' }
const TYPE_ICON = { question: '❓', tip: '💡', win: '🏆', review: '⭐', general: '💬' }

export default function DashCommunityFeed() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [composing, setComposing] = useState(false)
  const [expandedComments, setExpandedComments] = useState({})

  useEffect(() => {
    setLoading(true)
    getMemberCommunityFeed().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const posts = (data?.posts || []).filter(p => typeFilter === 'all' || p.type === typeFilter)

  const toggleComments = id => setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <DashLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Community Feed</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Share wins, tips, and questions with your team and network</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Your Posts', value: data?.myPostCount ?? '—', color: '#93c5fd' },
            { label: 'Likes Received', value: (data?.likesReceived || 0).toLocaleString(), color: '#fbbf24' },
            { label: 'Comments', value: (data?.commentCount || 0).toLocaleString(), color: '#86efac' },
            { label: 'Members Online', value: data?.onlineCount ?? '—', color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ ...card, marginBottom: 20 }}>
          {composing ? (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {Object.keys(TYPE_COLOR).map(t => (
                  <button key={t} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: 'var(--border)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{TYPE_ICON[t]} {t}</button>
                ))}
              </div>
              <textarea rows={4} placeholder="Share a win, tip, question, or product review…" autoFocus style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                <button onClick={() => setComposing(false)} style={{ padding: '7px 16px', background: 'var(--border)', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={() => setComposing(false)} style={{ padding: '7px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Post</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setComposing(true)} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', textAlign: 'left', color: 'var(--text-muted)', fontSize: 14 }}>
              Share something with your community…
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <button onClick={() => setTypeFilter('all')} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: typeFilter === 'all' ? '#6366f1' : 'var(--border)', color: typeFilter === 'all' ? '#fff' : 'var(--text-muted)' }}>All</button>
          {Object.keys(TYPE_COLOR).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: typeFilter === t ? TYPE_COLOR[t] : 'var(--border)', color: typeFilter === t ? '#000' : 'var(--text-muted)', textTransform: 'capitalize' }}>{TYPE_ICON[t]} {t}</button>
          ))}
        </div>

        {loading ? <div style={{ color: 'var(--text-muted)', padding: 24 }}>Loading…</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {posts.map(p => (
              <div key={p.id} style={card}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${TYPE_COLOR[p.type] || '#93c5fd'}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{TYPE_ICON[p.type] || '💬'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{p.authorName}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.rank}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[p.type], background: `${TYPE_COLOR[p.type]}22`, borderRadius: 5, padding: '1px 6px', textTransform: 'capitalize' }}>{p.type}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{p.timeAgo}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{p.body}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <button style={{ padding: '5px 12px', background: p.liked ? '#6366f122' : 'var(--border)', color: p.liked ? '#6366f1' : 'var(--text-muted)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {p.liked ? '♥' : '♡'} {p.likeCount}
                  </button>
                  <button onClick={() => toggleComments(p.id)} style={{ padding: '5px 12px', background: 'var(--border)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    💬 {p.commentCount} {expandedComments[p.id] ? '▲' : '▼'}
                  </button>
                  <button style={{ padding: '5px 12px', background: 'var(--border)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>↗ Share</button>
                </div>
                {expandedComments[p.id] && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(p.comments || []).map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>👤</div>
                        <div style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{c.authorName} </span>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.body}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>👤</div>
                      <input placeholder="Write a comment…" style={{ flex: 1, padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashLayout>
  )
}
