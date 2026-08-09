import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminLogViewer } from '../../api/mlmApi'

const SEV_COLOR = { error: '#f87171', warn: '#fbbf24', info: '#93c5fd', debug: '#818cf8' }
const SEV_BG = { error: '#f8717122', warn: '#fbbf2422', info: '#93c5fd22', debug: '#818cf822' }

export default function AdminLogViewer() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [severity, setSeverity] = useState('all')
  const [search, setSearch] = useState('')
  const [service, setService] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    setLoading(true)
    getAdminLogViewer().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '6px 14px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  const logs = (data?.logs || []).filter(l => {
    const matchSev = severity === 'all' || l.severity === severity
    const matchSvc = service === 'all' || l.service === service
    const matchSearch = !search || l.message.toLowerCase().includes(search.toLowerCase()) || l.requestId?.includes(search)
    return matchSev && matchSvc && matchSearch
  })

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Log Viewer</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Real-time application and system log explorer with severity filtering</p>
          </div>
          <button onClick={() => { setLoading(true); getAdminLogViewer().then(setData).finally(() => setLoading(false)) }} style={btn('#6366f111', '#6366f1')}>↻ Refresh</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Errors (1h)', value: data?.errorsLastHour || 0, color: '#f87171' },
            { label: 'Warnings (1h)', value: data?.warnsLastHour || 0, color: '#fbbf24' },
            { label: 'Requests (1h)', value: (data?.requestsLastHour || 0).toLocaleString(), color: '#93c5fd' },
            { label: 'P95 Latency', value: data?.p95Latency || '—', color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search message or request ID…" style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, minWidth: 220 }} />
          <select value={service} onChange={e => setService(e.target.value)} style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13 }}>
            <option value="all">All Services</option>
            {(data?.services || []).map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'error', 'warn', 'info', 'debug'].map(s => (
              <button key={s} onClick={() => setSeverity(s)} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', textTransform: 'capitalize', fontSize: 12, fontWeight: 700, background: severity === s ? (SEV_COLOR[s] || '#6366f1') : 'var(--border)', color: severity === s ? '#fff' : 'var(--text-muted)' }}>{s}</button>
            ))}
          </div>
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Loading logs…</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {logs.map(log => (
              <div key={log.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <div onClick={() => setExpanded(expanded === log.id ? null : log.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', cursor: 'pointer', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: SEV_COLOR[log.severity], background: SEV_BG[log.severity], borderRadius: 5, padding: '2px 8px', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{log.severity}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{log.timestamp}</span>
                  <span style={{ fontSize: 12, color: '#818cf8', whiteSpace: 'nowrap', flexShrink: 0 }}>[{log.service}]</span>
                  <span style={{ fontSize: 13, flex: 1, fontFamily: 'monospace' }}>{log.message}</span>
                  {log.latency && <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{log.latency}ms</span>}
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{expanded === log.id ? '▲' : '▼'}</span>
                </div>
                {expanded === log.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', background: 'var(--border)22', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                    {log.requestId && <div><strong>Request ID:</strong> {log.requestId}</div>}
                    {log.userId && <div><strong>User ID:</strong> {log.userId}</div>}
                    {log.method && <div><strong>Method:</strong> {log.method} {log.path}</div>}
                    {log.statusCode && <div><strong>Status:</strong> {log.statusCode}</div>}
                    {log.stack && <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', color: SEV_COLOR.error, fontSize: 11 }}>{log.stack}</pre>}
                  </div>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No log entries match your filter.</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
