import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getOrders } from '../../api/mlmApi'

const STATUS_BADGE = {
  Delivered:  'badge-green',
  Shipped:    'badge-blue',
  Processing: 'badge-yellow',
  Cancelled:  'badge-red',
}

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrders(user?.memberId)
      .then(d => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.memberId])

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '24px' }}>
        Mine ordrer
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
              <th>Ordrenr.</th>
              <th>Dato</th>
              <th>Varer</th>
              <th>Totalt</th>
              <th>Status</th>
              <th>Faktura</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px', fontSize: '14px' }}>
                  Laster ordrer…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--cream)', marginBottom: '6px' }}>Ingen ordrer ennå</div>
                  <div style={{ fontSize: '13px' }}>Viking Peptides-ordrene dine vises her etter kjøp.</div>
                </td>
              </tr>
            ) : orders.map(order => (
              <tr key={order.id}>
                <td>
                  <Link
                    to={`/dashboard/orders/${order.id}`}
                    style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '13px', textDecoration: 'none' }}
                  >
                    {order.id}
                  </Link>
                </td>
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
                  <Link
                    to={`/dashboard/orders/${order.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                  >
                    Vis faktura
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
