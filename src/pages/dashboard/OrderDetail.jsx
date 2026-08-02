import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { getOrderDetail } from '../../api/mlmApi'

const STATUS_COLOR = {
  Delivered:  { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80', label: 'Levert' },
  Shipped:    { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'Sendt' },
  Processing: { bg: 'rgba(234,179,8,0.15)',  color: '#facc15', label: 'Behandles' },
  Cancelled:  { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', label: 'Kansellert' },
}

const PRINT_STYLE = `
  @media print {
    body > *:not(#invoice-root) { display: none !important; }
    #invoice-root { display: block !important; }
    .no-print { display: none !important; }
    nav, aside, header, footer { display: none !important; }
    .invoice-card {
      background: #fff !important; color: #111 !important;
      border: none !important; box-shadow: none !important;
      padding: 0 !important;
    }
    .invoice-th { background: #f4f4f4 !important; color: #111 !important; }
    .invoice-td { color: #111 !important; border-bottom: 1px solid #e5e7eb !important; }
    .invoice-label { color: #555 !important; }
    .invoice-value { color: #111 !important; }
    .invoice-total-row { background: #f4f4f4 !important; color: #111 !important; }
    .invoice-grand-total { background: #111 !important; color: #fff !important; }
  }
`

export default function OrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getOrderDetail(orderId)
      .then(setOrder)
      .catch(e => setError(e.message || 'Ordre ikke funnet'))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return (
    <DashboardLayout>
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>Laster faktura…</div>
    </DashboardLayout>
  )

  if (error) return (
    <DashboardLayout>
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
        <div style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: '8px' }}>{error}</div>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard/orders')}>← Tilbake til ordrer</button>
      </div>
    </DashboardLayout>
  )

  const st = STATUS_COLOR[order.status] || STATUS_COLOR.Processing

  return (
    <DashboardLayout>
      <style>{PRINT_STYLE}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/orders')}>
          ← Ordrer
        </button>
        <h1 style={{ flex: 1, fontSize: '20px', fontWeight: 700, color: 'var(--cream)', margin: 0 }}>
          Faktura {order.id}
        </h1>
        <button className="btn btn-gold btn-sm" onClick={() => window.print()}>
          🖨 Skriv ut / Last ned PDF
        </button>
      </div>

      {/* Invoice card */}
      <div id="invoice-root" className="invoice-card" style={{
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '40px',
        maxWidth: '860px',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--gold)', letterSpacing: '-0.5px' }}>
              Nordic Vitals
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>
              {order.company.address}, {order.company.postalCode} {order.company.city}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>
              Org.nr: {order.company.orgNo} · {order.company.vatNo}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{order.company.email}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cream)', letterSpacing: '1px' }}>
              FAKTURA
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
              Fakturanr: <strong style={{ color: 'var(--gold)' }}>{order.id}</strong>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
              Fakturadato: <strong style={{ color: 'var(--cream)' }}>{order.date}</strong>
            </div>
            <div style={{ marginTop: '10px' }}>
              <span style={{
                background: st.bg, color: st.color,
                borderRadius: '20px', padding: '3px 12px',
                fontSize: '12px', fontWeight: 600,
              }}>
                {st.label}
              </span>
            </div>
          </div>
        </div>

        {/* Billing / Shipping */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '16px' }}>
            <div className="invoice-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Faktureres til
            </div>
            <div className="invoice-value" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>{order.billing.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Medlem-ID: {order.billing.memberId}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>{order.billing.address}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{order.billing.postalCode} {order.billing.city}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{order.billing.country}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '16px' }}>
            <div className="invoice-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Leveres til
            </div>
            <div className="invoice-value" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>{order.shipping.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>{order.shipping.address}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{order.shipping.postalCode} {order.shipping.city}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{order.shipping.country}</div>
          </div>
        </div>

        {/* Line items */}
        <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="invoice-th" style={{ background: 'rgba(201,168,76,0.08)', borderBottom: '2px solid var(--gold)' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Produkt</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ant.</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Enhetspris (eks. MVA)</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sum (eks. MVA)</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PV</th>
              </tr>
            </thead>
            <tbody>
              {order.lineItems.map((item, i) => {
                const unitExMva = Math.round(item.unitPrice / 1.25)
                const totalExMva = Math.round(item.total / 1.25)
                return (
                  <tr key={i} className="invoice-td" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px', color: 'var(--cream)', fontSize: '13px', fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: '12px 12px', color: 'var(--text2)', fontSize: '13px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '12px 12px', color: 'var(--text)', fontSize: '13px', textAlign: 'right' }}>NOK {unitExMva.toLocaleString()}</td>
                    <td style={{ padding: '12px 12px', color: 'var(--cream)', fontSize: '13px', textAlign: 'right', fontWeight: 600 }}>NOK {totalExMva.toLocaleString()}</td>
                    <td style={{ padding: '12px 12px', color: 'var(--gold)', fontSize: '12px', textAlign: 'right' }}>{item.qty * item.pv} PV</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <div style={{ minWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text2)', fontSize: '13px' }}>Sum eks. MVA</span>
              <span style={{ color: 'var(--cream)', fontSize: '13px' }}>NOK {order.subtotalExMva.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text2)', fontSize: '13px' }}>MVA {order.mvaRate}%</span>
              <span style={{ color: 'var(--text)', fontSize: '13px' }}>NOK {order.mvaAmount.toLocaleString()}</span>
            </div>
            <div className="invoice-grand-total" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', marginTop: '8px',
              background: 'var(--gold)', borderRadius: '8px',
            }}>
              <span style={{ color: '#1a1a2e', fontSize: '14px', fontWeight: 700 }}>Totalt inkl. MVA</span>
              <span style={{ color: '#1a1a2e', fontSize: '18px', fontWeight: 800 }}>NOK {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px',
          padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
          marginBottom: '24px',
        }}>
          <div>
            <div className="invoice-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Betalingsmåte
            </div>
            <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 600 }}>{order.payment.method}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Ref: {order.payment.ref}</div>
          </div>
          <div>
            <div className="invoice-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Opptjente PV
            </div>
            <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 700 }}>
              {order.lineItems.reduce((s, i) => s + i.qty * i.pv, 0)} PV
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Kreditert din PV-konto</div>
          </div>
        </div>

        {/* Legal footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '11px', color: 'var(--text2)', lineHeight: 1.6 }}>
          <div style={{ marginBottom: '4px' }}>
            <strong style={{ color: 'var(--cream)' }}>Nordic Vitals AS</strong> · Org.nr: {order.company.orgNo} · {order.company.vatNo}
          </div>
          <div>
            MVA-sats 25 % i henhold til merverdiavgiftsloven. Beløp oppgitt i norske kroner (NOK).
            Spørsmål? Kontakt <span style={{ color: 'var(--gold)' }}>{order.company.email}</span>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/orders')}>← Tilbake til ordrer</button>
        <button className="btn btn-gold btn-sm" onClick={() => window.print()}>🖨 Skriv ut / Last ned PDF</button>
      </div>
    </DashboardLayout>
  )
}
