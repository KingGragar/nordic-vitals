import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSmartNotifications } from '../../api/mlmApi'

const TRIGGER_COLOR = { behavioral: '#93c5fd', milestone: '#86efac', time: '#fbbf24', purchase: '#fb923c', inactivity: '#f87171' }
const CHANNEL_ICONS = { email: '✉️', sms: '💬', push: '🔔', inApp: '📱' }

export default function AdminSmartNotifications() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterActive, setFilterActive] = useState('all')

  useEffect(() => {
    setLoading(true)
    getAdminSmartNotifications().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '6px 14px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  const rules = (data?.rules || []).filter(r => filterActive === 'all' || (filterActive === 'active' ? r.active : !r.active))

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Smart Notifications</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Behavior-triggered notification rules sent automatically based on member actions</p>
          </div>
          <button onClick={() => setShowModal(true)} style={btn('#6366f1')}>+ New Rule</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Active Rules', value: (data?.rules || []).filter(r => r.active).length, color: '#86efac' },
            { label: 'Sent (30d)', value: (data?.sent30d || 0).toLocaleString(), color: '#93c5fd' },
            { label: 'Open Rate', value: `${data?.openRate || 0}%`, color: '#fbbf24' },
            { label: 'Click Rate', value: `${data?.clickRate || 0}%`, color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['all', 'active', 'inactive'].map(s => (
            <button key={s} onClick={() => setFilterActive(s)} style={{ padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', textTransform: 'capitalize', fontSize: 13, fontWeight: 600, background: filterActive === s ? '#6366f1' : 'var(--border)', color: filterActive === s ? '#fff' : 'var(--text-muted)' }}>{s}</button>
          ))}
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rules.map(rule => (
              <div key={rule.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{rule.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: TRIGGER_COLOR[rule.triggerType] || '#93c5fd', background: `${TRIGGER_COLOR[rule.triggerType] || '#93c5fd'}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>{rule.triggerType}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: rule.active ? '#86efac' : '#f87171', background: rule.active ? '#86efac22' : '#f8717122', borderRadius: 5, padding: '2px 8px' }}>{rule.active ? 'Active' : 'Paused'}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <strong>Trigger:</strong> {rule.triggerCondition}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      <strong>Message:</strong> {rule.messagePreview}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {(rule.channels || []).map(ch => (
                      <span key={ch} title={ch} style={{ fontSize: 16 }}>{CHANNEL_ICONS[ch] || '📧'}</span>
                    ))}
                    <button style={btn('#6366f111', '#6366f1')}>Edit</button>
                    <button style={btn(rule.active ? '#f8717122' : '#86efac22', rule.active ? '#f87171' : '#86efac')}>{rule.active ? 'Pause' : 'Enable'}</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 10, flexWrap: 'wrap' }}>
                  <span>Sent (30d): <strong style={{ color: 'var(--text)' }}>{rule.sent30d?.toLocaleString()}</strong></span>
                  <span>Open: <strong style={{ color: '#86efac' }}>{rule.openRate}%</strong></span>
                  <span>Click: <strong style={{ color: '#93c5fd' }}>{rule.clickRate}%</strong></span>
                  <span>Unsubscribe: <strong style={{ color: '#f87171' }}>{rule.unsubRate}%</strong></span>
                  {rule.delay && <span>Delay: <strong style={{ color: '#fbbf24' }}>{rule.delay}</strong></span>}
                </div>
              </div>
            ))}
            {rules.length === 0 && (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No notification rules match this filter.</div>
            )}
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 500, width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>New Smart Notification Rule</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Rule Name</label>
                  <input placeholder="Descriptive internal name" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Trigger Type</label>
                    <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                      {['behavioral', 'milestone', 'time', 'purchase', 'inactivity'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Send Delay</label>
                    <input placeholder="e.g. 2 hours, immediate" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Trigger Condition</label>
                  <input placeholder="e.g. Member views cart but doesn't checkout" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Message Template</label>
                  <textarea rows={3} placeholder="Notification message…" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Channels</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {['email', 'sms', 'push', 'inApp'].map(ch => (
                      <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
                        <input type="checkbox" defaultChecked={ch === 'email' || ch === 'inApp'} /> {ch}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={btn('#6366f1')}>Create Rule</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
