import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { getUserTransactions, getCommissions, requestWithdrawal, getPaymentMethods } from '../../api/mlmApi'
import { useAuth } from '../../context/AuthContext'

export default function Wallet() {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('1150')
  const [withdrawMethod, setWithdrawMethod] = useState('Bank Transfer')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [toast, setToast] = useState(null)
  const [txs, setTxs] = useState([])
  const [pendingBalance, setPendingBalance] = useState(0)
  const [savedMethods, setSavedMethods] = useState([])

  useEffect(() => {
    const uid = user?.memberId || 'NV-10042'
    getUserTransactions(uid).then(d => {
      const loaded = d.transactions || []
      setTxs(loaded)
      if (loaded.length > 0 && loaded[0].balance !== undefined) {
        setWithdrawAmount(String(loaded[0].balance))
      }
    })
    getCommissions()
      .then(d => {
        const pending = (d?.commissions || [])
          .filter(c => c.status === 'Pending')
          .reduce((s, c) => s + (c.amount || 0), 0)
        setPendingBalance(pending)
      })
      .catch(() => {})
    getPaymentMethods(uid).then(d => {
      const accounts = d.withdrawalAccounts || []
      setSavedMethods(accounts)
      const def = accounts.find(a => a.isDefault)
      if (def) {
        setWithdrawMethod(def.type)
        if (def.type !== 'Bank Transfer' && def.address) setWithdrawAddress(def.address)
        else if (def.type === 'SEPA Transfer' && def.iban) setWithdrawAddress(def.iban)
      }
    }).catch(() => {})
  }, [user])

  const availableBalance = txs.length > 0 && txs[0].balance !== undefined ? txs[0].balance : 1150
  const totalEarned = txs.reduce((sum, tx) => tx.direction === 'credit' ? sum + (tx.amount || 0) : sum, 0) || 8420

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleConfirmWithdrawal() {
    const amount = parseInt(withdrawAmount, 10)
    setWithdrawError('')
    if (!amount || amount <= 0) { setWithdrawError('Enter a valid amount.'); return }
    if (amount > availableBalance) { setWithdrawError(`Amount exceeds available balance (${availableBalance.toLocaleString()} MLMT).`); return }
    if (withdrawMethod !== 'Bank Transfer' && !withdrawAddress.trim()) { setWithdrawError('Enter your withdrawal address.'); return }
    setWithdrawLoading(true)
    try {
      const result = await requestWithdrawal(user?.memberId || 'NV-10042', {
        amount,
        method: withdrawMethod,
        address: withdrawAddress.trim(),
      })
      setShowModal(false)
      setWithdrawAmount(String(availableBalance))
      setWithdrawAddress('')
      showToast(`Withdrawal of ${amount.toLocaleString()} MLMT requested ✓ (${result.payout_id})`)
    } catch (err) {
      setWithdrawError(err.message || 'Request failed — please try again.')
    } finally {
      setWithdrawLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '24px' }}>
        Wallet
      </h1>

      {/* 3 balance cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {/* Available */}
        <div className="stat-card">
          <div className="label">Available Balance</div>
          <div className="value" style={{ color: 'var(--green-ok)' }}>{availableBalance.toLocaleString()} MLMT</div>
          <div className="sub" style={{ marginTop: '12px' }}>
            <button
              className="btn btn-green btn-sm"
              onClick={() => setShowModal(true)}
            >
              Claim / Withdraw
            </button>
          </div>
        </div>

        {/* Pending */}
        <div className="stat-card">
          <div className="label">Pending Balance</div>
          <div className="value" style={{ color: 'var(--yellow)' }}>{pendingBalance.toLocaleString()} MLMT</div>
          <div className="sub">{pendingBalance > 0 ? 'Processing' : 'None pending'}</div>
        </div>

        {/* Total Earned */}
        <div className="stat-card">
          <div className="label">Total Earned</div>
          <div className="value" style={{ color: 'var(--gold)' }}>{totalEarned.toLocaleString()} MLMT</div>
          <div className="sub">Lifetime earnings · testnet</div>
        </div>
      </div>

      {/* Transaction table */}
      <div style={{
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)' }}>Transaction History</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{tx.created_at}</td>
                <td style={{ fontSize: '14px' }}>{tx.description}</td>
                <td style={{
                  fontWeight: 700,
                  color: tx.direction === 'credit' ? 'var(--green-ok)' : 'var(--red)',
                  fontSize: '14px',
                }}>
                  {tx.direction === 'credit' ? '+' : '-'}{tx.amount?.toLocaleString()} MLMT
                </td>
                <td style={{ color: 'var(--cream)', fontWeight: 600, fontSize: '13px' }}>
                  {tx.balance !== undefined ? `${tx.balance?.toLocaleString()} MLMT` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Withdrawal modal */}
      {showModal && (
        <>
          {/* Overlay */}
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.55)', zIndex: 300,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setShowModal(false)}
          >
            {/* Modal card */}
            <div
              style={{
                background: 'var(--navy2)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '32px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--cream)', marginBottom: '24px' }}>
                Withdraw Funds
              </h2>

              {savedMethods.length > 0 && (
                <div style={{ marginBottom: '16px', background: 'var(--navy)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saved Accounts</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {savedMethods.map(m => (
                      <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="savedMethod" checked={withdrawMethod === m.type && (m.type === 'Bank Transfer' || withdrawAddress === (m.address || m.iban || ''))}
                          onChange={() => {
                            setWithdrawMethod(m.type)
                            setWithdrawAddress(m.type === 'Crypto' ? (m.address || '') : (m.type === 'SEPA Transfer' ? (m.iban || '') : ''))
                            setWithdrawError('')
                          }}
                          style={{ accentColor: 'var(--gold)' }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--cream)' }}>{m.alias}</span>
                        {m.isDefault && <span style={{ fontSize: '10px', color: 'var(--gold)' }}>DEFAULT</span>}
                        <span style={{ fontSize: '11px', color: 'var(--text2)', marginLeft: 'auto' }}>{m.type}</span>
                      </label>
                    ))}
                  </div>
                  <Link to="/dashboard/payment-methods" style={{ fontSize: '11px', color: 'var(--gold)', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}>
                    Manage payment methods →
                  </Link>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label className="label-text">Method</label>
                <select
                  className="input"
                  value={withdrawMethod}
                  onChange={e => { setWithdrawMethod(e.target.value); setWithdrawAddress(''); setWithdrawError('') }}
                >
                  <option>Bank Transfer</option>
                  <option>SEPA Transfer</option>
                  <option>Crypto (USDT/TRC-20)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="label-text">Amount (MLMT)</label>
                <input
                  className="input"
                  type="number"
                  value={withdrawAmount}
                  onChange={e => { setWithdrawAmount(e.target.value); setWithdrawError('') }}
                  max={String(availableBalance)}
                  min="1"
                />
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '6px' }}>
                  Available: {availableBalance.toLocaleString()} MLMT
                </div>
              </div>

              {withdrawMethod !== 'Bank Transfer' && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label-text">
                    {withdrawMethod === 'SEPA Transfer' ? 'IBAN' : 'Wallet Address'}
                  </label>
                  <input
                    className="input"
                    placeholder={withdrawMethod === 'SEPA Transfer' ? 'NO93 1234 5678 901' : 'T... (TRC-20)'}
                    value={withdrawAddress}
                    onChange={e => { setWithdrawAddress(e.target.value); setWithdrawError('') }}
                  />
                </div>
              )}

              {withdrawMethod === 'Bank Transfer' && (
                <div style={{
                  background: 'var(--navy)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: 'var(--text2)',
                }}>
                  {(() => {
                    const def = savedMethods.find(m => m.isDefault && m.type === 'Bank Transfer') || savedMethods.find(m => m.type === 'Bank Transfer')
                    return def
                      ? <><div style={{ marginBottom: '6px' }}>🏦 <strong style={{ color: 'var(--cream)' }}>{def.alias}</strong> — {def.bank} · IBAN ending ****{(def.iban || '').replace(/\s/g,'').slice(-4)}</div><div>⏱ Estimated: 2–3 business days</div></>
                      : <><div style={{ marginBottom: '6px' }}>🏦 No bank account saved yet</div><Link to="/dashboard/payment-methods" style={{ color: 'var(--gold)', fontSize: '12px' }}>Add a bank account →</Link></>
                  })()}
                </div>
              )}

              {withdrawError && (
                <div style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>
                  {withdrawError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => { setShowModal(false); setWithdrawError('') }}
                  disabled={withdrawLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-green"
                  onClick={handleConfirmWithdrawal}
                  disabled={withdrawLoading}
                >
                  {withdrawLoading ? 'Submitting…' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </DashboardLayout>
  )
}
