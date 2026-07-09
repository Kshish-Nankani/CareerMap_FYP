import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import '../styles/auth.css'
import '../styles/logoAnimations.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showSuccessCard, setShowSuccessCard] = useState(false)

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, 'success')
      navigate(location.pathname, { replace: true })
    }
    
    if (location.state?.error) {
      setError(location.state.error)
      showToast(location.state.error, 'error')
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, navigate, location.pathname, showToast])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const result = await login(email, password)
    
    if (result.success) {
     
      setShowSuccessCard(true)
      
      
      setTimeout(() => {
        const from = location.state?.from?.pathname || location.state?.from || '/dashboard'
        navigate(from, { replace: true })
      }, 1500)
    } else {
      setError(result.error)
      
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-page">
   
      {showSuccessCard && (
        <div className="success-card-overlay">
          <div className="success-card">
            <div className="success-icon">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h2 className="success-title">Signed in successfully!</h2>
            <div className="success-redirect-message">
              <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--brand)' }}></i>
              <span>Redirecting to your dashboard...</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="container">
        <div className="auth-layout">
          <div className="auth-left">
            <div className="mobile-back-row">
              <Link to="/" className="btn btn-ghost back-link" aria-label="Back to home">
                &larr; Back to home
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
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to your CareerMap account</p>
              
              {error && (
                <div className="auth-error" role="alert">
                  <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
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
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="password" className="form-label">
                    <i className="fa-solid fa-lock" aria-hidden="true"></i> Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-meta">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me for 30 days</span>
                  </label>
                  <Link to="/forgot" className="link">Forgot password</Link>
                </div>
                
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-large"
                    disabled={loading}
                  >
              
                    {' '}{loading ? 'Signing in...' : 'Sign in'}
                  </button>
                  <Link to="/signup" className="btn btn-ghost btn-large">
                
                    {' '}Create account
                  </Link>
                </div>
              </form>
            </div>
          </div>
          
          <div className="auth-right">
            <div className="auth-illustration">
              <div className="back-row">
              <Link to="/" className="btn btn-ghost back-link" aria-label="Back to home">
                &larr; Back to home
              </Link>
            </div>
              <img 
                src="/images/login.svg" 
                alt="Login illustration" 
                className="auth-image"
              />
              <div className="illustration-card">Career Guidance</div>
              <div className="illustration-card delay">Mentorship</div>
              <div className="illustration-card delay-2">Opportunities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

