import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberSubscriptionHistory } from '../../api/mlmApi'

const TYPE_CONFIG = {
  started:     { icon: '🚀', label: 'Subscribed',     color: '#86efac', dot: '#166534' },
  renewal:     { icon: '🔄', label: 'Auto-Renewed',   color: '#93c5fd', dot: '#1d4ed8' },
  plan_change: { icon: '⬆️', label: 'Plan Changed',   color: '#fcd34d', dot: '#d97706' },
  pause:       { icon: '⏸', label: 'Paused',          color: '#d1d5db', dot: '#4b5563' },
  cancelled:   { icon: '✕', label: 'Cancelled',       color: '#fca5a5', dot: '#991b1b' },
}

export default function SubscriptionHistory() {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMemberSubscriptionHistory().then(setHistory).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📋 Subscription History</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Your complete subscription timeline — plan changes, renewals, and pauses.</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !history || history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No history yet.</div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 32 }}>
            <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: 'var(--border)', borderRadius: 1 }} />
            {history.map((item, i) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.renewal
              return (
                <div key={item.id} style={{ position: 'relative', marginBottom: i < history.length - 1 ? 28 : 0 }}>
                  <div style={{
                    position: 'absolute', left: -32, top: 16,
                    width: 16, height: 16, borderRadius: '50%',
                    background: cfg.dot, border: '2px solid var(--bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8,
                  }} />
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{item.at}</div>
                    </div>

                    <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
                      {item.type === 'plan_change' && (
                        <div>Changed from <strong>{item.fromPlan}</strong> → <strong style={{ color: '#86efac' }}>{item.toPlan}</strong></div>
                      )}
                      {item.type === 'renewal' && (
                        <div>Renewed: <strong>{item.plan}</strong> · <span style={{ color: '#86efac' }}>{item.amount}</span></div>
                      )}
                      {item.type === 'started' && (
                        <div>Started: <strong>{item.plan}</strong> · <span style={{ color: '#86efac' }}>{item.amount}</span></div>
                      )}
                      {item.type === 'pause' && (
                        <div>Paused <strong>{item.plan}</strong> · Resumed: {item.resumedAt}</div>
                      )}
                      {item.note && (
                        <div style={{ color: 'var(--text2)', marginTop: 4, fontSize: 12 }}>{item.note}</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
