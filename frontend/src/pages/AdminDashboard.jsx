import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { fetchWithErrorHandling } from '../utils/api'
import { getAuthToken } from '../utils/authStorage'
import ConfirmModal from '../components/ConfirmModal'
import '../styles/AdminDashboard.css'
import '../styles/logoAnimations.css'

const trimString = (value) => (typeof value === 'string' ? value.trim() : '')

const isImageFile = (value = '') =>
  /^data:image\//i.test(value) || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(value)

const isVideoFile = (value = '') =>
  /^data:video\//i.test(value) || /\.(mp4|webm|ogg|mov|avi|mkv)(\?|#|$)/i.test(value)

const isPdfFile = (value = '') =>
  /^data:application\/pdf/i.test(value) || /\.pdf(\?|#|$)/i.test(value)

const normalizeDocumentUrl = (value = '') => {
  const raw = trimString(value)
  if (!raw) return ''

  if (/^data:/i.test(raw)) {
    return raw
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw
  }

  if (/^www\./i.test(raw)) {
    return `https://${raw}`
  }

  // Handle raw base64 payloads (legacy records) by coercing into a data URL.
  const compact = raw.replace(/\s+/g, '')
  const looksLikeBase64 = /^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 120
  if (looksLikeBase64) {
    if (compact.startsWith('JVBERi0')) {
      return `data:application/pdf;base64,${compact}`
    }
    if (compact.startsWith('/9j/')) {
      return `data:image/jpeg;base64,${compact}`
    }
    if (compact.startsWith('iVBORw0KGgo')) {
      return `data:image/png;base64,${compact}`
    }
    return `data:application/octet-stream;base64,${compact}`
  }

  return ''
}

const buildTutorDocumentItems = (application) => {
  const items = []
  const cnicDocument = normalizeDocumentUrl(application?.cnicDocument)
  const resumeDocument = normalizeDocumentUrl(application?.resumeDocument)
  const certificateDocuments = Array.isArray(application?.certificateDocuments)
    ? application.certificateDocuments
    : []

  if (cnicDocument) {
    items.push({
      id: `cnic-${application?._id || 'na'}`,
      label: 'CNIC Document',
      url: cnicDocument
    })
  }

  if (resumeDocument) {
    items.push({
      id: `resume-${application?._id || 'na'}`,
      label: 'Resume / CV',
      url: resumeDocument
    })
  }

  certificateDocuments.forEach((doc, index) => {
    const url = normalizeDocumentUrl(doc)
    if (!url) return
    items.push({
      id: `support-${application?._id || 'na'}-${index}`,
      label: `Supporting File ${index + 1}`,
      url
    })
  })

  return items
}

const getTutorShortDescription = (application) => {
  const source = trimString(application?.teachingExperience)
    || trimString(application?.specialization)
    || trimString(application?.certifications)
    || trimString(application?.achievements)
    || 'Tutor profile submitted for review.'

  const words = source.split(/\s+/).filter(Boolean)
  if (words.length <= 15) return source
  return `${words.slice(0, 15).join(' ')}...`
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAdminQuickMenu, setShowAdminQuickMenu] = useState(false)
  const [activeAdminView, setActiveAdminView] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarActive, setMobileSidebarActive] = useState(false)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create', 'edit', 'view'
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [showDeleteSubModal, setShowDeleteSubModal] = useState(false)
  const [subToDelete, setSubToDelete] = useState(null) // { id, type }
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    emailVerified: false,
    isAdmin: false
  })
  
  // Tutor Applications states
  const [tutorApplications, setTutorApplications] = useState([])
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [showTutorDetailsModal, setShowTutorDetailsModal] = useState(false)
  const [selectedTutorApplication, setSelectedTutorApplication] = useState(null)
  const [loadingTutorDetails, setLoadingTutorDetails] = useState(false)
  const [learningAgreements, setLearningAgreements] = useState([])
  const [loadingLearningAgreements, setLoadingLearningAgreements] = useState(false)

  // Seller Applications states
  const [sellerApplications, setSellerApplications] = useState([])
  const [loadingSellerApplications, setLoadingSellerApplications] = useState(false)
  const [showSellerDetailsModal, setShowSellerDetailsModal] = useState(false)
  const [selectedSellerApplication, setSelectedSellerApplication] = useState(null)
  const [loadingSellerDetails, setLoadingSellerDetails] = useState(false)

  
  const [hiddenTutorIds, setHiddenTutorIds] = useState(() => {
    try {
      const stored = localStorage.getItem('hiddenTutorIds')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [hiddenSellerIds, setHiddenSellerIds] = useState(() => {
    try {
      const stored = localStorage.getItem('hiddenSellerIds')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('hiddenTutorIds', JSON.stringify([...hiddenTutorIds]))
    } catch (e) {
      console.error('Error saving hiddenTutorIds:', e)
    }
  }, [hiddenTutorIds])

  useEffect(() => {
    try {
      localStorage.setItem('hiddenSellerIds', JSON.stringify([...hiddenSellerIds]))
    } catch (e) {
      console.error('Error saving hiddenSellerIds:', e)
    }
  }, [hiddenSellerIds])

  
  const CLEARABLE_STATUSES = ['expired', 'rejected', 'failed', 'cancelled', 'active', 'approved']
  
  // Sellers management states
  const [sellers, setSellers] = useState([])
  const [loadingSellers, setLoadingSellers] = useState(false)
  const [showSellerModal, setShowSellerModal] = useState(false)
  const [showDeleteSellerModal, setShowDeleteSellerModal] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [sellerToDelete, setSellerToDelete] = useState(null)
  const [sellerFormData, setSellerFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    gender: '',
    careerInterest: '',
    schoolUniversity: '',
    department: ''
  })

  const getDocumentFileName = (label = 'document', url = '') => {
    const safeLabel = trimString(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'document'
    if (isPdfFile(url)) return `${safeLabel}.pdf`
    if (isImageFile(url)) return `${safeLabel}.jpg`
    if (isVideoFile(url)) return `${safeLabel}.mp4`
    return `${safeLabel}.bin`
  }

  const downloadTutorDocument = async (url, label) => {
    const normalizedUrl = normalizeDocumentUrl(url)
    if (!normalizedUrl) {
      showToast('Invalid document URL', 'error')
      return
    }

    const fileName = getDocumentFileName(label, normalizedUrl)

    try {
      if (/^data:/i.test(normalizedUrl)) {
        const response = await fetch(normalizedUrl)
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = fileName
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        setTimeout(() => URL.revokeObjectURL(objectUrl), 2000)
      } else {
        const anchor = document.createElement('a')
        anchor.href = normalizedUrl
        anchor.download = fileName
        anchor.rel = 'noopener noreferrer'
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
      }
    } catch (error) {
      showToast('Unable to download document', 'error')
    }
  }

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/dashboard')
      return
    }
    loadDashboardData()
  }, [user, navigate, searchTerm])

 
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!cancelled) loadTutorApplications()
      if (!cancelled) loadSellerApplications()
      if (!cancelled) loadLearningAgreements()
    }
    run()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (activeAdminView === 'learning-agreements') {
      loadLearningAgreements()
    }
  }, [activeAdminView])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const statsData = await fetchWithErrorHandling('/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(statsData)
      const usersData = await fetchWithErrorHandling(
        `/admin/users?page=${currentPage}&limit=100&search=${searchTerm}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setUsers(usersData.users)
      const activityData = await fetchWithErrorHandling('/admin/activity', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRecentActivity(activityData.recentUsers)
    } catch (error) {
      console.error('Failed to load admin dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTutorApplications = async () => {
    try {
      setLoadingApplications(true)
      const token = getAuthToken()
      const response = await fetchWithErrorHandling('/tutors/admin/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTutorApplications(response.subscriptions || [])
    } catch (error) {
      console.error('Failed to load tutor subscriptions:', error)
    } finally {
      setLoadingApplications(false)
    }
  }

  const loadLearningAgreements = async () => {
    try {
      setLoadingLearningAgreements(true)
      const token = getAuthToken()
      const response = await fetchWithErrorHandling('/admin/learning-agreements', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setLearningAgreements(Array.isArray(response?.agreements) ? response.agreements : [])
    } catch (error) {
      console.error('Failed to load learning agreements:', error)
      showToast(error.message || 'Failed to load learning agreements', 'error')
    } finally {
      setLoadingLearningAgreements(false)
    }
  }
  const loadSellerApplications = async () => {
    try {
      setLoadingSellerApplications(true)
      const token = getAuthToken()
      const response = await fetchWithErrorHandling('/sellers/admin/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSellerApplications(response.subscriptions || [])
    } catch (error) {
      console.error('Failed to load seller subscriptions:', error)
    } finally {
      setLoadingSellerApplications(false)
    }
  }

  const handleSellerApplicationAction = async (applicationId, status, reviewNotes = '') => {
    try {
      const token = getAuthToken()
      const statusValue = status === 'Approved' ? 'active' : 'rejected'
      
      await fetchWithErrorHandling(`/sellers/admin/subscriptions/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: statusValue, reviewNotes })
      })

      showToast(`Seller subscription has been successfully ${statusValue === 'active' ? 'approved' : 'rejected'}.`, 'success')
      loadSellerApplications()
      loadDashboardData()
    } catch (error) {
      showToast('Failed to update seller subscription status: ' + error.message, 'error')
    }
  }

  const handleDeleteSellerSubscription = (id) => {
    setSubToDelete({ id, type: 'seller' })
    setShowDeleteSubModal(true)
  }

  const handleViewSellerApplicationDetails = async (application) => {
    setSelectedSellerApplication(application)
    setShowSellerDetailsModal(true)

    try {
      setLoadingSellerDetails(true)
      const token = getAuthToken()
      const response = await fetchWithErrorHandling(`/sellers/admin/subscriptions/${application._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.success && response.subscription) {
        setSelectedSellerApplication(response.subscription)
      }
    } catch (error) {
      console.error('Failed to load application images:', error)
    } finally {
      setLoadingSellerDetails(false)
    }
  }

  const closeSellerDetailsModal = () => {
    setShowSellerDetailsModal(false)
    setSelectedSellerApplication(null)
  }

  const openLearningAgreementsView = async () => {
    setActiveAdminView('learning-agreements')
    setShowAdminQuickMenu(false)
    await loadLearningAgreements()
  }

  const openOverviewView = () => {
    setActiveAdminView('overview')
    setShowAdminQuickMenu(false)
  }

  const handleApplicationAction = async (applicationId, status, reviewNotes = '') => {
    try {
      const token = getAuthToken()
      const statusValue = status === 'Approved' ? 'active' : 'rejected'
      
      await fetchWithErrorHandling(`/tutors/admin/subscriptions/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: statusValue, reviewNotes })
      })

      showToast(`Subscription has been successfully ${statusValue === 'active' ? 'approved' : 'rejected'}.`, 'success')
      loadTutorApplications()
      loadDashboardData() 
    } catch (error) {
      showToast('Failed to update subscription status: ' + error.message, 'error')
    }
  }

  const handleDeleteTutorSubscription = (id) => {
    setSubToDelete({ id, type: 'tutor' })
    setShowDeleteSubModal(true)
  }

  const confirmDeleteSub = async () => {
    if (!subToDelete) return
    const { id, type } = subToDelete
    try {
      const token = getAuthToken()
      if (type === 'tutor') {
        await fetchWithErrorHandling(`/tutors/admin/subscriptions/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        showToast('Tutor subscription request deleted successfully.', 'success')
        loadTutorApplications()
      } else {
        await fetchWithErrorHandling(`/sellers/admin/subscriptions/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        showToast('Seller subscription request deleted successfully.', 'success')
        loadSellerApplications()
      }
      loadDashboardData()
    } catch (error) {
      showToast(`Failed to delete ${type} subscription: ` + error.message, 'error')
    } finally {
      setShowDeleteSubModal(false)
      setSubToDelete(null)
    }
  }

  const cancelDeleteSub = () => {
    setShowDeleteSubModal(false)
    setSubToDelete(null)
  }

  const handleViewApplicationDetails = async (application) => {
    setSelectedTutorApplication(application)
    setShowTutorDetailsModal(true)

    try {
      setLoadingTutorDetails(true)
      const token = getAuthToken()
      const response = await fetchWithErrorHandling(`/tutors/admin/subscriptions/${application._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.success && response.subscription) {
        setSelectedTutorApplication(response.subscription)
      }
    } catch (error) {
      console.error('Failed to load tutor application details:', error)
    } finally {
      setLoadingTutorDetails(false)
    }
  }

  const closeTutorDetailsModal = () => {
    setShowTutorDetailsModal(false)
    setSelectedTutorApplication(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    
    try {
      const token = getAuthToken()
      await fetchWithErrorHandling(`/admin/users/${userToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('User deleted successfully', 'success')
      loadDashboardData()
    } catch (error) {
      showToast('Failed to delete user: ' + error.message, 'error')
    } finally {
      setShowDeleteModal(false)
      setUserToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
  }

  const handleToggleVerification = async (userId, currentStatus) => {
    try {
      const token = getAuthToken()
      await fetchWithErrorHandling(`/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emailVerified: !currentStatus })
      })
      showToast('User verification status updated', 'success')
      loadDashboardData()
    } catch (error) {
      showToast('Failed to update user: ' + error.message, 'error')
    }
  }
  const handleCreateUser = () => {
    setModalMode('create')
    setFormData({
      name: '',
      email: '',
      password: '',
      emailVerified: false,
      isAdmin: false
    })
    setShowModal(true)
  }

  const handleEditUser = (user) => {
    setModalMode('edit')
    setSelectedUser(user)
    setFormData({
      name: user.fullName || '',
      email: user.email,
      password: '', 
      emailVerified: user.emailVerified,
      isAdmin: user.isAdmin || false
    })
    setShowModal(true)
  }

  const handleViewUser = (user) => {
    setModalMode('view')
    setSelectedUser(user)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      emailVerified: false,
      isAdmin: false
    })
  }


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  
  const handleSubmitUser = async (e) => {
    e.preventDefault()
    
    try {
      const token = getAuthToken()
      
      if (modalMode === 'create') {
       
        if (!formData.email || !formData.password) {
          showToast('Email and password are required', 'error')
          return
        }

        await fetchWithErrorHandling('/admin/users', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })
        showToast('User created successfully', 'success')
      } else if (modalMode === 'edit') {
       
        const updateData = {
          fullName: formData.name,
          emailVerified: formData.emailVerified,
          isAdmin: formData.isAdmin
        }
        if (formData.password) {
          updateData.password = formData.password
        }

        await fetchWithErrorHandling(`/admin/users/${selectedUser._id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })
        showToast('User updated successfully', 'success')
      }

      handleCloseModal()
      loadDashboardData()
    } catch (error) {
      showToast('Failed to save user: ' + error.message, 'error')
    }
  }

  if (loading) {
    return (
      <div className="admin-loading-viewport">
        <div className="admin-loading-box">
          <div className="simple-loader-spinner"></div>
          
          <div className="loading-info-group">
            <h2 className="loading-headline">
              Loading Admin <span>Dashboard</span>
            </h2>
            <p className="loading-detail-text">Fetching data and statistics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-layout-wrapper">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarActive ? 'mobile-active' : ''}`}>
        <div className="sidebar-brand">
          <img src="/images/CM.png" alt="CareerMap Logo" className="sidebar-logo" />
          {!sidebarCollapsed && (
            <div className="sidebar-brand-text">
              <span className="logo-text">CareerMap</span>
              <span className="logo-subtitle">Admin Portal</span>
            </div>
          )}
        </div>
        <nav className="sidebar-nav">
          <button 
            type="button"
            className={`sidebar-nav-item ${activeAdminView === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveAdminView('overview')
              setMobileSidebarActive(false)
            }}
          >
            <i className="fa-solid fa-chart-line"></i>
            <span>Overview</span>
          </button>
          
          <button 
            type="button"
            className={`sidebar-nav-item ${activeAdminView === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveAdminView('users')
              setMobileSidebarActive(false)
            }}
          >
            <i className="fa-solid fa-users"></i>
            <span>User Management</span>
          </button>
          
          <button 
            type="button"
            className={`sidebar-nav-item ${activeAdminView === 'tutors' ? 'active' : ''}`}
            onClick={() => {
              setActiveAdminView('tutors')
              setMobileSidebarActive(false)
            }}
          >
            <i className="fa-solid fa-graduation-cap"></i>
            <span>Tutor Applications</span>
          </button>
          
          <button 
            type="button"
            className={`sidebar-nav-item ${activeAdminView === 'sellers' ? 'active' : ''}`}
            onClick={() => {
              setActiveAdminView('sellers')
              setMobileSidebarActive(false)
            }}
          >
            <i className="fa-solid fa-store"></i>
            <span>Seller Applications</span>
          </button>
          
          <button 
            type="button"
            className={`sidebar-nav-item ${activeAdminView === 'learning-agreements' ? 'active' : ''}`}
            onClick={() => {
              setActiveAdminView('learning-agreements')
              setMobileSidebarActive(false)
            }}
          >
            <i className="fa-solid fa-handshake"></i>
            <span>Learning Agreements</span>
          </button>

          {/* Divider and Portal Navigation Links */}
          <div className="sidebar-divider" style={{ height: '1px', background: 'rgba(0, 0, 0, 0.08)', margin: '1.5rem 0.75rem 1rem 0.75rem' }}></div>
          {!sidebarCollapsed && (
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(0, 0, 0, 0.4)', fontWeight: '700', padding: '0 1rem 0.5rem 1rem', letterSpacing: '0.05em' }}>Portal Links</div>
          )}

          <Link to="/dashboard" className="sidebar-nav-item" style={{ textDecoration: 'none' }} onClick={() => setMobileSidebarActive(false)}>
            <i className="fa-solid fa-house"></i>
            <span>Home</span>
          </Link>
          <Link to="/universities" className="sidebar-nav-item" style={{ textDecoration: 'none' }} onClick={() => setMobileSidebarActive(false)}>
            <i className="fa-solid fa-university"></i>
            <span>Universities</span>
          </Link>
          <Link to="/mentorship" className="sidebar-nav-item" style={{ textDecoration: 'none' }} onClick={() => setMobileSidebarActive(false)}>
            <i className="fa-solid fa-chalkboard-user"></i>
            <span>Mentorship</span>
          </Link>
          <Link to="/marketplace" className="sidebar-nav-item" style={{ textDecoration: 'none' }} onClick={() => setMobileSidebarActive(false)}>
            <i className="fa-solid fa-shop"></i>
            <span>MarketPlace</span>
          </Link>
        </nav>
        
        <button 
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label="Toggle sidebar"
        >
          <i className={`fa-solid ${sidebarCollapsed ? 'fa-angle-right' : 'fa-angle-left'}`}></i>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-container">
        {/* Topbar same as mentorship/marketplace */}
        <header className="dashboard-header" style={{ position: 'sticky', top: 0, zIndex: 90 }}>
          <div className="container header-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                type="button"
                className="mobile-menu-btn"
                onClick={() => setMobileSidebarActive(!mobileSidebarActive)}
                aria-label="Toggle mobile menu"
              >
                <i className="fa-solid fa-bars"></i>
              </button>

              {/* Logo inside Topbar (Mobile Only) */}
              <div className="topbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/images/CM.png" alt="CareerMap Logo" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
                <span className="logo-text" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#5c4a3d', letterSpacing: '-0.5px' }}>CareerMap</span>
              </div>
              
              {/* Breadcrumbs inside Topbar (Desktop Only) */}
              <div className="topbar-breadcrumbs-desktop">
                <span className="breadcrumb-main">Admin Portal</span>
                <span className="breadcrumb-separator">
                  <i className="fa-solid fa-angle-right"></i>
                </span>
                <span className="breadcrumb-active">
                  {activeAdminView === 'overview' && 'Overview & Analytics'}
                  {activeAdminView === 'users' && 'User Management'}
                  {activeAdminView === 'tutors' && 'Tutor Applications'}
                  {activeAdminView === 'sellers' && 'Seller Applications'}
                  {activeAdminView === 'learning-agreements' && 'Learning Agreements'}
                </span>
              </div>
            </div>
            

            
            <nav className={`nav-links reveal ${mobileMenuOpen ? 'active' : ''}`}>
              <Link to="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/universities" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                 Universities
              </Link>
              <Link to="/mentorship" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                Mentorship
              </Link>
              <Link to="/marketplace" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                MarketPlace
              </Link>
              <Link to="/admin" className="nav-link active" onClick={() => setMobileMenuOpen(false)}>
                Admin Dashboard
              </Link>
            </nav>

            <div className="nav-actions reveal">
              <div className="user-menu">
                <Link to="/profile" className="user-avatar">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.name || 'User'} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </Link>
                <button className="btn-logout" onClick={handleLogout}>
                  logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Panels */}
        <main className="admin-body-panel">
          <div className="tab-header">
            <div className="tab-title-block">
              <h1>
                {activeAdminView === 'overview' && 'Overview & Analytics'}
                {activeAdminView === 'users' && 'User Administration'}
                {activeAdminView === 'tutors' && 'Tutor Verification'}
                {activeAdminView === 'sellers' && 'Seller Verification'}
                {activeAdminView === 'learning-agreements' && 'Learning Agreements Logs'}
              </h1>
              <p>
                {activeAdminView === 'overview' && 'Real-time performance metrics, user analytics, and platform activities.'}
                {activeAdminView === 'users' && 'Manage system users, adjust roles, verify email addresses, and perform CRUD actions.'}
                {activeAdminView === 'tutors' && 'Review tutor licensing documents, specialization credentials, and approve subscriptions.'}
                {activeAdminView === 'sellers' && 'Verify seller business profiles, check government CNIC documents, and approve marketplace access.'}
                {activeAdminView === 'learning-agreements' && 'View agreements, lesson courses log histories, and schedules created by active tutors.'}
              </p>
            </div>
          </div>

          {/* Overview Tab Content */}
          {activeAdminView === 'overview' && (
            <>
              {/* Stats Card Grid */}
              <div className="stats-cards-grid">
                <div className="stat-card-modern">
                  <div className="stat-card-left">
                    <span className="stat-card-title">Total Users</span>
                    <h2 className="stat-card-value">{stats?.totalUsers || 0}</h2>
                  </div>
                  <div className="stat-card-icon-box">
                    <i className="fa-solid fa-users"></i>
                  </div>
                </div>

                <div className="stat-card-modern">
                  <div className="stat-card-left">
                    <span className="stat-card-title">Career Recommendations</span>
                    <h2 className="stat-card-value">{stats?.totalCareerRecommendations || 0}</h2>
                  </div>
                  <div className="stat-card-icon-box">
                    <i className="fa-solid fa-briefcase"></i>
                  </div>
                </div>

                <div className="stat-card-modern">
                  <div className="stat-card-left">
                    <span className="stat-card-title">Total Universities</span>
                    <h2 className="stat-card-value">{stats?.totalUniversities || 0}</h2>
                  </div>
                  <div className="stat-card-icon-box">
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                </div>

                <div className="stat-card-modern">
                  <div className="stat-card-left">
                    <span className="stat-card-title">Active Tutors</span>
                    <h2 className="stat-card-value">{stats?.totalTutors || 0}</h2>
                  </div>
                  <div className="stat-card-icon-box">
                    <i className="fa-solid fa-chalkboard-user"></i>
                  </div>
                </div>
              </div>

              {/* Activity Timeline and Guide */}
              <div className="overview-grid">
                <div className="overview-panel-card">
                  <div className="panel-card-header">
                    <h2>
                      <i className="fa-solid fa-chart-line"></i>
                      <span>Recent Activity</span>
                    </h2>
                  </div>
                  
                  {recentActivity.length === 0 ? (
                    <div className="empty-data-panel">
                      <i className="fa-solid fa-clock empty-data-icon"></i>
                      <p>No recent user registration activity recorded.</p>
                    </div>
                  ) : (
                    <div className="timeline-feed">
                      {recentActivity.map((activity) => (
                        <div key={activity._id} className={`timeline-item ${activity.emailVerified ? 'verified' : ''}`}>
                          <div className="timeline-marker"></div>
                          <div className="timeline-content-box">
                            <div className="timeline-info">
                              <span className="timeline-user">{activity.fullName || 'New User'}</span>
                              <span className="timeline-email">{activity.email}</span>
                            </div>
                            <span className={`timeline-badge-pill ${activity.emailVerified ? 'verified' : ''}`}>
                              {activity.emailVerified ? 'Verified' : 'Pending'}
                            </span>
                            <div className="timeline-meta">
                              Joined {new Date(activity.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="quick-info-card">
                    <div className="quick-info-header">
                      <i className="fa-solid fa-shield-halved"></i>
                      <span>Admin Security Portal</span>
                    </div>
                    <p className="quick-info-body">
                      This administration console coordinates security checks across both <strong>Mentorship</strong> and the <strong>Marketplace</strong>. Before approving tutor or seller subscription requests, please visually audit CNIC documents and selfies.
                    </p>
                  </div>
                  
                  <div className="quick-info-card">
                    <div className="quick-info-header">
                      <i className="fa-solid fa-circle-info"></i>
                      <span>Subscription Auditing</span>
                    </div>
                    <p className="quick-info-body">
                      Approved tutors can publish courses and offer mentorship lessons. Approved marketplace sellers are enabled to list educational products, guides, and materials.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* User Management Tab Content */}
          {activeAdminView === 'users' && (
            <>
              {/* Table Toolbar */}
              <div className="table-toolbar-box">
                <div className="search-input-wrapper">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="modern-search-input"
                  />
                </div>
                <button type="button" onClick={handleCreateUser} className="btn-premium primary">
                  <i className="fa-solid fa-plus"></i>
                  <span>Add User</span>
                </button>
              </div>

              {/* Table Container */}
              <div className="table-outer-card">
                <div className="modern-table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="5">
                            <div className="empty-data-panel">
                              <i className="fa-solid fa-users-slash empty-data-icon"></i>
                              <p>No matching users found.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        users
                          .sort((a, b) => {
                            if (a.isAdmin && !b.isAdmin) return -1
                            if (!a.isAdmin && b.isAdmin) return 1
                            return new Date(b.createdAt) - new Date(a.createdAt)
                          })
                          .map((u) => (
                            <tr key={u._id}>
                              <td style={{ fontWeight: '600' }}>{u.fullName || 'N/A'}</td>
                              <td>{u.email}</td>
                              <td>
                                <span className={`badge-role ${u.isAdmin ? 'admin' : ''}`}>
                                  {u.isAdmin ? '👑 Admin' : 'User'}
                                </span>
                              </td>
                              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td>
                                <div className="action-buttons-group">
                                   <button
                                     type="button"
                                     onClick={() => handleViewUser(u)}
                                     className="admin-action-btn"
                                   >
                                     View Details
                                   </button>
                                   <button
                                     type="button"
                                     onClick={() => handleEditUser(u)}
                                     className="admin-action-btn"
                                   >
                                     Edit
                                   </button>
                                   {!u.isAdmin && (
                                     <button
                                       type="button"
                                       onClick={() => handleDeleteUser(u._id)}
                                       className="admin-action-btn"
                                     >
                                       Delete
                                     </button>
                                   )}
                                 </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Tutor Applications Tab Content */}
          {activeAdminView === 'tutors' && (() => {
            const visibleTutorApps = tutorApplications.filter(a => !hiddenTutorIds.has(a._id))
            const clearableTutorCount = tutorApplications.filter(a =>
              !hiddenTutorIds.has(a._id) && CLEARABLE_STATUSES.includes(a.status?.toLowerCase())
            ).length
            return (
              <div className="table-outer-card">
                {loadingApplications ? (
                  <div className="empty-data-panel">
                    <i className="fa-solid fa-spinner fa-spin empty-data-icon"></i>
                    <p>Loading applications...</p>
                  </div>
                ) : visibleTutorApps.length === 0 ? (
                  <div className="empty-data-panel">
                    <i className="fa-solid fa-graduation-cap empty-data-icon"></i>
                    <p>{hiddenTutorIds.size > 0 ? 'All resolved entries have been cleared from view.' : 'No tutor subscription applications found.'}</p>
                    {hiddenTutorIds.size > 0 && (
                      <button
                        type="button"
                        className="admin-action-btn"
                        style={{ marginTop: '0.5rem' }}
                        onClick={() => setHiddenTutorIds(new Set())}
                      >
                        <i className="fa-solid fa-rotate-left" style={{ marginRight: '6px' }} />
                        Restore All ({hiddenTutorIds.size})
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="modern-table-container">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Tutor</th>
                          <th>Plan Tier</th>
                          <th>CNIC</th>
                          <th>Phone</th>
                          <th>Education</th>
                          <th>Status</th>
                          <th>Applied On</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTutorApps.map((application) => (
                          <tr key={application._id}>
                            <td>
                              <div className="tutor-table-name" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {application.userId?.profileImage ? (
                                  <img
                                    src={application.userId.profileImage}
                                    alt={application.fullName || 'Tutor'}
                                    className="tutor-avatar-chip tutor-avatar-image"
                                  />
                                ) : (
                                  <span className="tutor-avatar-chip">
                                    {(application.fullName || 'T').trim().charAt(0).toUpperCase()}
                                  </span>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--primary-graphite)' }}>
                                    {application.fullName || 'Tutor'}
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                                    {application.userId?.email || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong style={{ textTransform: 'capitalize' }}>
                                {application.planType.replace('_', ' ')}
                              </strong>
                              <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                                {application.amount} PKR
                              </div>
                            </td>
                            <td>{application.cnic}</td>
                            <td>{application.phone}</td>
                            <td>{application.education}</td>
                            <td>
                              <span className={`badge-status-pill ${application.status.toLowerCase().replace('_', '-')}`}>
                                {application.status === 'payment_pending' ? 'Payment Pending' : application.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td>{new Date(application.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons-group">
                                <button
                                  type="button"
                                  onClick={() => handleViewApplicationDetails(application)}
                                  className="admin-action-btn"
                                >
                                  View Details
                                </button>
                                {['pending_review', 'payment_pending'].includes(application.status?.toLowerCase()) && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApplicationAction(application._id, 'Approved')}
                                      className="admin-action-btn approve"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleApplicationAction(application._id, 'Rejected')}
                                      className="admin-action-btn reject"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTutorSubscription(application._id)}
                                  className="admin-action-btn delete"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Clear History Footer */}
                <div className="admin-clear-history-footer">
                  <div className="admin-clear-history-info">
                    <i className="fa-solid fa-circle-info" />
                    <span>
                      Showing <strong>{visibleTutorApps.length}</strong> of <strong>{tutorApplications.length}</strong> entries
                      {hiddenTutorIds.size > 0 && <span className="admin-hidden-badge">{hiddenTutorIds.size} hidden</span>}
                    </span>
                  </div>
                  <div className="admin-clear-history-actions">
                    {hiddenTutorIds.size > 0 && (
                      <button
                        type="button"
                        className="admin-history-restore-btn"
                        onClick={() => setHiddenTutorIds(new Set())}
                      >
                        <i className="fa-solid fa-rotate-left" />
                        Restore All
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-history-clear-btn"
                      disabled={clearableTutorCount === 0}
                      onClick={() => {
                        const toClear = tutorApplications
                          .filter(a => CLEARABLE_STATUSES.includes(a.status?.toLowerCase()))
                          .map(a => a._id)
                        if (toClear.length === 0) return
                        setHiddenTutorIds(prev => new Set([...prev, ...toClear]))
                      }}
                    >
                      <i className="fa-solid fa-broom" />
                      Clear History
                      {clearableTutorCount > 0 && (
                        <span className="admin-clear-count-badge">{clearableTutorCount}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Seller Applications Tab Content */}
          {activeAdminView === 'sellers' && (() => {
            const visibleSellerApps = sellerApplications.filter(a => !hiddenSellerIds.has(a._id))
            const clearableSellerCount = sellerApplications.filter(a =>
              !hiddenSellerIds.has(a._id) && CLEARABLE_STATUSES.includes(a.status?.toLowerCase())
            ).length
            return (
              <div className="table-outer-card">
                {loadingSellerApplications ? (
                  <div className="empty-data-panel">
                    <i className="fa-solid fa-spinner fa-spin empty-data-icon"></i>
                    <p>Loading applications...</p>
                  </div>
                ) : visibleSellerApps.length === 0 ? (
                  <div className="empty-data-panel">
                    <i className="fa-solid fa-store empty-data-icon"></i>
                    <p>{hiddenSellerIds.size > 0 ? 'All resolved entries have been cleared from view.' : 'No seller verification applications found.'}</p>
                    {hiddenSellerIds.size > 0 && (
                      <button
                        type="button"
                        className="admin-action-btn"
                        style={{ marginTop: '0.5rem' }}
                        onClick={() => setHiddenSellerIds(new Set())}
                      >
                        <i className="fa-solid fa-rotate-left" style={{ marginRight: '6px' }} />
                        Restore All ({hiddenSellerIds.size})
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="modern-table-container">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Seller</th>
                          <th>Plan Tier</th>
                          <th>CNIC</th>
                          <th>Phone</th>
                          <th>Seller Type</th>
                          <th>Status</th>
                          <th>Applied On</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleSellerApps.map((application) => (
                          <tr key={application._id}>
                            <td>
                              <div className="tutor-table-name" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {application.userId?.profileImage ? (
                                  <img
                                    src={application.userId.profileImage}
                                    alt={application.fullName || 'Seller'}
                                    className="tutor-avatar-chip tutor-avatar-image"
                                  />
                                ) : (
                                  <span className="tutor-avatar-chip">
                                    {(application.fullName || 'S').trim().charAt(0).toUpperCase()}
                                  </span>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--primary-graphite)' }}>
                                    {application.fullName || 'Seller'}
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                                    {application.userId?.email || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong style={{ textTransform: 'capitalize' }}>
                                {application.planType.replace('_', ' ')}
                              </strong>
                              <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                                {application.amount} PKR
                              </div>
                            </td>
                            <td>{application.cnic}</td>
                            <td>{application.phone}</td>
                            <td style={{ textTransform: 'capitalize' }}>{application.sellerType.replace('_', ' ')}</td>
                            <td>
                              <span className={`badge-status-pill ${application.status.toLowerCase().replace('_', '-')}`}>
                                {application.status === 'payment_pending' ? 'Payment Pending' : application.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td>{new Date(application.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons-group">
                                <button
                                  type="button"
                                  onClick={() => handleViewSellerApplicationDetails(application)}
                                  className="admin-action-btn"
                                >
                                  View Details
                                </button>
                                {['pending_review', 'payment_pending'].includes(application.status?.toLowerCase()) && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSellerApplicationAction(application._id, 'Approved')}
                                      className="admin-action-btn approve"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSellerApplicationAction(application._id, 'Rejected')}
                                      className="admin-action-btn reject"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSellerSubscription(application._id)}
                                  className="admin-action-btn delete"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Clear History Footer */}
                <div className="admin-clear-history-footer">
                  <div className="admin-clear-history-info">
                    <i className="fa-solid fa-circle-info" />
                    <span>
                      Showing <strong>{visibleSellerApps.length}</strong> of <strong>{sellerApplications.length}</strong> entries
                      {hiddenSellerIds.size > 0 && <span className="admin-hidden-badge">{hiddenSellerIds.size} hidden</span>}
                    </span>
                  </div>
                  <div className="admin-clear-history-actions">
                    {hiddenSellerIds.size > 0 && (
                      <button
                        type="button"
                        className="admin-history-restore-btn"
                        onClick={() => setHiddenSellerIds(new Set())}
                      >
                        <i className="fa-solid fa-rotate-left" />
                        Restore All
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-history-clear-btn"
                      disabled={clearableSellerCount === 0}
                      onClick={() => {
                        const toClear = sellerApplications
                          .filter(a => CLEARABLE_STATUSES.includes(a.status?.toLowerCase()))
                          .map(a => a._id)
                        if (toClear.length === 0) return
                        setHiddenSellerIds(prev => new Set([...prev, ...toClear]))
                      }}
                    >
                      <i className="fa-solid fa-broom" />
                      Clear History
                      {clearableSellerCount > 0 && (
                        <span className="admin-clear-count-badge">{clearableSellerCount}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Learning Agreements Tab Content */}
          {activeAdminView === 'learning-agreements' && (
            <div className="table-outer-card">
              {loadingLearningAgreements ? (
                <div className="empty-data-panel">
                  <i className="fa-solid fa-spinner fa-spin empty-data-icon"></i>
                  <p>Loading agreements...</p>
                </div>
              ) : learningAgreements.length === 0 ? (
                <div className="empty-data-panel">
                  <i className="fa-solid fa-handshake-slash empty-data-icon"></i>
                  <p>No learning agreements recorded.</p>
                </div>
              ) : (
                <div className="modern-table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Tutor</th>
                        <th>Student</th>
                        <th>Subject / Course</th>
                        <th>Session Date & Time</th>
                        <th>Duration</th>
                        <th>Created By</th>
                        <th>Created On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {learningAgreements.map((agreement) => (
                        <tr key={agreement._id}>
                          <td style={{ fontWeight: '600' }}>{agreement.tutorName || 'N/A'}</td>
                          <td style={{ fontWeight: '600' }}>{agreement.studentName || 'N/A'}</td>
                          <td>{agreement.subjectCourse || 'N/A'}</td>
                          <td>{agreement.sessionDateTime ? new Date(agreement.sessionDateTime).toLocaleString() : 'N/A'}</td>
                          <td>{agreement.duration || 'N/A'}</td>
                          <td>{agreement.createdBy?.fullName || agreement.createdBy?.email || 'Unknown'}</td>
                          <td>{agreement.createdAt ? new Date(agreement.createdAt).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

     
      {/* 1. Tutor Details Modal */}
      {showTutorDetailsModal && selectedTutorApplication && (
        <div className="premium-admin-modal-overlay" onClick={closeTutorDetailsModal}>
          <div 
            className="premium-admin-modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '650px' }}
          >
            <div className="modal-header-premium">
              <h2>
                <i className="fa-solid fa-graduation-cap"></i>
                <span>Tutor Subscription Application</span>
              </h2>
              <button 
                type="button"
                onClick={closeTutorDetailsModal} 
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body-premium">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Full Name</span>
                  <span className="modal-detail-value">{selectedTutorApplication.fullName}</span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Email Address</span>
                  <span className="modal-detail-value">{selectedTutorApplication.userId?.email || 'N/A'}</span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Phone Number</span>
                  <span className="modal-detail-value">{selectedTutorApplication.phone}</span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">CNIC Number</span>
                  <span className="modal-detail-value">{selectedTutorApplication.cnic}</span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Verification Status</span>
                  <span className="modal-detail-value" style={{ textTransform: 'capitalize' }}>
                    {selectedTutorApplication.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Highest Education</span>
                  <span className="modal-detail-value">{selectedTutorApplication.education}</span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Degree Field</span>
                  <span className="modal-detail-value">{selectedTutorApplication.degreeField || 'N/A'}</span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Gender</span>
                  <span className="modal-detail-value" style={{ textTransform: 'capitalize' }}>
                    {selectedTutorApplication.gender || 'N/A'}
                  </span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Current Profession</span>
                  <span className="modal-detail-value" style={{ textTransform: 'capitalize' }}>
                    {selectedTutorApplication.currently || 'N/A'}
                  </span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Plan Subscription Tier</span>
                  <span className="modal-detail-value" style={{ textTransform: 'capitalize' }}>
                    {selectedTutorApplication.planType.replace('_', ' ')}
                  </span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Paid Amount</span>
                  <span className="modal-detail-value">
                    {selectedTutorApplication.amount} {selectedTutorApplication.currency || 'PKR'}
                  </span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Course Quota Capacity</span>
                  <span className="modal-detail-value">{selectedTutorApplication.courseLimit} Courses Allowed</span>
                </div>
                
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
                  <span className="modal-detail-key" style={{ display: 'block', marginBottom: '0.75rem' }}>Government ID & Identity Credentials Auditing</span>
                  
                  {loadingTutorDetails ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem', background: 'var(--brand-warm-cream)', borderRadius: '16px', border: '1px dashed var(--brand-gold)', gap: '0.85rem' }}>
                      <i className="fas fa-spinner fa-spin" style={{ color: 'var(--brand-bronze)', fontSize: '1.75rem' }}></i>
                      <span style={{ fontSize: '0.88rem', color: '#7a5e44', fontWeight: '600' }}>Decrypting and loading verification assets...</span>
                    </div>
                  ) : selectedTutorApplication.cnicPicture ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span className="modal-detail-key">Verification Document Photo</span>
                      <a href={selectedTutorApplication.cnicPicture} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
                        <img 
                          src={selectedTutorApplication.cnicPicture} 
                          alt="Tutor CNIC / Degree Document" 
                          style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '16px', border: '1px solid var(--admin-border)', cursor: 'zoom-in', padding: '4px', background: '#f8fafc' }} 
                        />
                      </a>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem', background: 'var(--brand-warm-cream)', borderRadius: '16px', border: '1px solid var(--admin-border)', gap: '0.5rem' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--brand-bronze)', fontSize: '1.5rem' }}></i>
                      <span style={{ fontSize: '0.88rem', color: '#7a5e44', fontWeight: '600' }}>No verification document photo uploaded</span>
                    </div>
                  )}
                </div>

                {selectedTutorApplication.transactionId && (
                  <div className="modal-detail-row" style={{ marginTop: '0.5rem' }}>
                    <span className="modal-detail-key">Transaction Hash / ID</span>
                    <span className="modal-detail-value">{selectedTutorApplication.transactionId}</span>
                  </div>
                )}
                
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Applied Timestamp</span>
                  <span className="modal-detail-value">{new Date(selectedTutorApplication.createdAt).toLocaleString()}</span>
                </div>

                {selectedTutorApplication.reviewedAt && (
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Audit Reviewed On</span>
                    <span className="modal-detail-value">{new Date(selectedTutorApplication.reviewedAt).toLocaleString()}</span>
                  </div>
                )}

                {selectedTutorApplication.reviewedBy?.fullName && (
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Audited By</span>
                    <span className="modal-detail-value">{selectedTutorApplication.reviewedBy.fullName}</span>
                  </div>
                )}

                {selectedTutorApplication.reviewNotes && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.75rem', padding: '1rem', background: 'var(--status-danger-bg)', borderRadius: '12px', border: '1px solid rgba(220, 38, 38, 0.1)' }}>
                    <span style={{ fontWeight: '700', color: 'var(--status-danger-text)', fontSize: '0.85rem' }}>Audit Remarks / Feedback</span>
                    <span style={{ color: 'var(--status-danger-text)', fontSize: '0.92rem' }}>{selectedTutorApplication.reviewNotes}</span>
                  </div>
                )}
              </div>

              {['pending_review', 'payment_pending'].includes(selectedTutorApplication.status?.toLowerCase()) && (
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1.5rem' }}>
                  <div className="modal-form-group">
                    <label htmlFor="reviewNotesInput" style={{ color: 'var(--admin-text-main)', fontWeight: '700' }}>
                      Auditor Verification Notes (Required for rejection)
                    </label>
                    <div className="modal-input-shell" style={{ background: '#fcfaf7' }}>
                      <i className="fa-solid fa-comment-medical"></i>
                      <textarea
                        id="reviewNotesInput"
                        placeholder="Add review feedback notes, rejection reasons, or checkmark confirmation..."
                        style={{ minHeight: '80px', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const notes = document.getElementById('reviewNotesInput')?.value || ''
                        handleApplicationAction(selectedTutorApplication._id, 'Rejected', notes)
                        closeTutorDetailsModal()
                      }}
                      className="btn-premium"
                      style={{ flex: 1, background: 'var(--status-danger-text)', color: 'white', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}
                    >
                      <i className="fa-solid fa-times-circle"></i>
                      <span>Reject Application</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const notes = document.getElementById('reviewNotesInput')?.value || ''
                        handleApplicationAction(selectedTutorApplication._id, 'Approved', notes)
                        closeTutorDetailsModal()
                      }}
                      className="btn-premium"
                      style={{ flex: 1, background: 'var(--status-active-text)', color: 'white', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' }}
                    >
                      <i className="fa-solid fa-check-circle"></i>
                      <span>Approve Access</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Seller Details Modal */}
      {showSellerDetailsModal && selectedSellerApplication && (
        <div className="premium-admin-modal-overlay" onClick={closeSellerDetailsModal}>
          <div 
            className="premium-admin-modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '700px' }}
          >
            <div className="modal-header-premium">
              <h2>
                <i className="fa-solid fa-store"></i>
                <span>Seller Verification Application</span>
              </h2>
              <button 
                type="button"
                onClick={closeSellerDetailsModal} 
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body-premium">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Merchant Name</span>
                  <span className="modal-detail-value">{selectedSellerApplication.fullName}</span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Email Address</span>
                  <span className="modal-detail-value">{selectedSellerApplication.userId?.email || selectedSellerApplication.email || 'N/A'}</span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Phone Number</span>
                  <span className="modal-detail-value">{selectedSellerApplication.phone}</span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">CNIC Number</span>
                  <span className="modal-detail-value">{selectedSellerApplication.cnic}</span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Merchant Type</span>
                  <span className="modal-detail-value" style={{ textTransform: 'capitalize' }}>
                    {selectedSellerApplication.sellerType.replace('_', ' ')}
                  </span>
                </div>
                
                {selectedSellerApplication.socialMediaLink && (
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Social Reference Link</span>
                    <span className="modal-detail-value">
                      <a 
                        href={selectedSellerApplication.socialMediaLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ color: 'var(--brand-bronze)', textDecoration: 'underline', fontWeight: 'bold' }}
                      >
                        Visit Social Portfolio <i className="fa-solid fa-up-right-from-square" style={{ fontSize: '0.75rem', marginLeft: '2px' }}></i>
                      </a>
                    </span>
                  </div>
                )}
                
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Audit Status</span>
                  <span className="modal-detail-value" style={{ textTransform: 'capitalize' }}>
                    {selectedSellerApplication.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Plan Subscription Tier</span>
                  <span className="modal-detail-value" style={{ textTransform: 'capitalize' }}>
                    {selectedSellerApplication.planType}
                  </span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Audited Amount Paid</span>
                  <span className="modal-detail-value">
                    {selectedSellerApplication.amount} {selectedSellerApplication.currency || 'PKR'}
                  </span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Product Upload Capacity</span>
                  <span className="modal-detail-value">{selectedSellerApplication.productLimit} Products Allowed</span>
                </div>
                
                {/* Spacious multi-column credentials audit gallery */}
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
                  <span className="modal-detail-key" style={{ display: 'block', marginBottom: '0.75rem' }}>Government ID & Identity Credentials Auditing</span>
                  
                  {loadingSellerDetails ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem', background: 'var(--brand-warm-cream)', borderRadius: '16px', border: '1px dashed var(--brand-gold)', gap: '0.85rem' }}>
                      <i className="fas fa-spinner fa-spin" style={{ color: 'var(--brand-bronze)', fontSize: '1.75rem' }}></i>
                      <span style={{ fontSize: '0.88rem', color: '#7a5e44', fontWeight: '600' }}>Decrypting and loading verification assets...</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="docs-preview-grid">
                        {selectedSellerApplication.cnicFrontImage && (
                          <div className="doc-preview-card">
                            <h4>CNIC Identification (Front)</h4>
                            <a href={selectedSellerApplication.cnicFrontImage} target="_blank" rel="noopener noreferrer">
                              <img src={selectedSellerApplication.cnicFrontImage} alt="CNIC Front" className="doc-preview-img" style={{ cursor: 'zoom-in' }} />
                            </a>
                          </div>
                        )}
                        {selectedSellerApplication.cnicBackImage && (
                          <div className="doc-preview-card">
                            <h4>CNIC Identification (Back)</h4>
                            <a href={selectedSellerApplication.cnicBackImage} target="_blank" rel="noopener noreferrer">
                              <img src={selectedSellerApplication.cnicBackImage} alt="CNIC Back" className="doc-preview-img" style={{ cursor: 'zoom-in' }} />
                            </a>
                          </div>
                        )}
                      </div>

                      {selectedSellerApplication.selfieWithCnic && (
                        <div className="doc-preview-card" style={{ width: '100%' }}>
                          <h4>Selfie Portrait holding CNIC</h4>
                          <a href={selectedSellerApplication.selfieWithCnic} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={selectedSellerApplication.selfieWithCnic} 
                              alt="Selfie verification check" 
                              className="doc-preview-img" 
                              style={{ maxHeight: '250px', objectFit: 'contain', width: '100%', cursor: 'zoom-in' }} 
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedSellerApplication.transactionId && (
                  <div className="modal-detail-row" style={{ marginTop: '0.75rem' }}>
                    <span className="modal-detail-key">Transaction Hash / Reference</span>
                    <span className="modal-detail-value">{selectedSellerApplication.transactionId}</span>
                  </div>
                )}
                
                <div className="modal-detail-row">
                  <span className="modal-detail-key">Applied Timestamp</span>
                  <span className="modal-detail-value">{new Date(selectedSellerApplication.createdAt).toLocaleString()}</span>
                </div>

                {selectedSellerApplication.reviewedAt && (
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Audit Reviewed On</span>
                    <span className="modal-detail-value">{new Date(selectedSellerApplication.reviewedAt).toLocaleString()}</span>
                  </div>
                )}

                {selectedSellerApplication.reviewedBy?.fullName && (
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Audited By</span>
                    <span className="modal-detail-value">{selectedSellerApplication.reviewedBy.fullName}</span>
                  </div>
                )}

                {selectedSellerApplication.reviewNotes && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.75rem', padding: '1rem', background: 'var(--status-danger-bg)', borderRadius: '12px', border: '1px solid rgba(220, 38, 38, 0.1)' }}>
                    <span style={{ fontWeight: '700', color: 'var(--status-danger-text)', fontSize: '0.85rem' }}>Audit Remarks / Feedback</span>
                    <span style={{ color: 'var(--status-danger-text)', fontSize: '0.92rem' }}>{selectedSellerApplication.reviewNotes}</span>
                  </div>
                )}
              </div>

              {['pending_review', 'payment_pending'].includes(selectedSellerApplication.status?.toLowerCase()) && (
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1.5rem' }}>
                  <div className="modal-form-group">
                    <label htmlFor="sellerReviewNotesInput" style={{ color: 'var(--admin-text-main)', fontWeight: '700' }}>
                      Auditor Verification Notes (Required for rejection)
                    </label>
                    <div className="modal-input-shell" style={{ background: '#fcfaf7' }}>
                      <i className="fa-solid fa-comment-medical"></i>
                      <textarea
                        id="sellerReviewNotesInput"
                        placeholder="Add review feedback notes, rejection reasons, or seller credential audits..."
                        style={{ minHeight: '80px', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const notes = document.getElementById('sellerReviewNotesInput')?.value || ''
                        handleSellerApplicationAction(selectedSellerApplication._id, 'Rejected', notes)
                        closeSellerDetailsModal()
                      }}
                      className="btn-premium"
                      style={{ flex: 1, background: 'var(--status-danger-text)', color: 'white', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}
                    >
                      <i className="fa-solid fa-times-circle"></i>
                      <span>Reject Application</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const notes = document.getElementById('sellerReviewNotesInput')?.value || ''
                        handleSellerApplicationAction(selectedSellerApplication._id, 'Approved', notes)
                        closeSellerDetailsModal()
                      }}
                      className="btn-premium"
                      style={{ flex: 1, background: 'var(--status-active-text)', color: 'white', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' }}
                    >
                      <i className="fa-solid fa-check-circle"></i>
                      <span>Approve Access</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. User Create / Edit / View Console Modal */}
      {showModal && (
        <div className="premium-admin-modal-overlay" onClick={handleCloseModal}>
          <div 
            className="premium-admin-modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-header-premium">
              <h2>
                <i className="fa-solid fa-user-gear"></i>
                <span>
                  {modalMode === 'create' && 'Create System User'}
                  {modalMode === 'edit' && 'Edit System User'}
                  {modalMode === 'view' && 'User Information details'}
                </span>
              </h2>
              <button 
                type="button"
                onClick={handleCloseModal} 
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            {modalMode === 'view' ? (
              <div className="modal-body-premium">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Name</span>
                    <span className="modal-detail-value">{selectedUser?.fullName || selectedUser?.name || 'N/A'}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Email Address</span>
                    <span className="modal-detail-value">{selectedUser?.email}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Email Verified</span>
                    <span className="modal-detail-value" style={{ color: selectedUser?.emailVerified ? 'var(--status-active-text)' : 'var(--status-danger-text)' }}>
                      {selectedUser?.emailVerified ? 'Verified ✓' : 'Pending ✗'}
                    </span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">System Role</span>
                    <span className="modal-detail-value">
                      <span className={`badge-role ${selectedUser?.isAdmin ? 'admin' : ''}`}>
                        {selectedUser?.isAdmin ? '👑 System Admin' : 'End User'}
                      </span>
                    </span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Phone Number</span>
                    <span className="modal-detail-value">{selectedUser?.phone || 'N/A'}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">City / Location</span>
                    <span className="modal-detail-value">{selectedUser?.city || 'N/A'}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">University Academic</span>
                    <span className="modal-detail-value">{selectedUser?.university || 'N/A'}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Department / Major</span>
                    <span className="modal-detail-value">{selectedUser?.department || 'N/A'}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Account Created On</span>
                    <span className="modal-detail-value">{new Date(selectedUser?.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-key">Last Account Sync</span>
                    <span className="modal-detail-value">{new Date(selectedUser?.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="modal-footer-premium">
                  <button type="button" onClick={handleCloseModal} className="btn-premium" style={{ background: 'var(--primary-charcoal)', color: 'white' }}>
                    Dismiss Details
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitUser}>
                <div className="modal-body-premium">
                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label htmlFor="name">Full Name</label>
                      <div className="modal-input-shell">
                        <i className="fa-solid fa-user"></i>
                        <input 
                          type="text" 
                          id="name" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleInputChange} 
                          placeholder="Enter display name..." 
                        />
                      </div>
                    </div>

                    <div className="modal-form-group">
                      <label htmlFor="email">Email Address *</label>
                      <div className="modal-input-shell">
                        <i className="fa-solid fa-envelope"></i>
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleInputChange} 
                          placeholder="Enter email address..." 
                          required 
                          disabled={modalMode === 'edit'} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-form-group" style={{ marginTop: '0.5rem' }}>
                    <label htmlFor="password">
                      Password {modalMode === 'create' ? '*' : '(Leave blank to keep existing)'}
                    </label>
                    <div className="modal-input-shell">
                      <i className="fa-solid fa-lock"></i>
                      <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleInputChange} 
                        placeholder={modalMode === 'create' ? "Minimum 6 characters..." : "Enter new security key..."} 
                        required={modalMode === 'create'} 
                        minLength={6} 
                      />
                    </div>
                  </div>

                  <div className="modal-checkbox-row" style={{ marginTop: '0.75rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1.25rem' }}>
                    <label className="modal-checkbox-label">
                      <input 
                        type="checkbox" 
                        name="emailVerified" 
                        checked={formData.emailVerified} 
                        onChange={handleInputChange} 
                      />
                      <span>Mark Email Verified</span>
                    </label>
                    
                    <label className="modal-checkbox-label">
                      <input 
                        type="checkbox" 
                        name="isAdmin" 
                        checked={formData.isAdmin} 
                        onChange={handleInputChange} 
                      />
                      <span>Assign Administrator Privileges</span>
                    </label>
                  </div>
                </div>
                
                <div className="modal-footer-premium">
                  <button type="button" onClick={handleCloseModal} className="btn-premium" style={{ background: 'transparent', color: 'var(--primary-charcoal)', border: '1px solid var(--admin-border)', boxShadow: 'none' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-premium primary">
                    {modalMode === 'create' ? 'Create User' : 'Update Credentials'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Delete Subscription Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteSubModal}
        title={subToDelete?.type === 'tutor' ? 'Delete Tutor Subscription' : 'Delete Seller Subscription'}
        message={`Are you sure you want to delete this ${subToDelete?.type || 'subscription'} request? This cannot be undone.`}
        onConfirm={confirmDeleteSub}
        onCancel={cancelDeleteSub}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
