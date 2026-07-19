import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getUserTransactions } from '../../api/mlmApi'
import { useAuth } from '../../context/AuthContext'

export default function Wallet() {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('1150')
  const [toast, setToast] = useState(null)
  const [txs, setTxs] = useState([])

  useEffect(() => {
    getUserTransactions(user?.memberId || 'NV-10042').then(d => setTxs(d.transactions || []))
  }, [user])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleConfirmWithdrawal() {
    const amount = withdrawAmount || '1150'
    setShowModal(false)
    showToast(`Withdrawal of ${parseInt(amount).toLocaleString()} MLMT requested ✓`)
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
          <div className="value" style={{ color: 'var(--green-ok)' }}>1,150 MLMT</div>
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
          <div className="value" style={{ color: 'var(--yellow)' }}>890 MLMT</div>
          <div className="sub">Clears Friday</div>
        </div>

        {/* Total Earned */}
        <div className="stat-card">
          <div className="label">Total Earned</div>
          <div className="value" style={{ color: 'var(--gold)' }}>8,420 MLMT</div>
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

              <div style={{ marginBottom: '16px' }}>
                <label className="label-text">Amount (NOK)</label>
                <input
                  className="input"
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  max="1150"
                  min="1"
                />
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '6px' }}>
                  Maximum available: NOK 1,150
                </div>
              </div>

              <div style={{
                background: 'var(--navy)',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '16px',
                fontSize: '13px',
                color: 'var(--text2)',
              }}>
                <div style={{ marginBottom: '6px' }}>
                  🏦 Bank account: IBAN ending <strong style={{ color: 'var(--cream)' }}>****4521</strong>
                </div>
                <div>⏱ Estimated: 2–3 business days</div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-green"
                  onClick={handleConfirmWithdrawal}
                >
                  Confirm Withdrawal
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
