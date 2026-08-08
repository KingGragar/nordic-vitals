import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminQcBatches, createAdminQcBatch, updateAdminQcBatchStatus } from '../../api/mlmApi'

const STATUS_COLORS = {
  pass:    { bg: '#052e16', color: '#86efac', border: '#166534' },
  fail:    { bg: '#2d1515', color: '#fca5a5', border: '#991b1b' },
  pending: { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8' },
  review:  { bg: '#3b2500', color: '#fbbf24', border: '#d97706' },
}

const BLANK = { batchNo: '', product: '', lot: '', mfgDate: '', expiryDate: '', quantity: '' }

export default function AdminQualityControl() {
  const [batches, setBatches] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminQcBatches().then(setBatches).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function create() {
    setSaving(true)
    const created = await createAdminQcBatch(form)
    setBatches(prev => [created, ...prev])
    setForm(BLANK)
    setShowCreate(false)
    setSaving(false)
  }

  async function setStatus(id, status) {
    await updateAdminQcBatchStatus(id, status)
    setBatches(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }

  const filtered = !batches ? [] : filter === 'all' ? batches : batches.filter(b => b.status === filter)
  const stats = {
    pass: (batches || []).filter(b => b.status === 'pass').length,
    fail: (batches || []).filter(b => b.status === 'fail').length,
    pending: (batches || []).filter(b => b.status === 'pending').length,
    review: (batches || []).filter(b => b.status === 'review').length,
  }
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🧪 Quality Control</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Track batch testing, Certificates of Analysis (COA), and product expiry.</div>
          </div>
          <button onClick={() => setShowCreate(v => !v)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Log Batch
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Pass', value: stats.pass, color: '#86efac' },
            { label: 'Fail', value: stats.fail, color: '#fca5a5' },
            { label: 'Pending', value: stats.pending, color: '#93c5fd' },
            { label: 'Review', value: stats.review, color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {showCreate && (
          <div style={{ ...card, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>New Batch Entry</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
              {[
                { key: 'batchNo', label: 'Batch No.' },
                { key: 'product', label: 'Product' },
                { key: 'lot', label: 'Lot #' },
                { key: 'quantity', label: 'Units', type: 'number' },
                { key: 'mfgDate', label: 'Mfg Date', type: 'date' },
                { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{f.label}</div>
                  <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={create} disabled={saving || !form.batchNo || !form.product} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
                {saving ? 'Saving…' : 'Log Batch'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'pending', 'pass', 'fail', 'review'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No batches found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(b => {
              const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending
              const expiring = b.daysToExpiry !== undefined && b.daysToExpiry < 90
              return (
                <div key={b.id} style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <div style={{ fontWeight: 700 }}>{b.product}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12 }}>Batch {b.batchNo} · Lot {b.lot}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', minWidth: 100 }}>
                    <div>Qty: {b.quantity}</div>
                    <div>Mfg: {b.mfgDate}</div>
                  </div>
                  <div style={{ fontSize: 13, minWidth: 120 }}>
                    <div style={{ color: expiring ? '#fbbf24' : 'var(--text)' }}>
                      Exp: {b.expiryDate} {expiring && <span style={{ fontSize: 11, color: '#fbbf24' }}>⚠ soon</span>}
                    </div>
                    {b.coaUrl && <a href={b.coaUrl} target="_blank" rel="noreferrer" style={{ color: '#93c5fd', fontSize: 12 }}>📄 COA</a>}
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    {b.status.toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {b.status !== 'pass' && <button onClick={() => setStatus(b.id, 'pass')} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #166534', background: 'transparent', color: '#86efac', fontSize: 11, cursor: 'pointer' }}>Pass</button>}
                    {b.status !== 'fail' && <button onClick={() => setStatus(b.id, 'fail')} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #991b1b', background: 'transparent', color: '#fca5a5', fontSize: 11, cursor: 'pointer' }}>Fail</button>}
                    {b.status !== 'review' && <button onClick={() => setStatus(b.id, 'review')} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #d97706', background: 'transparent', color: '#fbbf24', fontSize: 11, cursor: 'pointer' }}>Flag</button>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
