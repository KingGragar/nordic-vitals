import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminCallCenter, assignAdminCallCenterTicket } from '../../api/mlmApi'

const STATUS_COLORS = {
  available: { bg: '#052e16', color: '#86efac', border: '#166534' },
  busy:      { bg: '#1c1917', color: '#fbbf24', border: '#92400e' },
  break:     { bg: '#1e1b4b', color: '#a5b4fc', border: '#3730a3' },
  offline:   { bg: '#18181b', color: '#71717a', border: '#3f3f46' },
}

const PRIORITY_COLORS = {
  high:   '#fca5a5',
  medium: '#fbbf24',
  low:    '#86efac',
}

export default function AdminCallCenter() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminCallCenter().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function assign(ticketId, agentId) {
    setAssigning(ticketId)
    await assignAdminCallCenterTicket(ticketId, agentId)
    setData(prev => ({
      ...prev,
      queue: prev.queue.map(q => q.id === ticketId
        ? { ...q, assignedTo: prev.agents.find(a => a.id === agentId)?.name || agentId }
        : q),
    }))
    setAssigning(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const fmtWait = s => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const availableAgents = data.agents.filter(a => a.status === 'available')

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📞 Call Center</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Live support queue, agent status, and resolved ticket history.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Queue',         value: data.queueLength,                     color: '#fbbf24' },
            { label: 'Avg Wait',      value: fmtWait(data.avgWaitSec),             color: '#a5b4fc' },
            { label: 'SLA Breached',  value: data.slaBreached,                     color: '#fca5a5' },
            { label: 'Agents Online', value: data.agentsOnline,                    color: '#86efac' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Live Queue</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {data.queue.map(q => (
                <div key={q.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{q.member}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12 }}>{q.ticket} — {q.issue}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: PRIORITY_COLORS[q.priority], background: 'transparent', border: `1px solid ${PRIORITY_COLORS[q.priority]}`, borderRadius: 20, padding: '2px 10px', textTransform: 'capitalize' }}>{q.priority}</span>
                  <div style={{ color: 'var(--text2)', fontSize: 12, minWidth: 60 }}>⏱ {fmtWait(q.waitSec)}</div>
                  {q.assignedTo ? (
                    <span style={{ fontSize: 12, color: '#86efac', background: '#052e16', border: '1px solid #166534', borderRadius: 20, padding: '2px 10px' }}>{q.assignedTo}</span>
                  ) : availableAgents.length > 0 ? (
                    <select
                      onChange={e => e.target.value && assign(q.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}
                      disabled={assigning === q.id}
                    >
                      <option value="">Assign…</option>
                      {availableAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>No agents free</span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 700, marginBottom: 12 }}>Recently Resolved</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.recentResolved.map(r => (
                <div key={r.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.member} — {r.issue}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 11 }}>{r.ticket} · {r.resolvedBy}</div>
                  </div>
                  <div style={{ color: 'var(--text2)', fontSize: 12 }}>{fmtWait(r.resolveSec)}</div>
                  <div style={{ color: '#fbbf24', fontSize: 14 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Agent Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.agents.map(a => {
                const sc = STATUS_COLORS[a.status] || STATUS_COLORS.offline
                return (
                  <div key={a.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '2px 10px', textTransform: 'capitalize' }}>{a.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)' }}>
                      <span>Tickets today: <b style={{ color: 'var(--text)' }}>{a.ticketsToday}</b></span>
                      <span>⭐ {a.satisfaction}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
