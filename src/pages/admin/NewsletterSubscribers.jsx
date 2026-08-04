import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getNewsletterSubscribers, updateSubscriberStatus, deleteNewsletterSubscriber, addNewsletterSubscriberManual } from '../../api/mlmApi'

const STATUS_TABS = ['all', 'active', 'unsubscribed']
const SOURCE_OPTIONS = ['all', 'landing', 'blog', 'shop', 'checkout', 'referral', 'manual']
const SEGMENT_OPTIONS = ['all', 'blog', 'customers']
const PAGE_SIZE = 20

const STATUS_BADGE = {
  active:       { bg: '#14532d', color: '#4ade80', label: 'Active' },
  unsubscribed: { bg: '#3f1d1d', color: '#f87171', label: 'Unsubscribed' },
}

const SOURCE_LABEL = {
  landing: 'Landing Page', blog: 'Blog', shop: 'Shop', checkout: 'Checkout',
  referral: 'Referral Link', manual: 'Manual Add',
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function csvEscape(v) {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv(rows) {
  const header = ['ID', 'Email', 'Name', 'Source', 'Status', 'Segments', 'Subscribed', 'Unsubscribed', 'Opens', 'Clicks']
  const lines = [
    header.join(','),
    ...rows.map(r => [
      r.id, r.email, r.name, r.source, r.status,
      (r.segments || []).join(';'),
      fmt(r.consented_at), fmt(r.unsubscribed_at),
      r.opens, r.clicks,
    ].map(csvEscape).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `newsletter-subscribers-${new Date().toISOString().slice(0,10)}.csv` })
  a.click()
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' }}>
      <div style={{ color: 'var(--text2)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{label}</div>
      <div style={{ color: color || 'var(--cream)', fontSize: '28px', fontWeight: '700' }}>{value}</div>
      {sub && <div style={{ color: 'var(--text2)', fontSize: '12px', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

function AddModal({ onSave, onClose }) {
  const [form, setForm] = useState({ email: '', name: '', source: 'manual', segments: ['blog'] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleSeg(seg) {
    setForm(f => ({
      ...f,
      segments: f.segments.includes(seg) ? f.segments.filter(s => s !== seg) : [...f.segments, seg],
    }))
  }

  async function handleSave() {
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) { setError('Valid email required.'); return }
    if (!form.segments.length) { setError('Select at least one segment.'); return }
    setSaving(true)
    try {
      await addNewsletterSubscriberManual(form)
      onSave()
    } catch (e) {
      setError(e.message || 'Failed to add subscriber.')
    } finally {
      setSaving(false)
    }
  }

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const box = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', width: '460px', maxWidth: '95vw' }
  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--cream)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <h3 style={{ color: 'var(--cream)', margin: '0 0 24px', fontSize: '18px' }}>Add Subscriber Manually</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: 'var(--text2)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Email *</label>
            <input style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="subscriber@example.com" />
          </div>
          <div>
            <label style={{ color: 'var(--text2)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Name (optional)</label>
            <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          </div>
          <div>
            <label style={{ color: 'var(--text2)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Source</label>
            <select style={inp} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
              {SOURCE_OPTIONS.filter(s => s !== 'all').map(s => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: 'var(--text2)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Segments *</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['blog', 'customers'].map(seg => (
                <label key={seg} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text2)', fontSize: '14px' }}>
                  <input type="checkbox" checked={form.segments.includes(seg)} onChange={() => toggleSeg(seg)} />
                  {seg.charAt(0).toUpperCase() + seg.slice(1)}
                </label>
              ))}
            </div>
          </div>
          {error && <div style={{ color: '#f87171', fontSize: '13px' }}>{error}</div>}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: '#0a0a0f', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Adding…' : 'Add Subscriber'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewsletterSubscribers() {
  const [rows, setRows]   = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, thisMonth: 0 })
  const [tab, setTab]     = useState('all')
  const [source, setSource] = useState('all')
  const [segment, setSegment] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage]   = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [allRows, setAllRows] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load(reset = false) {
    setLoading(true)
    const p = reset ? 1 : page
    if (reset) setPage(1)
    try {
      const res = await getNewsletterSubscribers({ status: tab === 'all' ? undefined : tab, source: source === 'all' ? undefined : source, segment: segment === 'all' ? undefined : segment, search: search || undefined, page: p, limit: PAGE_SIZE })
      setRows(res.items)
      setTotal(res.total)
      setPages(res.pages)
      setStats(res.stats)
    } finally {
      setLoading(false)
    }
  }

  async function loadAll() {
    const res = await getNewsletterSubscribers({ limit: 1000 })
    setAllRows(res.items)
  }

  useEffect(() => { load(true); loadAll() }, [tab, source, segment, search])
  useEffect(() => { load() }, [page])

  async function handleToggleStatus(row) {
    const next = row.status === 'active' ? 'unsubscribed' : 'active'
    await updateSubscriberStatus(row.id, next)
    load()
  }

  async function handleDelete(id) {
    await deleteNewsletterSubscriber(id)
    setConfirmDelete(null)
    load()
    loadAll()
  }

  const engagementRate = useMemo(() => {
    if (!stats.active) return '0%'
    const engaged = allRows.filter(r => r.status === 'active' && r.opens > 0).length
    return `${Math.round((engaged / stats.active) * 100)}%`
  }, [allRows, stats])

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ color: 'var(--cream)', fontSize: '24px', fontWeight: '700', margin: 0 }}>📨 Newsletter Subscribers</h1>
            <p style={{ color: 'var(--text2)', fontSize: '14px', margin: '6px 0 0' }}>Manage public newsletter opt-ins from blog, landing page, and storefront</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => downloadCsv(allRows)} style={{ padding: '10px 18px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px' }}>
              ⬇ Export CSV
            </button>
            <button onClick={() => setShowAdd(true)} style={{ padding: '10px 18px', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: '#0a0a0f', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
              + Add Subscriber
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px', marginBottom: '28px' }}>
          <KpiCard label="Total Subscribers" value={stats.total} />
          <KpiCard label="Active" value={stats.active} color="#4ade80" sub={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total`} />
          <KpiCard label="Unsubscribed" value={stats.unsubscribed} color="#f87171" />
          <KpiCard label="New This Month" value={stats.thisMonth} color="var(--gold)" />
          <KpiCard label="Engagement Rate" value={engagementRate} sub="Active subscribers who opened ≥1 email" />
        </div>

        {/* Filters */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          {/* Status tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {STATUS_TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? '700' : '400',
                background: tab === t ? 'var(--gold)' : 'var(--bg)', color: tab === t ? '#0a0a0f' : 'var(--text2)',
              }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {/* Search + dropdowns */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search email or name…"
              style={{ flex: '1', minWidth: '200px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 14px', color: 'var(--cream)', fontSize: '14px', outline: 'none' }}
            />
            <select value={source} onChange={e => { setSource(e.target.value); setPage(1) }}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 14px', color: 'var(--cream)', fontSize: '13px', outline: 'none' }}>
              {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : SOURCE_LABEL[s]}</option>)}
            </select>
            <select value={segment} onChange={e => { setSegment(e.target.value); setPage(1) }}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 14px', color: 'var(--cream)', fontSize: '13px', outline: 'none' }}>
              {SEGMENT_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Segments' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Email', 'Name', 'Source', 'Segments', 'Status', 'Subscribed', 'Opens', 'Clicks', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text2)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>No subscribers found.</td></tr>
                ) : rows.map(row => {
                  const badge = STATUS_BADGE[row.status] || STATUS_BADGE.active
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--cream)', fontSize: '13px' }}>{row.email}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: '13px' }}>{row.name || '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: '12px' }}>{SOURCE_LABEL[row.source] || row.source}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(row.segments || []).map(seg => (
                            <span key={seg} style={{ background: '#1e3a5f', color: '#60a5fa', fontSize: '11px', padding: '2px 8px', borderRadius: '10px' }}>{seg}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: badge.bg, color: badge.color, fontSize: '11px', padding: '3px 10px', borderRadius: '10px', fontWeight: '600' }}>{badge.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: '12px', whiteSpace: 'nowrap' }}>{fmt(row.consented_at)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: '13px', textAlign: 'center' }}>{row.opens}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: '13px', textAlign: 'center' }}>{row.clicks}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleToggleStatus(row)}
                            style={{ padding: '4px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: row.status === 'active' ? '#f87171' : '#4ade80', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
                            {row.status === 'active' ? 'Unsub' : 'Re-sub'}
                          </button>
                          <button onClick={() => setConfirmDelete(row)}
                            style={{ padding: '4px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: '#f87171', cursor: 'pointer', fontSize: '12px' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text2)', fontSize: '13px' }}>Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', color: page === 1 ? 'var(--text2)' : 'var(--cream)', cursor: page === 1 ? 'default' : 'pointer', fontSize: '13px' }}>
                  ← Prev
                </button>
                <span style={{ padding: '6px 14px', color: 'var(--text2)', fontSize: '13px' }}>{page} / {pages}</span>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  style={{ padding: '6px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', color: page === pages ? 'var(--text2)' : 'var(--cream)', cursor: page === pages ? 'default' : 'pointer', fontSize: '13px' }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* GDPR note */}
        <div style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '16px 20px' }}>
          <p style={{ color: '#60a5fa', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
            <strong>GDPR Note:</strong> All newsletter subscribers provided explicit consent at sign-up (Article 6(1)(a) lawful basis). Consent timestamps are stored per subscriber. The unsubscribe link in every email uses a one-click token at <code style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>/unsubscribe?token=…</code>. Subscribers can request full data deletion via the GDPR Requests page.
          </p>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <AddModal
          onSave={() => { setShowAdd(false); load(); loadAll() }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', width: '400px', maxWidth: '95vw', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ color: 'var(--cream)', margin: '0 0 12px' }}>Delete Subscriber?</h3>
            <p style={{ color: 'var(--text2)', fontSize: '14px', margin: '0 0 24px' }}>
              Permanently delete <strong style={{ color: 'var(--cream)' }}>{confirmDelete.email}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '10px 24px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} style={{ padding: '10px 24px', background: '#dc2626', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
