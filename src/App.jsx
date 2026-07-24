import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Suspense, lazy } from 'react'

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
const DashEarnings = lazy(() => import('./pages/dashboard/Earnings'))

const AdminOverview = lazy(() => import('./pages/admin/Overview'))
const AdminMembers = lazy(() => import('./pages/admin/Members'))
const AdminRuns    = lazy(() => import('./pages/admin/CommissionRuns'))
const AdminPayouts = lazy(() => import('./pages/admin/Payouts'))
const AdminReports = lazy(() => import('./pages/admin/Reports'))
const AdminPlan    = lazy(() => import('./pages/admin/PlanConfig'))
const AdminSettings= lazy(() => import('./pages/admin/Settings'))
const Checkout     = lazy(() => import('./pages/Checkout'))
const NotFound     = lazy(() => import('./pages/NotFound'))

function RequireAuth({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

const Loading = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text2)' }}>
    Loading…
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/"        element={<Landing />} />
        <Route path="/shop"    element={<Shop />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/join"    element={<Join />} />
        <Route path="/checkout" element={<Checkout />} />

        <Route path="/dashboard" element={<RequireAuth><DashHome /></RequireAuth>} />
        <Route path="/dashboard/tree"        element={<RequireAuth><DashTree /></RequireAuth>} />
        <Route path="/dashboard/commissions" element={<RequireAuth><DashComm /></RequireAuth>} />
        <Route path="/dashboard/wallet"      element={<RequireAuth><DashWallet /></RequireAuth>} />
        <Route path="/dashboard/referral"    element={<RequireAuth><DashRef /></RequireAuth>} />
        <Route path="/dashboard/orders"      element={<RequireAuth><DashOrders /></RequireAuth>} />
        <Route path="/dashboard/profile"   element={<RequireAuth><DashProfile /></RequireAuth>} />
        <Route path="/dashboard/earnings" element={<RequireAuth><DashEarnings /></RequireAuth>} />

        <Route path="/admin/overview" element={<RequireAuth role="admin"><AdminOverview /></RequireAuth>} />
        <Route path="/admin"          element={<RequireAuth role="admin"><AdminMembers /></RequireAuth>} />
        <Route path="/admin/runs"     element={<RequireAuth role="admin"><AdminRuns /></RequireAuth>} />
        <Route path="/admin/payouts"  element={<RequireAuth role="admin"><AdminPayouts /></RequireAuth>} />
        <Route path="/admin/reports"  element={<RequireAuth role="admin"><AdminReports /></RequireAuth>} />
        <Route path="/admin/plan"     element={<RequireAuth role="admin"><AdminPlan /></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth role="admin"><AdminSettings /></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
