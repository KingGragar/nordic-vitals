import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import usePageTitle from '../hooks/usePageTitle'

const LAST_UPDATED = '1 July 2026'

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '36px' }}>
      <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)', marginBottom: '12px' }}>{title}</h2>
      <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {children}
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  usePageTitle('Privacy Policy', 'Nordic Vitals GDPR-compliant privacy policy. How we collect, use, and protect your personal data as a customer or member.')
  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '72px' }}>
        {/* Hero */}
        <div style={{ background: 'var(--navy2)', borderBottom: '1px solid var(--border)', padding: '48px 24px 40px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
              LEGAL
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--cream)', marginBottom: '10px' }}>
              Privacy Policy
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text2)' }}>Last updated: {LAST_UPDATED}</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px 36px' }}>

            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.8, marginBottom: '32px' }}>
              Nordic Vitals AS ("we", "us", "our") is committed to protecting your personal data. This Privacy Policy explains what data we collect, how we use it, and your rights under the General Data Protection Regulation (GDPR) and applicable Norwegian law.
            </p>

            <Section title="1. Data Controller">
              <p>The data controller is Nordic Vitals AS, Norway. For privacy-related enquiries please <Link to="/contact" style={{ color: 'var(--gold)' }}>contact us</Link> or email privacy@nordic-vitals.com.</p>
            </Section>

            <Section title="2. What Data We Collect">
              <p><strong style={{ color: 'var(--cream)' }}>Account data:</strong> name, email address, country, and password (stored as a bcrypt hash).</p>
              <p><strong style={{ color: 'var(--cream)' }}>Order data:</strong> shipping address, order contents, and payment reference (we do not store card numbers).</p>
              <p><strong style={{ color: 'var(--cream)' }}>Membership data:</strong> your member ID, sponsor, rank, PV/BV, commission history, and MLMT balance.</p>
              <p><strong style={{ color: 'var(--cream)' }}>Usage data:</strong> pages visited, device type, and approximate location (via IP address). Collected in aggregate; not linked to your account.</p>
            </Section>

            <Section title="3. Legal Basis for Processing">
              <p>We process your data under the following legal bases:</p>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong style={{ color: 'var(--cream)' }}>Contract:</strong> to process your orders and administer your membership.</li>
                <li><strong style={{ color: 'var(--cream)' }}>Legal obligation:</strong> to comply with accounting, tax, and anti-money-laundering requirements.</li>
                <li><strong style={{ color: 'var(--cream)' }}>Legitimate interest:</strong> to prevent fraud and improve our services.</li>
                <li><strong style={{ color: 'var(--cream)' }}>Consent:</strong> for marketing emails. You can withdraw consent at any time.</li>
              </ul>
            </Section>

            <Section title="4. How We Use Your Data">
              <p>We use your data to: fulfil and deliver orders; administer membership accounts and calculate commissions; send transactional emails (order confirmations, shipping notifications, password resets); and, with your consent, send promotional emails about products and offers.</p>
              <p>We do not sell your data to third parties.</p>
            </Section>

            <Section title="5. Data Sharing">
              <p>We share your data only with: payment processors (to charge for orders); shipping carriers (to deliver your products); and the Arctico platform (to administer the MLM commission engine). All processors are bound by data processing agreements and GDPR-compliant safeguards.</p>
              <p>If we are required to disclose data by law or regulation, we will do so only to the extent necessary.</p>
            </Section>

            <Section title="6. Data Retention">
              <p>Account and order data is retained for 5 years after your last transaction to comply with Norwegian bookkeeping regulations. You may request deletion of personal data not required for legal compliance at any time.</p>
            </Section>

            <Section title="7. Your Rights">
              <p>Under GDPR you have the right to: access your personal data; correct inaccurate data; request deletion ("right to be forgotten"); restrict or object to processing; and receive a copy of your data in a portable format.</p>
              <p>To exercise any of these rights, please <Link to="/contact" style={{ color: 'var(--gold)' }}>contact us</Link>. We will respond within 30 days. You also have the right to lodge a complaint with the Norwegian Data Protection Authority (Datatilsynet).</p>
            </Section>

            <Section title="8. Cookies">
              <p>We use strictly necessary cookies to keep you logged in and remember your cart. We do not use third-party tracking cookies or advertising pixels.</p>
            </Section>

            <Section title="9. Security">
              <p>We use TLS encryption for all data in transit. Passwords are stored as salted bcrypt hashes. Access to production data is restricted to authorised personnel and logged.</p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>We may update this Privacy Policy periodically. Material changes will be communicated by email or in-app notice at least 14 days before taking effect.</p>
            </Section>

          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px' }}>
            <Link to="/terms" style={{ color: 'var(--gold)' }}>Terms &amp; Conditions →</Link>
            <Link to="/faq" style={{ color: 'var(--text2)' }}>FAQ</Link>
            <Link to="/contact" style={{ color: 'var(--text2)' }}>Contact</Link>
          </div>
        </div>
      </div>
    </>
  )
}
