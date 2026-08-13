import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminTranslations, saveTranslationKey } from '../../api/mlmApi'

export default function AdminTranslationManager() {
  const [data, setData]         = useState(null)
  const [loading, setLoad]      = useState(true)
  const [locale, setLocale]     = useState('nb')
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [edit, setEdit]         = useState(null)
  const [editVal, setEditVal]   = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => { getAdminTranslations().then(setData).finally(() => setLoad(false)) }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const currentLocale = data.locales.find(l => l.code === locale)
  const keys = data.keys.filter(k => {
    const q = search.toLowerCase()
    const matchQ = !q || k.key.toLowerCase().includes(q) || k.en.toLowerCase().includes(q) || (k.translations[locale]||'').toLowerCase().includes(q)
    const matchF = filter === 'all' || (filter === 'missing' && !k.translations[locale]) || (filter === 'translated' && !!k.translations[locale])
    return matchQ && matchF
  })

  async function handleSave() {
    if (!edit) return
    setSaving(true)
    await saveTranslationKey(edit.key, locale, editVal)
    setData(prev => ({
      ...prev,
      keys: prev.keys.map(k => k.key === edit.key ? { ...k, translations: { ...k.translations, [locale]: editVal } } : k)
    }))
    setEdit(null); setSaving(false)
  }

  const pct = currentLocale ? Math.round((currentLocale.translated / currentLocale.total) * 100) : 0

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🌐 Translation Manager</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Manage UI string translations per locale.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
          {data.locales.map(l => {
            const p = Math.round((l.translated / l.total) * 100)
            const isActive = l.code === locale
            return (
              <div key={l.code} onClick={() => setLocale(l.code)} style={{ ...card, cursor: 'pointer', border: `1px solid ${isActive ? '#a5b4fc' : 'var(--border)'}`, background: isActive ? '#a5b4fc11' : 'var(--card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>{l.flag} {l.name}</span>
                  <span style={{ fontSize: 12, color: p === 100 ? '#86efac' : '#fbbf24', fontWeight: 700 }}>{p}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p}%`, background: p === 100 ? '#86efac' : '#a5b4fc', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6 }}>{l.translated}/{l.total} strings</div>
              </div>
            )
          })}
        </div>

        <div style={{ ...card, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{currentLocale?.name} — {pct}% complete</div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#86efac' : '#a5b4fc', borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{currentLocale?.total - currentLocale?.translated} missing</div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search keys or text…"
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
          {['all','missing','translated'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              border: `1px solid ${filter === f ? '#a5b4fc' : 'var(--border)'}`,
              background: filter === f ? '#a5b4fc22' : 'transparent',
              color: filter === f ? '#a5b4fc' : 'var(--text2)',
            }}>{f}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {keys.map(k => (
            <div key={k.key} style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#a5b4fc', marginBottom: 2 }}>{k.key}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>EN: {k.en}</div>
              </div>
              <div style={{ fontSize: 13, color: k.translations[locale] ? 'var(--text)' : '#f87171' }}>
                {k.translations[locale] || '— not translated'}
              </div>
              <button onClick={() => { setEdit(k); setEditVal(k.translations[locale] || '') }} style={{
                padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text2)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>Edit</button>
            </div>
          ))}
          {keys.length === 0 && <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No strings match.</div>}
        </div>

        {edit && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 480, maxWidth: '95vw' }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Edit Translation</div>
              <div style={{ fontFamily: 'monospace', color: '#a5b4fc', fontSize: 12, marginBottom: 4 }}>{edit.key}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>EN: {edit.en}</div>
              <textarea value={editVal} onChange={e => setEditVal(e.target.value)} rows={3}
                placeholder={`${currentLocale?.name} translation…`}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 20 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEdit(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#86efac', color: '#14532d', fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving…' : 'Save Translation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
