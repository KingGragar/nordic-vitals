import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getPaymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } from '../../api/mlmApi'
import { useAuth } from '../../context/AuthContext'

const WITHDRAWAL_TYPES = ['Bank Transfer', 'SEPA Transfer', 'Crypto']
const CARD_TYPES = ['Visa', 'Mastercard', 'Vipps']
const CRYPTO_NETWORKS = ['TRON (TRC-20)', 'Ethereum (ERC-20)', 'Binance Smart Chain (BEP-20)', 'Bitcoin']

const TYPE_ICON = {
  'Bank Transfer': '🏦',
  'SEPA Transfer': '🇪🇺',
  'Crypto': '₿',
  'Visa': '💳',
  'Mastercard': '💳',
  'Vipps': '📱',
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value" style={{ fontSize: '22px', color: color || 'var(--cream)' }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

function MethodCard({ method, isWithdrawal, onSetDefault, onEdit, onDelete }) {
  const icon = TYPE_ICON[method.type] || '💳'
  const maskedDetails = isWithdrawal
    ? method.type === 'Crypto'
      ? `${method.network} · ${method.address?.slice(0, 6)}…${method.address?.slice(-4)}`
      : `${method.bank || method.type} · ****${(method.iban || '').slice(-4)}`
    : method.type === 'Vipps'
      ? `+47 ${method.phone?.slice(0, 3)} ${method.phone?.slice(3, 5)} ${method.phone?.slice(5)}`
      : `${method.type} ···· ${method.last4} · ${method.expiry}`

  return (
    <div style={{
      background: 'var(--navy2)',
      border: `1px solid ${method.isDefault ? 'var(--gold)' : 'var(--border)'}`,
      borderRadius: '12px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      marginBottom: '10px',
    }}>
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '14px' }}>{method.alias}</span>
          {method.isDefault && (
            <span className="badge" style={{ background: '#78350f', color: '#fcd34d', fontSize: '10px' }}>DEFAULT</span>
          )}
          <span className="badge badge-blue" style={{ fontSize: '10px' }}>{method.type}</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{maskedDetails}</div>
        <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>
          Added {method.addedAt}
          {method.currency ? ` · ${method.currency}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {!method.isDefault && (
          <button className="btn btn-outline btn-sm" onClick={() => onSetDefault(method.id)}>
            Set Default
          </button>
        )}
        <button className="btn btn-outline btn-sm" onClick={() => onEdit(method)}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(method)}>×</button>
      </div>
    </div>
  )
}

function WithdrawalForm({ data, onChange }) {
  return (
    <>
      <div style={{ marginBottom: '14px' }}>
        <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Type</label>
        <select className="input" value={data.type} onChange={e => onChange({ ...data, type: e.target.value, network: '', address: '', bank: '', iban: '', bic: '' })} style={{ width: '100%' }}>
          {WITHDRAWAL_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '14px' }}>
        <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Nickname / Alias</label>
        <input className="input" placeholder="e.g. DNB Brukskonto" value={data.alias} onChange={e => onChange({ ...data, alias: e.target.value })} style={{ width: '100%' }} />
      </div>
      {data.type === 'Bank Transfer' && (
        <>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Bank Name</label>
            <input className="input" placeholder="e.g. DNB Bank ASA" value={data.bank || ''} onChange={e => onChange({ ...data, bank: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Account Number (IBAN / Kontonummer)</label>
            <input className="input" placeholder="NO93 1234 5678 901" value={data.iban || ''} onChange={e => onChange({ ...data, iban: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>BIC / SWIFT (optional)</label>
            <input className="input" placeholder="DNBANOKK" value={data.bic || ''} onChange={e => onChange({ ...data, bic: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Currency</label>
            <select className="input" value={data.currency || 'NOK'} onChange={e => onChange({ ...data, currency: e.target.value })} style={{ width: '100%' }}>
              <option>NOK</option><option>EUR</option><option>USD</option><option>GBP</option>
            </select>
          </div>
        </>
      )}
      {data.type === 'SEPA Transfer' && (
        <>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>IBAN</label>
            <input className="input" placeholder="DE89 3704 0044 0532 0130 00" value={data.iban || ''} onChange={e => onChange({ ...data, iban: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>BIC / SWIFT</label>
            <input className="input" placeholder="COBADEFFXXX" value={data.bic || ''} onChange={e => onChange({ ...data, bic: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Currency</label>
            <select className="input" value={data.currency || 'EUR'} onChange={e => onChange({ ...data, currency: e.target.value })} style={{ width: '100%' }}>
              <option>EUR</option><option>NOK</option><option>USD</option><option>GBP</option>
            </select>
          </div>
        </>
      )}
      {data.type === 'Crypto' && (
        <>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Network</label>
            <select className="input" value={data.network || ''} onChange={e => onChange({ ...data, network: e.target.value })} style={{ width: '100%' }}>
              <option value="">— Select network —</option>
              {CRYPTO_NETWORKS.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Wallet Address</label>
            <input className="input" placeholder="T... or 0x..." value={data.address || ''} onChange={e => onChange({ ...data, address: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Currency</label>
            <select className="input" value={data.currency || 'USDT'} onChange={e => onChange({ ...data, currency: e.target.value })} style={{ width: '100%' }}>
              <option>USDT</option><option>USDC</option><option>BTC</option><option>ETH</option><option>BNB</option>
            </select>
          </div>
        </>
      )}
    </>
  )
}

function CardForm({ data, onChange }) {
  return (
    <>
      <div style={{ marginBottom: '14px' }}>
        <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Type</label>
        <select className="input" value={data.type} onChange={e => onChange({ ...data, type: e.target.value })} style={{ width: '100%' }}>
          {CARD_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '14px' }}>
        <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Nickname / Alias</label>
        <input className="input" placeholder="e.g. My Visa Debit" value={data.alias} onChange={e => onChange({ ...data, alias: e.target.value })} style={{ width: '100%' }} />
      </div>
      {data.type === 'Vipps' ? (
        <div style={{ marginBottom: '14px' }}>
          <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Phone Number (Norwegian)</label>
          <input className="input" placeholder="9XXXXXXX" value={data.phone || ''} onChange={e => onChange({ ...data, phone: e.target.value.replace(/\D/g,'').slice(0,8) })} style={{ width: '100%' }} />
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>Vipps will be linked to your Norwegian phone number.</div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Card Number (last 4 digits only stored)</label>
            <input className="input" placeholder="•••• •••• •••• 4242" maxLength={19}
              value={data.last4 ? `•••• •••• •••• ${data.last4}` : ''}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g,'').slice(-4)
                onChange({ ...data, last4: raw })
              }}
              style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label className="label" style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text2)' }}>Expiry (MM/YY)</label>
            <input className="input" placeholder="12/27" maxLength={5}
              value={data.expiry || ''}
              onChange={e => {
                let v = e.target.value.replace(/\D/g,'').slice(0,4)
                if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2)
                onChange({ ...data, expiry: v })
              }}
              style={{ width: '100%' }} />
          </div>
        </>
      )}
    </>
  )
}

const BLANK_WITHDRAWAL = { type: 'Bank Transfer', alias: '', bank: '', iban: '', bic: '', network: '', address: '', currency: 'NOK' }
const BLANK_CARD = { type: 'Visa', alias: '', last4: '', expiry: '', phone: '' }

export default function PaymentMethods() {
  const { user } = useAuth()
  const userId = user?.memberId || 'NV-10042'

  const [tab, setTab] = useState('withdrawal')
  const [methods, setMethods] = useState({ withdrawalAccounts: [], paymentCards: [] })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [editTarget, setEditTarget] = useState(null)
  const [formData, setFormData] = useState(BLANK_WITHDRAWAL)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getPaymentMethods(userId).then(d => {
      setMethods(d)
      setLoading(false)
    })
  }, [userId])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function openAdd() {
    setModalMode('add')
    setEditTarget(null)
    setFormData(tab === 'withdrawal' ? { ...BLANK_WITHDRAWAL } : { ...BLANK_CARD })
    setFormError('')
    setShowModal(true)
  }

  function openEdit(method) {
    setModalMode('edit')
    setEditTarget(method)
    setFormData({ ...method })
    setFormError('')
    setShowModal(true)
  }

  function validateForm() {
    if (!formData.alias.trim()) return 'Please enter a nickname/alias.'
    if (tab === 'withdrawal') {
      if (formData.type === 'Crypto') {
        if (!formData.network) return 'Select a network.'
        if (!formData.address.trim()) return 'Enter a wallet address.'
      } else {
        if (!formData.iban.trim()) return 'Enter an IBAN / account number.'
      }
    } else {
      if (formData.type === 'Vipps') {
        if (!formData.phone || formData.phone.length < 8) return 'Enter a valid 8-digit Norwegian phone number.'
      } else {
        if (!formData.last4 || formData.last4.length < 4) return 'Enter the last 4 digits of your card.'
        if (!formData.expiry || formData.expiry.length < 5) return 'Enter a valid expiry date.'
      }
    }
    return null
  }

  async function handleSave() {
    const err = validateForm()
    if (err) { setFormError(err); return }
    setSaving(true)
    setFormError('')
    try {
      if (modalMode === 'add') {
        const updated = await addPaymentMethod(userId, { tab, ...formData })
        setMethods(updated)
        showToast(`${formData.alias} added ✓`)
      } else {
        const updated = await updatePaymentMethod(userId, editTarget.id, { tab, ...formData })
        setMethods(updated)
        showToast(`${formData.alias} updated ✓`)
      }
      setShowModal(false)
    } catch (e) {
      setFormError(e.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSetDefault(methodId) {
    const updated = await setDefaultPaymentMethod(userId, methodId, tab)
    setMethods(updated)
    showToast('Default updated ✓')
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const updated = await deletePaymentMethod(userId, deleteTarget.id, tab)
      setMethods(updated)
      showToast(`${deleteTarget.alias} removed`)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const accounts = methods.withdrawalAccounts || []
  const cards = methods.paymentCards || []
  const defaultAccount = accounts.find(a => a.isDefault)
  const defaultCard = cards.find(c => c.isDefault)

  const list = tab === 'withdrawal' ? accounts : cards

  return (
    <DashboardLayout>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: 'var(--green2)', color: '#fff', padding: '12px 20px',
          borderRadius: '10px', fontWeight: 600, fontSize: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>{toast}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)' }}>Payment Methods</h1>
        <button className="btn btn-gold btn-sm" onClick={openAdd}>+ Add {tab === 'withdrawal' ? 'Account' : 'Card'}</button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '14px', marginBottom: '28px' }}>
        <KpiCard label="Withdrawal Accounts" value={accounts.length} sub={defaultAccount ? `Default: ${defaultAccount.alias}` : 'No default set'} color="var(--gold)" />
        <KpiCard label="Payment Cards" value={cards.length} sub={defaultCard ? `Default: ${defaultCard.alias}` : 'No default set'} color="var(--gold)" />
        <KpiCard label="Default Payout Method" value={defaultAccount ? defaultAccount.type : '—'} sub={defaultAccount ? defaultAccount.alias : 'Add a withdrawal account'} color={defaultAccount ? 'var(--green-ok)' : 'var(--red)'} />
        <KpiCard label="Default Payment Card" value={defaultCard ? defaultCard.type : '—'} sub={defaultCard ? (defaultCard.type === 'Vipps' ? `+47 ${defaultCard.phone}` : `···· ${defaultCard.last4}`) : 'Add a payment card'} color={defaultCard ? 'var(--green-ok)' : 'var(--yellow)'} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[
          { key: 'withdrawal', label: '🏦 Withdrawal Accounts' },
          { key: 'card', label: '💳 Payment Cards' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '13px',
            color: tab === t.key ? 'var(--gold)' : 'var(--text2)',
            borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text2)', padding: '40px', textAlign: 'center' }}>Loading…</div>
      ) : list.length === 0 ? (
        <div style={{
          background: 'var(--navy2)', border: '1px dashed var(--border)', borderRadius: '12px',
          padding: '48px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>{tab === 'withdrawal' ? '🏦' : '💳'}</div>
          <div style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: '8px' }}>
            No {tab === 'withdrawal' ? 'withdrawal accounts' : 'payment cards'} saved yet
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '20px' }}>
            {tab === 'withdrawal'
              ? 'Add a bank account, SEPA account, or crypto wallet to enable fast withdrawals from your Wallet.'
              : 'Save a card or Vipps number for faster checkout.'}
          </div>
          <button className="btn btn-gold" onClick={openAdd}>+ Add {tab === 'withdrawal' ? 'Withdrawal Account' : 'Payment Card'}</button>
        </div>
      ) : (
        <div>
          {list.map(m => (
            <MethodCard
              key={m.id}
              method={m}
              isWithdrawal={tab === 'withdrawal'}
              onSetDefault={handleSetDefault}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
          <button className="btn btn-outline btn-sm" onClick={openAdd} style={{ marginTop: '8px' }}>
            + Add {tab === 'withdrawal' ? 'Account' : 'Card'}
          </button>
        </div>
      )}

      {/* Security note */}
      <div style={{
        marginTop: '32px', background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '20px' }}>🔒</span>
        <div>
          <div style={{ color: 'var(--cream)', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Security Notice</div>
          <div style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: '1.6' }}>
            Only the last 4 digits of card numbers are stored. Withdrawal account details are encrypted at rest and visible only to you.
            All payouts are reviewed by admin before processing. For assistance, contact support.
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{
            background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px',
            padding: '28px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h3 style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: '20px' }}>
              {modalMode === 'add' ? `Add ${tab === 'withdrawal' ? 'Withdrawal Account' : 'Payment Card'}` : 'Edit Method'}
            </h3>
            {tab === 'withdrawal'
              ? <WithdrawalForm data={formData} onChange={setFormData} />
              : <CardForm data={formData} onChange={setFormData} />}
            {formError && (
              <div style={{ color: '#fca5a5', fontSize: '12px', background: '#7f1d1d', borderRadius: '6px', padding: '8px 12px', marginBottom: '14px' }}>
                {formError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-gold btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : modalMode === 'add' ? 'Add' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{
            background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px',
            padding: '28px', width: '100%', maxWidth: '380px',
          }}>
            <h3 style={{ color: '#fca5a5', fontWeight: 700, marginBottom: '12px' }}>Remove Payment Method</h3>
            <p style={{ color: 'var(--cream)', fontSize: '14px', marginBottom: '20px' }}>
              Remove <strong>{deleteTarget.alias}</strong>? This cannot be undone.
              {deleteTarget.isDefault && ' You will need to set a new default.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
