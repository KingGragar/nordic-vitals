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

export default function TermsPage() {
  usePageTitle('Terms & Conditions', 'Nordic Vitals terms and conditions governing membership, purchases, returns, and use of our supplements and member platform.')
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
              Terms &amp; Conditions
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text2)' }}>Last updated: {LAST_UPDATED}</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px 36px' }}>

            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.8, marginBottom: '32px' }}>
              These Terms &amp; Conditions ("Terms") govern your use of the Nordic Vitals website and membership programme operated by Nordic Vitals AS ("we", "us", "our"). By placing an order or creating a member account you agree to these Terms in full.
            </p>

            <Section title="1. Products and Orders">
              <p>All orders are subject to product availability. We reserve the right to refuse or cancel orders at our discretion, including where a pricing error has occurred.</p>
              <p>Prices are displayed in Norwegian Kroner (NOK) and include applicable VAT where required by Norwegian law. Prices are subject to change without notice.</p>
              <p>You may return any product within 30 days of delivery for a full refund. Products must be unused and in original packaging unless defective.</p>
            </Section>

            <Section title="2. Membership Programme">
              <p>Membership is free to join. As a member you gain access to discounted member pricing and the ability to participate in the referral commission programme.</p>
              <p>We operate a multi-level compensation plan administered through the Arctico platform. Commissions are earned on actual product sales made by you and your downline. There is no income guarantee and past earnings of other members are not indicative of your results.</p>
              <p>Nordic Vitals is not a pyramid scheme. You are never required to recruit other members and commissions are not paid solely for recruiting. If you do not make any sales you will not earn commissions.</p>
              <p>You must be at least 18 years old and a legal resident of a supported country to join the membership programme.</p>
            </Section>

            <Section title="3. MLMT Tokens">
              <p>Commissions are credited as MLMT (MultiLevel Member Tokens), an internal reward token on the Arctico platform. MLMT has no guaranteed monetary value and is subject to the terms and conditions of the Arctico platform.</p>
              <p>Withdrawals of MLMT are processed once per commission period subject to minimum withdrawal thresholds. We reserve the right to withhold payouts pending fraud review.</p>
            </Section>

            <Section title="4. User Accounts">
              <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us immediately if you suspect unauthorised access.</p>
              <p>We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or abuse the commission system.</p>
            </Section>

            <Section title="5. Prohibited Conduct">
              <p>You may not: make false or misleading income claims when recruiting; spam or harass others; create multiple accounts; reverse-engineer any part of the platform; or violate applicable laws in your jurisdiction.</p>
            </Section>

            <Section title="6. Intellectual Property">
              <p>All content on this website, including text, images, and branding, is the property of Nordic Vitals AS or its licensors. You may not reproduce or distribute any content without written permission.</p>
            </Section>

            <Section title="7. Limitation of Liability">
              <p>To the fullest extent permitted by law, Nordic Vitals AS is not liable for indirect, incidental, or consequential damages arising from your use of our products or services. Our total liability to you shall not exceed the value of your most recent order.</p>
              <p>Dietary supplements are not medicines and are not intended to diagnose, treat, cure, or prevent any disease. Consult a healthcare professional before use if you are pregnant, nursing, or taking medication.</p>
            </Section>

            <Section title="8. Governing Law">
              <p>These Terms are governed by Norwegian law. Disputes shall be subject to the exclusive jurisdiction of the courts of Norway.</p>
            </Section>

            <Section title="9. Changes to These Terms">
              <p>We may update these Terms from time to time. Significant changes will be communicated by email or via an in-app notice. Continued use of the service after the effective date constitutes acceptance of the revised Terms.</p>
            </Section>

            <Section title="10. Contact">
              <p>
                If you have questions about these Terms, please{' '}
                <Link to="/contact" style={{ color: 'var(--gold)' }}>contact us</Link>.
              </p>
            </Section>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px' }}>
            <Link to="/privacy" style={{ color: 'var(--gold)' }}>Privacy Policy →</Link>
            <Link to="/faq" style={{ color: 'var(--text2)' }}>FAQ</Link>
            <Link to="/contact" style={{ color: 'var(--text2)' }}>Contact</Link>
          </div>
        </div>
      </div>
    </>
  )
}
