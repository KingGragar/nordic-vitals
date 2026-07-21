import { useState, useEffect } from 'react'
import { getCommissions } from '../../api/mlmApi'
import { COMMISSIONS as MOCK_COMMISSIONS } from '../../data/mock'
import DashboardLayout from '../../components/DashboardLayout'

const TABS = ['This Week', 'This Month', 'Last Month', 'All Time']

const TYPE_BADGE = {
  'Pairing Bonus':         { cls: 'badge-blue',   label: 'Pairing' },
  'Sponsor Bonus':         { cls: 'badge-green',  label: 'Sponsor' },
  'Level Commission L1':   { cls: 'badge-yellow', label: 'Level L1' },
  'Level Commission L2':   { cls: 'badge-yellow', label: 'Level L2' },
  'Level Commission L3':   { cls: 'badge-yellow', label: 'Level L3' },
  'Pool Bonus':            { cls: 'badge-grey',   label: 'Pool' },
  'Override Bonus':        { cls: 'badge-gold',   label: 'Override' },
}

const BONUS_GROUP = {
  'Pairing Bonus':        { label: 'Pairing',  color: '#3b82f6' },
  'Sponsor Bonus':        { label: 'Sponsor',  color: '#10b981' },
  'Level Commission L1':  { label: 'Level',    color: '#d69e2e' },
  'Level Commission L2':  { label: 'Level',    color: '#d69e2e' },
  'Level Commission L3':  { label: 'Level',    color: '#d69e2e' },
  'Pool Bonus':           { label: 'Pool',     color: '#8b5cf6' },
  'Override Bonus':       { label: 'Override', color: '#ec4899' },
}

function computeSummary(commissions) {
  const totalEarned  = commissions.reduce((s, c) => s + c.amount, 0)
  const pendingAmount = commissions.filter(c => c.status === 'Pending').reduce((s, c) => s + c.amount, 0)
  const paidAmount    = commissions.filter(c => c.status === 'Paid').reduce((s, c) => s + c.amount, 0)
  const groups = {}
  commissions.forEach(c => {
    const g = BONUS_GROUP[c.type] || { label: 'Other', color: '#64748b' }
    groups[g.label] = groups[g.label] || { label: g.label, color: g.color, amount: 0 }
    groups[g.label].amount += c.amount
  })
  const segments = Object.values(groups)
    .filter(g => g.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map(g => ({ ...g, pct: totalEarned > 0 ? Math.round((g.amount / totalEarned) * 100) : 0 }))
  return { totalEarned, pendingAmount, paidAmount, segments }
}

export default function Commissions() {
  const [activeTab, setActiveTab] = useState('This Month')
  const [commissions, setCommissions] = useState(MOCK_COMMISSIONS)

  useEffect(() => {
    getCommissions()
      .then(d => { if (d?.commissions?.length) setCommissions(d.commissions) })
      .catch(() => {})
  }, [])

  const { totalEarned, pendingAmount, paidAmount, segments } = computeSummary(commissions)

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>
        Commissions
      </h1>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--border)',
        marginBottom: '24px',
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === tab ? 'var(--gold)' : 'var(--text2)',
              borderBottom: activeTab === tab ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <div className="stat-card">
          <div className="label">Total Earned</div>
          <div className="value">{totalEarned.toLocaleString()} MLMT</div>
          <div className="sub">All commissions</div>
        </div>
        <div className="stat-card">
          <div className="label">Pending</div>
          <div className="value" style={{ color: 'var(--yellow)' }}>{pendingAmount.toLocaleString()} MLMT</div>
          <div className="sub">Processing</div>
        </div>
        <div className="stat-card">
          <div className="label">Paid Out</div>
          <div className="value" style={{ color: 'var(--green-ok)' }}>{paidAmount.toLocaleString()} MLMT</div>
          <div className="sub">Received</div>
        </div>
      </div>

      {/* Breakdown bar */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cream)', marginBottom: '16px' }}>
          Commission Breakdown
        </h2>
        <div style={{
          display: 'flex',
          height: '28px',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '12px',
        }}>
          {segments.map(seg => (
            <div
              key={seg.label}
              style={{
                width: `${seg.pct}%`,
                background: seg.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: '#fff',
                transition: 'width 0.4s ease',
              }}
            >
              {seg.pct}%
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {segments.map(seg => (
            <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '10px', height: '10px',
                borderRadius: '2px',
                background: seg.color,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{seg.label} ({seg.pct}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full commissions table */}
      <div style={{
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)' }}>All Commissions</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>From</th>
              <th>Leg / Level</th>
              <th>Amount (MLMT)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map(c => {
              const badge = TYPE_BADGE[c.type] || { cls: 'badge-grey', label: c.type }
              return (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{c.date}</td>
                  <td>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  </td>
                  <td style={{ fontSize: '13px' }}>{c.from}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text2)' }}>{c.leg}</td>
                  <td style={{ fontWeight: 700, color: 'var(--cream)' }}>
                    {c.amount.toLocaleString()} MLMT
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'Paid' ? 'badge-green' : 'badge-yellow'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
