import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberAgreements } from '../../api/mlmApi'

const STATUS_COLOR = { signed: '#86efac', pending: '#fbbf24', expired: '#f87171', draft: '#94a3b8' }
const TYPE_ICON = { membership: '📋', distributor: '🤝', compliance: '⚖️', nda: '🔒', tax: '💰', amendment: '📝' }

export default function DashAgreements() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMemberAgreements().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '7px 16px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  const agreements = (data?.agreements || []).filter(a => filterStatus === 'all' || a.status === filterStatus)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>My Agreements</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>View, sign, and download your membership agreements and legal documents</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total', value: (data?.agreements || []).length, color: '#93c5fd' },
            { label: 'Signed', value: (data?.agreements || []).filter(a => a.status === 'signed').length, color: '#86efac' },
            { label: 'Pending', value: (data?.agreements || []).filter(a => a.status === 'pending').length, color: '#fbbf24' },
            { label: 'Expired', value: (data?.agreements || []).filter(a => a.status === 'expired').length, color: '#f87171' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['all', 'pending', 'signed', 'expired'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', textTransform: 'capitalize', fontSize: 13, fontWeight: 600, background: filterStatus === s ? '#6366f1' : 'var(--border)', color: filterStatus === s ? '#fff' : 'var(--text-muted)' }}>{s}</button>
          ))}
        </div>

        {(data?.agreements || []).filter(a => a.status === 'pending').length > 0 && (
          <div style={{ background: '#fbbf2414', border: '1px solid #fbbf2444', borderRadius: 10, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600 }}>You have {(data.agreements).filter(a => a.status === 'pending').length} agreement(s) requiring your signature.</span>
          </div>
        )}

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Loading…</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {agreements.map(a => (
              <div key={a.id} style={{ ...card, cursor: 'pointer', transition: 'border-color .15s', borderColor: selected === a.id ? '#6366f1' : 'var(--border)' }} onClick={() => setSelected(selected === a.id ? null : a.id)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{TYPE_ICON[a.type] || '📄'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{a.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[a.status], background: `${STATUS_COLOR[a.status]}22`, borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>{a.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Version {a.version} · {a.category}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                      {a.signedDate && <span>Signed: {a.signedDate}</span>}
                      {a.expiryDate && <span>Expires: {a.expiryDate}</span>}
                      {a.sentDate && <span>Sent: {a.sentDate}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {a.status === 'pending' && <button style={btn('#6366f1')} onClick={e => e.stopPropagation()}>Sign Now</button>}
                    {a.status === 'signed' && <button style={btn('#6366f111', '#6366f1')} onClick={e => e.stopPropagation()}>Download</button>}
                  </div>
                </div>

                {selected === a.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{a.summary}</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {a.status === 'pending' && (
                        <>
                          <button style={btn('#6366f1')}>Sign Agreement</button>
                          <button style={btn('#6366f111', '#6366f1')}>Preview Document</button>
                        </>
                      )}
                      {a.status === 'signed' && (
                        <>
                          <button style={btn('#6366f111', '#6366f1')}>Download PDF</button>
                          <button style={btn('var(--border)', 'var(--text-muted)')}>View History</button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {agreements.length === 0 && (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No agreements match this filter.</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
