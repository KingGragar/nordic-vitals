import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminMobileApp, toggleAdminMobileFlag } from '../../api/mlmApi'

export default function AdminMobileApp() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminMobileApp().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleToggle(id, platform, enabled) {
    setToggling(`${id}-${platform}`)
    await toggleAdminMobileFlag(id, platform, enabled)
    setData(prev => ({
      ...prev,
      featureFlags: prev.featureFlags.map(f => f.id === id
        ? { ...f, [`enabled${platform.charAt(0).toUpperCase() + platform.slice(1)}`]: enabled }
        : f),
    }))
    setToggling(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  return (
    <AdminLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📱 Mobile App</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Version management, push notification stats, and per-platform feature flags.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'iOS Version',    value: data.iosVersion,          sub: `Built ${data.iosBuildDate}`,      color: '#a5b4fc' },
            { label: 'Android Version',value: data.androidVersion,      sub: `Built ${data.androidBuildDate}`,  color: '#86efac' },
            { label: 'Push Sent',      value: data.pushStats.sent.toLocaleString(), sub: `Open rate ${data.pushStats.openRate}`, color: '#fbbf24' },
            { label: 'Opted-in Users', value: data.pushStats.optedIn.toLocaleString(), sub: 'Push notifications',  color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ fontWeight: 700, marginBottom: 12 }}>Feature Flags</div>
        <div style={{ ...card, padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Feature', 'iOS', 'Android', 'Rollout %'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.featureFlags.map((f, i) => (
                <tr key={f.id} style={{ borderBottom: i < data.featureFlags.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: 13 }}>
                    {f.label}
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, fontWeight: 400 }}>{f.key}</div>
                  </td>
                  {['ios', 'android'].map(platform => {
                    const enabled = f[`enabled${platform.charAt(0).toUpperCase() + platform.slice(1)}`]
                    const tid = `${f.id}-${platform}`
                    return (
                      <td key={platform} style={{ padding: '10px 16px' }}>
                        <button
                          onClick={() => handleToggle(f.id, platform, !enabled)}
                          disabled={toggling === tid}
                          style={{
                            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                            background: enabled ? '#166534' : '#3f3f46',
                            position: 'relative', transition: 'background 0.2s',
                          }}
                        >
                          <span style={{
                            position: 'absolute', top: 3, left: enabled ? 22 : 3,
                            width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                          }} />
                        </button>
                      </td>
                    )
                  })}
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${f.rolloutPct}%`, background: '#a5b4fc', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, minWidth: 36, textAlign: 'right' }}>{f.rolloutPct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <a href={data.appStoreLinks.ios} target="_blank" rel="noreferrer" style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
            🍎 iOS App Store
          </a>
          <a href={data.appStoreLinks.android} target="_blank" rel="noreferrer" style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
            🤖 Google Play
          </a>
        </div>
      </div>
    </AdminLayout>
  )
}
