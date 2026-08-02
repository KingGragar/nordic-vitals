import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Suspense, lazy, useState, useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import CookieConsent from './components/CookieConsent'
import { readMaintenanceMode } from './api/mlmApi'

const Landing     = lazy(() => import('./pages/Landing'))
const Shop        = lazy(() => import('./pages/Shop'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Login       = lazy(() => import('./pages/Login'))
const Join        = lazy(() => import('./pages/Join'))

const DashHome    = lazy(() => import('./pages/dashboard/Home'))
const DashTree    = lazy(() => import('./pages/dashboard/Tree'))
const DashComm    = lazy(() => import('./pages/dashboard/Commissions'))
const DashWallet  = lazy(() => import('./pages/dashboard/Wallet'))
const DashRef     = lazy(() => import('./pages/dashboard/Referral'))
const DashOrders  = lazy(() => import('./pages/dashboard/Orders'))
const DashProfile  = lazy(() => import('./pages/dashboard/Profile'))
const DashEarnings       = lazy(() => import('./pages/dashboard/Earnings'))
const DashLeaderboard    = lazy(() => import('./pages/dashboard/Leaderboard'))
const DashNotifications  = lazy(() => import('./pages/dashboard/Notifications'))
const DashCalculator     = lazy(() => import('./pages/dashboard/Calculator'))
const DashSupport        = lazy(() => import('./pages/dashboard/Support'))
const DashAutoship       = lazy(() => import('./pages/dashboard/Autoship'))
const DashMilestones     = lazy(() => import('./pages/dashboard/Milestones'))
const DashResources      = lazy(() => import('./pages/dashboard/Resources'))
const DashRankProgress   = lazy(() => import('./pages/dashboard/RankProgress'))
const DashTraining       = lazy(() => import('./pages/dashboard/Training'))
const DashAnnouncements  = lazy(() => import('./pages/dashboard/Announcements'))
const DashMyTeam         = lazy(() => import('./pages/dashboard/MyTeam'))
const DashEvents         = lazy(() => import('./pages/dashboard/Events'))
const DashBusinessPlan   = lazy(() => import('./pages/dashboard/BusinessPlan'))
const DashMemberCard     = lazy(() => import('./pages/dashboard/MemberCard'))
const DashTaxSummary     = lazy(() => import('./pages/dashboard/TaxSummary'))
const DashOnboarding     = lazy(() => import('./pages/dashboard/Onboarding'))
const DashKyc            = lazy(() => import('./pages/dashboard/Kyc'))
const DashMyReviews          = lazy(() => import('./pages/dashboard/MyReviews'))
const DashWishlist           = lazy(() => import('./pages/dashboard/Wishlist'))
const DashNetworkAnalytics   = lazy(() => import('./pages/dashboard/NetworkAnalytics'))
const DashProspects          = lazy(() => import('./pages/dashboard/Prospects'))
const DashLoyalty            = lazy(() => import('./pages/dashboard/Loyalty'))
const DashDataPrivacy        = lazy(() => import('./pages/dashboard/DataPrivacy'))
const DashActivityTracker    = lazy(() => import('./pages/dashboard/ActivityTracker'))
const DashNotifPrefs         = lazy(() => import('./pages/dashboard/NotificationPreferences'))
const DashTeamBroadcast      = lazy(() => import('./pages/dashboard/TeamBroadcast'))
const DashChallenges         = lazy(() => import('./pages/dashboard/Challenges'))

const AdminOverview = lazy(() => import('./pages/admin/Overview'))
const AdminMembers = lazy(() => import('./pages/admin/Members'))
const AdminRuns    = lazy(() => import('./pages/admin/CommissionRuns'))
const AdminPayouts = lazy(() => import('./pages/admin/Payouts'))
const AdminReports = lazy(() => import('./pages/admin/Reports'))
const AdminPlan    = lazy(() => import('./pages/admin/PlanConfig'))
const AdminSettings= lazy(() => import('./pages/admin/Settings'))
const AdminProducts      = lazy(() => import('./pages/admin/Products'))
const AdminOrders        = lazy(() => import('./pages/admin/Orders'))
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'))
const AdminAuditLog      = lazy(() => import('./pages/admin/AuditLog'))
const AdminSupport       = lazy(() => import('./pages/admin/Support'))
const AdminAutoships     = lazy(() => import('./pages/admin/Autoships'))
const AdminPromos          = lazy(() => import('./pages/admin/Promos'))
const AdminReferrals       = lazy(() => import('./pages/admin/Referrals'))
const AdminEmailTemplates  = lazy(() => import('./pages/admin/EmailTemplates'))
const AdminTokens          = lazy(() => import('./pages/admin/Tokens'))
const AdminNetwork         = lazy(() => import('./pages/admin/Network'))
const AdminAnalytics       = lazy(() => import('./pages/admin/Analytics'))
const AdminRoles           = lazy(() => import('./pages/admin/Roles'))
const AdminCompliance         = lazy(() => import('./pages/admin/Compliance'))
const AdminEvents             = lazy(() => import('./pages/admin/Events'))
const AdminCommissionPreview  = lazy(() => import('./pages/admin/CommissionPreview'))
const AdminIntegrations       = lazy(() => import('./pages/admin/Integrations'))
const AdminImport             = lazy(() => import('./pages/admin/Import'))
const AdminCampaigns          = lazy(() => import('./pages/admin/Campaigns'))
const AdminKyc                = lazy(() => import('./pages/admin/Kyc'))
const AdminRetention          = lazy(() => import('./pages/admin/Retention'))
const AdminInventory          = lazy(() => import('./pages/admin/Inventory'))
const AdminNotifications      = lazy(() => import('./pages/admin/Notifications'))
const AdminFinancials         = lazy(() => import('./pages/admin/Financials'))
const AdminLaunchChecklist    = lazy(() => import('./pages/admin/LaunchChecklist'))
const AdminBundles            = lazy(() => import('./pages/admin/Bundles'))
const AdminReviews            = lazy(() => import('./pages/admin/Reviews'))
const AdminChallenges         = lazy(() => import('./pages/admin/Challenges'))
const AdminExchangeRates      = lazy(() => import('./pages/admin/ExchangeRates'))
const AdminBanners            = lazy(() => import('./pages/admin/Banners'))
const Checkout       = lazy(() => import('./pages/Checkout'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword  = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail    = lazy(() => import('./pages/VerifyEmail'))
const FAQ            = lazy(() => import('./pages/FAQ'))
const Contact        = lazy(() => import('./pages/Contact'))
const Terms          = lazy(() => import('./pages/Terms'))
const Privacy        = lazy(() => import('./pages/Privacy'))
const NotFound            = lazy(() => import('./pages/NotFound'))
const RefLanding          = lazy(() => import('./pages/RefLanding'))
const MaintenancePage     = lazy(() => import('./pages/MaintenancePage'))
const CompensationPlan    = lazy(() => import('./pages/CompensationPlan'))

function RequireAuth({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

const Loading = () => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16 }}>
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      border: '3px solid var(--border)',
      borderTopColor: 'var(--gold)',
      animation: 'nv-spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes nv-spin { to { transform: rotate(360deg) } }`}</style>
    <span style={{ color:'var(--text2)', fontSize:13 }}>Loading…</span>
  </div>
)

function AppRoutes() {
  const location = useLocation()
  return (
    <ErrorBoundary key={location.pathname} onReset={() => window.location.reload()}>
      <Suspense fallback={<Loading />}>
        <Routes>
        <Route path="/"        element={<Landing />} />
        <Route path="/shop"    element={<Shop />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/join"    element={<Join />} />
        <Route path="/checkout"        element={<Checkout />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/verify-email"    element={<VerifyEmail />} />
        <Route path="/faq"     element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms"   element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/ref/:code" element={<RefLanding />} />
        <Route path="/plan"    element={<CompensationPlan />} />

        <Route path="/dashboard" element={<RequireAuth><DashHome /></RequireAuth>} />
        <Route path="/dashboard/tree"        element={<RequireAuth><DashTree /></RequireAuth>} />
        <Route path="/dashboard/commissions" element={<RequireAuth><DashComm /></RequireAuth>} />
        <Route path="/dashboard/wallet"      element={<RequireAuth><DashWallet /></RequireAuth>} />
        <Route path="/dashboard/referral"    element={<RequireAuth><DashRef /></RequireAuth>} />
        <Route path="/dashboard/orders"      element={<RequireAuth><DashOrders /></RequireAuth>} />
        <Route path="/dashboard/profile"      element={<RequireAuth><DashProfile /></RequireAuth>} />
        <Route path="/dashboard/earnings"       element={<RequireAuth><DashEarnings /></RequireAuth>} />
        <Route path="/dashboard/leaderboard"   element={<RequireAuth><DashLeaderboard /></RequireAuth>} />
        <Route path="/dashboard/notifications" element={<RequireAuth><DashNotifications /></RequireAuth>} />
        <Route path="/dashboard/calculator"   element={<RequireAuth><DashCalculator /></RequireAuth>} />
        <Route path="/dashboard/support"      element={<RequireAuth><DashSupport /></RequireAuth>} />
        <Route path="/dashboard/autoship"     element={<RequireAuth><DashAutoship /></RequireAuth>} />
        <Route path="/dashboard/milestones"     element={<RequireAuth><DashMilestones /></RequireAuth>} />
        <Route path="/dashboard/resources"     element={<RequireAuth><DashResources /></RequireAuth>} />
        <Route path="/dashboard/rank-progress" element={<RequireAuth><DashRankProgress /></RequireAuth>} />
        <Route path="/dashboard/training"       element={<RequireAuth><DashTraining /></RequireAuth>} />
        <Route path="/dashboard/announcements" element={<RequireAuth><DashAnnouncements /></RequireAuth>} />
        <Route path="/dashboard/my-team"       element={<RequireAuth><DashMyTeam /></RequireAuth>} />
        <Route path="/dashboard/events"         element={<RequireAuth><DashEvents /></RequireAuth>} />
        <Route path="/dashboard/business-plan" element={<RequireAuth><DashBusinessPlan /></RequireAuth>} />
        <Route path="/dashboard/member-card"   element={<RequireAuth><DashMemberCard /></RequireAuth>} />
        <Route path="/dashboard/tax-summary"   element={<RequireAuth><DashTaxSummary /></RequireAuth>} />
        <Route path="/dashboard/onboarding"   element={<RequireAuth><DashOnboarding /></RequireAuth>} />
        <Route path="/dashboard/kyc"          element={<RequireAuth><DashKyc /></RequireAuth>} />
        <Route path="/dashboard/my-reviews"         element={<RequireAuth><DashMyReviews /></RequireAuth>} />
        <Route path="/dashboard/wishlist"           element={<RequireAuth><DashWishlist /></RequireAuth>} />
        <Route path="/dashboard/network-analytics" element={<RequireAuth><DashNetworkAnalytics /></RequireAuth>} />
        <Route path="/dashboard/prospects"        element={<RequireAuth><DashProspects /></RequireAuth>} />
        <Route path="/dashboard/loyalty"           element={<RequireAuth><DashLoyalty /></RequireAuth>} />
        <Route path="/dashboard/data-privacy"     element={<RequireAuth><DashDataPrivacy /></RequireAuth>} />
        <Route path="/dashboard/activity"                  element={<RequireAuth><DashActivityTracker /></RequireAuth>} />
        <Route path="/dashboard/notification-preferences" element={<RequireAuth><DashNotifPrefs /></RequireAuth>} />
        <Route path="/dashboard/team-broadcast"         element={<RequireAuth><DashTeamBroadcast /></RequireAuth>} />
        <Route path="/dashboard/challenges"            element={<RequireAuth><DashChallenges /></RequireAuth>} />

        <Route path="/admin/overview" element={<RequireAuth role="admin"><AdminOverview /></RequireAuth>} />
        <Route path="/admin"          element={<RequireAuth role="admin"><AdminMembers /></RequireAuth>} />
        <Route path="/admin/runs"     element={<RequireAuth role="admin"><AdminRuns /></RequireAuth>} />
        <Route path="/admin/payouts"  element={<RequireAuth role="admin"><AdminPayouts /></RequireAuth>} />
        <Route path="/admin/reports"  element={<RequireAuth role="admin"><AdminReports /></RequireAuth>} />
        <Route path="/admin/plan"     element={<RequireAuth role="admin"><AdminPlan /></RequireAuth>} />
        <Route path="/admin/settings"  element={<RequireAuth role="admin"><AdminSettings /></RequireAuth>} />
        <Route path="/admin/products" element={<RequireAuth role="admin"><AdminProducts /></RequireAuth>} />
        <Route path="/admin/orders"         element={<RequireAuth role="admin"><AdminOrders /></RequireAuth>} />
        <Route path="/admin/announcements" element={<RequireAuth role="admin"><AdminAnnouncements /></RequireAuth>} />
        <Route path="/admin/audit-log"    element={<RequireAuth role="admin"><AdminAuditLog /></RequireAuth>} />
        <Route path="/admin/support"      element={<RequireAuth role="admin"><AdminSupport /></RequireAuth>} />
        <Route path="/admin/autoships"    element={<RequireAuth role="admin"><AdminAutoships /></RequireAuth>} />
        <Route path="/admin/promos"           element={<RequireAuth role="admin"><AdminPromos /></RequireAuth>} />
        <Route path="/admin/referrals"        element={<RequireAuth role="admin"><AdminReferrals /></RequireAuth>} />
        <Route path="/admin/email-templates"  element={<RequireAuth role="admin"><AdminEmailTemplates /></RequireAuth>} />
        <Route path="/admin/tokens"           element={<RequireAuth role="admin"><AdminTokens /></RequireAuth>} />
        <Route path="/admin/network"          element={<RequireAuth role="admin"><AdminNetwork /></RequireAuth>} />
        <Route path="/admin/analytics"        element={<RequireAuth role="admin"><AdminAnalytics /></RequireAuth>} />
        <Route path="/admin/roles"            element={<RequireAuth role="admin"><AdminRoles /></RequireAuth>} />
        <Route path="/admin/compliance"       element={<RequireAuth role="admin"><AdminCompliance /></RequireAuth>} />
        <Route path="/admin/events"              element={<RequireAuth role="admin"><AdminEvents /></RequireAuth>} />
        <Route path="/admin/commission-preview" element={<RequireAuth role="admin"><AdminCommissionPreview /></RequireAuth>} />
        <Route path="/admin/integrations"       element={<RequireAuth role="admin"><AdminIntegrations /></RequireAuth>} />
        <Route path="/admin/import"             element={<RequireAuth role="admin"><AdminImport /></RequireAuth>} />
        <Route path="/admin/campaigns"          element={<RequireAuth role="admin"><AdminCampaigns /></RequireAuth>} />
        <Route path="/admin/kyc"               element={<RequireAuth role="admin"><AdminKyc /></RequireAuth>} />
        <Route path="/admin/retention"        element={<RequireAuth role="admin"><AdminRetention /></RequireAuth>} />
        <Route path="/admin/inventory"        element={<RequireAuth role="admin"><AdminInventory /></RequireAuth>} />
        <Route path="/admin/notifications"    element={<RequireAuth role="admin"><AdminNotifications /></RequireAuth>} />
        <Route path="/admin/financials"       element={<RequireAuth role="admin"><AdminFinancials /></RequireAuth>} />
        <Route path="/admin/launch"           element={<RequireAuth role="admin"><AdminLaunchChecklist /></RequireAuth>} />
        <Route path="/admin/bundles"          element={<RequireAuth role="admin"><AdminBundles /></RequireAuth>} />
        <Route path="/admin/reviews"          element={<RequireAuth role="admin"><AdminReviews /></RequireAuth>} />
        <Route path="/admin/challenges"       element={<RequireAuth role="admin"><AdminChallenges /></RequireAuth>} />
        <Route path="/admin/exchange-rates"   element={<RequireAuth role="admin"><AdminExchangeRates /></RequireAuth>} />
        <Route path="/admin/banners"          element={<RequireAuth role="admin"><AdminBanners /></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

const ADMIN_BANNER_STYLE = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
  background: '#b45309', color: '#fff',
  fontSize: 12, fontWeight: 700, textAlign: 'center', padding: '6px 16px',
  letterSpacing: '0.05em',
}

export default function App() {
  const { user } = useAuth()
  const [maint, setMaint] = useState(() => readMaintenanceMode())

  useEffect(() => {
    const id = setInterval(() => { setMaint(readMaintenanceMode()) }, 5000)
    return () => clearInterval(id)
  }, [])

  const isAdmin = user?.role === 'admin'

  if (maint.active && !isAdmin) {
    return (
      <Suspense fallback={<div />}>
        <MaintenancePage />
      </Suspense>
    )
  }

  return (
    <>
      {maint.active && isAdmin && (
        <div style={ADMIN_BANNER_STYLE}>
          🔧 MAINTENANCE MODE ACTIVE — Only you can see this site. Visitors see the maintenance page.
        </div>
      )}
      <div style={maint.active && isAdmin ? { paddingTop: 32 } : {}}>
        <AppRoutes />
        <CookieConsent />
      </div>
    </>
  )
}
