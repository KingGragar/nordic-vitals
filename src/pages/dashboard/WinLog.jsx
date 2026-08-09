import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberWinLog } from '../../api/mlmApi'

const TAG_COLORS = { sales: '#86efac', recruitment: '#93c5fd', wellness: '#f9a8d4', rank: '#fbbf24', income: '#818cf8', personal: '#fb923c' }

export default function DashWinLog() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [tag, setTag] = useState('all')
  const [winText, setWinText] = useState('')
  const [winTag, setWinTag] = useState('sales')

  useEffect(() => {
    setLoading(true)
    getMemberWinLog().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const wins = (data?.wins || []).filter(w => tag === 'all' || w.tag === tag)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Win Log</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Record your wins, milestones, and testimonials — fuel your motivation and your team's inspiration</p>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ Log a Win</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Wins', value: (data?.wins || []).length, color: '#818cf8' },
            { label: 'This Month', value: data?.thisMonth || 0, color: '#86efac' },
            { label: 'Streak (days)', value: data?.streak || 0, color: '#fbbf24' },
            { label: 'Shared', value: data?.sharedCount || 0, color: '#93c5fd' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {['all', ...Object.keys(TAG_COLORS)].map(t => (
            <button key={t} onClick={() => setTag(t)} style={{ padding: '4px 12px', borderRadius: 16, border: '1px solid var(--border)', background: tag === t ? (TAG_COLORS[t] || '#6366f1') : 'transparent', color: tag === t ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 12, textTransform: 'capitalize', fontWeight: tag === t ? 700 : 400 }}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : wins.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>No wins logged yet</div>
              <div style={{ fontSize: 13 }}>Every win counts — even the small ones. Start logging!</div>
            </div>
          ) : wins.map(w => (
            <div key={w.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{w.emoji || '🏆'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TAG_COLORS[w.tag] || '#818cf8', background: `${TAG_COLORS[w.tag] || '#818cf8'}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>{w.tag}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{w.date}</span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>{w.text}</div>
                  {w.impact && <div style={{ fontSize: 12, color: '#86efac', marginTop: 6 }}>Impact: {w.impact}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                {w.shared ? (
                  <span style={{ fontSize: 11, color: '#86efac' }}>✓ Shared</span>
                ) : (
                  <button style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>Share to Feed</button>
                )}
                <button style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#6366f122', color: '#818cf8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Share Card</button>
              </div>
            </div>
          ))}
        </div>

        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 }}>
            <div style={{ ...card, width: '100%', maxWidth: 480 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Log a Win 🏆</div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Category</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.keys(TAG_COLORS).map(t => (
                    <button key={t} onClick={() => setWinTag(t)} style={{ padding: '4px 10px', borderRadius: 16, border: '1px solid var(--border)', background: winTag === t ? TAG_COLORS[t] : 'transparent', color: winTag === t ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: winTag === t ? 700 : 400, textTransform: 'capitalize' }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Describe your win</label>
                <textarea rows={4} value={winText} onChange={e => setWinText(e.target.value)} placeholder="e.g. Enrolled my first customer today — she bought the Collagen + BPC-157 starter pack!" style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAdd(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowAdd(false)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Save Win</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
