import { useState, useEffect } from 'react'
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

      {/* Quick nav cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
      }}>
        {[
          { label: '👥 Members',         desc: 'Browse & manage all members',  path: '/admin' },
          { label: '⚡ Commission Runs', desc: 'History & manual triggers',     path: '/admin/runs' },
          { label: '💸 Payout Queue',    desc: 'Review withdrawal requests',    path: '/admin/payouts' },
          { label: '📊 Reports',         desc: 'Analytics & top earners',       path: '/admin/reports' },
          { label: '⚙️ Plan Config',     desc: 'Rank thresholds & rates',       path: '/admin/plan' },
          { label: '🔧 Settings',        desc: 'System & notification settings', path: '/admin/settings' },
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
