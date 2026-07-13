import { useState } from 'react'
import { ORDERS } from '../../data/mock'
import DashboardLayout from '../../components/DashboardLayout'

const STATUS_BADGE = {
  Delivered:  'badge-green',
  Shipped:    'badge-blue',
  Processing: 'badge-yellow',
}

export default function Orders() {
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleInvoiceDownload(e, orderId) {
    e.preventDefault()
    showToast(`Invoice ${orderId} downloaded`)
  }

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '24px' }}>
        My Orders
      </h1>

      <div style={{
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {ORDERS.map(order => (
              <tr key={order.id}>
                <td style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '13px' }}>{order.id}</td>
                <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{order.date}</td>
                <td style={{ fontSize: '13px', color: 'var(--text)', maxWidth: '240px' }}>
                  {order.items.join(', ')}
                </td>
                <td style={{ fontWeight: 700, color: 'var(--cream)' }}>
                  NOK {order.total.toLocaleString()}
                </td>
                <td>
                  <span className={`badge ${STATUS_BADGE[order.status] || 'badge-grey'}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={e => handleInvoiceDownload(e, order.id)}
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </DashboardLayout>
  )
}
