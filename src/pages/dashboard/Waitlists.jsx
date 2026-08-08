import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberWaitlists, removeMemberWaitlist, toggleMemberWaitlistNotify } from '../../api/mlmApi'

export default function MemberWaitlists() {
  const [waitlists, setWaitlists] = useState(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null)
  const [toggling, setToggling] = useState(null)

  useEffect(() => {
    getMemberWaitlists().then(setWaitlists).finally(() => setLoading(false))
  }, [])

  async function handleRemove(productId) {
    if (!window.confirm('Leave this waitlist? You will lose your place in the queue.')) return
    setRemoving(productId)
    await removeMemberWaitlist(productId)
    setWaitlists(prev => prev.filter(w => w.productId !== productId))
    setRemoving(null)
  }

  async function handleToggleNotify(productId, current) {
    setToggling(productId)
    await toggleMemberWaitlistNotify(productId, !current)
    setWaitlists(prev => prev.map(w => w.productId === productId ? { ...w, notifyMe: !current } : w))
    setToggling(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📋 My Waitlists</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Products you've joined the waitlist for. You'll be notified when they're back in stock.</div>
        </div>

        {!waitlists || waitlists.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No waitlists yet</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>When you join a product waitlist in the shop, it will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {waitlists.map(w => {
              const positionPct = Math.max(5, Math.round(((w.totalWaiting - w.position + 1) / w.totalWaiting) * 100))
              return (
                <div key={w.productId} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{w.productName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>SKU: {w.sku} · Joined {new Date(w.joinedAt).toLocaleDateString()}</div>
                    </div>
                    {w.restockEta && (
                      <div style={{ background: '#1e3a5f', border: '1px solid #1d4ed8', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#93c5fd', flexShrink: 0 }}>
                        ETA: {new Date(w.restockEta).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Queue position */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text2)' }}>Queue position</span>
                      <span style={{ fontWeight: 700 }}>#{w.position} of {w.totalWaiting}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${positionPct}%`, background: 'var(--gold)', borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                      {w.position <= 5 ? '🔥 You\'re near the front!' : w.position <= 15 ? '⏳ Moving up the queue' : '📋 Holding your place'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={w.notifyMe}
                        disabled={toggling === w.productId}
                        onChange={() => handleToggleNotify(w.productId, w.notifyMe)}
                        style={{ accentColor: 'var(--gold)', width: 16, height: 16 }}
                      />
                      <span style={{ color: toggling === w.productId ? 'var(--text2)' : 'var(--text)' }}>
                        Notify me by email when back in stock
                      </span>
                    </label>
                    <button
                      onClick={() => handleRemove(w.productId)}
                      disabled={removing === w.productId}
                      style={{ padding: '7px 14px', background: 'none', border: '1px solid #7f1d1d', borderRadius: 8, color: '#f87171', fontSize: 13, cursor: removing === w.productId ? 'not-allowed' : 'pointer', opacity: removing === w.productId ? 0.6 : 1, flexShrink: 0 }}
                    >
                      {removing === w.productId ? 'Leaving…' : 'Leave Waitlist'}
                    </button>
                  </div>
                </div>
              )
            })}

            <div style={{ ...card, background: 'var(--bg)', textAlign: 'center', fontSize: 13, color: 'var(--text2)', padding: '14px 20px' }}>
              💡 Your position is reserved as long as you stay on the waitlist. You'll receive an email when it's your turn.
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
