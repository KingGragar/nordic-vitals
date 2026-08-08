import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminPaymentGateways, toggleAdminPaymentGateway, testAdminPaymentGateway } from '../../api/mlmApi'

const PROVIDER_ICONS = { stripe: '💳', paypal: '🅿️', crypto: '₿', klarna: '🛍', applepay: '🍎', googlepay: '🔵' }

export default function AdminPaymentGateways() {
  const [gateways, setGateways] = useState(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState({})
  const [testResults, setTestResults] = useState({})

  const load = useCallback(() => {
    setLoading(true)
    getAdminPaymentGateways().then(setGateways).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function toggle(id) {
    await toggleAdminPaymentGateway(id)
    setGateways(prev => prev.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g))
  }

  async function test(id) {
    setTesting(prev => ({ ...prev, [id]: true }))
    const result = await testAdminPaymentGateway(id)
    setTestResults(prev => ({ ...prev, [id]: result }))
    setTesting(prev => ({ ...prev, [id]: false }))
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }
  const activeCount = (gateways || []).filter(g => g.enabled).length

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💳 Payment Gateways</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Configure and test payment provider integrations. {activeCount} active.</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 14 }}>
            {(gateways || []).map(gw => {
              const tr = testResults[gw.id]
              return (
                <div key={gw.id} style={{ ...card, opacity: gw.enabled ? 1 : 0.65 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 26 }}>{PROVIDER_ICONS[gw.provider] || '💳'}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{gw.name}</div>
                        <div style={{ color: 'var(--text2)', fontSize: 12 }}>{gw.provider}</div>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <div onClick={() => toggle(gw.id)} style={{ width: 40, height: 22, borderRadius: 11, background: gw.enabled ? '#166534' : 'var(--border)', position: 'relative', transition: 'background .2s', cursor: 'pointer' }}>
                        <div style={{ position: 'absolute', top: 3, left: gw.enabled ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                      </div>
                      <span style={{ fontSize: 12, color: gw.enabled ? '#86efac' : 'var(--text2)', fontWeight: 600 }}>{gw.enabled ? 'Active' : 'Disabled'}</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text2)' }}>Mode</span>
                      <span style={{ fontWeight: 600, color: gw.mode === 'live' ? '#86efac' : '#fbbf24' }}>{gw.mode === 'live' ? '🟢 Live' : '🟡 Test'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text2)' }}>Fee</span>
                      <span>{gw.feePercent}% + {gw.feeFixed}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text2)' }}>Currencies</span>
                      <span>{gw.currencies.join(', ')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text2)' }}>Webhook</span>
                      <span style={{ color: gw.webhookOk ? '#86efac' : '#fca5a5' }}>{gw.webhookOk ? '✓ OK' : '✗ Not configured'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text2)' }}>Last 30d volume</span>
                      <span style={{ fontWeight: 600 }}>{gw.volume30d}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => test(gw.id)}
                      disabled={testing[gw.id]}
                      style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13, cursor: testing[gw.id] ? 'wait' : 'pointer' }}
                    >
                      {testing[gw.id] ? 'Testing…' : 'Test Connection'}
                    </button>
                    {tr && (
                      <span style={{ fontSize: 12, color: tr.ok ? '#86efac' : '#fca5a5', fontWeight: 600 }}>
                        {tr.ok ? '✓ Connected' : `✗ ${tr.error}`}
                      </span>
                    )}
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
