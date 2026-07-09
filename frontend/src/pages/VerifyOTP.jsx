import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { API_BASE_URL } from '../utils/api'
import '../styles/auth.css'
import '../styles/logoAnimations.css'

export default function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const [otpCode, setOtpCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSuccessCard, setShowSuccessCard] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) 
  const [canResend, setCanResend] = useState(false)
  const { completeLoginWithToken } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
  
    if (location.state?.email) {
      setEmail(location.state.email)
    } else {
      navigate('/forgot')
    }
  }, [location.state, navigate])

  useEffect(() => {
  
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')  
    setSuccess('')
    
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    try {
     
      const endpoint = location.state?.purpose === 'signup' ? '/auth/verify-email' : '/auth/verify-otp'
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to verify OTP code')

      if (location.state?.purpose === 'signup') {
        showToast('Email verified! Signing you in...', 'success')
      
        if (data.token) {
          const done = await completeLoginWithToken(data.token)
          if (done.success) {
            setTimeout(() => navigate('/dashboard', { replace: true }), 2000)
            return
          }
        }
       
        setTimeout(() => navigate('/login'), 2500)
        return
      }

      
      showToast('OTP verified successfully! Redirecting to reset password...', 'success')
      setTimeout(() => {
        navigate('/reset-password', { 
          state: { 
            email, 
            resetToken: data.resetToken,
            expiresIn: data.expiresIn 
          } 
        })
      }, 2000)
    } catch (err) {
      setError(err.message)
     
    } finally {
      setLoading(false)
    }
  }

  async function resendOTP() {
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data?.error || 'Failed to resend OTP code')
      
      setSuccess('New OTP code has been sent to your email.')
      showToast('New OTP code has been sent to your email.', 'success')
      setTimeLeft(600)
      setCanResend(false)
      setOtpCode('')
    } catch (err) {
      setError(err.message)
      
    } finally {
      setLoading(false)
    }
  }
  if (!email) {
    return null
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-layout">
          <div className="auth-left">
            <div className="mobile-back-row">
              <Link to="/forgot" className="btn btn-ghost back-link" aria-label="Back to forgot password">
                &larr; Back
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
              <h1 className="auth-title">Enter verification code</h1>
              <p className="auth-subtitle">
                We've sent a 6-digit code to <strong>{email}</strong>
              </p>
              
              {error && (
                <div className="auth-error" role="alert">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              )}
              
              <form onSubmit={onSubmit} className="auth-form" noValidate>
                <div className="form-field">
                  <label htmlFor="otpCode" className="form-label">
                    <i className="fa-solid fa-key" aria-hidden="true"></i> Verification code
                  </label>
                  <input 
                    id="otpCode" 
                    type="text" 
                    className="form-input otp-input" 
                    value={otpCode} 
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength="6"
                    required 
                    style={{ 
                      textAlign: 'center', 
                      fontSize: '24px', 
                      letterSpacing: '8px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
                
                <div className="otp-info">
                  <p className="text-sm text-gray-600">
                    Code expires in: <strong>{formatTime(timeLeft)}</strong>
                  </p>
                  {canResend ? (
                    <button 
                      type="button" 
                      onClick={resendOTP}
                      className="btn btn-link text-sm"
                      disabled={loading}
                    >
                      Resend code
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Can resend in: <strong>{formatTime(timeLeft)}</strong>
                    </p>
                  )}
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-large" 
                    disabled={loading || otpCode.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify code'}
                  </button>
                  <Link to="/login" className="btn btn-ghost btn-large">
                 &larr;   Back to sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>
          
          <div className="auth-right">
            <div className="auth-illustration">
              <div className="back-row">
                <Link to="/forgot" className="btn btn-ghost back-link" aria-label="Back to forgot password">
                   &larr;  Back
                </Link>
              </div>
              <img 
                src="/images/Enter OTP.svg" 
                alt="Professionals collaborating in a modern office" 
                className="auth-image" 
              />
              <div className="illustration-card">6-Digit Code</div>
              <div className="illustration-card delay">Email Verification</div>
              <div className="illustration-card delay-2">Secure Reset</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
