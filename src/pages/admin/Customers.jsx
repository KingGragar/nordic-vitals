import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getRetailCustomers,
  getRetailCustomerDetail,
  addRetailCustomerNote,
  convertCustomerToMember,
  sendCustomerEmail,
} from '../../api/mlmApi'

const TAG_COLORS = {
  vip:       { bg: '#854d0e33', color: '#fbbf24', border: '#854d0e55' },
  loyal:     { bg: '#14532d33', color: '#4ade80', border: '#14532d55' },
  repeat:    { bg: '#1e3a5f33', color: '#60a5fa', border: '#1e3a5f55' },
  new:       { bg: '#1e3a5f33', color: '#a78bfa', border: '#1e3a5f55' },
  'at-risk': { bg: '#7c2d1233', color: '#f97316', border: '#7c2d1255' },
  churned:   { bg: '#1f212433', color: '#9ca3af', border: '#1f212455' },
  converted: { bg: '#14532d33', color: '#34d399', border: '#14532d55' },
}

function Tag({ label }) {
  const s = TAG_COLORS[label] || { bg: '#33333355', color: '#aaa', border: '#55555555' }
  return (
    <span style={{
      fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '99px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'uppercase', letterSpacing: '0.4px',
    }}>{label}</span>
  )
}

function kpi(label, value, sub) {
  return (
    <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', minWidth: 0 }}>
      <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--cream)' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

function CustomerDrawer({ customerId, onClose, onConverted }) {
  const [detail, setDetail] = useState(null)
  const [note, setNote] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)
  const [convertLoading, setConvertLoading] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' })
  const [emailLoading, setEmailLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!customerId) return
    setDetail(null)
    getRetailCustomerDetail(customerId).then(setDetail)
  }, [customerId])

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleNote(e) {
    e.preventDefault()
    if (!note.trim()) return
    setNoteLoading(true)
    try {
      await addRetailCustomerNote(customerId, note.trim())
      setNote('')
      const d = await getRetailCustomerDetail(customerId)
      setDetail(d)
      showToast('Note saved')
    } catch { showToast('Error saving note', false) }
    setNoteLoading(false)
  }

  async function handleConvert() {
    if (!window.confirm(`Convert ${detail.name} to a Nordic Vitals member? They will receive a membership invitation email.`)) return
    setConvertLoading(true)
    try {
      const res = await convertCustomerToMember(customerId)
      showToast(`Converted! New member ID: ${res.member_id}`)
      const d = await getRetailCustomerDetail(customerId)
      setDetail(d)
      onConverted?.()
    } catch { showToast('Conversion failed', false) }
    setConvertLoading(false)
  }

  async function handleEmail(e) {
    e.preventDefault()
    setEmailLoading(true)
    try {
      await sendCustomerEmail(customerId, emailForm)
      showToast('Email sent')
      setEmailModal(false)
      setEmailForm({ subject: '', body: '' })
    } catch { showToast('Failed to send email', false) }
    setEmailLoading(false)
  }

  if (!customerId) return null

  const isConverted = detail?.tags?.includes('converted')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400, display: 'flex', justifyContent: 'flex-end',
    }}>
      <div onClick={onClose} style={{ flex: 1, background: '#00000060' }} />
      <div style={{
        width: '520px', maxWidth: '95vw', background: 'var(--navy)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cream)', marginBottom: '6px' }}>
              {detail ? detail.name : '…'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>{detail?.email}</div>
            {detail && <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {detail.tags.map(t => <Tag key={t} label={t} />)}
            </div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        {!detail ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                ['Orders', detail.orders],
                ['Total spent', `${detail.total_nok.toLocaleString('nb-NO')} NOK`],
                ['Country', `${detail.country} — ${detail.city}`],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>{l}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cream)' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Contact info */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: 'var(--text2)' }}>
                <span>📧 {detail.email}</span>
                <span>📱 {detail.phone || '—'}</span>
                <span>📅 First: {detail.first_purchase}</span>
                <span>📅 Last: {detail.last_purchase}</span>
                {detail.referred_by && <span>🔗 Referred by {detail.referred_by}</span>}
              </div>
            </div>

            {/* Order history */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order History</div>
              {(detail.orders?.length || 0) === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text2)' }}>No order details available.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detail.orders.map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 12px', background: 'var(--navy3)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)', marginBottom: '3px' }}>{o.id}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{o.items.join(', ')}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>{o.total.toLocaleString('nb-NO')} kr</div>
                        <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{o.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Notes</div>
              <form onSubmit={handleNote} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note…"
                  style={{ flex: 1, background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--cream)', fontSize: '13px', outline: 'none' }}
                />
                <button type="submit" disabled={noteLoading} style={{
                  padding: '8px 14px', background: 'var(--gold)', border: 'none', borderRadius: '8px',
                  color: '#1a1a1a', fontWeight: 700, cursor: noteLoading ? 'not-allowed' : 'pointer', fontSize: '12px',
                }}>Save</button>
              </form>
              {(detail.notes?.length || 0) === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text2)' }}>No notes yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detail.notes.map(n => (
                    <div key={n.id} style={{ background: 'var(--navy3)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--cream)', marginBottom: '4px' }}>{n.text}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{n.author} · {new Date(n.created_at).toLocaleString('nb-NO')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setEmailModal(true)}
                style={{ padding: '10px 18px', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--cream)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >✉️ Send Email</button>
              {!isConverted && (
                <button
                  onClick={handleConvert}
                  disabled={convertLoading}
                  style={{ padding: '10px 18px', background: '#14532d55', border: '1px solid #14532d88', borderRadius: '8px', color: '#4ade80', cursor: convertLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}
                >{convertLoading ? 'Converting…' : '🤝 Convert to Member'}</button>
              )}
              {isConverted && (
                <div style={{ padding: '10px 18px', background: '#14532d33', border: '1px solid #14532d55', borderRadius: '8px', color: '#34d399', fontSize: '13px', fontWeight: 600 }}>✓ Already a Member</div>
              )}
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 600,
            background: toast.ok ? '#14532d' : '#7f1d1d', border: '1px solid', borderColor: toast.ok ? '#166534' : '#991b1b',
            color: toast.ok ? '#4ade80' : '#f87171', borderRadius: '10px', padding: '12px 18px', fontSize: '13px', fontWeight: 600,
          }}>{toast.msg}</div>
        )}

        {/* Email modal */}
        {emailModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#00000070', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px', width: '480px', maxWidth: '95vw' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '18px' }}>Send Email to {detail?.name}</div>
              <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  value={emailForm.subject}
                  onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Subject"
                  required
                  style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--cream)', fontSize: '14px', outline: 'none' }}
                />
                <textarea
                  value={emailForm.body}
                  onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Message body…"
                  required
                  rows={6}
                  style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--cream)', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEmailModal(false)} style={{ padding: '10px 18px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                  <button type="submit" disabled={emailLoading} style={{ padding: '10px 18px', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: '#1a1a1a', fontWeight: 700, cursor: emailLoading ? 'not-allowed' : 'pointer', fontSize: '13px' }}>{emailLoading ? 'Sending…' : 'Send'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const TAG_FILTERS = ['all', 'vip', 'loyal', 'repeat', 'new', 'at-risk', 'churned', 'converted']

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRetailCustomers({ search, tag })
      setCustomers(data)
    } finally {
      setLoading(false)
    }
  }, [search, tag])

  useEffect(() => { load() }, [load])

  const total = customers.length
  const totalRevenue = customers.reduce((s, c) => s + c.total_nok, 0)
  const repeatBuyers = customers.filter(c => c.orders > 1).length
  const repeatRate = total ? Math.round((repeatBuyers / total) * 100) : 0
  const avgLtv = total ? Math.round(totalRevenue / total) : 0

  function exportCsv() {
    const rows = [['ID', 'Name', 'Email', 'Country', 'City', 'Orders', 'Total NOK', 'First Purchase', 'Last Purchase', 'Tags']]
    customers.forEach(c => rows.push([c.id, c.name, c.email, c.country, c.city, c.orders, c.total_nok, c.first_purchase, c.last_purchase, c.tags.join('|')]))
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'retail-customers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const inp = { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 14px', color: 'var(--cream)', fontSize: '13px', outline: 'none', width: '100%' }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', margin: 0 }}>Retail Customers</h1>
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>Non-member buyers — track, retain, and convert to members</p>
        </div>
        <button onClick={exportCsv} style={{ padding: '10px 18px', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--cream)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>⬇ Export CSV</button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {kpi('Total Customers', total)}
        {kpi('Total Revenue', `${totalRevenue.toLocaleString('nb-NO')} NOK`)}
        {kpi('Repeat Buyer Rate', `${repeatRate}%`, `${repeatBuyers} of ${total} bought 2+ times`)}
        {kpi('Avg. Lifetime Value', `${avgLtv.toLocaleString('nb-NO')} NOK`)}
      </div>

      {/* Compliance note */}
      <div style={{ background: '#1e3a5f33', border: '1px solid #1e3a5f88', borderRadius: '10px', padding: '14px 18px', marginBottom: '22px', fontSize: '12px', color: '#93c5fd', lineHeight: 1.6 }}>
        <strong>🇳🇴 Compliance note:</strong> Norwegian and EU MLM regulations (Markedsføringsloven, EU UCPD) require a demonstrable retail customer base to distinguish the business from a pyramid scheme. This page tracks retail sales so Nordic Vitals can report the retail-to-member revenue ratio to regulators.
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or ID…"
          style={{ ...inp, maxWidth: '320px' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TAG_FILTERS.map(t => (
            <button key={t} onClick={() => setTag(t)} style={{
              padding: '6px 14px', borderRadius: '99px', border: '1px solid',
              borderColor: tag === t ? 'var(--gold)' : 'var(--border)',
              background: tag === t ? '#c9a84c22' : 'transparent',
              color: tag === t ? 'var(--gold)' : 'var(--text2)',
              cursor: 'pointer', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Customer', 'Email', 'Country', 'Orders', 'Total Spent', 'Last Purchase', 'Tags', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>Loading…</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>No customers found.</td></tr>
              ) : customers.map(c => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--navy3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{c.id}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>{c.email}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>{c.country}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--cream)', fontWeight: 600, textAlign: 'center' }}>{c.orders}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--gold)', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.total_nok.toLocaleString('nb-NO')} kr</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{c.last_purchase}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {c.tags.map(t => <Tag key={t} label={t} />)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedId(c.id) }}
                      style={{ padding: '5px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer', fontSize: '11px' }}
                    >View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text2)' }}>
          Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Detail drawer */}
      {selectedId && (
        <CustomerDrawer
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onConverted={load}
        />
      )}
    </AdminLayout>
  )
}
