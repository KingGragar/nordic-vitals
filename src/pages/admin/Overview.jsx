import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { useNavigate } from 'react-router-dom'
import {
  getAdminMembers, getAdminSummary, getPayoutQueue,
  getCommissionRuns, getAdminNetworkVolume, triggerCommissionRun,
} from '../../api/mlmApi'
import { COMMISSION_RUNS, ADMIN_MEMBERS } from '../../data/mock'

function ago(isoStr) {
  if (!isoStr) return '—'
  const diff = Date.now() - new Date(isoStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  if (d === 1) return '1d ago'
  return `${d}d ago`
}

export default function Overview() {
  const navigate = useNavigate()

  const [members,     setMembers]     = useState([])
  const [summary,     setSummary]     = useState(null)
  const [payouts,     setPayouts]     = useState([])
  const [runs,        setRuns]        = useState(COMMISSION_RUNS.slice(0, 5))
  const [netVol,      setNetVol]      = useState(null)
  const [triggering,  setTriggering]  = useState(false)
  const [triggerMsg,  setTriggerMsg]  = useState(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    let done = 0
    const finish = () => { done++; if (done >= 5) setLoading(false) }

    getAdminMembers()
      .then(d => { if (d?.members) setMembers(d.members) })
      .catch(() => {})
      .finally(finish)

    getAdminSummary()
      .then(d => { if (d) setSummary(d) })
      .catch(() => {})
      .finally(finish)

    getPayoutQueue()
      .then(d => { if (d?.queue) setPayouts(d.queue) })
      .catch(() => {})
      .finally(finish)

    getCommissionRuns({ limit: 5 })
      .then(d => { if (d?.runs?.length) setRuns(d.runs.slice(0, 5)) })
      .catch(() => {})
      .finally(finish)

    getAdminNetworkVolume()
      .then(d => { if (d) setNetVol(d) })
      .catch(() => {})
      .finally(finish)
  }, [])

  async function handleTriggerRun() {
    setTriggering(true)
    setTriggerMsg(null)
    try {
      const res = await triggerCommissionRun({ type: 'manual' })
      setTriggerMsg({ ok: true, text: `Commission run ${res?.run_id || 'started'} — ${res?.status || 'Running'}` })
    } catch (e) {
      setTriggerMsg({ ok: false, text: e.message || 'Failed to trigger run' })
    } finally {
      setTriggering(false)
    }
  }

  const totalMembers  = members.length || ADMIN_MEMBERS.length
  const activeMembers = members.filter(m => m.status === 'Active').length || ADMIN_MEMBERS.filter(m => m.status === 'Active').length
  const pendingPayouts = payouts.length
  const pendingPayoutTotal = payouts.reduce((s, p) => s + (p.amount || 0), 0)
  const lastRun = runs[0]
  const networkPv = netVol?.network_pv ?? 42800
  const commissionsPaid = netVol?.commissions_paid_last_run ?? 18400
  const tokenSupply = summary?.total_supply ?? 100_000_000
  const bonusPaid = summary?.total_bonus_paid ?? 3133

  const allMembers = members.length > 0 ? members : ADMIN_MEMBERS

  const recentSignups = useMemo(() => {
    return [...allMembers]
      .sort((a, b) => new Date(b.joined) - new Date(a.joined))
      .slice(0, 5)
  }, [allMembers])

  const RANK_THRESHOLDS = {
    Bronze:   { minPv: 100,  minGv: 1000  },
    Silver:   { minPv: 300,  minGv: 4000  },
    Gold:     { minPv: 500,  minGv: 10000 },
    Platinum: { minPv: 1000, minGv: 30000 },
  }
  const RANK_ORDER = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']

  const nearRankUp = useMemo(() => {
    return allMembers
      .filter(m => m.status === 'Active' && m.rank !== 'Platinum')
      .map(m => {
        const currentIdx = RANK_ORDER.indexOf(m.rank)
        const nextRank   = RANK_ORDER[currentIdx + 1]
        if (!nextRank) return null
        const thresh = RANK_THRESHOLDS[nextRank]
        if (!thresh) return null
        const pvPct = Math.min(100, Math.round((m.pv / thresh.minPv) * 100))
        const gvPct = Math.min(100, Math.round((m.gv / thresh.minGv) * 100))
        const progress = Math.min(pvPct, gvPct)
        return { ...m, nextRank, progress }
      })
      .filter(Boolean)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5)
  }, [allMembers])

  const kpis = [
    {
      label: 'Total Members',
      value: totalMembers.toLocaleString(),
      sub: `${activeMembers} active · ${totalMembers - activeMembers} inactive`,
      color: 'var(--cream)',
      action: () => navigate('/admin'),
    },
    {
      label: 'Network PV',
      value: networkPv.toLocaleString(),
      sub: 'Total personal volume',
      color: '#c9a84c',
      action: null,
    },
    {
      label: 'Last Run Paid',
      value: `${commissionsPaid.toLocaleString()} MLMT`,
      sub: lastRun ? `Run ${lastRun.id} · ${ago(lastRun.started_at)}` : '—',
      color: '#22c55e',
      action: () => navigate('/admin/runs'),
    },
    {
      label: 'Pending Payouts',
      value: pendingPayouts.toLocaleString(),
      sub: `${pendingPayoutTotal.toLocaleString()} MLMT queued`,
      color: pendingPayouts > 0 ? '#f59e0b' : 'var(--text2)',
      action: () => navigate('/admin/payouts'),
    },
    {
      label: 'Token Supply',
      value: `${(tokenSupply / 1_000_000).toFixed(0)}M MLMT`,
      sub: `${bonusPaid.toLocaleString()} MLMT bonuses paid all-time`,
      color: 'var(--text)',
      action: null,
    },
    {
      label: 'Active Rate',
      value: totalMembers > 0 ? `${Math.round((activeMembers / totalMembers) * 100)}%` : '—',
      sub: 'Active / total members',
      color: 'var(--cream)',
      action: null,
    },
  ]

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>
            Admin Overview
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text2)' }}>
            {loading ? 'Loading…' : 'Live network snapshot'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {triggerMsg && (
            <span className={`badge ${triggerMsg.ok ? 'badge-green' : 'badge-yellow'}`}>
              {triggerMsg.text}
            </span>
          )}
          <button
            className="btn btn-gold btn-sm"
            onClick={handleTriggerRun}
            disabled={triggering}
            style={{ opacity: triggering ? 0.6 : 1 }}
          >
            {triggering ? 'Starting…' : '⚡ Run Commissions'}
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '28px',
      }}>
        {kpis.map(k => (
          <div
            key={k.label}
            className="stat-card"
            onClick={k.action || undefined}
            style={{ cursor: k.action ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
            onMouseEnter={k.action ? e => e.currentTarget.style.borderColor = '#c9a84c55' : undefined}
            onMouseLeave={k.action ? e => e.currentTarget.style.borderColor = '' : undefined}
          >
            <div className="label">{k.label}</div>
            <div className="value" style={{ color: k.color }}>{k.value}</div>
            <div className="sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-column: recent runs + rank distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '20px' }}>

        {/* Recent commission runs */}
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px 12px', borderBottom: '1px solid var(--border)',
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cream)' }}>Recent Commission Runs</h2>
            <button
              onClick={() => navigate('/admin/runs')}
              className="btn btn-outline btn-sm"
            >View all</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Run</th>
                <th>Type</th>
                <th>Paid</th>
                <th>Members</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '13px' }}>{r.id}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{r.type}</td>
                  <td style={{ fontSize: '13px', fontWeight: 600 }}>{(r.total_paid || 0).toLocaleString()} MLMT</td>
                  <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{(r.members_processed || 0).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${
                      r.status === 'Completed' ? 'badge-green'
                      : r.status === 'Running'  ? 'badge-yellow'
                      : r.status === 'Failed'   ? 'badge-red'
                      : 'badge-grey'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pending payouts */}
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px 12px', borderBottom: '1px solid var(--border)',
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cream)' }}>
              Pending Payouts
              {pendingPayouts > 0 && (
                <span className="badge badge-yellow" style={{ marginLeft: '8px', fontSize: '11px' }}>
                  {pendingPayouts}
                </span>
              )}
            </h2>
            <button
              onClick={() => navigate('/admin/payouts')}
              className="btn btn-outline btn-sm"
            >Manage</button>
          </div>
          {payouts.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text2)', fontSize: '14px' }}>
              No pending payouts
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {payouts.slice(0, 5).map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 500 }}>{p.member}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{p.memberId}</div>
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>
                      {(p.amount || 0).toLocaleString()} MLMT
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{p.requested}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {payouts.length > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text2)' }}>
              Total queued: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{pendingPayoutTotal.toLocaleString()} MLMT</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Signups + Near Rank Up */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '20px' }}>

        {/* Recent signups */}
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cream)' }}>Recent Signups</h2>
            <button onClick={() => navigate('/admin')} className="btn btn-outline btn-sm">View all</button>
          </div>
          {recentSignups.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text2)', fontSize: '14px' }}>No members found</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Country</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{m.id}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{m.country}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{m.joined}</td>
                    <td><span className={`badge ${m.status === 'Active' ? 'badge-green' : 'badge-grey'}`}>{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Near rank up */}
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cream)' }}>
              Near Rank Up
              <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 400, marginLeft: '8px' }}>active members</span>
            </h2>
            <button onClick={() => navigate('/admin')} className="btn btn-outline btn-sm">Manage</button>
          </div>
          {nearRankUp.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text2)', fontSize: '14px' }}>All members at max rank or no data</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Current → Next</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {nearRankUp.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>PV {m.pv} · GV {m.gv?.toLocaleString()}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                      {m.rank} → <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{m.nextRank}</span>
                    </td>
                    <td style={{ minWidth: '100px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--navy3)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${m.progress}%`, background: m.progress >= 80 ? '#22c55e' : m.progress >= 50 ? 'var(--gold)' : '#60a5fa', borderRadius: '3px', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text2)', minWidth: '32px', textAlign: 'right' }}>{m.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Quick nav cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
      }}>
        {[
          { label: '👥 Members',         desc: 'Browse & manage all members',   path: '/admin' },
          { label: '🛍️ Products',       desc: 'Manage Viking Peptides catalog', path: '/admin/products' },
          { label: '🗃️ Inventory',      desc: 'Stock levels, reorder alerts & movements', path: '/admin/inventory' },
          { label: '📦 Orders',          desc: 'Track & update all orders',      path: '/admin/orders' },
          { label: '♻️ Autoships',       desc: 'Recurring subscription orders',  path: '/admin/autoships' },
          { label: '⚡ Commission Runs',    desc: 'History & manual triggers',        path: '/admin/runs' },
          { label: '🧮 Commission Preview', desc: 'Dry-run: simulate payout amounts', path: '/admin/commission-preview' },
          { label: '💸 Payout Queue',       desc: 'Review withdrawal requests',       path: '/admin/payouts' },
          { label: '📊 Reports',         desc: 'Analytics & top earners',       path: '/admin/reports' },
          { label: '📈 Analytics',         desc: 'Revenue, growth & funnel',          path: '/admin/analytics' },
          { label: '💰 Financial P&L',     desc: 'P&L, margins & unit economics',      path: '/admin/financials' },
          { label: '📉 Retention & Churn', desc: 'Activity scores, cohorts & at-risk', path: '/admin/retention' },
          { label: '⚙️ Plan Config',     desc: 'Rank thresholds & rates',       path: '/admin/plan' },
          { label: '🏷️ Promo Codes',      desc: 'Create & manage discount codes', path: '/admin/promos' },
          { label: '🔗 Referrals',        desc: 'Track referral link performance', path: '/admin/referrals' },
          { label: '📣 Announcements',    desc: 'Broadcast messages to members',  path: '/admin/announcements' },
          { label: '🔍 Audit Log',       desc: 'Immutable record of all actions', path: '/admin/audit-log' },
          { label: '🎫 Support',         desc: 'Manage member help tickets',      path: '/admin/support' },
          { label: '✉️ Email Templates',  desc: 'Edit transactional email templates', path: '/admin/email-templates' },
          { label: '📧 Email Campaigns',  desc: 'Targeted bulk email blasts to segments', path: '/admin/campaigns' },
          { label: '🔔 Notification Broadcast', desc: 'Send in-app notifications to segments', path: '/admin/notifications' },
          { label: '🪙 Token Management', desc: 'Mint, airdrop, burn MLMT + ledger', path: '/admin/tokens' },
          { label: '🌐 Network Tree',    desc: 'Interactive full-network genealogy', path: '/admin/network' },
          { label: '🔐 Roles & Permissions', desc: 'Admin users, roles, and access matrix', path: '/admin/roles' },
          { label: '⚖️ Compliance',       desc: 'IDS, regulatory checklist, doc vault', path: '/admin/compliance' },
          { label: '🔏 KYC Queue',        desc: 'Review member identity verifications',  path: '/admin/kyc' },
          { label: '🔌 Integrations',    desc: 'Arctico API, gateways & webhooks',    path: '/admin/integrations' },
          { label: '📦 Starter Packs',   desc: 'Product bundles shown in the shop', path: '/admin/bundles' },
          { label: '⭐ Product Reviews',  desc: 'Approve, reject, and moderate member reviews', path: '/admin/reviews' },
          { label: '📥 Bulk Import',     desc: 'CSV member import for launch seeding', path: '/admin/import' },
          { label: '🔧 Settings',        desc: 'System & notification settings', path: '/admin/settings' },
          { label: '🚀 Launch Checklist', desc: 'Pre-launch readiness tracker for Gary + Bjørn', path: '/admin/launch' },
          { label: '💱 Exchange Rates',   desc: 'MLMT→NOK/EUR/USD rates for Tax + P&L reports', path: '/admin/exchange-rates' },
          { label: '📢 Banners',          desc: 'Promotional banners on Landing + Shop pages', path: '/admin/banners' },
        ].map(({ label, desc, path }) => (
          <div
            key={path}
            onClick={() => navigate(path)}
            style={{
              background: 'var(--navy2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '16px 18px',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#c9a84c55'
              e.currentTarget.style.background = 'var(--navy3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--navy2)'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.4 }}>{desc}</div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
