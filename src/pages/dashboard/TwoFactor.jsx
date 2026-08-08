import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberTwoFactorStatus, enableMemberTwoFactor, disableMemberTwoFactor, verifyMemberTwoFactor, regenerateMemberBackupCodes } from '../../api/mlmApi'

export default function DashTwoFactor() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('idle')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [backupCodes, setBackupCodes] = useState(null)
  const [disableCode, setDisableCode] = useState('')
  const [regenerating, setRegenerating] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getMemberTwoFactorStatus().then(setStatus).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function startEnable() {
    const data = await enableMemberTwoFactor()
    setStatus(prev => ({ ...prev, qrCode: data.qrCode, secret: data.secret }))
    setStep('scan')
  }

  async function verify() {
    if (code.length < 6) return
    setVerifying(true)
    setError('')
    const res = await verifyMemberTwoFactor(code)
    if (res.success) {
      setBackupCodes(res.backupCodes)
      setStatus(prev => ({ ...prev, enabled: true, qrCode: null, secret: null, verifiedAt: new Date().toISOString() }))
      setStep('backup')
    } else {
      setError('Invalid code. Please try again.')
    }
    setVerifying(false)
    setCode('')
  }

  async function disable() {
    if (disableCode.length < 6) return
    setVerifying(true)
    const res = await disableMemberTwoFactor(disableCode)
    if (res.success) {
      setStatus(prev => ({ ...prev, enabled: false }))
      setStep('idle')
      setDisableCode('')
    } else {
      setError('Invalid code.')
    }
    setVerifying(false)
  }

  async function regenerate() {
    setRegenerating(true)
    const codes = await regenerateMemberBackupCodes()
    setBackupCodes(codes)
    setRegenerating(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px' }
  const inp = { padding: '10px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 16, width: '100%', letterSpacing: '0.2em', boxSizing: 'border-box', textAlign: 'center' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🔐 Two-Factor Authentication</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Add an extra layer of security to your account.</div>
        </div>

        {/* Status banner */}
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ fontSize: 28 }}>{status?.enabled ? '✅' : '🔓'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>2FA is {status?.enabled ? 'Enabled' : 'Disabled'}</div>
            <div style={{ color: 'var(--text2)', fontSize: 12 }}>
              {status?.enabled ? `Active since ${status.verifiedAt?.slice(0, 10)}` : 'Your account has only password protection.'}
            </div>
          </div>
          {!status?.enabled && step === 'idle' && (
            <button onClick={startEnable} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>
              Enable
            </button>
          )}
          {status?.enabled && step === 'idle' && (
            <button onClick={() => setStep('disable')} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #991b1b', background: 'transparent', color: '#fca5a5', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
              Disable
            </button>
          )}
        </div>

        {/* Step: scan QR */}
        {step === 'scan' && status?.qrCode && (
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Step 1 — Scan this QR code</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 14 }}>Use an authenticator app (Google Authenticator, Authy, 1Password) to scan the code below.</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <img src={status.qrCode} alt="QR Code" style={{ width: 160, height: 160, borderRadius: 8, background: '#fff', padding: 8 }} />
            </div>
            {status.secret && (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontFamily: 'monospace', fontSize: 14, marginBottom: 14, wordBreak: 'break-all', textAlign: 'center', letterSpacing: '0.1em' }}>
                {status.secret}
              </div>
            )}
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Step 2 — Enter the 6-digit code</div>
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              style={inp}
              maxLength={6}
            />
            {error && <div style={{ color: '#fca5a5', fontSize: 13, marginTop: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => { setStep('idle'); setCode('') }} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={verify} disabled={verifying || code.length < 6} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: code.length < 6 ? 'not-allowed' : 'pointer' }}>
                {verifying ? 'Verifying…' : 'Verify & Activate'}
              </button>
            </div>
          </div>
        )}

        {/* Step: backup codes */}
        {step === 'backup' && backupCodes && (
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>✅ 2FA Activated! Save your backup codes</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 14 }}>Store these in a safe place. Each code can only be used once if you lose your authenticator.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {backupCodes.map((c, i) => (
                <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 12px', fontFamily: 'monospace', fontSize: 14, textAlign: 'center' }}>{c}</div>
              ))}
            </div>
            <button onClick={() => setStep('idle')} style={{ width: '100%', padding: '10px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        )}

        {/* Step: disable */}
        {step === 'disable' && (
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Disable Two-Factor Authentication</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 14 }}>Enter your current authenticator code to confirm.</div>
            <input value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" style={inp} maxLength={6} />
            {error && <div style={{ color: '#fca5a5', fontSize: 13, marginTop: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => { setStep('idle'); setError('') }} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={disable} disabled={verifying || disableCode.length < 6} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#991b1b', color: '#fca5a5', fontWeight: 700, cursor: verifying ? 'wait' : 'pointer' }}>
                {verifying ? 'Disabling…' : 'Confirm Disable'}
              </button>
            </div>
          </div>
        )}

        {/* Backup codes regen */}
        {status?.enabled && step === 'idle' && (
          <div style={{ ...card, marginTop: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>🗝 Backup Codes</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 12 }}>
              You have {status.unusedBackupCodes ?? '?'} unused backup codes remaining.
            </div>
            <button onClick={regenerate} disabled={regenerating} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13, cursor: regenerating ? 'wait' : 'pointer' }}>
              {regenerating ? 'Generating…' : 'Regenerate Backup Codes'}
            </button>
            {backupCodes && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 14 }}>
                {backupCodes.map((c, i) => (
                  <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontFamily: 'monospace', fontSize: 13, textAlign: 'center' }}>{c}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
