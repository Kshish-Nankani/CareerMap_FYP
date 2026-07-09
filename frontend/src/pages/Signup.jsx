import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import '../styles/auth.css'
import '../styles/logoAnimations.css'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    
    // Validate inputs
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    
    const result = await signup(name, email, password)
    
    if (result.success && result.needsVerification) {
      
      showToast('Account created — please verify your email', 'success')
      navigate('/verify-otp', { state: { email, purpose: 'signup' } })
    } else if (result.success) {
    
      showToast('Account created successfully', 'success')
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.error)
      
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-page">
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
              <h1 className="auth-title">Create your account</h1>
              <p className="auth-subtitle">Join CareerMap and start your journey</p>
              
              {error && (
                <div className="auth-error" role="alert">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              )}
              
              <form onSubmit={onSubmit} className="auth-form" noValidate>
                <div className="form-field">
                  <label htmlFor="name" className="form-label">
                    <i className="fa-solid fa-user" aria-hidden="true"></i> Name
                  </label>
                  <input id="name" type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-field">
                  <label htmlFor="email" className="form-label">
                    <i className="fa-solid fa-envelope" aria-hidden="true"></i> Email
                  </label>
                  <input id="email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label htmlFor="password" className="form-label">
                    <i className="fa-solid fa-lock" aria-hidden="true"></i> Password
                  </label>
                  <input id="password" type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary btn-large" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
                  <Link to="/login" className="btn btn-ghost btn-large">Sign in</Link>
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
              <img src="/images/Sign up.svg" alt="Signup illustration" className="auth-image" />
              <div className="illustration-card">Learn & Grow</div>
              <div className="illustration-card delay">Connect & Mentor</div>
              <div className="illustration-card delay-2">Find Opportunities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
