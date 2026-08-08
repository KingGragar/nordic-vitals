import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberProductSamples, requestMemberProductSample } from '../../api/mlmApi'

const STATUS_COLOR = { delivered: '#86efac', processing: '#fbbf24', cancelled: '#f87171' }
const STATUS_BG    = { delivered: '#14532d', processing: '#78350f', cancelled: '#7f1d1d' }

export default function MemberProductSamples() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => { getMemberProductSamples().then(setData).finally(() => setLoading(false)) }, [])

  async function request(sample) {
    if (data?.allowanceUsed >= data?.allowanceTotal) return
    setRequesting(sample.id)
    await requestMemberProductSample(sample.id, {})
    setData(prev => ({
      ...prev,
      allowanceUsed: (prev.allowanceUsed || 0) + 1,
      history: [{ id: `sm${Date.now()}`, product: sample.name, requestedAt: new Date().toISOString().slice(0,10), status: 'processing', trackingCode: null, deliveredAt: null }, ...(prev.history || [])]
    }))
    setSuccess(sample.id)
    setRequesting(null)
    setTimeout(() => setSuccess(null), 3000)
  }

  const allowanceLeft = (data?.allowanceTotal || 0) - (data?.allowanceUsed || 0)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🧪 Product Samples</div>
        <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 22 }}>Request free product samples to experience our range or share with prospects.</div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'Samples Used', value: data?.allowanceUsed || 0, color: '#60a5fa' },
                { label: 'Remaining', value: allowanceLeft, color: allowanceLeft > 0 ? '#86efac' : '#f87171' },
                { label: 'Total Allowance', value: data?.allowanceTotal || 0, color: 'var(--text)' },
                { label: 'Resets', value: data?.resetDate || '—', color: 'var(--text2)', small: true },
              ].map(s => (
                <div key={s.label} style={card}>
                  <div style={{ fontSize: s.small ? 16 : 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {allowanceLeft === 0 && (
              <div style={{ ...card, background: '#7f1d1d', border: '1px solid #f87171', marginBottom: 22, padding: '12px 18px' }}>
                <div style={{ color: '#f87171', fontSize: 14, fontWeight: 600 }}>⚠️ Sample allowance used for this period. Resets on {data?.resetDate}.</div>
              </div>
            )}

            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Available Samples</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
              {(data?.availableSamples || []).map(s => (
                <div key={s.id} style={{ ...card, opacity: !s.available || allowanceLeft === 0 ? 0.55 : 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>{s.description}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>Value: {s.value}</span>
                    {!s.available && <span style={{ fontSize: 11, color: '#f87171', padding: '2px 8px', borderRadius: 20, background: '#7f1d1d' }}>Unavailable</span>}
                  </div>
                  {success === s.id ? (
                    <div style={{ padding: '10px', borderRadius: 8, background: '#14532d', color: '#86efac', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>✅ Request sent!</div>
                  ) : (
                    <button onClick={() => request(s)} disabled={!s.available || allowanceLeft === 0 || requesting === s.id} style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', background: s.available && allowanceLeft > 0 ? 'var(--gold)' : 'var(--border)', color: s.available && allowanceLeft > 0 ? '#000' : 'var(--text2)', fontWeight: 700, fontSize: 13, cursor: s.available && allowanceLeft > 0 ? 'pointer' : 'default', opacity: requesting === s.id ? 0.6 : 1 }}>
                      {requesting === s.id ? 'Requesting…' : 'Request Sample'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Sample History</div>
            {!(data?.history?.length) ? (
              <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No sample requests yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(data?.history || []).map(h => (
                  <div key={h.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{h.product}</div>
                      <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
                        Requested: {h.requestedAt}
                        {h.deliveredAt && <span style={{ marginLeft: 10 }}>· Delivered: {h.deliveredAt}</span>}
                        {h.trackingCode && <span style={{ marginLeft: 10 }}>· Tracking: {h.trackingCode}</span>}
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_BG[h.status] || '#1e293b', color: STATUS_COLOR[h.status] || '#94a3b8', textTransform: 'capitalize' }}>{h.status}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
