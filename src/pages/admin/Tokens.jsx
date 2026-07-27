import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getTokenStats, getTokenEvents, mintTokens, airdropTokens, burnTokens } from '../../api/mlmApi'

const PAGE_SIZE = 15

const TYPE_COLORS = {
  mint:    { bg: '#16a34a22', text: '#16a34a', label: '⬆️ Mint' },
  airdrop: { bg: '#7c3aed22', text: '#7c3aed', label: '🪂 Airdrop' },
  burn:    { bg: '#dc262622', text: '#dc2626', label: '🔥 Burn' },
  transfer:{ bg: '#0ea5e922', text: '#0ea5e9', label: '↔️ Transfer' },
}

function fmt(n) { return (n ?? 0).toLocaleString() }
function fmtDate(ts) { return ts ? new Date(ts).toLocaleString() : '—' }
function fmtRelDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] || { bg: '#64748b22', text: '#64748b', label: type }
  return (
    <span style={{ background: c.bg, color: c.text, padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '18px 20px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '28px 32px', minWidth: 360, maxWidth: 480, width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--navy3)', background: 'var(--navy)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
const labelStyle = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }
const btnPrimary = { padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: 14 }
const btnSecondary = { padding: '9px 20px', borderRadius: 8, border: '1px solid var(--navy3)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 14 }

export default function AdminTokens() {
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [total, setTotal] = useState(0)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'mint' | 'airdrop' | 'burn' | 'confirm'
  const [pendingAction, setPendingAction] = useState(null)
  const [form, setForm] = useState({})
  const [actionMsg, setActionMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    try {
      const [sr, er] = await Promise.all([
        getTokenStats(),
        getTokenEvents({ type: typeFilter, search, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
      ])
      setStats(sr.stats)
      setEvents(er.events)
      setTotal(er.total)
    } catch {
      /* keep stale data */
    } finally {
      setLoading(false)
    }
  }, [typeFilter, search, page])

  useEffect(() => { reload() }, [reload])

  function openModal(m) { setForm({}); setModal(m) }

  async function handleSubmitMint() {
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return
    setPendingAction({ type: 'mint', label: `Mint ${fmt(amount)} MLMT`, fn: () => mintTokens({ amount, recipient: form.recipient || 'platform-reserve', memo: form.memo || 'Manual mint' }) })
    setModal('confirm')
  }

  async function handleSubmitAirdrop() {
    const amount = Number(form.amount)
    if (!amount || amount <= 0 || !form.target) return
    const targetLabel = form.target === 'all-members' ? 'all members' : `rank: ${form.target.split(':')[1] || form.target}`
    setPendingAction({ type: 'airdrop', label: `Airdrop ${fmt(amount)} MLMT each to ${targetLabel}`, fn: () => airdropTokens({ amount, target: form.target, memo: form.memo || 'Airdrop' }) })
    setModal('confirm')
  }

  async function handleSubmitBurn() {
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return
    setPendingAction({ type: 'burn', label: `Burn ${fmt(amount)} MLMT`, fn: () => burnTokens({ amount, memo: form.memo || 'Manual burn' }) })
    setModal('confirm')
  }

  async function executeAction() {
    if (!pendingAction) return
    setBusy(true)
    try {
      const res = await pendingAction.fn()
      const extra = res.memberCount ? ` (${res.memberCount} members, ${fmt(res.totalAmount)} MLMT total)` : ''
      setActionMsg(`✅ ${pendingAction.label}${extra} — done`)
      setModal(null)
      setPendingAction(null)
      reload()
    } catch (e) {
      setActionMsg(`❌ ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  function csvExport() {
    const header = ['Type', 'Amount (MLMT)', 'Actor', 'Recipient', 'Memo', 'Date']
    const rows = events.map(e => [e.type, e.amount, e.actor, e.recipient || '', e.memo, fmtDate(e.ts)])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `token-events-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminLayout>
      <div style={{ padding: '28px 24px', maxWidth: 1100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>🪙 Token Management</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 13 }}>MLMT token supply — mint, airdrop, burn, and audit all token events</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => openModal('mint')}    style={{ ...btnPrimary, background: '#16a34a', color: '#fff' }}>⬆️ Mint</button>
            <button onClick={() => openModal('airdrop')} style={{ ...btnPrimary, background: '#7c3aed', color: '#fff' }}>🪂 Airdrop</button>
            <button onClick={() => openModal('burn')}    style={{ ...btnPrimary, background: '#dc2626', color: '#fff' }}>🔥 Burn</button>
          </div>
        </div>

        {actionMsg && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: actionMsg.startsWith('✅') ? '#16a34a22' : '#dc262622', color: actionMsg.startsWith('✅') ? '#16a34a' : '#dc2626', fontSize: 14 }}>
            {actionMsg} <button onClick={() => setActionMsg('')} style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>×</button>
          </div>
        )}

        {/* KPI cards */}
        {stats && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
            <KpiCard label="Total Supply"       value={`${fmt(stats.totalSupply)} MLMT`}       color="var(--gold)" />
            <KpiCard label="Circulating Supply" value={`${fmt(stats.circulatingSupply)} MLMT`} color="#3b82f6" sub={`${((stats.circulatingSupply / stats.totalSupply) * 100).toFixed(1)}% of total`} />
            <KpiCard label="Platform Reserve"   value={`${fmt(stats.reservedPlatform)} MLMT`}  color="#f59e0b" sub={`${((stats.reservedPlatform / stats.totalSupply) * 100).toFixed(1)}% of total`} />
            <KpiCard label="All-time Burned"    value={`${fmt(stats.burnedTotal)} MLMT`}       color="#dc2626" sub={`Last burn: ${fmtRelDate(stats.lastBurnAt)}`} />
            <KpiCard label="Member Wallets"     value={`${fmt(stats.memberWallets)} MLMT`}     color="#22c55e" sub={`Last mint: ${fmtRelDate(stats.lastMintAt)}`} />
          </div>
        )}

        {/* Supply bar */}
        {stats && (
          <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Supply Allocation</div>
            <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              <div title="Member Wallets" style={{ width: `${(stats.memberWallets / stats.totalSupply) * 100}%`, background: '#22c55e' }} />
              <div title="Platform Reserve" style={{ width: `${(stats.reservedPlatform / stats.totalSupply) * 100}%`, background: '#f59e0b' }} />
              <div title="Burned" style={{ width: `${(stats.burnedTotal / stats.totalSupply) * 100}%`, background: '#dc2626' }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12, color: 'var(--text2)' }}>
              <span><span style={{ color: '#22c55e' }}>■</span> Member Wallets</span>
              <span><span style={{ color: '#f59e0b' }}>■</span> Platform Reserve</span>
              <span><span style={{ color: '#dc2626' }}>■</span> Burned</span>
            </div>
          </div>
        )}

        {/* Filters + search */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          {['all', 'mint', 'airdrop', 'burn', 'transfer'].map(t => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(0) }}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--navy3)', background: typeFilter === t ? 'var(--gold)' : 'transparent', color: typeFilter === t ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: typeFilter === t ? 700 : 400, textTransform: 'capitalize' }}>
              {t === 'all' ? 'All Events' : t}
            </button>
          ))}
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="Search memo, actor, recipient…"
            style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
          <button onClick={csvExport} style={{ ...btnSecondary, fontSize: 13 }}>⬇ CSV</button>
        </div>

        {/* Events table */}
        <div style={{ background: 'var(--navy2)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--navy3)' }}>
                  {['Type', 'Amount (MLMT)', 'Actor', 'Recipient', 'Memo', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text2)' }}>Loading…</td></tr>
                ) : events.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text2)' }}>No token events found.</td></tr>
                ) : events.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--navy3)' }}>
                    <td style={{ padding: '10px 14px' }}><TypeBadge type={e.type} /></td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(e.amount)}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text2)', fontSize: 12 }}>{e.actor}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text2)', fontSize: 12 }}>{e.recipient || <em style={{ opacity: 0.5 }}>burned</em>}</td>
                    <td style={{ padding: '10px 14px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.memo}>{e.memo}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtRelDate(e.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ ...btnSecondary, padding: '6px 14px' }}>←</button>
            <span style={{ padding: '6px 14px', color: 'var(--text2)', fontSize: 13 }}>Page {page + 1} of {pages} ({total} events)</span>
            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} style={{ ...btnSecondary, padding: '6px 14px' }}>→</button>
          </div>
        )}
      </div>

      {/* Mint modal */}
      {modal === 'mint' && (
        <Modal title="⬆️ Mint Tokens" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Amount (MLMT) *</label>
              <input type="number" min={1} value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} placeholder="e.g. 100000" />
            </div>
            <div>
              <label style={labelStyle}>Recipient (default: platform-reserve)</label>
              <input value={form.recipient || ''} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))} style={inputStyle} placeholder="platform-reserve" />
            </div>
            <div>
              <label style={labelStyle}>Memo / Reason</label>
              <input value={form.memo || ''} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} style={inputStyle} placeholder="Reason for mint…" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button onClick={() => setModal(null)} style={btnSecondary}>Cancel</button>
              <button onClick={handleSubmitMint} style={{ ...btnPrimary, background: '#16a34a', color: '#fff' }}>Mint Tokens</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Airdrop modal */}
      {modal === 'airdrop' && (
        <Modal title="🪂 Airdrop Tokens" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Amount per recipient (MLMT) *</label>
              <input type="number" min={1} value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} placeholder="e.g. 500" />
            </div>
            <div>
              <label style={labelStyle}>Target audience *</label>
              <select value={form.target || ''} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} style={inputStyle}>
                <option value="">— select target —</option>
                <option value="all-members">All active members</option>
                <option value="rank:bronze">Rank: Bronze</option>
                <option value="rank:silver">Rank: Silver</option>
                <option value="rank:gold">Rank: Gold</option>
                <option value="rank:platinum">Rank: Platinum</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Memo / Reason</label>
              <input value={form.memo || ''} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} style={inputStyle} placeholder="Reason for airdrop…" />
            </div>
            {form.amount && form.target && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#7c3aed22', color: '#7c3aed', fontSize: 13 }}>
                This will send <strong>{fmt(Number(form.amount))} MLMT</strong> to each qualifying member in <strong>{form.target}</strong>.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button onClick={() => setModal(null)} style={btnSecondary}>Cancel</button>
              <button onClick={handleSubmitAirdrop} style={{ ...btnPrimary, background: '#7c3aed', color: '#fff' }}>Airdrop</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Burn modal */}
      {modal === 'burn' && (
        <Modal title="🔥 Burn Tokens" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#dc262622', color: '#dc2626', fontSize: 13 }}>
              ⚠️ Burning tokens is irreversible. Tokens are permanently removed from supply.
            </div>
            <div>
              <label style={labelStyle}>Amount to burn (MLMT) *</label>
              <input type="number" min={1} value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} placeholder="e.g. 10000" />
            </div>
            <div>
              <label style={labelStyle}>Memo / Reason</label>
              <input value={form.memo || ''} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} style={inputStyle} placeholder="Reason for burn…" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button onClick={() => setModal(null)} style={btnSecondary}>Cancel</button>
              <button onClick={handleSubmitBurn} style={{ ...btnPrimary, background: '#dc2626', color: '#fff' }}>🔥 Burn</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm modal */}
      {modal === 'confirm' && pendingAction && (
        <Modal title="Confirm Action" onClose={() => { setModal(null); setPendingAction(null) }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14 }}>Are you sure you want to: <strong>{pendingAction.label}</strong>?</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text2)' }}>This action will be recorded in the token event ledger and cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setPendingAction(null) }} style={btnSecondary} disabled={busy}>Cancel</button>
              <button onClick={executeAction} disabled={busy}
                style={{ ...btnPrimary, background: pendingAction.type === 'burn' ? '#dc2626' : pendingAction.type === 'airdrop' ? '#7c3aed' : '#16a34a', color: '#fff', opacity: busy ? 0.7 : 1 }}>
                {busy ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
