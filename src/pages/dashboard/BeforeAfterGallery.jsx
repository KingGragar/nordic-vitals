import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberBeforeAfterGallery, submitBeforeAfterEntry } from '../../api/mlmApi'

const GOALS = ['Recovery','Anti-aging','Performance','Weight loss','Muscle growth']
const PRODUCTS = ['BPC-157','GHK-Cu','TB-500','CJC-1295','Ipamorelin']

export default function DashBeforeAfterGallery() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('community')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]     = useState({ weeks: 12, product: PRODUCTS[0], goal: GOALS[0], note: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { getMemberBeforeAfterGallery().then(setData).finally(() => setLoading(false)) }, [])

  async function handleSubmit() {
    setSubmitting(true)
    const res = await submitBeforeAfterEntry(form)
    if (res.ok) {
      setData(prev => ({ ...prev, my_entries: [{ id: res.id, ...form, status: 'pending', likes: 0, created_at: new Date().toISOString().slice(0,10) }, ...prev.my_entries] }))
      setShowForm(false)
    }
    setSubmitting(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign:'center', padding:80, color:'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📸 Before & After Gallery</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Community transformation stories — share yours and inspire others.</div>
          </div>
          <button onClick={() => setShowForm(true)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#a5b4fc', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Share My Story</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Stories',    value: data.stats.total_entries.toLocaleString(), color: '#a5b4fc' },
            { label: 'Avg Duration',     value: `${data.stats.avg_weeks} weeks`,            color: '#86efac' },
            { label: 'My Stories',       value: data.my_entries.length,                    color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
          <div style={card}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Top Goals</div>
            {Object.entries(data.stats.goals).slice(0,3).map(([g,pct]) => (
              <div key={g} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                <span>{g}</span><span style={{ fontWeight: 700, color: '#a5b4fc' }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['community','my_stories'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${tab === t ? '#a5b4fc' : 'var(--border)'}`,
              background: tab === t ? '#a5b4fc22' : 'transparent',
              color: tab === t ? '#a5b4fc' : 'var(--text2)',
            }}>{t === 'community' ? 'Community' : 'My Stories'}</button>
          ))}
        </div>

        {tab === 'community' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
            {data.community.map(e => (
              <div key={e.id} style={card}>
                <div style={{ background: 'var(--border)', borderRadius: 10, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 12 }}>🧬</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{e.username}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{e.weeks}wk journey</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ background: '#a5b4fc22', color: '#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{e.goal}</span>
                  <span style={{ background: '#86efac22', color: '#86efac', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{e.product}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
                  <span>❤️ {e.likes} likes</span>
                  <span>💬 {e.comments} comments</span>
                  <span>{e.created_at.slice(0,7)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'my_stories' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.my_entries.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
                <div style={{ fontWeight: 600 }}>No stories yet — share your transformation!</div>
              </div>
            ) : data.my_entries.map(e => (
              <div key={e.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{e.goal} · {e.weeks} weeks</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{e.product} · {e.created_at}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: e.status === 'published' ? '#86efac22' : '#fbbf2422', color: e.status === 'published' ? '#86efac' : '#fbbf24', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{e.status}</span>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>❤️ {e.likes}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 420, maxWidth: '95vw' }}>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 18 }}>Share Your Story</div>
              {[
                { label: 'Goal', key: 'goal', options: GOALS },
                { label: 'Product Used', key: 'product', options: PRODUCTS },
              ].map(({ label, key, options }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{label}</div>
                  <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}>
                    {options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Duration (weeks)</div>
                <input type="number" min={1} max={52} value={form.weeks} onChange={e => setForm(f => ({ ...f, weeks: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Notes (optional)</div>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3} placeholder="Describe your experience…"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: '#a5b4fc', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {submitting ? 'Submitting…' : 'Submit for Review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
