import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const result = await login(email, password)
    
    if (result.success) {
      // Redirect to intended page or dashboard
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
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
            <div className="auth-brand">
              <div className="logo">CareerMap</div>
            </div>
            <div className="back-row"><Link to="/" className="btn btn-ghost back-link" aria-label="Back to home">← Back to home</Link></div>
            <div className="auth-card">
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to your CareerMap account</p>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <form onSubmit={onSubmit} className="auth-form" noValidate>
                <div className="form-field">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input id="email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input id="password" type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-meta">
                  <label className="checkbox">
                    <input type="checkbox" />
                    <span>Remember me for 30 days</span>
                  </label>
                  <Link to="/forgot" className="link">Forgot password</Link>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary btn-large" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
                  <Link to="/signup" className="btn btn-ghost btn-large">Create account</Link>
                </div>
              </form>
            </div>
          </div>
          <div className="auth-right" aria-hidden>
            <div className="auth-illustration">
              <img src="https://images.pexels.com/photos/7698912/pexels-photo-7698912.jpeg" alt="Professionals collaborating in a modern office" className="auth-image" />
              <div className="illustration-badge">✔</div>
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
