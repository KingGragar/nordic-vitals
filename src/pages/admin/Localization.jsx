import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminLocalization } from '../../api/mlmApi'

const STATUS_COLOR = { active: '#86efac', inactive: '#f87171', default: '#93c5fd' }

export default function AdminLocalization() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('languages')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAdminLocalization().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '6px 14px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  const TABS = ['languages', 'currencies', 'timezones']

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Localization</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Manage languages, currencies, timezones and regional settings</p>
          </div>
          <button onClick={() => setShowModal(true)} style={btn('#6366f1')}>+ Add Locale</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Active Languages', value: (data?.languages || []).filter(l => l.active).length, color: '#86efac' },
            { label: 'Active Currencies', value: (data?.currencies || []).filter(c => c.active).length, color: '#93c5fd' },
            { label: 'Timezones', value: (data?.timezones || []).length, color: '#fbbf24' },
            { label: 'Default Locale', value: data?.defaultLocale || '—', color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize', fontSize: 14, background: tab === t ? '#6366f1' : 'transparent', color: tab === t ? '#fff' : 'var(--text-muted)' }}>{t}</button>
          ))}
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tab === 'languages' && (data?.languages || []).map(lang => (
              <div key={lang.code} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 22 }}>{lang.flag}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{lang.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lang.code} · {lang.nativeName}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {lang.isDefault && <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', background: '#93c5fd22', borderRadius: 5, padding: '2px 8px' }}>Default</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[lang.active ? 'active' : 'inactive'], background: `${STATUS_COLOR[lang.active ? 'active' : 'inactive']}22`, borderRadius: 5, padding: '2px 8px' }}>{lang.active ? 'Active' : 'Inactive'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lang.coverage}% translated</span>
                  <button style={btn('transparent', 'var(--text-muted)')} >Edit</button>
                </div>
              </div>
            ))}
            {tab === 'currencies' && (data?.currencies || []).map(cur => (
              <div key={cur.code} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{cur.code} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>— {cur.name}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Symbol: {cur.symbol} · Rate: {cur.rate} · Decimals: {cur.decimals}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {cur.isDefault && <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', background: '#93c5fd22', borderRadius: 5, padding: '2px 8px' }}>Default</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[cur.active ? 'active' : 'inactive'], background: `${STATUS_COLOR[cur.active ? 'active' : 'inactive']}22`, borderRadius: 5, padding: '2px 8px' }}>{cur.active ? 'Active' : 'Inactive'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updated {cur.rateUpdated}</span>
                  <button style={btn('transparent', 'var(--text-muted)')}>Edit</button>
                </div>
              </div>
            ))}
            {tab === 'timezones' && (data?.timezones || []).map(tz => (
              <div key={tz.id} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{tz.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tz.offset} · {tz.region}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tz.memberCount} members</span>
                  {tz.isDefault && <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', background: '#93c5fd22', borderRadius: 5, padding: '2px 8px' }}>Default</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 440, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 18px' }}>Add Locale</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Type</label>
                  <select style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14 }}>
                    <option>Language</option><option>Currency</option><option>Timezone</option>
                  </select>
                </div>
                {['Code', 'Name', 'Native Name / Symbol'].map(f => (
                  <div key={f}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{f}</label>
                    <input placeholder={f} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowModal(false)} style={btn('#6366f1')}>Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
