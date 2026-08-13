import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAiContentTemplates, generateAiContent, saveGeneratedContent, getContentDrafts, deleteContentDraft } from '../../api/mlmApi'

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', maxChars: 2200 },
  { key: 'tiktok',    label: 'TikTok',    icon: '🎵', maxChars: 2200 },
  { key: 'facebook',  label: 'Facebook',  icon: '💬', maxChars: 63206 },
  { key: 'x',         label: 'X / Twitter', icon: '𝕏', maxChars: 280 },
  { key: 'linkedin',  label: 'LinkedIn',  icon: '💼', maxChars: 3000 },
  { key: 'email',     label: 'Email',     icon: '✉️', maxChars: 999999 },
]

const TONES = ['Inspirational', 'Educational', 'Conversational', 'Professional', 'Playful', 'Nordic/Nature']
const GOALS = ['Product awareness', 'Recruitment', 'Team motivation', 'Event promotion', 'Health education', 'Testimonial', 'Behind the scenes']

function CharBar({ used, max }) {
  const pct = Math.min(100, (used / max) * 100)
  const color = pct > 90 ? '#dc2626' : pct > 70 ? '#d97706' : '#16a34a'
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ height: 4, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.2s' }} />
      </div>
      <div style={{ fontSize: 11, color: pct > 90 ? color : 'var(--text2)', marginTop: 3 }}>{used} / {max} chars</div>
    </div>
  )
}

