import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import { API_BASE_URL } from '../utils/api'
import '../styles/auth.css'
import '../styles/logoAnimations.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const { showToast } = useToast()

  useEffect(() => {
    if (location.state?.email && location.state?.resetToken) {
      setEmail(location.state.email)
      setResetToken(location.state.resetToken)
      setTimeLeft(location.state.expiresIn || 1800) 
    } else {
      navigate('/forgot')
    }
  }, [location.state, navigate])

  useEffect(() => {
   
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            navigate('/forgot', { 
              state: { 
                error: 'Reset session expired. Please request a new verification code.' 
              } 
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeLeft, navigate])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')


    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, password })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data?.error || 'Failed to reset password')
      
      showToast('Password reset successful! Please sign in with your new password.', 'success')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message)
    
    } finally {
      setLoading(false)
    }
  }

  
  if (!resetToken || !email) {
    return null
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
              <h1 className="auth-title">Reset your password</h1>
              <p className="auth-subtitle">
                Enter your new password below to complete the reset process.
              </p>
              
              {error && (
                <div className="auth-error" role="alert">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              )}
              
              <form onSubmit={onSubmit} className="auth-form" noValidate>
                <div className="form-field">
                  <label htmlFor="password" className="form-label">
                    <i className="fa-solid fa-lock" aria-hidden="true"></i> New password
                  </label>
                  <input 
                    id="password" 
                    type="password" 
                    className="form-input" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Enter your new password"
                    required 
                    minLength="6"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="confirmPassword" className="form-label">
                    <i className="fa-solid fa-lock" aria-hidden="true"></i> Confirm new password
                  </label>
                  <input 
                    id="confirmPassword" 
                    type="password" 
                    className="form-input" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm your new password"
                    required 
                    minLength="6"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-large" 
                    disabled={loading || !password || !confirmPassword}
                  >
                    {loading ? 'Resetting...' : 'Reset password'}
                  </button>
                  <Link to="/login" className="btn btn-ghost btn-large">
                    Back to sign in
                  </Link>
                </div>
              </form>

              <div className="auth-meta">
                <p className="text-sm text-gray-600">
                  Resetting password for: <strong>{email}</strong>
                </p>
                {timeLeft > 0 && (
                  <p className="text-sm text-gray-500">
                    Session expires in: <strong>{formatTime(timeLeft)}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="auth-right">
            <div className="auth-illustration">
              <div className="back-row">
                <Link to="/login" className="btn btn-ghost back-link" aria-label="Back to login">
                  ← Back to login
                </Link>
              </div>
              <img 
                src="/images/Reset .svg" 
                alt="Professionals collaborating in a modern office" 
                className="auth-image" 
              />
              <div className="illustration-card">New Password</div>
              <div className="illustration-card delay">Secure Account</div>
              <div className="illustration-card delay-2">Ready to Go</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}