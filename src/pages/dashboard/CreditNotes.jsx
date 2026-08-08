import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberCreditNotes } from '../../api/mlmApi'

const STATUS_COLOR = { active: '#86efac', used: '#93c5fd', void: '#f87171', expired: '#fbbf24' }
const STATUS_BG    = { active: '#14532d', used: '#1e3a5f', void: '#7f1d1d', expired: '#78350f' }
const TYPE_ICON    = { refund: '↩️', goodwill: '🎁', correction: '✏️', loyalty: '⭐' }

export default function DashCreditNotes() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getMemberCreditNotes().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const notes = (data?.notes || []).filter(n => filter === 'all' || n.status === filter)
  const totalActive = (data?.notes || []).filter(n => n.status === 'active').reduce((s, n) => s + n.amount, 0)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📄 My Credit Notes</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Store credits issued to your account — use them on future orders.</div>
        </div>

        <div style={{ ...card, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(135deg, #78350f22, #78350f11)' }}>
          <div style={{ fontSize: 36 }}>💰</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 28, color: 'var(--gold)' }}>€{totalActive.toLocaleString()}</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Available store credit</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'active', 'used', 'void', 'expired'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'transparent', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !notes.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No credit notes {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.map(n => (
              <div key={n.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 24 }}>{TYPE_ICON[n.type] || '📄'}</div>
                <div style={{ flex: '1 1 180px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{n.reason}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>#{n.id} · {n.type} · Issued {n.issuedAt}</div>
                  {n.status === 'active' && n.expiresAt && (
                    <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 2 }}>Expires {n.expiresAt}</div>
                  )}
                  {n.status === 'used' && n.usedAt && (
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Used on {n.usedAt}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>€{n.amount.toLocaleString()}</div>
                  <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: STATUS_BG[n.status], color: STATUS_COLOR[n.status], textTransform: 'capitalize' }}>{n.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...card, marginTop: 24, fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 10 }}>
          <span>ℹ️</span>
          <span>Store credits are applied automatically at checkout. Credit notes expire after the validity period shown. Contact support if you have questions about a specific note.</span>
        </div>
      </div>
    </DashboardLayout>
  )
}
