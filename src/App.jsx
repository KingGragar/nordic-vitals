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
const DashOrderDetail        = lazy(() => import('./pages/dashboard/OrderDetail'))
const DashTeamReport         = lazy(() => import('./pages/dashboard/TeamReport'))
const DashForecast            = lazy(() => import('./pages/dashboard/Forecast'))
const DashMessages            = lazy(() => import('./pages/dashboard/Messages'))
const DashSocialFeed          = lazy(() => import('./pages/dashboard/SocialFeed'))
const DashCertificates        = lazy(() => import('./pages/dashboard/Certificates'))
const DashPaymentMethods      = lazy(() => import('./pages/dashboard/PaymentMethods'))
const DashFastStart           = lazy(() => import('./pages/dashboard/FastStart'))
const DashAppeals             = lazy(() => import('./pages/dashboard/Appeals'))
const DashReturns             = lazy(() => import('./pages/dashboard/Returns'))
const DashSubscription        = lazy(() => import('./pages/dashboard/Subscription'))

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
const AdminSystemStatus       = lazy(() => import('./pages/admin/SystemStatus'))
const AdminBanners            = lazy(() => import('./pages/admin/Banners'))
const AdminForecast           = lazy(() => import('./pages/admin/Forecast'))
const AdminMessages           = lazy(() => import('./pages/admin/Messages'))
const AdminCustomers          = lazy(() => import('./pages/admin/Customers'))
const AdminAppeals            = lazy(() => import('./pages/admin/Appeals'))
const AdminReturns            = lazy(() => import('./pages/admin/Returns'))
const AdminGdprRequests       = lazy(() => import('./pages/admin/GdprRequests'))
const AdminBlog               = lazy(() => import('./pages/admin/Blog'))
const AdminNewsletterSubs     = lazy(() => import('./pages/admin/NewsletterSubscribers'))
const AdminSegments           = lazy(() => import('./pages/admin/Segments'))
const AdminShipping           = lazy(() => import('./pages/admin/Shipping'))
const AdminTax                = lazy(() => import('./pages/admin/Tax'))
const AdminMembershipFees     = lazy(() => import('./pages/admin/MembershipFees'))
const AdminSubscriptions      = lazy(() => import('./pages/admin/Subscriptions'))
const AdminGiftCards          = lazy(() => import('./pages/admin/GiftCards'))
const DashGiftCards           = lazy(() => import('./pages/dashboard/GiftCards'))
const DashSecurity            = lazy(() => import('./pages/dashboard/Security'))
const AdminWebhooks           = lazy(() => import('./pages/admin/Webhooks'))
const AdminRanks              = lazy(() => import('./pages/admin/Ranks'))
const AdminFraud              = lazy(() => import('./pages/admin/Fraud'))
const AdminAbTests            = lazy(() => import('./pages/admin/AbTests'))
const AdminAbandonedCarts     = lazy(() => import('./pages/admin/AbandonedCarts'))
const DashGoals               = lazy(() => import('./pages/dashboard/Goals'))
const DashAddresses           = lazy(() => import('./pages/dashboard/Addresses'))
const AdminSurveys            = lazy(() => import('./pages/admin/Surveys'))
const DashSurveys             = lazy(() => import('./pages/dashboard/Surveys'))
const AdminContent            = lazy(() => import('./pages/admin/Content'))
const AdminTraining           = lazy(() => import('./pages/admin/Training'))
const AdminLoyaltyConfig      = lazy(() => import('./pages/admin/LoyaltyConfig'))
const AdminPriceLists         = lazy(() => import('./pages/admin/PriceLists'))
const AdminSmsCampaigns       = lazy(() => import('./pages/admin/SmsCampaigns'))
const DashDownloads           = lazy(() => import('./pages/dashboard/Downloads'))
const DashVouchers            = lazy(() => import('./pages/dashboard/Vouchers'))
const DashWebinars            = lazy(() => import('./pages/dashboard/Webinars'))
const DashPayouts             = lazy(() => import('./pages/dashboard/Payouts'))
const AdminPushNotifications  = lazy(() => import('./pages/admin/PushNotifications'))
const AdminApiKeys            = lazy(() => import('./pages/admin/ApiKeys'))
const AdminTerritories        = lazy(() => import('./pages/admin/Territories'))
const DashReferralLinks          = lazy(() => import('./pages/dashboard/ReferralLinks'))
const DashAchievements           = lazy(() => import('./pages/dashboard/Achievements'))
const AdminInfluencers           = lazy(() => import('./pages/admin/Influencers'))
const DashCommissionStatements   = lazy(() => import('./pages/dashboard/CommissionStatements'))
const AdminCategories            = lazy(() => import('./pages/admin/Categories'))
const AdminCoOp                  = lazy(() => import('./pages/admin/CoOp'))
const AdminBranding              = lazy(() => import('./pages/admin/Branding'))
const AdminFlashSales            = lazy(() => import('./pages/admin/FlashSales'))
const AdminDigitalProducts       = lazy(() => import('./pages/admin/DigitalProducts'))
const DashCoupons                = lazy(() => import('./pages/dashboard/Coupons'))
const DashCoOp                   = lazy(() => import('./pages/dashboard/CoOp'))
const DashDigitalProducts        = lazy(() => import('./pages/dashboard/DigitalProducts'))
const DashTeamGoals              = lazy(() => import('./pages/dashboard/TeamGoals'))
const AdminWaitlists             = lazy(() => import('./pages/admin/Waitlists'))
const AdminSeasonalCampaigns     = lazy(() => import('./pages/admin/SeasonalCampaigns'))
const DashWaitlists              = lazy(() => import('./pages/dashboard/Waitlists'))
const DashRankHistory            = lazy(() => import('./pages/dashboard/RankHistory'))
const AdminVendors               = lazy(() => import('./pages/admin/Vendors'))
const AdminLiveStreams            = lazy(() => import('./pages/admin/LiveStreams'))
const AdminTaxDocs               = lazy(() => import('./pages/admin/TaxDocs'))
const AdminPayoutSchedule        = lazy(() => import('./pages/admin/PayoutSchedule'))
const DashBadges                 = lazy(() => import('./pages/dashboard/Badges'))
const DashBusinessAnalytics      = lazy(() => import('./pages/dashboard/BusinessAnalytics'))
const DashDocuments              = lazy(() => import('./pages/dashboard/Documents'))
const DashSocialSharing          = lazy(() => import('./pages/dashboard/SocialSharing'))
const AdminCommissionDisputes    = lazy(() => import('./pages/admin/CommissionDisputes'))
const AdminLoyaltyLedger         = lazy(() => import('./pages/admin/LoyaltyLedger'))
const AdminFeatureFlags          = lazy(() => import('./pages/admin/FeatureFlags'))
const AdminCouponsPage           = lazy(() => import('./pages/admin/AdminCoupons'))
const DashIncomeDisclosure       = lazy(() => import('./pages/dashboard/IncomeDisclosure'))
const DashReferralAnalytics      = lazy(() => import('./pages/dashboard/ReferralAnalytics'))
const DashVipBenefits            = lazy(() => import('./pages/dashboard/VipBenefits'))
const DashEnrollment             = lazy(() => import('./pages/dashboard/Enrollment'))
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
const Compare             = lazy(() => import('./pages/Compare'))
const Blog                = lazy(() => import('./pages/Blog'))
const BlogPost            = lazy(() => import('./pages/BlogPost'))
const Unsubscribe         = lazy(() => import('./pages/Unsubscribe'))
const AdminOrderDisputes         = lazy(() => import('./pages/admin/OrderDisputes'))
const AdminPartnerPortal         = lazy(() => import('./pages/admin/PartnerPortal'))
const AdminSubscriptionAnalytics = lazy(() => import('./pages/admin/SubscriptionAnalytics'))
const AdminSocialProof           = lazy(() => import('./pages/admin/SocialProof'))
const DashSubscriptionHistory    = lazy(() => import('./pages/dashboard/SubscriptionHistory'))
const DashPartnerLinks           = lazy(() => import('./pages/dashboard/PartnerLinks'))
const DashHealthTracker          = lazy(() => import('./pages/dashboard/HealthTracker'))
const DashHabitTracker           = lazy(() => import('./pages/dashboard/HabitTracker'))
const AdminStockAlerts           = lazy(() => import('./pages/admin/StockAlerts'))
const AdminPaymentGateways       = lazy(() => import('./pages/admin/PaymentGateways'))
const AdminCustomerGroups        = lazy(() => import('./pages/admin/CustomerGroups'))
const AdminQualityControl        = lazy(() => import('./pages/admin/QualityControl'))
const DashPriceAlerts            = lazy(() => import('./pages/dashboard/PriceAlerts'))
const DashTeamChat               = lazy(() => import('./pages/dashboard/TeamChat'))
const DashWalletHistory          = lazy(() => import('./pages/dashboard/WalletHistory'))
const DashTwoFactor              = lazy(() => import('./pages/dashboard/TwoFactor'))
const AdminSupplierOrders        = lazy(() => import('./pages/admin/SupplierOrders'))
const AdminAutomationRules       = lazy(() => import('./pages/admin/AutomationRules'))
const AdminDataExports           = lazy(() => import('./pages/admin/DataExports'))
const AdminChatSupport           = lazy(() => import('./pages/admin/ChatSupport'))
const DashLearningPath           = lazy(() => import('./pages/dashboard/LearningPath'))
const DashTeamPerformance        = lazy(() => import('./pages/dashboard/TeamPerformance'))
const DashProductComparison      = lazy(() => import('./pages/dashboard/ProductComparison'))
const DashEventCalendar          = lazy(() => import('./pages/dashboard/EventCalendar'))
const AdminGeoBlocking           = lazy(() => import('./pages/admin/GeoBlocking'))
const AdminProductLabels         = lazy(() => import('./pages/admin/ProductLabels'))
const AdminSalesScripts          = lazy(() => import('./pages/admin/SalesScripts'))
const AdminMemberMarketplace     = lazy(() => import('./pages/admin/MemberMarketplace'))
const DashQuickOrder             = lazy(() => import('./pages/dashboard/QuickOrder'))
const DashMeetingScheduler       = lazy(() => import('./pages/dashboard/MeetingScheduler'))
const DashKnowledgeBase          = lazy(() => import('./pages/dashboard/KnowledgeBase'))
const DashProductSamples         = lazy(() => import('./pages/dashboard/ProductSamples'))
const AdminCreditNotes           = lazy(() => import('./pages/admin/CreditNotes'))
const AdminRecruitmentPipeline   = lazy(() => import('./pages/admin/RecruitmentPipeline'))
const AdminEmailDeliverability   = lazy(() => import('./pages/admin/EmailDeliverability'))
const AdminAffiliateNetwork      = lazy(() => import('./pages/admin/AffiliateNetwork'))
const DashCreditNotes            = lazy(() => import('./pages/dashboard/CreditNotes'))
const DashAutoshipHistory        = lazy(() => import('./pages/dashboard/AutoshipHistory'))
const DashRecruitmentPipeline    = lazy(() => import('./pages/dashboard/RecruitmentPipeline'))
const DashSmartGoals             = lazy(() => import('./pages/dashboard/SmartGoals'))
const AdminBulkMessaging         = lazy(() => import('./pages/admin/BulkMessaging'))
const AdminNetworkHealth         = lazy(() => import('./pages/admin/NetworkHealth'))
const AdminRewardPrograms        = lazy(() => import('./pages/admin/RewardPrograms'))
const AdminPendingApprovals      = lazy(() => import('./pages/admin/PendingApprovals'))
const DashMyPromotions           = lazy(() => import('./pages/dashboard/MyPromotions'))
const DashTrainingPlanner        = lazy(() => import('./pages/dashboard/TrainingPlanner'))
const DashMyTokens               = lazy(() => import('./pages/dashboard/MyTokens'))
const DashTeamLeaderboard        = lazy(() => import('./pages/dashboard/TeamLeaderboard'))
const AdminChargebacks           = lazy(() => import('./pages/admin/Chargebacks'))
const AdminProductPerformance    = lazy(() => import('./pages/admin/ProductPerformance'))
const AdminSubscriptionBilling   = lazy(() => import('./pages/admin/SubscriptionBilling'))
const AdminInventoryForecasting  = lazy(() => import('./pages/admin/InventoryForecasting'))
const DashConsultations          = lazy(() => import('./pages/dashboard/Consultations'))
const DashPurchasePlanner        = lazy(() => import('./pages/dashboard/PurchasePlanner'))
const DashJournal                = lazy(() => import('./pages/dashboard/Journal'))
const DashReferralContest        = lazy(() => import('./pages/dashboard/ReferralContest'))
const AdminBackOrders            = lazy(() => import('./pages/admin/BackOrders'))
const AdminUpsellRules           = lazy(() => import('./pages/admin/UpsellRules'))
const AdminRewardCatalog         = lazy(() => import('./pages/admin/RewardCatalog'))
const AdminRetentionOffers       = lazy(() => import('./pages/admin/RetentionOffers'))
const DashBodyMeasurements       = lazy(() => import('./pages/dashboard/BodyMeasurements'))
const DashSupplementStack        = lazy(() => import('./pages/dashboard/SupplementStack'))
const DashProgressPhotos         = lazy(() => import('./pages/dashboard/ProgressPhotos'))
const DashGoalBuddy              = lazy(() => import('./pages/dashboard/GoalBuddy'))
const AdminOrderRouting          = lazy(() => import('./pages/admin/OrderRouting'))
const AdminBundleBuilder         = lazy(() => import('./pages/admin/BundleBuilder'))
const AdminReferralCampaigns     = lazy(() => import('./pages/admin/ReferralCampaigns'))
const AdminNetworkSnapshot       = lazy(() => import('./pages/admin/NetworkSnapshot'))
const DashKitBuilder             = lazy(() => import('./pages/dashboard/KitBuilder'))
const DashWinLog                 = lazy(() => import('./pages/dashboard/WinLog'))
const DashAiInsights             = lazy(() => import('./pages/dashboard/AiInsights'))
const DashContentPlanner         = lazy(() => import('./pages/dashboard/ContentPlanner'))
const AdminLocalization          = lazy(() => import('./pages/admin/Localization'))
const AdminOnboardingFlows       = lazy(() => import('./pages/admin/OnboardingFlows'))
const AdminMemberTags            = lazy(() => import('./pages/admin/MemberTags'))
const AdminSmartNotifications    = lazy(() => import('./pages/admin/SmartNotifications'))
const DashIncomeForecast         = lazy(() => import('./pages/dashboard/IncomeForecast'))
const DashSavingsTracker         = lazy(() => import('./pages/dashboard/SavingsTracker'))
const DashTeamActivities         = lazy(() => import('./pages/dashboard/TeamActivities'))
const DashProductFeedback        = lazy(() => import('./pages/dashboard/ProductFeedback'))
const AdminTaxRules              = lazy(() => import('./pages/admin/TaxRules'))
const AdminLogViewer             = lazy(() => import('./pages/admin/LogViewer'))
const AdminAttribution           = lazy(() => import('./pages/admin/Attribution'))
const AdminCustomerSatisfaction  = lazy(() => import('./pages/admin/CustomerSatisfaction'))
const DashProtocolBuilder        = lazy(() => import('./pages/dashboard/ProtocolBuilder'))
const DashNetworkMap             = lazy(() => import('./pages/dashboard/NetworkMap'))
const DashAgreements             = lazy(() => import('./pages/dashboard/Agreements'))
const DashLoyaltyTiers           = lazy(() => import('./pages/dashboard/LoyaltyTiers'))
const AdminEmailSequences        = lazy(() => import('./pages/admin/EmailSequences'))
const AdminCommissionTiers       = lazy(() => import('./pages/admin/CommissionTiers'))
const AdminProductReviews        = lazy(() => import('./pages/admin/ProductReviews'))
const AdminMemberJourney         = lazy(() => import('./pages/admin/MemberJourney'))
const DashReadingList            = lazy(() => import('./pages/dashboard/ReadingList'))
const DashCommunityFeed          = lazy(() => import('./pages/dashboard/CommunityFeed'))
const DashMentorship             = lazy(() => import('./pages/dashboard/Mentorship'))
const DashLiveEvents             = lazy(() => import('./pages/dashboard/LiveEvents'))
const AdminCallCenter            = lazy(() => import('./pages/admin/CallCenter'))
const AdminPriceHistory          = lazy(() => import('./pages/admin/PriceHistory'))
const AdminMobileApp             = lazy(() => import('./pages/admin/MobileApp'))
const AdminComplianceWatchlist   = lazy(() => import('./pages/admin/ComplianceWatchlist'))
const DashWellnessGoals          = lazy(() => import('./pages/dashboard/WellnessGoals'))
const DashOrderTracking          = lazy(() => import('./pages/dashboard/OrderTracking'))
const DashSubscriptionUpgrade    = lazy(() => import('./pages/dashboard/SubscriptionUpgrade'))
const DashNutritionLog           = lazy(() => import('./pages/dashboard/NutritionLog'))
const AdminSmartPricing          = lazy(() => import('./pages/admin/SmartPricing'))
const AdminMemberFeedback        = lazy(() => import('./pages/admin/MemberFeedback'))
const AdminFulfillmentCenters    = lazy(() => import('./pages/admin/FulfillmentCenters'))
const AdminGamification          = lazy(() => import('./pages/admin/Gamification'))
const DashSleepTracker           = lazy(() => import('./pages/dashboard/SleepTracker'))
const DashChallengesHistory      = lazy(() => import('./pages/dashboard/ChallengesHistory'))
const DashInvoiceHistory         = lazy(() => import('./pages/dashboard/InvoiceHistory'))
const DashTeamMap                = lazy(() => import('./pages/dashboard/TeamMap'))

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
        <Route path="/compare" element={<Compare />} />
        <Route path="/blog"       element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />

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
        <Route path="/dashboard/orders/:orderId"       element={<RequireAuth><DashOrderDetail /></RequireAuth>} />
        <Route path="/dashboard/team-report"           element={<RequireAuth><DashTeamReport /></RequireAuth>} />
        <Route path="/dashboard/forecast"             element={<RequireAuth><DashForecast /></RequireAuth>} />
        <Route path="/dashboard/messages"             element={<RequireAuth><DashMessages /></RequireAuth>} />
        <Route path="/dashboard/social"              element={<RequireAuth><DashSocialFeed /></RequireAuth>} />
        <Route path="/dashboard/certificates"        element={<RequireAuth><DashCertificates /></RequireAuth>} />
        <Route path="/dashboard/payment-methods"    element={<RequireAuth><DashPaymentMethods /></RequireAuth>} />
        <Route path="/dashboard/fast-start"          element={<RequireAuth><DashFastStart /></RequireAuth>} />
        <Route path="/dashboard/appeals"            element={<RequireAuth><DashAppeals /></RequireAuth>} />
        <Route path="/dashboard/returns"            element={<RequireAuth><DashReturns /></RequireAuth>} />
        <Route path="/dashboard/subscription"       element={<RequireAuth><DashSubscription /></RequireAuth>} />
        <Route path="/dashboard/gift-cards"          element={<RequireAuth><DashGiftCards /></RequireAuth>} />
        <Route path="/dashboard/security"            element={<RequireAuth><DashSecurity /></RequireAuth>} />
        <Route path="/dashboard/goals"               element={<RequireAuth><DashGoals /></RequireAuth>} />
        <Route path="/dashboard/addresses"           element={<RequireAuth><DashAddresses /></RequireAuth>} />
        <Route path="/dashboard/surveys"              element={<RequireAuth><DashSurveys /></RequireAuth>} />
        <Route path="/dashboard/downloads"            element={<RequireAuth><DashDownloads /></RequireAuth>} />

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
        <Route path="/admin/system-status"   element={<RequireAuth role="admin"><AdminSystemStatus /></RequireAuth>} />
        <Route path="/admin/banners"          element={<RequireAuth role="admin"><AdminBanners /></RequireAuth>} />
        <Route path="/admin/forecast"         element={<RequireAuth role="admin"><AdminForecast /></RequireAuth>} />
        <Route path="/admin/messages"         element={<RequireAuth role="admin"><AdminMessages /></RequireAuth>} />
        <Route path="/admin/customers"        element={<RequireAuth role="admin"><AdminCustomers /></RequireAuth>} />
        <Route path="/admin/appeals"          element={<RequireAuth role="admin"><AdminAppeals /></RequireAuth>} />
        <Route path="/admin/shipping"         element={<RequireAuth role="admin"><AdminShipping /></RequireAuth>} />
        <Route path="/admin/tax"              element={<RequireAuth role="admin"><AdminTax /></RequireAuth>} />
        <Route path="/admin/membership-fees"  element={<RequireAuth role="admin"><AdminMembershipFees /></RequireAuth>} />
        <Route path="/admin/subscriptions"    element={<RequireAuth role="admin"><AdminSubscriptions /></RequireAuth>} />
        <Route path="/admin/returns"          element={<RequireAuth role="admin"><AdminReturns /></RequireAuth>} />
        <Route path="/admin/gdpr"             element={<RequireAuth role="admin"><AdminGdprRequests /></RequireAuth>} />
        <Route path="/admin/blog"             element={<RequireAuth role="admin"><AdminBlog /></RequireAuth>} />
        <Route path="/admin/newsletter"       element={<RequireAuth role="admin"><AdminNewsletterSubs /></RequireAuth>} />
        <Route path="/admin/segments"         element={<RequireAuth role="admin"><AdminSegments /></RequireAuth>} />
        <Route path="/admin/gift-cards"       element={<RequireAuth role="admin"><AdminGiftCards /></RequireAuth>} />
        <Route path="/admin/webhooks"         element={<RequireAuth role="admin"><AdminWebhooks /></RequireAuth>} />
        <Route path="/admin/ranks"            element={<RequireAuth role="admin"><AdminRanks /></RequireAuth>} />
        <Route path="/admin/fraud"            element={<RequireAuth role="admin"><AdminFraud /></RequireAuth>} />
        <Route path="/admin/ab-tests"           element={<RequireAuth role="admin"><AdminAbTests /></RequireAuth>} />
        <Route path="/admin/abandoned-carts"  element={<RequireAuth role="admin"><AdminAbandonedCarts /></RequireAuth>} />
        <Route path="/admin/surveys"           element={<RequireAuth role="admin"><AdminSurveys /></RequireAuth>} />
        <Route path="/admin/content"           element={<RequireAuth role="admin"><AdminContent /></RequireAuth>} />
        <Route path="/admin/training"          element={<RequireAuth role="admin"><AdminTraining /></RequireAuth>} />
        <Route path="/admin/loyalty-config"    element={<RequireAuth role="admin"><AdminLoyaltyConfig /></RequireAuth>} />
        <Route path="/admin/price-lists"       element={<RequireAuth role="admin"><AdminPriceLists /></RequireAuth>} />
        <Route path="/admin/sms-campaigns"        element={<RequireAuth role="admin"><AdminSmsCampaigns /></RequireAuth>} />
        <Route path="/admin/push-notifications"  element={<RequireAuth role="admin"><AdminPushNotifications /></RequireAuth>} />
        <Route path="/dashboard/vouchers"          element={<RequireAuth><DashVouchers /></RequireAuth>} />
        <Route path="/dashboard/webinars"          element={<RequireAuth><DashWebinars /></RequireAuth>} />
        <Route path="/dashboard/payouts"           element={<RequireAuth><DashPayouts /></RequireAuth>} />
        <Route path="/admin/api-keys"              element={<RequireAuth role="admin"><AdminApiKeys /></RequireAuth>} />
        <Route path="/admin/territories"           element={<RequireAuth role="admin"><AdminTerritories /></RequireAuth>} />
        <Route path="/dashboard/referral-links"          element={<RequireAuth><DashReferralLinks /></RequireAuth>} />
        <Route path="/dashboard/achievements"            element={<RequireAuth><DashAchievements /></RequireAuth>} />
        <Route path="/admin/influencers"                 element={<RequireAuth role="admin"><AdminInfluencers /></RequireAuth>} />
        <Route path="/dashboard/commission-statements"   element={<RequireAuth><DashCommissionStatements /></RequireAuth>} />
        <Route path="/admin/categories"                  element={<RequireAuth role="admin"><AdminCategories /></RequireAuth>} />
        <Route path="/admin/co-op"                       element={<RequireAuth role="admin"><AdminCoOp /></RequireAuth>} />
        <Route path="/admin/branding"                    element={<RequireAuth role="admin"><AdminBranding /></RequireAuth>} />
        <Route path="/admin/flash-sales"                 element={<RequireAuth role="admin"><AdminFlashSales /></RequireAuth>} />
        <Route path="/admin/digital-products"            element={<RequireAuth role="admin"><AdminDigitalProducts /></RequireAuth>} />
        <Route path="/dashboard/coupons"                 element={<RequireAuth><DashCoupons /></RequireAuth>} />
        <Route path="/dashboard/co-op"                   element={<RequireAuth><DashCoOp /></RequireAuth>} />
        <Route path="/dashboard/digital-products"        element={<RequireAuth><DashDigitalProducts /></RequireAuth>} />
        <Route path="/dashboard/team-goals"              element={<RequireAuth><DashTeamGoals /></RequireAuth>} />
        <Route path="/admin/waitlists"                   element={<RequireAuth role="admin"><AdminWaitlists /></RequireAuth>} />
        <Route path="/admin/seasonal"                    element={<RequireAuth role="admin"><AdminSeasonalCampaigns /></RequireAuth>} />
        <Route path="/dashboard/waitlists"               element={<RequireAuth><DashWaitlists /></RequireAuth>} />
        <Route path="/dashboard/rank-history"            element={<RequireAuth><DashRankHistory /></RequireAuth>} />
        <Route path="/admin/vendors"                     element={<RequireAuth role="admin"><AdminVendors /></RequireAuth>} />
        <Route path="/admin/live-streams"                element={<RequireAuth role="admin"><AdminLiveStreams /></RequireAuth>} />
        <Route path="/admin/tax-docs"                    element={<RequireAuth role="admin"><AdminTaxDocs /></RequireAuth>} />
        <Route path="/admin/payout-schedule"             element={<RequireAuth role="admin"><AdminPayoutSchedule /></RequireAuth>} />
        <Route path="/dashboard/badges"                  element={<RequireAuth><DashBadges /></RequireAuth>} />
        <Route path="/dashboard/business-analytics"      element={<RequireAuth><DashBusinessAnalytics /></RequireAuth>} />
        <Route path="/dashboard/documents"               element={<RequireAuth><DashDocuments /></RequireAuth>} />
        <Route path="/dashboard/social-sharing"          element={<RequireAuth><DashSocialSharing /></RequireAuth>} />
        <Route path="/admin/commission-disputes"         element={<RequireAuth role="admin"><AdminCommissionDisputes /></RequireAuth>} />
        <Route path="/admin/loyalty-ledger"              element={<RequireAuth role="admin"><AdminLoyaltyLedger /></RequireAuth>} />
        <Route path="/admin/feature-flags"               element={<RequireAuth role="admin"><AdminFeatureFlags /></RequireAuth>} />
        <Route path="/admin/coupons"                     element={<RequireAuth role="admin"><AdminCouponsPage /></RequireAuth>} />
        <Route path="/dashboard/income-disclosure"       element={<RequireAuth><DashIncomeDisclosure /></RequireAuth>} />
        <Route path="/dashboard/referral-analytics"      element={<RequireAuth><DashReferralAnalytics /></RequireAuth>} />
        <Route path="/dashboard/vip-benefits"            element={<RequireAuth><DashVipBenefits /></RequireAuth>} />
        <Route path="/dashboard/enrollment"              element={<RequireAuth><DashEnrollment /></RequireAuth>} />

        <Route path="/admin/order-disputes"          element={<RequireAuth role="admin"><AdminOrderDisputes /></RequireAuth>} />
        <Route path="/admin/partner-portal"          element={<RequireAuth role="admin"><AdminPartnerPortal /></RequireAuth>} />
        <Route path="/admin/subscription-analytics"  element={<RequireAuth role="admin"><AdminSubscriptionAnalytics /></RequireAuth>} />
        <Route path="/admin/social-proof"            element={<RequireAuth role="admin"><AdminSocialProof /></RequireAuth>} />
        <Route path="/dashboard/subscription-history" element={<RequireAuth><DashSubscriptionHistory /></RequireAuth>} />
        <Route path="/dashboard/partner-links"        element={<RequireAuth><DashPartnerLinks /></RequireAuth>} />
        <Route path="/dashboard/health-tracker"       element={<RequireAuth><DashHealthTracker /></RequireAuth>} />
        <Route path="/dashboard/habit-tracker"        element={<RequireAuth><DashHabitTracker /></RequireAuth>} />
        <Route path="/admin/stock-alerts"             element={<RequireAuth role="admin"><AdminStockAlerts /></RequireAuth>} />
        <Route path="/admin/payment-gateways"         element={<RequireAuth role="admin"><AdminPaymentGateways /></RequireAuth>} />
        <Route path="/admin/customer-groups"          element={<RequireAuth role="admin"><AdminCustomerGroups /></RequireAuth>} />
        <Route path="/admin/quality-control"          element={<RequireAuth role="admin"><AdminQualityControl /></RequireAuth>} />
        <Route path="/dashboard/price-alerts"         element={<RequireAuth><DashPriceAlerts /></RequireAuth>} />
        <Route path="/dashboard/team-chat"            element={<RequireAuth><DashTeamChat /></RequireAuth>} />
        <Route path="/dashboard/wallet-history"       element={<RequireAuth><DashWalletHistory /></RequireAuth>} />
        <Route path="/dashboard/two-factor"           element={<RequireAuth><DashTwoFactor /></RequireAuth>} />
        <Route path="/admin/supplier-orders"          element={<RequireAuth role="admin"><AdminSupplierOrders /></RequireAuth>} />
        <Route path="/admin/automation-rules"         element={<RequireAuth role="admin"><AdminAutomationRules /></RequireAuth>} />
        <Route path="/admin/data-exports"             element={<RequireAuth role="admin"><AdminDataExports /></RequireAuth>} />
        <Route path="/admin/chat-support"             element={<RequireAuth role="admin"><AdminChatSupport /></RequireAuth>} />
        <Route path="/dashboard/learning-path"        element={<RequireAuth><DashLearningPath /></RequireAuth>} />
        <Route path="/dashboard/team-performance"     element={<RequireAuth><DashTeamPerformance /></RequireAuth>} />
        <Route path="/dashboard/product-comparison"   element={<RequireAuth><DashProductComparison /></RequireAuth>} />
        <Route path="/dashboard/event-calendar"       element={<RequireAuth><DashEventCalendar /></RequireAuth>} />
        <Route path="/admin/geo-blocking"             element={<RequireAuth role="admin"><AdminGeoBlocking /></RequireAuth>} />
        <Route path="/admin/product-labels"           element={<RequireAuth role="admin"><AdminProductLabels /></RequireAuth>} />
        <Route path="/admin/sales-scripts"            element={<RequireAuth role="admin"><AdminSalesScripts /></RequireAuth>} />
        <Route path="/admin/marketplace"              element={<RequireAuth role="admin"><AdminMemberMarketplace /></RequireAuth>} />
        <Route path="/dashboard/quick-order"          element={<RequireAuth><DashQuickOrder /></RequireAuth>} />
        <Route path="/dashboard/meeting-scheduler"    element={<RequireAuth><DashMeetingScheduler /></RequireAuth>} />
        <Route path="/dashboard/knowledge-base"       element={<RequireAuth><DashKnowledgeBase /></RequireAuth>} />
        <Route path="/dashboard/samples"              element={<RequireAuth><DashProductSamples /></RequireAuth>} />
        <Route path="/admin/credit-notes"             element={<RequireAuth role="admin"><AdminCreditNotes /></RequireAuth>} />
        <Route path="/admin/recruitment-pipeline"     element={<RequireAuth role="admin"><AdminRecruitmentPipeline /></RequireAuth>} />
        <Route path="/admin/email-deliverability"     element={<RequireAuth role="admin"><AdminEmailDeliverability /></RequireAuth>} />
        <Route path="/admin/affiliate-network"        element={<RequireAuth role="admin"><AdminAffiliateNetwork /></RequireAuth>} />
        <Route path="/dashboard/credit-notes"         element={<RequireAuth><DashCreditNotes /></RequireAuth>} />
        <Route path="/dashboard/autoship-history"     element={<RequireAuth><DashAutoshipHistory /></RequireAuth>} />
        <Route path="/dashboard/recruitment-pipeline" element={<RequireAuth><DashRecruitmentPipeline /></RequireAuth>} />
        <Route path="/dashboard/smart-goals"          element={<RequireAuth><DashSmartGoals /></RequireAuth>} />
        <Route path="/admin/bulk-messaging"          element={<RequireAuth role="admin"><AdminBulkMessaging /></RequireAuth>} />
        <Route path="/admin/network-health"          element={<RequireAuth role="admin"><AdminNetworkHealth /></RequireAuth>} />
        <Route path="/admin/reward-programs"         element={<RequireAuth role="admin"><AdminRewardPrograms /></RequireAuth>} />
        <Route path="/admin/pending-approvals"       element={<RequireAuth role="admin"><AdminPendingApprovals /></RequireAuth>} />
        <Route path="/dashboard/my-promotions"       element={<RequireAuth><DashMyPromotions /></RequireAuth>} />
        <Route path="/dashboard/training-planner"    element={<RequireAuth><DashTrainingPlanner /></RequireAuth>} />
        <Route path="/dashboard/my-tokens"           element={<RequireAuth><DashMyTokens /></RequireAuth>} />
        <Route path="/dashboard/team-leaderboard"    element={<RequireAuth><DashTeamLeaderboard /></RequireAuth>} />
        <Route path="/admin/chargebacks"             element={<RequireAuth role="admin"><AdminChargebacks /></RequireAuth>} />
        <Route path="/admin/product-performance"     element={<RequireAuth role="admin"><AdminProductPerformance /></RequireAuth>} />
        <Route path="/admin/subscription-billing"    element={<RequireAuth role="admin"><AdminSubscriptionBilling /></RequireAuth>} />
        <Route path="/admin/inventory-forecasting"   element={<RequireAuth role="admin"><AdminInventoryForecasting /></RequireAuth>} />
        <Route path="/dashboard/consultations"       element={<RequireAuth><DashConsultations /></RequireAuth>} />
        <Route path="/dashboard/purchase-planner"    element={<RequireAuth><DashPurchasePlanner /></RequireAuth>} />
        <Route path="/dashboard/journal"             element={<RequireAuth><DashJournal /></RequireAuth>} />
        <Route path="/dashboard/referral-contest"    element={<RequireAuth><DashReferralContest /></RequireAuth>} />
        <Route path="/admin/back-orders"             element={<RequireAuth role="admin"><AdminBackOrders /></RequireAuth>} />
        <Route path="/admin/upsell-rules"            element={<RequireAuth role="admin"><AdminUpsellRules /></RequireAuth>} />
        <Route path="/admin/reward-catalog"          element={<RequireAuth role="admin"><AdminRewardCatalog /></RequireAuth>} />
        <Route path="/admin/retention-offers"        element={<RequireAuth role="admin"><AdminRetentionOffers /></RequireAuth>} />
        <Route path="/dashboard/body-measurements"   element={<RequireAuth><DashBodyMeasurements /></RequireAuth>} />
        <Route path="/dashboard/supplement-stack"    element={<RequireAuth><DashSupplementStack /></RequireAuth>} />
        <Route path="/dashboard/progress-photos"     element={<RequireAuth><DashProgressPhotos /></RequireAuth>} />
        <Route path="/dashboard/goal-buddy"          element={<RequireAuth><DashGoalBuddy /></RequireAuth>} />
        <Route path="/admin/order-routing"           element={<RequireAuth role="admin"><AdminOrderRouting /></RequireAuth>} />
        <Route path="/admin/bundle-builder"          element={<RequireAuth role="admin"><AdminBundleBuilder /></RequireAuth>} />
        <Route path="/admin/referral-campaigns"      element={<RequireAuth role="admin"><AdminReferralCampaigns /></RequireAuth>} />
        <Route path="/admin/network-snapshot"        element={<RequireAuth role="admin"><AdminNetworkSnapshot /></RequireAuth>} />
        <Route path="/dashboard/kit-builder"         element={<RequireAuth><DashKitBuilder /></RequireAuth>} />
        <Route path="/dashboard/win-log"             element={<RequireAuth><DashWinLog /></RequireAuth>} />
        <Route path="/dashboard/ai-insights"         element={<RequireAuth><DashAiInsights /></RequireAuth>} />
        <Route path="/dashboard/content-planner"     element={<RequireAuth><DashContentPlanner /></RequireAuth>} />
        <Route path="/admin/localization"            element={<RequireAuth role="admin"><AdminLocalization /></RequireAuth>} />
        <Route path="/admin/onboarding-flows"        element={<RequireAuth role="admin"><AdminOnboardingFlows /></RequireAuth>} />
        <Route path="/admin/member-tags"             element={<RequireAuth role="admin"><AdminMemberTags /></RequireAuth>} />
        <Route path="/admin/smart-notifications"     element={<RequireAuth role="admin"><AdminSmartNotifications /></RequireAuth>} />
        <Route path="/dashboard/income-forecast"     element={<RequireAuth><DashIncomeForecast /></RequireAuth>} />
        <Route path="/dashboard/savings-tracker"     element={<RequireAuth><DashSavingsTracker /></RequireAuth>} />
        <Route path="/dashboard/team-activities"     element={<RequireAuth><DashTeamActivities /></RequireAuth>} />
        <Route path="/dashboard/product-feedback"    element={<RequireAuth><DashProductFeedback /></RequireAuth>} />
        <Route path="/admin/tax-rules"               element={<RequireAuth role="admin"><AdminTaxRules /></RequireAuth>} />
        <Route path="/admin/log-viewer"              element={<RequireAuth role="admin"><AdminLogViewer /></RequireAuth>} />
        <Route path="/admin/attribution"             element={<RequireAuth role="admin"><AdminAttribution /></RequireAuth>} />
        <Route path="/admin/customer-satisfaction"   element={<RequireAuth role="admin"><AdminCustomerSatisfaction /></RequireAuth>} />
        <Route path="/dashboard/protocol-builder"    element={<RequireAuth><DashProtocolBuilder /></RequireAuth>} />
        <Route path="/dashboard/network-map"         element={<RequireAuth><DashNetworkMap /></RequireAuth>} />
        <Route path="/dashboard/agreements"          element={<RequireAuth><DashAgreements /></RequireAuth>} />
        <Route path="/dashboard/loyalty-tiers"       element={<RequireAuth><DashLoyaltyTiers /></RequireAuth>} />
        <Route path="/admin/email-sequences"         element={<RequireAuth role="admin"><AdminEmailSequences /></RequireAuth>} />
        <Route path="/admin/commission-tiers"        element={<RequireAuth role="admin"><AdminCommissionTiers /></RequireAuth>} />
        <Route path="/admin/product-reviews"         element={<RequireAuth role="admin"><AdminProductReviews /></RequireAuth>} />
        <Route path="/admin/member-journey"          element={<RequireAuth role="admin"><AdminMemberJourney /></RequireAuth>} />
        <Route path="/dashboard/reading-list"        element={<RequireAuth><DashReadingList /></RequireAuth>} />
        <Route path="/dashboard/community-feed"      element={<RequireAuth><DashCommunityFeed /></RequireAuth>} />
        <Route path="/dashboard/mentorship"          element={<RequireAuth><DashMentorship /></RequireAuth>} />
        <Route path="/dashboard/live-events"         element={<RequireAuth><DashLiveEvents /></RequireAuth>} />
        <Route path="/admin/call-center"             element={<RequireAuth role="admin"><AdminCallCenter /></RequireAuth>} />
        <Route path="/admin/price-history"           element={<RequireAuth role="admin"><AdminPriceHistory /></RequireAuth>} />
        <Route path="/admin/mobile-app"              element={<RequireAuth role="admin"><AdminMobileApp /></RequireAuth>} />
        <Route path="/admin/compliance-watchlist"    element={<RequireAuth role="admin"><AdminComplianceWatchlist /></RequireAuth>} />
        <Route path="/dashboard/wellness-goals"      element={<RequireAuth><DashWellnessGoals /></RequireAuth>} />
        <Route path="/dashboard/order-tracking"      element={<RequireAuth><DashOrderTracking /></RequireAuth>} />
        <Route path="/dashboard/subscription-upgrade" element={<RequireAuth><DashSubscriptionUpgrade /></RequireAuth>} />
        <Route path="/dashboard/nutrition-log"       element={<RequireAuth><DashNutritionLog /></RequireAuth>} />
        <Route path="/admin/smart-pricing"           element={<RequireAuth role="admin"><AdminSmartPricing /></RequireAuth>} />
        <Route path="/admin/member-feedback"         element={<RequireAuth role="admin"><AdminMemberFeedback /></RequireAuth>} />
        <Route path="/admin/fulfillment-centers"     element={<RequireAuth role="admin"><AdminFulfillmentCenters /></RequireAuth>} />
        <Route path="/admin/gamification"            element={<RequireAuth role="admin"><AdminGamification /></RequireAuth>} />
        <Route path="/dashboard/sleep-tracker"       element={<RequireAuth><DashSleepTracker /></RequireAuth>} />
        <Route path="/dashboard/challenges-history"  element={<RequireAuth><DashChallengesHistory /></RequireAuth>} />
        <Route path="/dashboard/invoice-history"     element={<RequireAuth><DashInvoiceHistory /></RequireAuth>} />
        <Route path="/dashboard/team-map"            element={<RequireAuth><DashTeamMap /></RequireAuth>} />

        <Route path="/unsubscribe" element={<Unsubscribe />} />

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
