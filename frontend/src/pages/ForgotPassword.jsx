import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import { API_BASE_URL } from '../utils/api'
import '../styles/auth.css'
import '../styles/logoAnimations.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
 
    if (location.state?.error) {
      setError(location.state.error)
     
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, navigate, location.pathname])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      
    
      console.log('Send OTP response:', data)
      
      if (!res.ok) throw new Error(data?.error || 'Failed to send OTP code')
      
      setSuccess('OTP code has been sent to your email. Please check your inbox.')
      showToast('OTP code has been sent to your email. Please check your inbox.', 'success')
      
      
      setTimeout(() => {
        navigate('/verify-otp', { state: { email } })
      }, 2000)
    } catch (err) {
      setError(err.message)
    
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-layout">
          <div className="auth-left">
            <div className="mobile-back-row">
              <Link to="/login" className="btn btn-ghost back-link" aria-label="Back to login">
                &larr; Back to login
              </Link>
            </div>
            <div className="auth-brand">
              <div className="logo">
                <img src="/images/CM.png" alt="CareerMap Logo" className="logo-combined" />
                <div className="logo-brand-group">
                  <span className="logo-text">CareerMap</span>
                  <span className="logo-tagline">Find Your Way. Own Your Future.</span>
                </div>
              </div>
            </div>
            
            <div className="auth-card">
              <h1 className="auth-title reveal">Forgot your password?</h1>
              <p className="auth-subtitle reveal stagger-1">
                Enter your email address and we'll send you a 6-digit verification code to reset your password.
              </p>
              
              {error && (
                <div className="auth-error" role="alert">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              )}
              
              <form onSubmit={onSubmit} className="auth-form" noValidate>
                <div className="form-field">
                  <label htmlFor="email" className="form-label">
                    <i className="fa-solid fa-envelope" aria-hidden="true"></i> Email address
                  </label>
                  <input 
                    id="email" 
                    type="email" 
                    className="form-input" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter your email address"
                    required 
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-large reveal stagger-2" 
                    disabled={loading || !email}
                  >
                    {loading ? 'Sending...' : 'Send verification code'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="auth-right">
            <div className="auth-illustration">
              <div className="back-row">
                <Link to="/login" className="btn btn-ghost back-link" aria-label="Back to login">
                   &larr; Back to home 
                </Link>
              </div>
              <img 
                src="images/Forgotpassword.svg" 
                alt="Professionals collaborating in a modern office" 
                className="auth-image" 
              />
              <div className="illustration-card">Secure Reset</div>
              <div className="illustration-card delay">Email Verification</div>
              <div className="illustration-card delay-2">Account Recovery</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}