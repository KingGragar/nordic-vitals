import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberPayouts, requestMemberPayout } from '../../api/mlmApi'

const STATUS_STYLE = {
  processing: { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8', label: 'Processing' },
  paid:       { bg: '#052e16', color: '#86efac', border: '#166534', label: 'Paid' },
  rejected:   { bg: '#450a0a', color: '#fca5a5', border: '#991b1b', label: 'Rejected' },
}

const METHODS = [
  { id: 'bank_transfer', label: '🏦 Bank Transfer', desc: 'Arrives in 1–3 business days' },
  { id: 'wallet_credit', label: '💳 Nordic Wallet Credit', desc: 'Instant — use for in-store purchases' },
]

function RequestModal({ walletBalance, onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank_transfer')
  const [accountLabel, setAccountLabel] = useState('DNB ****4821')
  const [step, setStep] = useState('form') // 'form' | 'confirm' | 'done'
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  const parsed = parseFloat(amount) || 0
  const valid = parsed >= 100 && parsed <= walletBalance

  async function handleConfirm() {
    setSaving(true)
    const r = await requestMemberPayout({ amount: parsed, currency: 'NOK', method, accountLabel })
    setResult(r)
    setStep('done')
    setSaving(false)
    onSave(r)
  }

  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={step === 'done' ? onClose : undefined}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 440, width: '100%' }} onClick={e => e.stopPropagation()}>
        {step === 'form' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Request Payout</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Available balance</span>
              <span style={{ fontWeight: 700, color: 'var(--gold)' }}>NOK {walletBalance.toLocaleString('nb-NO', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Amount (NOK) — minimum NOK 100</label>
                <input type="number" min="100" max={walletBalance} step="50" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 500" style={inp} />
                {parsed > walletBalance && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>Exceeds available balance.</div>}
                {parsed > 0 && parsed < 100 && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>Minimum payout is NOK 100.</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Payout Method</label>
                {METHODS.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: method === m.id ? 'rgba(202,169,76,0.08)' : 'var(--bg)', border: `1px solid ${method === m.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', marginBottom: 8 }}>
                    <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: method === m.id ? 600 : 400 }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              {method === 'bank_transfer' && (
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Bank Account Reference</label>
                  <input value={accountLabel} onChange={e => setAccountLabel(e.target.value)} placeholder="e.g. DNB ****4821" style={inp} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep('confirm')} disabled={!valid}
                style={{ flex: 1, background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', opacity: valid ? 1 : 0.4 }}>
                Review Request
              </button>
              <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Confirm Payout Request</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                ['Amount', `NOK ${parsed.toLocaleString('nb-NO', { minimumFractionDigits: 2 })}`],
                ['Method', METHODS.find(m => m.id === method)?.label],
                ['Account', accountLabel],
                ['Processing', method === 'bank_transfer' ? '1–3 business days' : 'Instant'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg)', borderRadius: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleConfirm} disabled={saving}
                style={{ flex: 1, background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Submitting…' : 'Confirm & Submit'}
              </button>
              <button onClick={() => setStep('form')} style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>Back</button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Request Submitted!</div>
            <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
              Your payout of <strong>NOK {parsed.toLocaleString('nb-NO', { minimumFractionDigits: 2 })}</strong> is now in queue.<br />
              {method === 'bank_transfer' ? 'Expect it in 1–3 business days.' : 'Wallet credit applied instantly.'}
            </div>
            <button onClick={onClose} style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 32px', cursor: 'pointer' }}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Payouts() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const walletBalance = 3850.00

  useEffect(() => {
    getMemberPayouts().then(setPayouts).finally(() => setLoading(false))
  }, [])

  function handleNew(r) {
    setPayouts(p => [r, ...p])
    setShowModal(false)
  }

  const pending = payouts.filter(p => p.status === 'processing').reduce((s, p) => s + p.amount, 0)
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)

  return (
    <DashboardLayout>
      {showModal && <RequestModal walletBalance={walletBalance} onSave={handleNew} onClose={() => setShowModal(false)} />}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>💸 Payout Requests</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Withdraw your commission earnings to your bank account.</div>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>
            + Request Payout
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { icon: '💳', label: 'Available Balance', value: `NOK ${walletBalance.toLocaleString('nb-NO', { minimumFractionDigits: 2 })}` },
            { icon: '⏳', label: 'Pending Payout', value: pending > 0 ? `NOK ${pending.toLocaleString('nb-NO', { minimumFractionDigits: 2 })}` : '—' },
            { icon: '✅', label: 'Total Paid Out', value: `NOK ${totalPaid.toLocaleString('nb-NO', { minimumFractionDigits: 2 })}` },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Payout methods info */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Payout Methods</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { icon: '🏦', label: 'Bank Transfer', desc: '1–3 business days • Min. NOK 100' },
              { icon: '💳', label: 'Wallet Credit', desc: 'Instant • Use for purchases' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Payout History</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {payouts.map(p => {
              const ss = STATUS_STYLE[p.status] || STATUS_STYLE.processing
              return (
                <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>NOK {p.amount.toLocaleString('nb-NO', { minimumFractionDigits: 2 })}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ss.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span>{p.method === 'bank_transfer' ? '🏦' : '💳'} {p.accountLabel}</span>
                        <span>📅 Requested {new Date(p.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {p.processedAt && <span>✅ Paid {new Date(p.processedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        {p.ref && <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.ref}</span>}
                      </div>
                      {p.status === 'rejected' && p.rejectReason && (
                        <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 6, background: '#450a0a', border: '1px solid #991b1b', borderRadius: 6, padding: '6px 10px' }}>
                          ⚠️ {p.rejectReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {payouts.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No payout requests yet.</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
