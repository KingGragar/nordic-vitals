import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberTeamMessages, markTeamMessageRead } from '../../api/mlmApi'

const TYPE_COLOR = { broadcast: '#a5b4fc', update: '#86efac', alert: '#f87171', training: '#fbbf24', recognition: '#f9a8d4' }
const TYPE_ICON  = { broadcast: '📢', update: '📋', alert: '🚨', training: '🎓', recognition: '🏆' }

export default function DashTeamMessages() {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => { getMemberTeamMessages().then(setData).finally(() => setLoad(false)) }, [])

  async function openMsg(msg) {
    if (!msg.read) {
      await markTeamMessageRead(msg.id)
      setData(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === msg.id ? { ...m, read: true } : m),
        unread: prev.unread - 1,
      }))
    }
    setSelected(msg)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const msgs = data.messages.filter(m => filter === 'all' || m.type === filter || (filter === 'unread' && !m.read))

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 22 }}>📩 Team Messages</div>
            {data.unread > 0 && (
              <span style={{ background: '#f87171', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>{data.unread} unread</span>
            )}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Broadcasts and updates from your upline and team leadership.</div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all','unread','broadcast','update','alert','training','recognition'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              border: `1px solid ${filter===f ? (TYPE_COLOR[f]||'#a5b4fc') : 'var(--border)'}`,
              background: filter===f ? (TYPE_COLOR[f]||'#a5b4fc')+'22' : 'transparent',
              color: filter===f ? (TYPE_COLOR[f]||'#a5b4fc') : 'var(--text2)',
            }}>{f}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {msgs.map(m => (
            <div key={m.id} onClick={() => openMsg(m)} style={{
              ...card, cursor: 'pointer',
              background: m.read ? 'var(--card)' : (TYPE_COLOR[m.type]||'#a5b4fc')+'0a',
              border: `1px solid ${m.read ? 'var(--border)' : (TYPE_COLOR[m.type]||'#a5b4fc')+'55'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{TYPE_ICON[m.type]||'📩'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: m.read ? 600 : 800, fontSize: 14 }}>{m.subject}</span>
                    {!m.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />}
                    <span style={{ background: (TYPE_COLOR[m.type]||'#a5b4fc')+'22', color: TYPE_COLOR[m.type]||'#a5b4fc', padding: '1px 7px', borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: 'capitalize' }}>{m.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    From <strong style={{ color: 'var(--text)' }}>{m.from}</strong>
                    &nbsp;·&nbsp;{new Date(m.sent_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70ch' }}>
                    {m.preview}
                  </div>
                </div>
                <div style={{ fontSize: 18, color: 'var(--text2)' }}>›</div>
              </div>
            </div>
          ))}
          {msgs.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No messages match the selected filter.</div>
          )}
        </div>

        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 600, maxWidth: '100%', maxHeight: '80vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>{TYPE_ICON[selected.type]||'📩'}</span>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{selected.subject}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
                From <strong style={{ color: 'var(--text)' }}>{selected.from}</strong>
                &nbsp;·&nbsp;{new Date(selected.sent_at).toLocaleString('en-GB',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{selected.body}</div>
              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <button onClick={() => setSelected(null)} style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