function GeneratePanel({ templates }) {
  const [platform, setPlatform] = useState('instagram')
  const [tone, setTone] = useState('Inspirational')
  const [goal, setGoal] = useState('Product awareness')
  const [product, setProduct] = useState('Omega-3 Arctic Pure')
  const [customHint, setCustomHint] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)

  const plat = PLATFORMS.find(p => p.key === platform)

  async function handleGenerate() {
    setGenerating(true)
    setSaved(false)
    const out = await generateAiContent({ platform, tone, goal, product, customHint })
    setResult(out)
    setGenerating(false)
  }

  async function handleSave() {
    await saveGeneratedContent({ platform, tone, goal, product, content: result.content, hashtags: result.hashtags })
    setSaved(true)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div style={{ background: 'var(--card)', borderRadius: 10, padding: 20, border: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 16, fontSize: 15 }}>⚙️ Generation Settings</div>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Platform</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PLATFORMS.map(p => (
              <button key={p.key} onClick={() => setPlatform(p.key)}
                style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${platform === p.key ? '#c9a84c' : 'var(--border)'}`, background: platform === p.key ? '#c9a84c22' : 'var(--bg)', color: platform === p.key ? '#c9a84c' : 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </label>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Content Goal</div>
          <select value={goal} onChange={e => setGoal(e.target.value)} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }}>
            {GOALS.map(g => <option key={g}>{g}</option>)}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Tone</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TONES.map(t => (
              <button key={t} onClick={() => setTone(t)}
                style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${tone === t ? '#c9a84c' : 'var(--border)'}`, background: tone === t ? '#c9a84c22' : 'var(--bg)', color: tone === t ? '#c9a84c' : 'var(--text)', cursor: 'pointer', fontSize: 12 }}>
                {t}
              </button>
            ))}
          </div>
        </label>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Featured Product</div>
          <select value={product} onChange={e => setProduct(e.target.value)} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }}>
            {['Omega-3 Arctic Pure', 'Nordic Collagen Complex', 'Vitamin D3 + K2', 'Arctic Shilajit', 'Nordic Greens Blend', 'Focus Formula', 'No specific product'].map(p => <option key={p}>{p}</option>)}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Custom Notes / Context</div>
          <textarea value={customHint} onChange={e => setCustomHint(e.target.value)} placeholder="Add specific talking points, events, promotions…" rows={3}
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 13, resize: 'vertical' }} />
        </label>

        <button onClick={handleGenerate} disabled={generating} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: generating ? '#888' : '#c9a84c', color: '#000', fontWeight: 700, cursor: generating ? 'default' : 'pointer', fontSize: 14 }}>
          {generating ? '✨ Generating…' : '✨ Generate Content'}
        </button>
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 10, padding: 20, border: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 16, fontSize: 15 }}>📋 Generated Content</div>
        {!result ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
            <div>Configure settings and click Generate to create AI content for your team</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>POST CAPTION</div>
              <textarea value={result.content} readOnly rows={8}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 12px', color: 'var(--text)', fontSize: 13, resize: 'vertical' }} />
              <CharBar used={result.content.length} max={plat.maxChars} />
            </div>
            {result.hashtags && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>HASHTAGS</div>
                <div style={{ background: 'var(--bg)', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: '#3b82f6', lineHeight: 1.7 }}>{result.hashtags}</div>
              </div>
            )}
            {result.caption_ideas && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>ALTERNATIVE HOOKS</div>
                {result.caption_ideas.map((c, i) => (
                  <div key={i} style={{ background: 'var(--bg)', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>"{c}"</div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleGenerate} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
                🔄 Regenerate
              </button>
              <button onClick={handleSave} disabled={saved} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: saved ? '#16a34a' : '#c9a84c', color: saved ? '#fff' : '#000', fontWeight: 700, cursor: saved ? 'default' : 'pointer', fontSize: 13 }}>
                {saved ? '✅ Saved!' : '💾 Save Draft'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DraftsPanel({ drafts, onDelete }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const visible = drafts.filter(d =>
    (filter === 'all' || d.platform === filter) &&
    (search === '' || d.content.toLowerCase().includes(search.toLowerCase()) || d.product.toLowerCase().includes(search.toLowerCase()))
  )

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', ...PLATFORMS.map(p => p.key)].map(k => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: filter === k ? 700 : 400, background: filter === k ? '#c9a84c' : 'var(--card)', color: filter === k ? '#000' : 'var(--text)', textTransform: 'capitalize', fontSize: 13 }}>
            {k === 'all' ? 'All' : PLATFORMS.find(p => p.key === k)?.icon + ' ' + k}
          </button>
        ))}
        <input placeholder="Search drafts…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, minWidth: 200 }} />
      </div>
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No saved drafts yet — generate some content above</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {visible.map(d => {
            const plat = PLATFORMS.find(p => p.key === d.platform)
            return (
              <div key={d.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{plat?.icon} {plat?.label} · {d.tone}</span>
                  <button onClick={() => onDelete(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14 }}>🗑</button>
                </div>
                <div style={{ fontSize: 11, color: '#c9a84c', marginBottom: 6 }}>📦 {d.product}</div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 10, maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.content}</div>
                {d.hashtags && <div style={{ fontSize: 11, color: '#3b82f6', marginBottom: 10 }}>{d.hashtags.split(' ').slice(0, 5).join(' ')}…</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{d.savedAt}</span>
                  <button onClick={() => copyToClipboard(d.content + '\n\n' + (d.hashtags || ''))}
                    style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>
                    📋 Copy
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminAiContentTools() {
  const [templates, setTemplates] = useState([])
  const [drafts, setDrafts] = useState([])
  const [tab, setTab] = useState('generate')

  useEffect(() => {
    getAiContentTemplates().then(setTemplates)
    getContentDrafts().then(setDrafts)
  }, [])

  async function handleDeleteDraft(id) {
    await deleteContentDraft(id)
    setDrafts(p => p.filter(d => d.id !== id))
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px 28px' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: 'var(--text)', fontSize: 22 }}>🤖 AI Content Tools</h2>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Generate on-brand social media content for your team and influencers</div>
        </div>

        <div style={{ display: 'flex', gap: 0, background: 'var(--card)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 24, width: 'fit-content' }}>
          {[['generate', '✨ Generate'], ['drafts', '📁 Saved Drafts'], ['templates', '📋 Templates']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: tab === k ? 700 : 400, background: tab === k ? '#c9a84c' : 'transparent', color: tab === k ? '#000' : 'var(--text)', fontSize: 14 }}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'generate' && <GeneratePanel templates={templates} />}

        {tab === 'drafts' && <DraftsPanel drafts={drafts} onDelete={handleDeleteDraft} />}

        {tab === 'templates' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {templates.map(t => (
              <div key={t.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{t.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.5 }}>{t.description}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {t.platforms.map(p => {
                    const plat = PLATFORMS.find(x => x.key === p)
                    return <span key={p} style={{ fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', color: 'var(--text2)' }}>{plat?.icon} {p}</span>
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
