import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberContentPlanner } from '../../api/mlmApi'

const PLATFORM_COLOR = { instagram: '#f9a8d4', tiktok: '#86efac', facebook: '#93c5fd', youtube: '#f87171', linkedin: '#818cf8', whatsapp: '#86efac' }
const TYPE_COLOR = { product: '#fbbf24', testimonial: '#86efac', education: '#93c5fd', recruitment: '#818cf8', personal: '#f9a8d4', promo: '#fb923c' }
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PLATFORMS = ['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin']

export default function DashContentPlanner() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('calendar')
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState({ platform: 'instagram', type: 'product', caption: '', day: 1 })

  useEffect(() => {
    setLoading(true)
    getMemberContentPlanner().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  const WEEKS = 4
  const slots = Array.from({ length: WEEKS * 7 }, (_, i) => i + 1)
  const byDay = {}
  ;(data?.posts || []).forEach(p => { if (!byDay[p.day]) byDay[p.day] = []; byDay[p.day].push(p) })

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Content Planner</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Plan your monthly social media content — never miss a posting day</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['calendar', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--border)', background: view === v ? '#6366f1' : 'transparent', color: view === v ? '#fff' : 'var(--text)', cursor: 'pointer', textTransform: 'capitalize', fontWeight: 600 }}>{v}</button>
            ))}
            <button onClick={() => setShowAdd(true)} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ Add Post</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Planned', value: (data?.posts || []).length, color: '#818cf8' },
            { label: 'Published', value: (data?.posts || []).filter(p => p.published).length, color: '#86efac' },
            { label: 'This Week', value: (data?.posts || []).filter(p => p.day <= 7).length, color: '#93c5fd' },
            { label: 'Posting Streak', value: `${data?.streak || 0}d`, color: '#fbbf24' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {view === 'calendar' ? (
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
              {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {slots.map(day => {
                const posts = byDay[day] || []
                return (
                  <div key={day} onClick={() => { setDraft(d => ({ ...d, day })); setShowAdd(true) }} style={{ minHeight: 72, border: '1px solid var(--border)', borderRadius: 7, padding: '5px 6px', cursor: 'pointer', background: posts.length ? 'rgba(99,102,241,.05)' : 'transparent' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{day}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {posts.slice(0, 3).map((p, i) => (
                        <div key={i} style={{ fontSize: 10, fontWeight: 600, color: PLATFORM_COLOR[p.platform] || '#818cf8', background: `${PLATFORM_COLOR[p.platform] || '#818cf8'}22`, borderRadius: 4, padding: '1px 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{p.platform}</div>
                      ))}
                      {posts.length > 3 && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{posts.length - 3}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (data?.posts || []).length === 0 ? (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
                <div style={{ fontWeight: 700 }}>No posts planned</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Click "+ Add Post" to start planning your content</div>
              </div>
            ) : (data?.posts || []).map(p => (
              <div key={p.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ background: `${PLATFORM_COLOR[p.platform] || '#818cf8'}22`, borderRadius: 8, padding: '8px 10px', flexShrink: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: PLATFORM_COLOR[p.platform] || '#818cf8', textTransform: 'capitalize' }}>{p.platform}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Day {p.day}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[p.type] || '#818cf8', background: `${TYPE_COLOR[p.type] || '#818cf8'}22`, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize' }}>{p.type}</span>
                      {p.published && <span style={{ fontSize: 11, color: '#86efac' }}>✓ Published</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{p.caption}</div>
                    {p.hashtags && <div style={{ fontSize: 11, color: '#818cf8', marginTop: 5 }}>{p.hashtags}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 11 }}>Edit</button>
                    {!p.published && <button style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#86efac22', color: '#86efac', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Mark Done</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 }}>
            <div style={{ ...card, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Add Planned Post</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Platform</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PLATFORMS.map(pl => (
                      <button key={pl} onClick={() => setDraft(d => ({ ...d, platform: pl }))} style={{ padding: '4px 10px', borderRadius: 16, border: '1px solid var(--border)', background: draft.platform === pl ? (PLATFORM_COLOR[pl] || '#6366f1') : 'transparent', color: draft.platform === pl ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 12, textTransform: 'capitalize', fontWeight: draft.platform === pl ? 700 : 400 }}>{pl}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Content Type</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Object.keys(TYPE_COLOR).map(t => (
                      <button key={t} onClick={() => setDraft(d => ({ ...d, type: t }))} style={{ padding: '4px 10px', borderRadius: 16, border: '1px solid var(--border)', background: draft.type === t ? (TYPE_COLOR[t] || '#6366f1') : 'transparent', color: draft.type === t ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 12, textTransform: 'capitalize', fontWeight: draft.type === t ? 700 : 400 }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Day of Month</label>
                  <input type="number" min={1} max={31} value={draft.day} onChange={e => setDraft(d => ({ ...d, day: +e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Caption / Draft</label>
                  <textarea rows={4} value={draft.caption} onChange={e => setDraft(d => ({ ...d, caption: e.target.value }))} placeholder="Write your caption draft here…" style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Hashtags</label>
                  <input value={draft.hashtags || ''} onChange={e => setDraft(d => ({ ...d, hashtags: e.target.value }))} placeholder="#nordicvitals #peptides #wellness" style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAdd(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowAdd(false)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Save Post</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
