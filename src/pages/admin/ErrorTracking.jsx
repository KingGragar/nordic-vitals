import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminErrorTracking, resolveAdminError } from '../../api/mlmApi'

const STATUS_COLORS = { open: '#ef4444', resolved: '#86efac', ignored: '#6b7280' }
const SEVERITY = ['all', 'critical', 'high', 'medium', 'low']
const SEV_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#fbbf24', low: '#86efac' }

export default function AdminErrorTracking() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [severity, setSeverity] = useState('all')
  const [status, setStatus] = useState('open')
  const [selected, setSelected] = useState(null)
  const [resolving, setResolving] = useState(null)

  useEffect(() => { getAdminErrorTracking().then(setData).finally(() => setLoading(false)) }, [])

  async function handleResolve(id) {
    setResolving(id)
    await resolveAdminError(id)
    setData(prev => ({
      ...prev,
      errors: prev.errors.map(e => e.id === id ? { ...e, status: 'resolved' } : e),
    }))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'resolved' }))
    setResolving(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const filtered = data.errors.filter(e =>
    (severity === 'all' || e.severity === severity) &&
    (status === 'all' || e.status === status)
  )

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🐛 Error Tracking</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Monitor, triage, and resolve application errors.</div>
          </div>
          <button style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            Configure Alerts
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Open',     value: data.stats.open,     color: '#ef4444' },
            { label: 'Critical', value: data.stats.critical,  color: '#f97316' },
            { label: 'Users Hit', value: data.stats.usersHit, color: '#fbbf24' },
            { label: 'Resolved 7d', value: data.stats.resolved7d, color: '#86efac' },
            { label: 'MTTR',     value: data.stats.mttr,     color: '#a5b4fc' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {SEVERITY.map(s => (
            <button key={s} onClick={() => setSeverity(s)} style={{
              padding: '6px 14px', borderRadius: 20, border: `1px solid ${severity === s ? (SEV_COLORS[s] || 'var(--gold)') : 'var(--border)'}`,
              background: severity === s ? (SEV_COLORS[s] || 'var(--gold)') + '22' : 'transparent',
              color: severity === s ? (SEV_COLORS[s] || 'var(--text)') : 'var(--text2)',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
            }}>{s}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {['open', 'resolved', 'ignored', 'all'].map(st => (
              <button key={st} onClick={() => setStatus(st)} style={{
                padding: '6px 12px', borderRadius: 20, border: `1px solid ${status === st ? 'var(--gold)' : 'var(--border)'}`,
                background: status === st ? '#fbbf2422' : 'transparent',
                color: status === st ? '#fbbf24' : 'var(--text2)', fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              }}>{st}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 20 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{filtered.length} errors</div>
            {filtered.map(e => (
              <div
                key={e.id}
                onClick={() => setSelected(s => s?.id === e.id ? null : e)}
                style={{
                  padding: '12px 14px', borderRadius: 8, marginBottom: 8, cursor: 'pointer',
                  background: selected?.id === e.id ? 'var(--border)' : 'var(--bg)',
                  border: `1px solid ${selected?.id === e.id ? (SEV_COLORS[e.severity] || 'var(--border)') : 'var(--border)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, fontFamily: 'monospace' }}>{e.message}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{e.location} · {e.occurrences} occurrences · {e.lastSeen}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: (SEV_COLORS[e.severity] || '#888') + '22', color: SEV_COLORS[e.severity] || '#888',
                      textTransform: 'uppercase',
                    }}>{e.severity}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: (STATUS_COLORS[e.status] || '#888') + '22', color: STATUS_COLORS[e.status] || '#888',
                    }}>{e.status}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 14 }}>No errors match the selected filters.</div>
            )}
          </div>

          {selected && (
            <div style={{ ...card, position: 'sticky', top: 80 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, fontFamily: 'monospace', wordBreak: 'break-all' }}>{selected.message}</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  background: (SEV_COLORS[selected.severity] || '#888') + '22', color: SEV_COLORS[selected.severity] || '#888', textTransform: 'uppercase',
                }}>{selected.severity}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  background: (STATUS_COLORS[selected.status]) + '22', color: STATUS_COLORS[selected.status],
                }}>{selected.status}</span>
              </div>
              {[
                { label: 'Location',   value: selected.location },
                { label: 'First Seen', value: selected.firstSeen },
                { label: 'Last Seen',  value: selected.lastSeen },
                { label: 'Occurrences',value: selected.occurrences.toLocaleString() },
                { label: 'Users Affected', value: selected.usersAffected },
                { label: 'Browser',    value: selected.browser },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{r.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Stack Trace</div>
                <pre style={{
                  fontSize: 10, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
                  padding: 10, overflow: 'auto', maxHeight: 180, color: '#ef4444', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>{selected.stackTrace}</pre>
              </div>
              {selected.status === 'open' && (
                <button
                  onClick={() => handleResolve(selected.id)}
                  disabled={resolving === selected.id}
                  style={{ width: '100%', marginTop: 14, padding: '9px 0', borderRadius: 8, border: 'none', background: '#86efac', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                >
                  {resolving === selected.id ? 'Resolving…' : '✓ Mark Resolved'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
