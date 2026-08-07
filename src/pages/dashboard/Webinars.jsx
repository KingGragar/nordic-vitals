import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberWebinars, registerMemberWebinar, getMemberWebinarRecordings } from '../../api/mlmApi'

const CATEGORY_COLORS = {
  'Business Growth': '#6366f1',
  'Product Training': '#10b981',
  'Leadership':      '#f59e0b',
  'Compliance':      '#64748b',
  'Motivation':      '#ec4899',
  'Tech & Tools':    '#14b8a6',
}

function CategoryBadge({ category }) {
  const c = CATEGORY_COLORS[category] || '#6b7280'
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: c + '22', color: c, border: `1px solid ${c}44` }}>{category}</span>
}

function CountdownBadge({ startsAt }) {
  const diff = new Date(startsAt) - new Date()
  if (diff <= 0) return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#052e16', color: '#86efac', border: '1px solid #166534' }}>🔴 LIVE</span>
  const days = Math.floor(diff / 86400000)
  const hrs  = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const label = days > 0 ? `${days}d ${hrs}h` : hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#1e3a5f', color: '#93c5fd', border: '1px solid #1d4ed8' }}>In {label}</span>
}

function WebinarCard({ webinar, onRegister, registering }) {
  const isLive = new Date(webinar.startsAt) <= new Date() && new Date(webinar.endsAt) >= new Date()
  const cat = CATEGORY_COLORS[webinar.category] || '#6b7280'

  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${webinar.registered ? cat + '55' : 'var(--border)'}`, borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ width: 56, height: 56, borderRadius: 10, background: cat + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{webinar.icon}</div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{webinar.title}</span>
          <CategoryBadge category={webinar.category} />
          <CountdownBadge startsAt={webinar.startsAt} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{webinar.description}</div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
          <span>🗓️ {new Date(webinar.startsAt).toLocaleDateString()} · {new Date(webinar.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>⏱️ {webinar.durationMin} min</span>
          <span>🎙️ {webinar.host}</span>
          <span>👥 {webinar.registeredCount} registered</span>
          {webinar.language && <span>🌐 {webinar.language}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 130, alignItems: 'flex-end' }}>
        {webinar.registered ? (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>✓ Registered</div>
            {isLive ? (
              <a href={webinar.joinUrl} target="_blank" rel="noopener noreferrer"
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>
                🔴 Join Live
              </a>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'right' }}>You'll get a reminder email 15 min before.</div>
            )}
          </>
        ) : (
          <button onClick={() => onRegister(webinar.id)} disabled={registering === webinar.id}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: cat, color: '#fff', fontWeight: 600, cursor: registering === webinar.id ? 'not-allowed' : 'pointer', fontSize: 13, opacity: registering === webinar.id ? 0.7 : 1 }}>
            {registering === webinar.id ? 'Registering…' : 'Register Free'}
          </button>
        )}
      </div>
    </div>
  )
}

function RecordingCard({ rec }) {
  const cat = CATEGORY_COLORS[rec.category] || '#6b7280'
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ width: 52, height: 52, borderRadius: 10, background: cat + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, position: 'relative' }}>
        {rec.icon}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          <span style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>▶</span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{rec.title}</span>
          <CategoryBadge category={rec.category} />
          {rec.isNew && <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#6366f1', color: '#fff' }}>NEW</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{rec.description}</div>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text2)' }}>
          <span>🎙️ {rec.host}</span>
          <span>⏱️ {rec.durationMin} min</span>
          <span>👁️ {rec.views.toLocaleString()} views</span>
          <span>📅 {new Date(rec.recordedAt).toLocaleDateString()}</span>
        </div>
      </div>
      <a href={rec.watchUrl} target="_blank" rel="noopener noreferrer"
        style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${cat}`, color: cat, background: 'none', fontWeight: 600, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
        ▶ Watch
      </a>
    </div>
  )
}

export default function MemberWebinars() {
  const [upcoming, setUpcoming] = useState([])
  const [recordings, setRecordings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const [registering, setRegistering] = useState(null)
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    Promise.all([getMemberWebinars(), getMemberWebinarRecordings()]).then(([u, r]) => {
      setUpcoming(u)
      setRecordings(r)
      setLoading(false)
    })
  }, [])

  async function handleRegister(id) {
    setRegistering(id)
    await registerMemberWebinar(id)
    setUpcoming(u => u.map(w => w.id === id ? { ...w, registered: true, registeredCount: w.registeredCount + 1 } : w))
    setRegistering(null)
  }

  const cats = ['all', ...Array.from(new Set([...upcoming.map(w => w.category), ...recordings.map(r => r.category)]))]
  const filteredUpcoming = catFilter === 'all' ? upcoming : upcoming.filter(w => w.category === catFilter)
  const filteredRecordings = catFilter === 'all' ? recordings : recordings.filter(r => r.category === catFilter)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🎙️ Webinars</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Live training sessions and on-demand recordings from Nordic Vitals experts.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { icon: '📅', label: 'Upcoming', value: upcoming.length },
            { icon: '✅', label: 'Registered', value: upcoming.filter(w => w.registered).length },
            { icon: '🎬', label: 'Recordings', value: recordings.length },
            { icon: '🔴', label: 'Live Now', value: upcoming.filter(w => new Date(w.startsAt) <= new Date() && new Date(w.endsAt) >= new Date()).length },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)' }}>
            {[['upcoming', 'Upcoming'], ['recordings', 'Recordings']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{ padding: '8px 18px', border: 'none', background: 'none', color: tab === key ? '#6366f1' : 'var(--text2)', fontWeight: tab === key ? 700 : 400, borderBottom: `2px solid ${tab === key ? '#6366f1' : 'transparent'}`, cursor: 'pointer', fontSize: 14, marginBottom: -1 }}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: catFilter === c ? '#6366f1' : 'none', color: catFilter === c ? '#fff' : 'var(--text2)', cursor: 'pointer', fontSize: 11, textTransform: c === 'all' ? 'capitalize' : 'none' }}>
                {c === 'all' ? 'All Topics' : c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Loading…</div>
        ) : tab === 'upcoming' ? (
          filteredUpcoming.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗓️</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>No upcoming webinars</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Check back soon or browse the recordings library.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredUpcoming.map(w => <WebinarCard key={w.id} webinar={w} onRegister={handleRegister} registering={registering} />)}
            </div>
          )
        ) : (
          filteredRecordings.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>No recordings available</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredRecordings.map(r => <RecordingCard key={r.id} rec={r} />)}
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}
