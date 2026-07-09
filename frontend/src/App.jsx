import { Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { CartProvider } from './contexts/CartContext'
import ProtectedRoute from './components/ProtectedRoute'
import GuestHome from './pages/GuestHome'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import Assessment from './pages/Assessment'
import Universities from './pages/Universities'
import Mentorship from './pages/Mentorship'
import Marketplace from './pages/Marketplace'
import SellItem from './pages/SellItem'
import EditItem from './pages/EditItem'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOTP from './pages/VerifyOTP'
import ResetPassword from './pages/ResetPassword'
import PaymentCallback from './pages/PaymentCallback'


export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

function AppRoutes() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
     
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/assessment" element={
        <ProtectedRoute>
          <Assessment />
        </ProtectedRoute>
      } />
      <Route path="/universities" element={
        <ProtectedRoute>
          <Universities />
        </ProtectedRoute>
      } />
      <Route path="/mentorship" element={
        <ProtectedRoute>
          <Mentorship />
        </ProtectedRoute>
      } />
      <Route path="/marketplace" element={
        <ProtectedRoute>
          <Marketplace />
        </ProtectedRoute>
      } />
      <Route path="/marketplace/sell" element={
        <ProtectedRoute>
          <SellItem />
        </ProtectedRoute>
      } />
      <Route path="/marketplace/edit/:id" element={
        <ProtectedRoute>
          <EditItem />
        </ProtectedRoute>
      } />
      <Route path="/marketplace/cart" element={
        <ProtectedRoute>
          <Cart />
        </ProtectedRoute>
      } />
      <Route path="/marketplace/:productId" element={
        <ProtectedRoute>
          <ProductDetail />
        </ProtectedRoute>
      } />

 
      <Route path="/" element={<GuestHome />} />
      <Route path="/payment/callback" element={<PaymentCallback />} />
      
    
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function NotFound() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Page not found</h1>
      <p>
        <Link to="/">Go back home</Link>
      </p>
    </div>
  )
}
