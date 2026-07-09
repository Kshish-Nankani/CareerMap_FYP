import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'

export default function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  const errCode = searchParams.get('err_code') || searchParams.get('ERR_CODE') || ''
  const errMsg = searchParams.get('err_msg') || searchParams.get('ERR_MSG') || ''
  const transactionId = searchParams.get('transaction_id') || searchParams.get('TRANSACTION_ID') || ''
  const basketId = searchParams.get('basket_id') || searchParams.get('BASKET_ID') || ''
  const validationHash = searchParams.get('validation_hash') || searchParams.get('VALIDATION_HASH') || ''

  // PayFast uses err_code "000" for success
  const isSuccess = errCode === '000' || errCode === '00'

  useEffect(() => {
    // Call backend webhook to confirm payment if running locally or as a fallback
    const confirmPayment = async () => {
      try {
        if (basketId && errCode) {
          const webhookUrl = `${API_BASE_URL}/orders/payfast/webhook?basket_id=${basketId}&err_code=${errCode}&validation_hash=${validationHash}&transaction_id=${transactionId}`
          console.log('PaymentCallback: triggering fallback webhook confirmation at:', webhookUrl)
          const res = await fetch(webhookUrl)
          const data = await res.json()
          console.log('PaymentCallback: webhook response:', data)
        }
      } catch (err) {
        console.error('PaymentCallback: error triggering fallback webhook confirmation:', err)
      }
    }

    confirmPayment()

    // Countdown then redirect to dashboard/mentorship
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/dashboard')
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate, basketId, errCode, validationHash, transactionId])

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Icon */}
        <div style={{ ...styles.iconCircle, background: isSuccess ? '#e6f9f0' : '#fdecea' }}>
          {isSuccess ? (
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="#22c55e" fillOpacity="0.15" />
              <path d="M20 33l8 8 16-16" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="#ef4444" fillOpacity="0.15" />
              <path d="M22 22l20 20M42 22L22 42" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h1 style={{ ...styles.title, color: isSuccess ? '#15803d' : '#b91c1c' }}>
          {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
        </h1>

        {/* Message */}
        <p style={styles.message}>
          {isSuccess
            ? 'Your payment has been processed successfully. Your subscription application is now under review. You will be notified via email once it is approved.'
            : `Your payment could not be completed. ${errMsg ? `Reason: ${decodeURIComponent(errMsg)}.` : ''} Please try again or contact support.`}
        </p>

        {/* Transaction ID */}
        {transactionId && (
          <div style={styles.txnBox}>
            <span style={styles.txnLabel}>Transaction ID:</span>
            <span style={styles.txnId}>{transactionId}</span>
          </div>
        )}

        {/* Error detail */}
        {!isSuccess && errMsg && (
          <div style={styles.errorBox}>
            <span style={styles.errorLabel}>Details: </span>
            {decodeURIComponent(errMsg)}
          </div>
        )}

        {/* Redirect countdown */}
        <p style={styles.redirectNote}>
          Redirecting to dashboard in <strong>{countdown}</strong> second{countdown !== 1 ? 's' : ''}…
        </p>

        {/* Manual buttons */}
        <div style={styles.buttonRow}>
          <button style={styles.primaryBtn} onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
          {!isSuccess && (
            <button style={styles.secondaryBtn} onClick={() => navigate(-2)}>
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
    padding: '24px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  card: {
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  iconCircle: {
    borderRadius: '50%',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '1.9rem',
    fontWeight: '700',
    margin: 0,
    lineHeight: 1.2,
  },
  message: {
    fontSize: '1rem',
    color: '#4b5563',
    lineHeight: 1.65,
    margin: '0 0 8px 0',
  },
  txnBox: {
    background: '#f3f4f6',
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '0.88rem',
    color: '#374151',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
    boxSizing: 'border-box',
  },
  txnLabel: {
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    fontSize: '0.72rem',
    letterSpacing: '0.05em',
  },
  txnId: {
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    wordBreak: 'break-all',
    color: '#1f2937',
  },
  errorBox: {
    background: '#fff1f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '0.88rem',
    color: '#991b1b',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  errorLabel: {
    fontWeight: '700',
  },
  redirectNote: {
    fontSize: '0.88rem',
    color: '#9ca3af',
    margin: '4px 0',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 28px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  secondaryBtn: {
    background: 'transparent',
    color: '#6366f1',
    border: '2px solid #6366f1',
    borderRadius: '10px',
    padding: '12px 28px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
}
