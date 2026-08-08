import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminFeatureFlags, updateAdminFeatureFlag } from '../../api/mlmApi'

const ENVIRONMENTS = ['production', 'staging', 'all']

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState(null)
  const [loading, setLoading] = useState(true)
  const [env, setEnv] = useState('all')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminFeatureFlags().then(setFlags).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function toggle(flag) {
    setSaving(flag.id)
    const updated = await updateAdminFeatureFlag(flag.id, { enabled: !flag.enabled })
    setFlags(f => f.map(x => x.id === flag.id ? { ...x, ...updated } : x))
    setSaving(null)
  }

  async function updateRollout(flag, pct) {
    setSaving(flag.id + '_rollout')
    const updated = await updateAdminFeatureFlag(flag.id, { rolloutPercent: pct })
    setFlags(f => f.map(x => x.id === flag.id ? { ...x, ...updated } : x))
    setSaving(null)
  }

  const filtered = !flags ? [] : flags
    .filter(f => env === 'all' || f.environment === env || f.environment === 'all')
    .filter(f => !search || f.key.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase()))

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const enabledCount = (flags || []).filter(f => f.enabled).length

  return (
    <AdminLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🚩 Feature Flags</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Control platform feature rollout without code deploys.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Flags', value: (flags || []).length },
            { label: 'Enabled', value: enabledCount },
            { label: 'Disabled', value: (flags || []).length - enabledCount },
            { label: 'Partial Rollout', value: (flags || []).filter(f => f.enabled && f.rolloutPercent < 100).length },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search flags…" style={{ padding: '8px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, minWidth: 200 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {ENVIRONMENTS.map(e => (
              <button key={e} onClick={() => setEnv(e)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: env === e ? 'var(--gold)' : 'var(--card)', color: env === e ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: env === e ? 700 : 400, textTransform: 'capitalize' }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No flags found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(flag => (
              <div key={flag.id} style={{ ...card, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <code style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>{flag.key}</code>
                    <span style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--bg)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4, textTransform: 'capitalize' }}>{flag.environment}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>{flag.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6 }}>Last modified: {flag.lastModified} by {flag.modifiedBy}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: flag.enabled ? '#86efac' : 'var(--text2)' }}>{flag.enabled ? 'Enabled' : 'Disabled'}</span>
                    <button
                      onClick={() => toggle(flag)}
                      disabled={saving === flag.id}
                      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: flag.enabled ? '#166534' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', opacity: saving === flag.id ? 0.6 : 1 }}
                    >
                      <span style={{ position: 'absolute', top: 3, left: flag.enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: flag.enabled ? '#86efac' : '#9ca3af', transition: 'left 0.2s' }} />
                    </button>
                  </div>
                  {flag.enabled && (
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                        <span>Rollout</span><span style={{ fontWeight: 700, color: 'var(--text)' }}>{flag.rolloutPercent}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100" value={flag.rolloutPercent}
                        onChange={e => setFlags(f => f.map(x => x.id === flag.id ? { ...x, rolloutPercent: Number(e.target.value) } : x))}
                        onMouseUp={e => updateRollout(flag, Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--gold)' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
