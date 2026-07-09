import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle, Trash2, Unlock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import useChatUnreadCount from '../hooks/useChatUnreadCount'
import { fetchWithErrorHandling, API_BASE_URL } from '../utils/api'
import { getAuthToken } from '../utils/authStorage'
import ConfirmModal from '../components/ConfirmModal'
import '../styles/Profile.css'
import '../styles/logoAnimations.css'

const EMPTY_TUTOR_APPLICATION_FORM = {
  fullName: '',
  email: '',
  phone: '',
  cnic: '',
  university: '',
  degreeProgram: '',
  currentSemester: '',
  subjects: '',
  specialization: '',
  gpa: '',
  teachingExperience: '',
  certifications: '',
  achievements: '',
  linkedinPortfolio: ''
}

export default function Profile() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const chatUnreadCount = useChatUnreadCount(user?.id)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tutorApplications, setTutorApplications] = useState([])
  const [tutorSubscription, setTutorSubscription] = useState(null)
  const [loadingSubscription, setLoadingSubscription] = useState(false)
  const [loadingTutorApplications, setLoadingTutorApplications] = useState(false)
  const [savingTutorApplication, setSavingTutorApplication] = useState(false)
  const [deletingApplicationId, setDeletingApplicationId] = useState('')
  const [pendingDeleteApplicationId, setPendingDeleteApplicationId] = useState('')
  const [showDeleteTutorModal, setShowDeleteTutorModal] = useState(false)
  const [editingApplicationId, setEditingApplicationId] = useState('')
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [tutorApplicationForm, setTutorApplicationForm] = useState(EMPTY_TUTOR_APPLICATION_FORM)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false)
  const [blockedUsersLoaded, setBlockedUsersLoaded] = useState(false)
  const [showUnblockModal, setShowUnblockModal] = useState(false)
  const [unblockingConversationId, setUnblockingConversationId] = useState('')
  const [unblockingUser, setUnblockingUser] = useState(null)
  const [unblockingInProgress, setUnblockingInProgress] = useState(false)
  const [myLearningAgreements, setMyLearningAgreements] = useState([])
  const [loadingMyLearningAgreements, setLoadingMyLearningAgreements] = useState(false)
  const [myLearningAgreementsLoaded, setMyLearningAgreementsLoaded] = useState(false)
  const [showDeleteAgreementConfirm, setShowDeleteAgreementConfirm] = useState(false)
  const [agreementToDelete, setAgreementToDelete] = useState(null)
  const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [myOrders, setMyOrders] = useState([])
  const [loadingMyOrders, setLoadingMyOrders] = useState(false)
  const [myOrdersLoaded, setMyOrdersLoaded] = useState(false)
  const [myItems, setMyItems] = useState([])
  const [loadingMyItems, setLoadingMyItems] = useState(false)
  const [myItemsLoaded, setMyItemsLoaded] = useState(false)
  const [sellerReceivedOrders, setSellerReceivedOrders] = useState([])
  const [loadingSellerOrders, setLoadingSellerOrders] = useState(false)
  const [sellerOrdersLoaded, setSellerOrdersLoaded] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/')
  }
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    gender: '',
    dateofbirth: '',
    careerInterest: '',
    profileImage: '',
    schoolUniversity: '',
    degreeGradeType: '',
    department: '',
    currentSemesterYear: '',
    cgpaPercentage: '',
    isTutor: false,
    careerPathStages: {
      profileSetup: false,
      careerAssessment: false,
      universitySelection: false
    }
  })

  useEffect(() => {
    fetchProfileData()
    fetchBlockedUsers(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'tutor-applications') {
      fetchTutorApplications(true)
      fetchTutorSubscription()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'blocked-users') {
      fetchBlockedUsers(true)
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'my-learning-agreements' && !myLearningAgreementsLoaded) {
      fetchMyLearningAgreements(true)
    }
  }, [activeTab, myLearningAgreementsLoaded])

  useEffect(() => {
    if (activeTab === 'my-items' && !myItemsLoaded) {
      fetchMyItems(true)
    }
  }, [activeTab, myItemsLoaded])

  useEffect(() => {
    if (activeTab === 'seller-orders' && !sellerOrdersLoaded) {
      fetchSellerReceivedOrders(true)
    }
  }, [activeTab, sellerOrdersLoaded])

  useEffect(() => {
    setShowProfileMenu(false)
  }, [activeTab])

  const fetchProfileData = async () => {
    try {
      const token = getAuthToken()
      const response = await fetchWithErrorHandling('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Fetched profile data:', response)
      
      if (response) {
        setProfileData({
          name: response.name || '',
          email: response.email || '',
          phone: response.phone || '',
          city: response.city || '',
          gender: response.gender || '',
          dateofbirth: response.dateofbirth || '',
          careerInterest: response.careerInterest || '',
          schoolUniversity: response.schoolUniversity || '',
          degreeGradeType: response.degreeGradeType || '',
          department: response.department || '',
          currentSemesterYear: response.currentSemesterYear || '',
          cgpaPercentage: response.cgpaPercentage || '',
          profileImage: response.profileImage || '',
          isTutor: response.isTutor || false,
          careerPathStages: response.careerPathStages || {
            profileSetup: false,
            careerAssessment: false,
            universitySelection: false
          }
        })
      }
    } catch (error) {
      console.error('Fetch profile error:', error)
      showToast(error.message || 'Failed to load profile data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const buildApplicationFormFromProfile = () => ({
    ...EMPTY_TUTOR_APPLICATION_FORM,
    fullName: profileData.name || user?.name || '',
    email: profileData.email || user?.email || '',
    phone: profileData.phone || '',
    university: profileData.schoolUniversity || '',
    degreeProgram: profileData.department || '',
    currentSemester: profileData.currentSemesterYear || '',
    gpa: profileData.cgpaPercentage || ''
  })

  const buildApplicationFormFromApplication = (application) => ({
    ...EMPTY_TUTOR_APPLICATION_FORM,
    fullName: application?.fullName || '',
    email: application?.email || '',
    phone: application?.phone || '',
    cnic: application?.cnic || '',
    university: application?.university || '',
    degreeProgram: application?.degreeProgram || '',
    currentSemester: application?.currentSemester || '',
    subjects: Array.isArray(application?.subjects) ? application.subjects.join(', ') : '',
    specialization: application?.specialization || '',
    gpa: application?.gpa || '',
    teachingExperience: application?.teachingExperience || '',
    certifications: application?.certifications || '',
    achievements: application?.achievements || '',
    linkedinPortfolio: application?.linkedinPortfolio || ''
  })

  const fetchTutorApplications = async (showErrorToast = false) => {
    try {
      setLoadingTutorApplications(true)
      const token = getAuthToken()
      try {
        const response = await fetchWithErrorHandling('/tutors/my-applications', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        setTutorApplications(Array.isArray(response?.applications) ? response.applications : [])
      } catch {
        // Backward compatibility: older backend may only expose /my-application.
        const fallbackResponse = await fetchWithErrorHandling('/tutors/my-application', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const legacyApplication = fallbackResponse?.application
        setTutorApplications(legacyApplication ? [legacyApplication] : [])
      }
    } catch (error) {
      console.error('Fetch tutor applications error:', error)
      if (showErrorToast) {
        showToast(error.message || 'Failed to load tutor applications', 'error')
      }
    } finally {
      setLoadingTutorApplications(false)
    }
  }

  const fetchTutorSubscription = async () => {
    try {
      setLoadingSubscription(true)
      const token = getAuthToken()
      const response = await fetchWithErrorHandling('/tutors/my-subscription', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (response?.success) {
        setTutorSubscription(response)
      }
    } catch (error) {
      console.error('Fetch tutor subscription error:', error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const fetchBlockedUsers = async (showErrorToast = false) => {
    try {
      setLoadingBlockedUsers(true)
      const response = await fetchWithErrorHandling('/chat/blocked-users', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      })

      setBlockedUsers(Array.isArray(response?.blockedUsers) ? response.blockedUsers : [])
      setBlockedUsersLoaded(true)
    } catch (error) {
      console.error('Fetch blocked users error:', error)
      if (showErrorToast) {
        showToast(error.message || 'Failed to load blocked users', 'error')
      }
    } finally {
      setLoadingBlockedUsers(false)
    }
  }

  const openBlockedUsersTab = async () => {
    setShowProfileMenu(false)
    setActiveTab('blocked-users')
    if (!blockedUsersLoaded) {
      await fetchBlockedUsers(true)
    }
  }

  const fetchMyLearningAgreements = async (showErrorToast = false) => {
    try {
      setLoadingMyLearningAgreements(true)
      const response = await fetchWithErrorHandling('/chat/agreements/mine', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      })

      setMyLearningAgreements(Array.isArray(response?.agreements) ? response.agreements : [])
      setMyLearningAgreementsLoaded(true)
    } catch (error) {
      console.error('Fetch my learning agreements error:', error)
      if (showErrorToast) {
        showToast(error.message || 'Failed to load learning agreements', 'error')
      }
    } finally {
      setLoadingMyLearningAgreements(false)
    }
  }

  const openMyLearningAgreementsTab = async () => {
    if (!profileData.isTutor) {
      showToast('Only tutors can view learning agreements', 'error')
      return
    }

    setShowProfileMenu(false)
    setActiveTab('my-learning-agreements')
    if (!myLearningAgreementsLoaded) {
      await fetchMyLearningAgreements(true)
    }
  }

  const fetchMyOrders = async (showErrorToast = false) => {
    try {
      setLoadingMyOrders(true)
      const response = await fetchWithErrorHandling('/orders/my-orders', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      })

      setMyOrders(Array.isArray(response?.orders) ? response.orders : [])
      setMyOrdersLoaded(true)
    } catch (error) {
      console.error('Fetch my orders error:', error)
      if (showErrorToast) {
        showToast(error.message || 'Failed to load orders', 'error')
      }
    } finally {
      setLoadingMyOrders(false)
    }
  }

  const openMyOrdersTab = async () => {
    setShowProfileMenu(false)
    setActiveTab('my-orders')
    if (!myOrdersLoaded) {
      await fetchMyOrders(true)
    }
  }

  const openSellerReceivedOrdersTab = async () => {
    setShowProfileMenu(false)
    setActiveTab('seller-orders')
    if (!sellerOrdersLoaded) {
      await fetchSellerReceivedOrders(true)
    }
  }

  const fetchMyItems = async (showErrorToast = false) => {
    try {
      setLoadingMyItems(true)
      const response = await fetchWithErrorHandling('/marketplace/my-items/all', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      })

      setMyItems(Array.isArray(response?.data) ? response.data : [])
      setMyItemsLoaded(true)
    } catch (error) {
      console.error('Fetch my items error:', error)
      if (showErrorToast) {
        showToast(error.message || 'Failed to load your items', 'error')
      }
    } finally {
      setLoadingMyItems(false)
    }
  }

  const openUnblockModal = (entry) => {
    setUnblockingConversationId(entry.conversationId)
    setUnblockingUser(entry.user)
    setShowUnblockModal(true)
  }

  const fetchSellerReceivedOrders = async (showErrorToast = false) => {
    try {
      setLoadingSellerOrders(true)
      const response = await fetchWithErrorHandling('/orders/seller/received-orders', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      })

      setSellerReceivedOrders(Array.isArray(response?.orders) ? response.orders : [])
      setSellerOrdersLoaded(true)
    } catch (error) {
      console.error('Fetch seller received orders error:', error)
      if (showErrorToast) {
        showToast(error.message || 'Failed to load received orders', 'error')
      }
    } finally {
      setLoadingSellerOrders(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId)
      setUpdatingOrderStatus(newStatus)
      const response = await fetchWithErrorHandling(`/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response?.success) {
        showToast('Order status updated successfully', 'success')
        // Update the order in the local state
        setSellerReceivedOrders(orders => 
          orders.map(order => 
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        )
      }
    } catch (error) {
      console.error('Update order status error:', error)
      showToast(error.message || 'Failed to update order status', 'error')
    } finally {
      setUpdatingOrderId('')
      setUpdatingOrderStatus('')
    }
  }

  const closeUnblockModal = () => {
    if (unblockingInProgress) return
    setShowUnblockModal(false)
    setUnblockingConversationId('')
    setUnblockingUser(null)
  }

  const handleConfirmUnblock = async () => {
    if (!unblockingConversationId || unblockingInProgress) return

    try {
      setUnblockingInProgress(true)
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/chat/conversations/${unblockingConversationId}/block`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to unblock user')
      }

      showToast('User unblocked successfully', 'success')
      closeUnblockModal()
      // Refresh the blocked users list
      await fetchBlockedUsers(false)
    } catch (error) {
      showToast(error.message || 'Failed to unblock user', 'error')
    } finally {
      setUnblockingInProgress(false)
    }
  }

  const handleDeleteItemRequest = (itemId) => {
    setItemToDelete(itemId)
    setShowDeleteItemConfirm(true)
  }

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetchWithErrorHandling(`/marketplace/${itemToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      })

      if (response?.success) {
        showToast('Item deleted successfully', 'success')
        await fetchMyItems(false)
      }
    } catch (error) {
      console.error('Delete item error:', error)
      showToast(error.message || 'Failed to delete item', 'error')
    } finally {
      setShowDeleteItemConfirm(false)
      setItemToDelete(null)
    }
  }

  const handleDeleteLearningAgreement = async (agreementId) => {
    setAgreementToDelete(agreementId)
    setShowDeleteAgreementConfirm(true)
  }

  const confirmDeleteLearningAgreement = async () => {
    if (!agreementToDelete) return

    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/chat/agreements/${agreementToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete learning agreement')
      }

      showToast('Learning agreement deleted successfully', 'success')
      // Refresh the list
      await fetchMyLearningAgreements(false)
    } catch (error) {
      showToast(error.message || 'Failed to delete learning agreement', 'error')
    } finally {
      setShowDeleteAgreementConfirm(false)
      setAgreementToDelete(null)
    }
  }

  const handleTutorApplicationInputChange = (e) => {
    const { name, value } = e.target
    setTutorApplicationForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const openEditTutorApplication = (application) => {
    setEditingApplicationId(application._id)
    setTutorApplicationForm(buildApplicationFormFromApplication(application))
    setShowApplicationForm(true)
  }

  const closeTutorApplicationForm = () => {
    setShowApplicationForm(false)
    setEditingApplicationId('')
    setTutorApplicationForm(EMPTY_TUTOR_APPLICATION_FORM)
  }

  const submitTutorApplication = async (e) => {
    e.preventDefault()

    const requiredFields = [
      'fullName',
      'email',
      'phone',
      'cnic',
      'university',
      'degreeProgram',
      'currentSemester',
      'subjects',
      'specialization'
    ]

    const hasMissingFields = requiredFields.some((field) => !String(tutorApplicationForm[field] || '').trim())
    if (hasMissingFields) {
      showToast('Please complete all required fields before submitting.', 'error')
      return
    }

    // Parse new subjects - normalize for comparison
    const newSubjectsRaw = tutorApplicationForm.subjects
      .split(',')
      .map((subject) => subject.trim())
      .filter(Boolean)

    const newSubjectsLower = newSubjectsRaw.map((s) => s.toLowerCase())

    // Check for duplicate subjects WITHIN the same form (e.g., "math, physics, math")
    const uniqueSubjects = new Set(newSubjectsLower)
    if (uniqueSubjects.size !== newSubjectsLower.length) {
      const duplicatesWithin = newSubjectsRaw.filter((subject, index) => {
        return newSubjectsRaw.findIndex((s) => s.toLowerCase() === subject.toLowerCase()) !== index
      })
      const uniqueDuplicates = [...new Set(duplicatesWithin.map((s) => s.toLowerCase()))]
      showToast(
        `You have duplicate subject(s) in the form: ${uniqueDuplicates.join(', ')}. Please remove duplicates.`,
        'error'
      )
      return
    }

    // Check for duplicate subjects against existing applications (only when creating new)
    if (!editingApplicationId && tutorApplications.length > 0) {
      const existingSubjects = new Set()
      tutorApplications.forEach((app) => {
        if (Array.isArray(app.subjects)) {
          app.subjects.forEach((subject) => {
            existingSubjects.add(String(subject).trim().toLowerCase())
          })
        }
      })

      const duplicates = newSubjectsLower.filter((subject) => existingSubjects.has(subject))
      if (duplicates.length > 0) {
        showToast(
          `You already have an application with the following subject(s): ${duplicates.join(', ')}. Each tutor can only apply for a subject once.`,
          'error'
        )
        return
      }
    }

    // Verify active subscription and course limit
    if (!tutorSubscription || !tutorSubscription.hasActiveSubscription) {
      showToast('An active tutor subscription is required to submit course applications. Please purchase a membership plan on the Mentorship page.', 'error')
      return
    }

    const nextSubjectsLength = newSubjectsRaw.length
    if (editingApplicationId) {
      const currentApplication = tutorApplications.find(app => app._id === editingApplicationId)
      const currentSubjectsLength = currentApplication ? currentApplication.subjects.length : 0
      const diff = nextSubjectsLength - currentSubjectsLength
      
      if (diff > 0) {
        let otherCoursesCount = 0
        tutorApplications.forEach(app => {
          if (app._id !== editingApplicationId && (app.status === 'Pending' || app.status === 'Approved')) {
            if (Array.isArray(app.subjects)) {
              otherCoursesCount += app.subjects.length
            }
          }
        })
        
        if (otherCoursesCount + nextSubjectsLength > tutorSubscription.coursesLimit) {
          showToast(`You would exceed your subscription's course limit of ${tutorSubscription.coursesLimit} courses. Remaining allowance: ${tutorSubscription.coursesRemaining} courses.`, 'error')
          return
        }
      }
    } else {
      if (tutorSubscription.coursesUsed + nextSubjectsLength > tutorSubscription.coursesLimit) {
        showToast(`You would exceed your subscription's course limit of ${tutorSubscription.coursesLimit} courses. Remaining allowance: ${tutorSubscription.coursesRemaining} courses.`, 'error')
        return
      }
    }

    try {
      setSavingTutorApplication(true)

      const payload = {
        ...tutorApplicationForm,
        subjects: newSubjectsRaw,
        certificateDocuments: []
      }

      const response = await fetchWithErrorHandling(
        editingApplicationId ? `/tutors/my-applications/${editingApplicationId}` : '/tutors/my-applications',
        {
          method: editingApplicationId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify(payload)
        }
      )

      if (response?.success) {
        if (response.paymentRequired && response.redirectUrl && response.fields) {
          showToast('Redirecting to PayFast payment gateway...', 'info')
          
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = response.redirectUrl
          form.style.display = 'none'

          Object.entries(response.fields).forEach(([key, value]) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = value
            form.appendChild(input)
          })

          document.body.appendChild(form)
          form.submit()
          return
        }

        showToast(editingApplicationId ? 'Application updated and approved successfully!' : 'Application submitted and approved successfully!', 'success')
        closeTutorApplicationForm()
        fetchTutorApplications(true)
        fetchTutorSubscription()
        fetchProfileData()
      }
    } catch (error) {
      console.error('Tutor application submit error:', error)
      showToast(error.message || 'Failed to save tutor application', 'error')
    } finally {
      setSavingTutorApplication(false)
    }
  }

  const requestDeleteTutorApplication = (applicationId) => {
    if (!applicationId || deletingApplicationId) return
    setPendingDeleteApplicationId(applicationId)
    setShowDeleteTutorModal(true)
  }

  const closeDeleteTutorModal = () => {
    if (deletingApplicationId) return
    setShowDeleteTutorModal(false)
    setPendingDeleteApplicationId('')
  }

  const confirmDeleteTutorApplication = async () => {
    const applicationId = pendingDeleteApplicationId
    if (!applicationId) return

    try {
      setDeletingApplicationId(applicationId)
      const response = await fetchWithErrorHandling(`/tutors/my-applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      })

      if (response?.success) {
        showToast('Application deleted successfully', 'success')
        if (editingApplicationId === applicationId) {
          closeTutorApplicationForm()
        }
        fetchTutorApplications(true)
        fetchProfileData()
      }
    } catch (error) {
      console.error('Delete tutor application error:', error)
      showToast(error.message || 'Failed to delete tutor application', 'error')
    } finally {
      setDeletingApplicationId('')
      setPendingDeleteApplicationId('')
      setShowDeleteTutorModal(false)
    }
  }

  const getApplicationStatusClass = (status = 'Pending') => {
    const normalized = status.toLowerCase()
    if (normalized === 'approved') return 'status-approved'
    if (normalized === 'rejected' || normalized === 'payment_failed' || normalized === 'payment_cancelled') return 'status-rejected'
    return 'status-pending'
  }

  const handlePayNow = async (application) => {
    try {
      setSavingTutorApplication(true)
      showToast('Initializing payment gateway...', 'info')
      
      const response = await fetchWithErrorHandling(
        `/tutors/my-applications/${application._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({
            ...application,
            subjects: Array.isArray(application.subjects) ? application.subjects : [application.subjects]
          })
        }
      )

      if (response?.success && response.paymentRequired && response.redirectUrl && response.fields) {
        showToast('Redirecting to PayFast payment gateway...', 'info')
        
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = response.redirectUrl
        form.style.display = 'none'

        Object.entries(response.fields).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = value
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()
      } else {
        showToast('Failed to initialize payment gateway.', 'error')
      }
    } catch (error) {
      console.error('Pay now error:', error)
      showToast(error.message || 'Failed to initialize payment', 'error')
    } finally {
      setSavingTutorApplication(false)
    }
  }

  const formatApplicationDate = (value) => {
    if (!value) return 'Unknown date'
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatBlockedDate = (value) => {
    if (!value) return 'Unknown date'
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          profileImage: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const dataToSend = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        city: profileData.city,
        gender: profileData.gender,
        dateofbirth: profileData.dateofbirth,
        careerInterest: profileData.careerInterest,
        profileImage: profileData.profileImage,
        schoolUniversity: profileData.schoolUniversity,
        degreeGradeType: profileData.degreeGradeType,
        department: profileData.department,
        currentSemesterYear: profileData.currentSemesterYear,
        cgpaPercentage: profileData.cgpaPercentage,
        isTutor: profileData.isTutor,
        careerPathStages: profileData.careerPathStages
      }
      
      console.log('Sending profile data:', dataToSend)
      
      const response = await fetchWithErrorHandling('/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      })
      
      console.log('Profile update response:', response)
      
      if (response) {
        showToast('Profile updated successfully!', 'success')
        setIsEditing(false)
  
        setProfileData({
          name: response.name || '',
          email: response.email || '',
          phone: response.phone || '',
          city: response.city || '',
          gender: response.gender || '',
          dateofbirth: response.dateofbirth || '',
          careerInterest: response.careerInterest || '',
          schoolUniversity: response.schoolUniversity || '',
          degreeGradeType: response.degreeGradeType || '',
          department: response.department || '',
          currentSemesterYear: response.currentSemesterYear || '',
          cgpaPercentage: response.cgpaPercentage || '',
          profileImage: response.profileImage || '',
          isTutor: response.isTutor || false,
          careerPathStages: response.careerPathStages || {
            profileSetup: false,
            careerAssessment: false,
            universitySelection: false
          }
        })
  
        if (updateUser) {
          updateUser(response)
        }
        setActiveTab('overview')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      showToast(error.message || 'Failed to update profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    fetchProfileData()
  }

  const calculateProfileCompletion = () => {
    const personalFields = [
      profileData.name,
      profileData.email,
      profileData.phone,
      profileData.city,
      profileData.gender,
      profileData.dateofbirth,
      profileData.careerInterest,
      profileData.profileImage
    ]
    
    const academicFields = [
      profileData.schoolUniversity,
      profileData.degreeGradeType,
      profileData.department,
      profileData.currentSemesterYear,
      profileData.cgpaPercentage
    ]

    const personalFilled = personalFields.filter(field => field && field !== '').length
    const academicFilled = academicFields.filter(field => field && field !== '').length
    const totalFilledFields = personalFilled + academicFilled
    const maxFields = 13
    
    return Math.round((totalFilledFields / maxFields) * 100)
  }

  const profileCompletion = calculateProfileCompletion()

  if (loading && !profileData.email) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <header className="dashboard-header">
        <div className="container header-inner">
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img src="/images/CM.png" alt="CareerMap Logo" className="logo-combined" style={{ width: '128px', height: '128px', objectFit: 'contain' }} />
            <div className="logo-brand-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', lineHeight: '1.15' }}>
              <span className="logo-text" style={{ fontSize: '30px', fontWeight: '800', color: '#5c4a3d', letterSpacing: '-0.5px' }}>CareerMap</span>
              <span className="logo-tagline" style={{ fontSize: '11px', fontWeight: '600', color: '#8b6e58', marginTop: '2px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Find Your Way. Own Your Future.</span>
            </div>
          </div>
          
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
          
          <nav className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
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
            {user?.isAdmin && (
              <Link to="/admin" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                Admin Dashboard
              </Link>
            )}
          </nav>

          <div className="nav-actions">
            <div className="user-menu">
              <Link to="/profile" className="user-avatar active">
                {profileData.profileImage ? (
                  <img 
                    src={profileData.profileImage} 
                    alt={profileData.name || 'User'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </Link>
              <button className="btn-logout" onClick={handleLogout}>
                logout
              </button>
              <div className="profile-menu-wrapper">
                <button
                  type="button"
                  className="profile-menu-toggle"
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  aria-label="Open profile options"
                  aria-expanded={showProfileMenu}
                >
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </button>
                {showProfileMenu && (
                  <div className="profile-menu-dropdown" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      className="profile-menu-item"
                      onClick={openBlockedUsersTab}
                    >
                      Blocked in users
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="profile-menu-item"
                      onClick={openMyOrdersTab}
                    >
                      View all your orders
                    </button>
                    {profileData.isTutor && (
                      <button
                        type="button"
                        role="menuitem"
                        className="profile-menu-item"
                        onClick={openMyLearningAgreementsTab}
                      >
                        View all your learning agreements
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      className="profile-menu-item"
                      onClick={openSellerReceivedOrdersTab}
                    >
                      Received Orders
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="profile-main">
        <div className="container">
          <div className="profile-hero">
            <div className="profile-hero-left">
              <div className="profile-avatar-section">
                <div className="profile-avatar-wrapper">
                  <img 
                    src={profileData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&size=200&background=A78B71&color=fff&bold=true`} 
                    alt="Profile" 
                    className="profile-avatar"
                  />
                  {isEditing && (
                    <label className="avatar-upload-btn">
                      <i className="fa-solid fa-camera"></i>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>
              
              <div className="profile-header-info">
                <h1 className="profile-name">{profileData.name || 'User Name'}</h1>
                <p className="profile-career-interest">{profileData.careerInterest || 'No career interest selected'}</p>
                
                {/*  Grid */}
                <div className="profile-quick-info">
                  <div className="quick-info-item full-width">
                    <i className="fa-solid fa-envelope"></i>
                    <span>{profileData.email || 'No email'}</span>
                  </div>
                  <div className="quick-info-item">
                    <i className="fa-solid fa-phone"></i>
                    <span>{profileData.phone || 'No phone'}</span>
                  </div>
                  <div className="quick-info-item">
                    <i className="fa-solid fa-location-dot"></i>
                    <span>{profileData.city || 'No city'}</span>
                  </div>
                  <div className="quick-info-item">
                    <i className="fa-solid fa-person-half-dress"></i>
                    <span>{profileData.gender || 'No gender'}</span>
                  </div>
                </div>
                <div className="profile-tags">
                  {profileData.isTutor && (
                    <span className="profile-tag tag-gold">Tutor Option Enabled</span>
                  )}
                </div>
                
                <div className="profile-actions">
                  {!isEditing && (
                    <button 
                      className="btn-primary" 
                      onClick={() => {
                        setIsEditing(true);
                        if (activeTab === 'overview') {
                          setActiveTab('personal');
                        }
                      }}
                    >
                      <i className="fa-solid fa-pen"></i> Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="profile-hero-right">
              <div className="completion-card">
                <h3 className="completion-title">
                  <i className="fa-solid fa-chart-line"></i> Profile Completion
                </h3>
                <div className="completion-percentage">
                  <span className="percentage-value">{profileCompletion}%</span>
                  <span className="percentage-label">Complete</span>
                </div>
                <div className="completion-bar">
                  <div 
                    className="completion-progress" 
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
                <p className="completion-message">
                  {profileCompletion === 100 
                    ? ' Your profile is complete!' 
                    : `${100 - profileCompletion}% remaining - Complete your profile`}
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="profile-tabs">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Information
            </button>
            <button 
              className={`tab-button ${activeTab === 'academic' ? 'active' : ''}`}
              onClick={() => setActiveTab('academic')}
            >
              Academic Information
            </button>
            <button
              className={`tab-button ${activeTab === 'tutor-applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('tutor-applications')}
            >
              Tutor Applications
            </button>
            <button
              className={`tab-button ${activeTab === 'my-items' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-items')}
            >
              My Items (For Sale)
            </button>
          </div>
          <div className="profile-grid">
            {activeTab === 'personal' && (
            <div className="profile-card tab-card">
              <div className="card-header-tab">
                <div className="tab-header-left">
                  <div className="tab-indicator"></div>
                  <h2 className="card-title">
                    <i className="fa-solid fa-user"></i> Personal Information
                  </h2>
                </div>
                {!isEditing && (
                  <button className="btn-edit-card" onClick={() => setIsEditing(true)}>
                    <i className="fa-solid fa-pen"></i> Edit
                  </button>
                )}
              </div>
              <div className="card-content">
                <div className="info-grid">
                  <div className="info-item">
                    <label className="info-label">Student Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="name"
                        className="form-input"
                        value={profileData.name}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="info-value">{profileData.name || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="info-item">
                    <label className="info-label">Career Interest</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="careerInterest"
                        className="form-input"
                        value={profileData.careerInterest}
                        onChange={handleInputChange}
                        placeholder="e.g., Software Development"
                      />
                    ) : (
                      <p className="info-value">{profileData.careerInterest || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="info-item full-width">
                    <label className="info-label">Email</label>
                    <p className="info-value">{profileData.email}</p>
                  </div>

                  <div className="info-item">
                    <label className="info-label">Phone Number</label>
                    {isEditing ? (
                      <input 
                        type="tel" 
                        name="phone"
                        className="form-input"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        placeholder="+92 300 1234567"
                      />
                    ) : (
                      <p className="info-value">{profileData.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="info-item">
                    <label className="info-label">City</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="city"
                        className="form-input"
                        value={profileData.city}
                        onChange={handleInputChange}
                        placeholder="e.g., Karachi"
                      />
                    ) : (
                      <p className="info-value">{profileData.city || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="info-item">
                    <label className="info-label">Gender</label>
                    {isEditing ? (
                      <select 
                        name="gender"
                        className="form-input"
                        value={profileData.gender}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="info-value">{profileData.gender || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="info-item">
                    <label className="info-label">Date of Birth</label>
                    {isEditing ? (
                      <input 
                        type="date" 
                        name="dateofbirth"
                        className="form-input"
                        value={profileData.dateofbirth}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="info-value">{profileData.dateofbirth || 'Not provided'}</p>
                    )}
                  </div>


                </div>
                {isEditing && (
                  <div className="card-actions">
                    <button className="btn-save" onClick={handleSave} disabled={loading}>
                      <i className="fa-solid fa-check"></i> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="btn-cancel" onClick={handleCancel}>
                      <i className="fa-solid fa-times"></i> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            )}

            {activeTab === 'academic' && (
            <div className="profile-card tab-card">
              <div className="card-header-tab">
                <div className="tab-header-left">
                  <div className="tab-indicator"></div>
                  <h2 className="card-title">
                    <i className="fa-solid fa-graduation-cap"></i> Academic Information
                  </h2>
                </div>
                {!isEditing && (
                  <button className="btn-edit-card" onClick={() => setIsEditing(true)}>
                    <i className="fa-solid fa-pen"></i> Edit
                  </button>
                )}
              </div>
              <div className="card-content">
                <div className="academic-info-grid">
                  <div className="academic-info-item full-width">
                    <label className="academic-info-label">School / University Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="schoolUniversity"
                        className="form-input"
                        value={profileData.schoolUniversity}
                        onChange={handleInputChange}
                        placeholder="e.g., University of Karachi, Model High School"
                      />
                    ) : (
                      <p className="academic-info-value">{profileData.schoolUniversity || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="academic-info-item">
                    <label className="academic-info-label">Degree / Grade Type</label>
                    {isEditing ? (
                      <select 
                        name="degreeGradeType"
                        className="form-input"
                        value={profileData.degreeGradeType}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Degree/Grade Type</option>
                        <option value="High School">High School</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Bachelor's">Bachelor's</option>
                        <option value="Master's">Master's</option>
                        <option value="PhD">PhD</option>
                      </select>
                    ) : (
                      <p className="academic-info-value">{profileData.degreeGradeType || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="academic-info-item">
                    <label className="academic-info-label">Department / Stream</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="department"
                        className="form-input"
                        value={profileData.department}
                        onChange={handleInputChange}
                        placeholder="e.g., Computer Science, Commerce, Science"
                      />
                    ) : (
                      <p className="academic-info-value">{profileData.department || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="academic-info-item">
                    <label className="academic-info-label">Current Semester / Year</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="currentSemesterYear"
                        className="form-input"
                        value={profileData.currentSemesterYear}
                        onChange={handleInputChange}
                        placeholder="e.g., Semester 4, Year 2"
                      />
                    ) : (
                      <p className="academic-info-value">{profileData.currentSemesterYear || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="academic-info-item">
                    <label className="academic-info-label">CGPA / Percentage</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="cgpaPercentage"
                        className="form-input"
                        value={profileData.cgpaPercentage}
                        onChange={handleInputChange}
                        placeholder="e.g., 3.8/4.0 or 85%"
                      />
                    ) : (
                      <p className="academic-info-value">{profileData.cgpaPercentage || 'Not provided'}</p>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="card-actions">
                    <button className="btn-save" onClick={handleSave} disabled={loading}>
                      <i className="fa-solid fa-check"></i> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="btn-cancel" onClick={handleCancel}>
                      <i className="fa-solid fa-times"></i> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
               
                <div className="overview-stats">
                  <div className="stat-card">
                    <div className="stat-icon blue">
                      <i className="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-value">{profileData.cgpaPercentage || 'N/A'}</h3>
                      <p className="stat-label">CGPA / Percentage</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon green">
                      <i className="fa-solid fa-book"></i>
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-value">{profileData.currentSemesterYear || 'N/A'}</h3>
                      <p className="stat-label">Semester / Year</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon purple">
                      <i className="fa-solid fa-bullseye"></i>
                    </div>
                    <div className="stat-content">
                      <h3 className="stat-value">{calculateProfileCompletion()}%</h3>
                      <p className="stat-label">Profile Complete</p>
                    </div>
                  </div>
                </div>

                {/* Profile Summary */}
                <div className="overview-summary">
                  <div className="summary-card">
                    <div className="card-header-tab">
                      <div className="tab-header-left">
                        <div className="tab-indicator"></div>
                        <h2 className="card-title">
                          <i className="fa-solid fa-user-circle"></i> Profile Summary
                        </h2>
                      </div>
                    </div>
                    <div className="card-content">
                      <div className="summary-grid">
                        <div className="summary-item">
                          <div className="summary-icon">
                            <i className="fa-solid fa-user"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">Full Name</span>
                            <span className="summary-value">{profileData.name || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item full-width">
                          <div className="summary-icon">
                            <i className="fa-solid fa-envelope"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">Email</span>
                            <span className="summary-value">{profileData.email || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item">
                          <div className="summary-icon">
                            <i className="fa-solid fa-phone"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">Phone</span>
                            <span className="summary-value">{profileData.phone || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item">
                          <div className="summary-icon">
                            <i className="fa-solid fa-location-dot"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">City</span>
                            <span className="summary-value">{profileData.city || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item">
                          <div className="summary-icon">
                            <i className="fa-solid fa-venus-mars"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">Gender</span>
                            <span className="summary-value">{profileData.gender || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item">
                          <div className="summary-icon">
                            <i className="fa-solid fa-calendar"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">Date of Birth</span>
                            <span className="summary-value">{profileData.dateofbirth || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item full-width">
                          <div className="summary-icon">
                            <i className="fa-solid fa-building-columns"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">School / University</span>
                            <span className="summary-value">{profileData.schoolUniversity || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item">
                          <div className="summary-icon">
                            <i className="fa-solid fa-award"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">Degree Type</span>
                            <span className="summary-value">{profileData.degreeGradeType || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item">
                          <div className="summary-icon">
                            <i className="fa-solid fa-chart-bar"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">CGPA / Percentage</span>
                            <span className="summary-value">{profileData.cgpaPercentage || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item">
                          <div className="summary-icon">
                            <i className="fa-solid fa-layer-group"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">Semester / Year</span>
                            <span className="summary-value">{profileData.currentSemesterYear || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item">
                          <div className="summary-icon">
                            <i className="fa-solid fa-laptop-code"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">Department</span>
                            <span className="summary-value">{profileData.department || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item">
                          <div className="summary-icon">
                            <i className="fa-solid fa-compass"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">Career Interest</span>
                            <span className="summary-value">{profileData.careerInterest || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="summary-item">
                          <div className="summary-icon">
                            <i className="fa-solid fa-chalkboard-user"></i>
                          </div>
                          <div className="summary-details">
                            <span className="summary-label">Tutor Status</span>
                            <span className="summary-value">{profileData.isTutor ? 'Tutor Option Enabled' : 'Not a tutor yet'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'tutor-applications' && (
              <div className="profile-card tab-card tutor-applications-card">
                <div className="card-header-tab">
                  <div className="tab-header-left">
                    <div className="tab-indicator"></div>
                    <h2 className="card-title">
                      <i className="fa-solid fa-file-signature"></i> My Tutor Applications
                    </h2>
                  </div>
                </div>

                {tutorSubscription && (
                  <div style={{ margin: '1.5rem 1.5rem 0 1.5rem', background: '#EBF8FF', border: '1px solid #BEE3F8', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <i className="fa-solid fa-crown" style={{ color: '#FFD700' }}></i>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#2B6CB0', margin: 0 }}>
                            {tutorSubscription.hasActiveSubscription ? `${tutorSubscription.subscription.planType.replace('_', ' ').toUpperCase()} MEMBERSHIP` : 'NO ACTIVE MEMBERSHIP'}
                          </h3>
                        </div>
                        {tutorSubscription.hasActiveSubscription ? (
                          <p style={{ fontSize: '0.85rem', color: '#4A5568', margin: 0 }}>
                            Valid until: <strong>{new Date(tutorSubscription.subscription.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                          </p>
                        ) : tutorSubscription.subscription?.status === 'pending_review' ? (
                          <p style={{ fontSize: '0.85rem', color: '#3182CE', margin: 0 }}>
                            Your security application is currently <strong>Under Admin Review</strong>. We will notify you once approved.
                          </p>
                        ) : tutorSubscription.subscription?.status === 'rejected' ? (
                          <p style={{ fontSize: '0.85rem', color: '#E53E3E', margin: 0 }}>
                            Application Rejected: {tutorSubscription.subscription.reviewNotes || 'Security details verification failed.'}
                          </p>
                        ) : (
                          <p style={{ fontSize: '0.85rem', color: '#E53E3E', margin: 0 }}>
                            Purchase a membership on the Mentorship page to start applying and teaching.
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', color: '#718096', display: 'block' }}>Course Slots Limit</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2D3748' }}>
                            {tutorSubscription.coursesUsed} / {tutorSubscription.coursesLimit}
                          </span>
                        </div>
                        <div style={{ width: '4px', height: '30px', background: '#CBD5E0' }}></div>
                        <div>
                          <span style={{ fontSize: '0.85rem', color: '#718096', display: 'block' }}>Slots Remaining</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: tutorSubscription.coursesRemaining > 0 ? '#38A169' : '#E53E3E' }}>
                            {tutorSubscription.coursesRemaining}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="card-content">

                  {showApplicationForm && (
                    <form className="tutor-application-form-card" onSubmit={submitTutorApplication}>
                      <div className="tutor-app-form-header">
                        <h3>{editingApplicationId ? 'Edit Tutor Application' : 'Create Tutor Application'}</h3>
                        <button type="button" className="btn-secondary" onClick={closeTutorApplicationForm}>
                          Cancel
                        </button>
                      </div>

                      <div className="tutor-app-form-grid">
                        <div className="info-item">
                          <label className="info-label">Full Name *</label>
                          <input type="text" name="fullName" className="form-input" value={tutorApplicationForm.fullName} onChange={handleTutorApplicationInputChange} />
                        </div>
                        <div className="info-item">
                          <label className="info-label">Email *</label>
                          <input type="email" name="email" className="form-input" value={tutorApplicationForm.email} onChange={handleTutorApplicationInputChange} />
                        </div>
                        <div className="info-item">
                          <label className="info-label">Phone *</label>
                          <input type="text" name="phone" className="form-input" value={tutorApplicationForm.phone} onChange={handleTutorApplicationInputChange} />
                        </div>
                        <div className="info-item">
                          <label className="info-label">CNIC *</label>
                          <input type="text" name="cnic" className="form-input" value={tutorApplicationForm.cnic} onChange={handleTutorApplicationInputChange} placeholder="12345-1234567-1" />
                        </div>
                        <div className="info-item">
                          <label className="info-label">University *</label>
                          <input type="text" name="university" className="form-input" value={tutorApplicationForm.university} onChange={handleTutorApplicationInputChange} />
                        </div>
                        <div className="info-item">
                          <label className="info-label">Degree Program *</label>
                          <input type="text" name="degreeProgram" className="form-input" value={tutorApplicationForm.degreeProgram} onChange={handleTutorApplicationInputChange} />
                        </div>
                        <div className="info-item">
                          <label className="info-label">Current Semester *</label>
                          <input type="text" name="currentSemester" className="form-input" value={tutorApplicationForm.currentSemester} onChange={handleTutorApplicationInputChange} />
                        </div>
                        <div className="info-item">
                          <label className="info-label">Specialization *</label>
                          <input type="text" name="specialization" className="form-input" value={tutorApplicationForm.specialization} onChange={handleTutorApplicationInputChange} />
                        </div>
                        <div className="info-item full-width">
                          <label className="info-label">Subjects * (comma-separated)</label>
                          <input type="text" name="subjects" className="form-input" value={tutorApplicationForm.subjects} onChange={handleTutorApplicationInputChange} placeholder="Mathematics, Physics, Programming" />
                        </div>
                        <div className="info-item full-width">
                          <label className="info-label">Teaching Experience</label>
                          <textarea name="teachingExperience" className="form-input tutor-bio-input" value={tutorApplicationForm.teachingExperience} onChange={handleTutorApplicationInputChange} rows="3" />
                        </div>
                        <div className="info-item full-width">
                          <label className="info-label">Certifications</label>
                          <textarea name="certifications" className="form-input tutor-bio-input" value={tutorApplicationForm.certifications} onChange={handleTutorApplicationInputChange} rows="2" />
                        </div>
                        <div className="info-item full-width">
                          <label className="info-label">Achievements</label>
                          <textarea name="achievements" className="form-input tutor-bio-input" value={tutorApplicationForm.achievements} onChange={handleTutorApplicationInputChange} rows="2" />
                        </div>
                        <div className="info-item">
                          <label className="info-label">GPA/CGPA</label>
                          <input type="text" name="gpa" className="form-input" value={tutorApplicationForm.gpa} onChange={handleTutorApplicationInputChange} />
                        </div>
                        <div className="info-item">
                          <label className="info-label">LinkedIn / Portfolio</label>
                          <input type="url" name="linkedinPortfolio" className="form-input" value={tutorApplicationForm.linkedinPortfolio} onChange={handleTutorApplicationInputChange} placeholder="https://" />
                        </div>
                      </div>

                      <div className="card-actions">
                        <button type="button" className="btn-cancel" onClick={closeTutorApplicationForm}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={savingTutorApplication}>
                          <i className="fa-solid fa-floppy-disk"></i> {savingTutorApplication ? 'Saving...' : editingApplicationId ? 'Update Application' : 'Submit Application'}
                        </button>
                      </div>
                    </form>
                  )}

                  {loadingTutorApplications ? (
                    <div className="tutor-applications-loading">Loading your tutor applications...</div>
                  ) : tutorApplications.length === 0 ? (
                    <div className="tutor-applications-empty">
                      <i className="fa-solid fa-inbox"></i>
                      <h3>No tutor applications yet</h3>
                      <p>You can create applications from the Tutor page.</p>
                    </div>
                  ) : (
                    <div className="tutor-applications-list">
                      {tutorApplications.map((application, index) => (
                        <article className="tutor-application-item" key={application._id}>
                          <div className="application-meta">
                            <span className={`application-pill ${getApplicationStatusClass(application.status)}`}>
                              {application.status}
                            </span>
                            <span className="application-date">Submitted {formatApplicationDate(application.createdAt)}</span>
                            <span className="application-date">Application #{tutorApplications.length - index}</span>
                          </div>

                          <div className="tutor-application-main-grid">
                            <div className="application-text-block">
                              <h3>Academic Details</h3>
                              <p><strong>University:</strong> {application.university || 'Not provided'}</p>
                              <p><strong>Program:</strong> {application.degreeProgram || 'Not provided'}</p>
                              <p><strong>Semester:</strong> {application.currentSemester || 'Not provided'}</p>
                              <p><strong>Specialization:</strong> {application.specialization || 'Not provided'}</p>
                              <p><strong>Subjects:</strong> {Array.isArray(application.subjects) ? application.subjects.join(', ') : 'Not provided'}</p>
                            </div>

                            <div className="application-text-block">
                              <h3>Professional Details</h3>
                              <p><strong>GPA:</strong> {application.gpa || 'Not provided'}</p>
                              <p><strong>Experience:</strong> {application.teachingExperience || 'Not provided'}</p>
                              <p><strong>Certifications:</strong> {application.certifications || 'Not provided'}</p>
                            </div>
                          </div>

                          {application.reviewNotes && (
                            <div className="application-review-note">
                              <h4>Admin Review Notes</h4>
                              <p>{application.reviewNotes}</p>
                            </div>
                          )}

                          <div className="card-actions tutor-application-actions">
                            {['payment_pending', 'payment_failed', 'payment_cancelled'].includes(application.status) && (
                              <button 
                                type="button" 
                                className="btn-save" 
                                onClick={() => handlePayNow(application)}
                                style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                                disabled={savingTutorApplication}
                              >
                                <i className="fa-solid fa-credit-card"></i> Pay Now (PKR 500)
                              </button>
                            )}
                            <button type="button" className="btn-secondary" onClick={() => openEditTutorApplication(application)}>
                              <i className="fa-solid fa-pen"></i> Edit
                            </button>
                            <button
                              type="button"
                              className="btn-delete"
                              onClick={() => requestDeleteTutorApplication(application._id)}
                              disabled={deletingApplicationId === application._id}
                            >
                              <i className="fa-solid fa-trash"></i> {deletingApplicationId === application._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'blocked-users' && (
              <div className="profile-card tab-card tutor-applications-card">
                <div className="card-header-tab">
                  <div className="tab-header-left">
                    <div className="tab-indicator"></div>
                    <h2 className="card-title">
                      <i className="fa-solid fa-user-slash"></i> Blocked Users
                    </h2>
                  </div>
                </div>

                <div className="card-content">
                  {loadingBlockedUsers ? (
                    <div className="tutor-applications-loading">Loading blocked users...</div>
                  ) : blockedUsers.length === 0 ? (
                    <div className="tutor-applications-empty">
                      <i className="fa-solid fa-user-check"></i>
                      <h3>No blocked users</h3>
                      <p>You have not blocked anyone yet.</p>
                    </div>
                  ) : (
                    <div className="tutor-applications-list blocked-users-list">
                      {blockedUsers.map((entry) => (
                        <article className="tutor-application-item blocked-user-item" key={entry.conversationId}>
                          <div className="blocked-user-main">
                            <img
                              className="blocked-user-avatar"
                              src={entry?.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry?.user?.fullName || 'User')}&size=120&background=A78B71&color=fff&bold=true`}
                              alt={entry?.user?.fullName || 'User'}
                            />
                            <div className="blocked-user-meta">
                              <h3>{entry?.user?.fullName || 'Unknown user'}</h3>
                              <p>{entry?.user?.email || 'No email available'}</p>
                              <span className="application-date">Blocked on {formatBlockedDate(entry?.blockedAt)}</span>
                            </div>
                          </div>
                          <button
                            className="btn-unblock-user"
                            onClick={() => openUnblockModal(entry)}
                            disabled={unblockingInProgress}
                            title="Unblock this user"
                          >
                            <Unlock size={16} aria-hidden="true" />
                            Unblock
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'my-learning-agreements' && (
              <div className="profile-card tab-card tutor-applications-card">
                <div className="card-header-tab">
                  <div className="tab-header-left">
                    <div className="tab-indicator"></div>
                    <h2 className="card-title">
                      <i className="fa-solid fa-file-signature"></i> My Learning Agreements
                    </h2>
                  </div>
                </div>

                <div className="card-content">
                  {loadingMyLearningAgreements ? (
                    <div className="tutor-applications-loading">Loading your learning agreements...</div>
                  ) : myLearningAgreements.length === 0 ? (
                    <div className="tutor-applications-empty">
                      <i className="fa-solid fa-file-circle-xmark"></i>
                      <h3>No learning agreements yet</h3>
                      <p>Create a learning agreement from mentorship chat to see it here.</p>
                    </div>
                  ) : (
                    <div className="tutor-applications-list blocked-users-list">
                      {myLearningAgreements.map((agreement) => (
                        <article className="tutor-application-item blocked-user-item agreement-item" key={agreement._id}>
                          <div className="blocked-user-meta">
                            <h3>{agreement.subjectCourse || 'Untitled subject'}</h3>
                            <p><strong>Tutor:</strong> {agreement.tutorName || 'N/A'}</p>
                            <p><strong>Student:</strong> {agreement.studentName || 'N/A'}</p>
                            <p><strong>Duration:</strong> {agreement.duration || 'N/A'}</p>
                            <p><strong>Session Date:</strong> {agreement.sessionDateTime ? new Date(agreement.sessionDateTime).toLocaleString() : 'N/A'}</p>
                            <span className="application-date">Created on {formatBlockedDate(agreement.createdAt)}</span>
                          </div>
                          <button 
                            className="btn-delete-agreement-profile"
                            onClick={() => handleDeleteLearningAgreement(agreement._id)}
                            title="Delete this learning agreement"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                            Delete
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'my-items' && (
              <div className="profile-card tab-card tutor-applications-card">
                <div className="card-header-tab">
                  <div className="tab-header-left">
                    <div className="tab-indicator"></div>
                    <h2 className="card-title">
                      <i className="fa-solid fa-tag"></i> My Items (For Sale)
                    </h2>
                  </div>
                </div>

                <div className="card-content">
                  {loadingMyItems ? (
                    <div className="tutor-applications-loading">Loading your items...</div>
                  ) : myItems.length === 0 ? (
                    <div className="tutor-applications-empty">
                      <i className="fa-solid fa-inbox"></i>
                      <h3>No items listed yet</h3>
                      <p>Go to the marketplace to list items for sale.</p>
                    </div>
                  ) : (
                    <div className="tutor-applications-list blocked-users-list">
                      {myItems.map((item) => (
                        <article className="tutor-application-item blocked-user-item item-for-sale" key={item._id}>
                          <div className="blocked-user-meta">
                            <h3>{item.title}</h3>
                            <p><strong>Price:</strong> PKR {item.price?.toLocaleString() || 'N/A'}</p>
                            <p><strong>Category:</strong> {item.category || 'N/A'}</p>
                            <p><strong>Condition:</strong> {item.condition || 'N/A'}</p>
                            <p><strong>Location:</strong> {item.location?.city || 'N/A'}{item.location?.area ? `, ${item.location.area}` : ''}</p>
                            <p><strong>Description:</strong> {item.description?.substring(0, 100) || 'N/A'}...</p>
                            <span className="application-date">Listed on {formatBlockedDate(item.createdAt)}</span>
                          </div>
                          <div className="item-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Link to={`/marketplace/${item._id}`} className="btn-view-item">
                              View
                            </Link>
                            <button 
                              className="btn-delete-agreement-profile"
                              onClick={() => handleDeleteItemRequest(item._id)}
                              title="Delete this item"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'seller-orders' && (
              <div className="profile-card tab-card tutor-applications-card">
                <div className="card-header-tab">
                  <div className="tab-header-left">
                    <div className="tab-indicator"></div>
                    <h2 className="card-title">
                      <i className="fa-solid fa-inbox"></i> Received Orders
                    </h2>
                  </div>
                </div>

                <div className="card-content">
                  {loadingSellerOrders ? (
                    <div className="tutor-applications-loading">Loading received orders...</div>
                  ) : sellerReceivedOrders.length === 0 ? (
                    <div className="tutor-applications-empty">
                      <i className="fa-solid fa-inbox"></i>
                      <h3>No orders received yet</h3>
                      <p>Orders for your items will appear here.</p>
                    </div>
                  ) : (
                    <div className="tutor-applications-list blocked-users-list">
                      {sellerReceivedOrders.map((order) => (
                        <article className="tutor-application-item blocked-user-item order-item" key={order._id}>
                          <div className="blocked-user-meta" style={{ width: '100%' }}>
                            <h3>Order #{order.orderNumber || order._id}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                              <div>
                                <p><strong>Status:</strong> <span className={`order-status ${order.status}`}>{order.status.replaceAll('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span></p>
                                <p><strong>Total Amount:</strong> PKR {order.totalAmount?.toLocaleString() || 'N/A'}</p>
                                <p><strong>Payment Method:</strong> {order.paymentMethod?.toUpperCase() || 'N/A'}</p>
                                <p><strong>Items:</strong> {order.items?.length || 0}</p>
                              </div>
                              <div>
                                <p><strong>Buyer:</strong> {order.userId?.fullName || 'N/A'}</p>
                                <p><strong>Email:</strong> {order.userId?.email || 'N/A'}</p>
                                <p><strong>Phone:</strong> {order.shippingDetails?.phone || 'N/A'}</p>
                                <p><strong>City:</strong> {order.shippingDetails?.city || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="order-items-list" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                              <p style={{ marginBottom: '0.5rem' }}><strong>Items Ordered:</strong></p>
                              {order.items?.map((item, idx) => (
                                <div key={idx} style={{ marginBottom: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid #a78b71' }}>
                                  <p style={{ margin: '0.25rem 0' }}>{item.title}</p>
                                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>Quantity: {item.quantity} | Price: PKR {(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                            <p style={{ marginTop: '1rem' }}><strong>Delivery Address:</strong> {order.shippingDetails?.fullAddress || 'N/A'}</p>
                            <span className="application-date">Order placed on {formatBlockedDate(order.createdAt)}</span>
                          </div>
                          <div className="item-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', minWidth: '200px' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                disabled={updatingOrderId === order._id}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  border: '1px solid #a78b71',
                                  borderRadius: '4px',
                                  fontSize: '0.9rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              {updatingOrderId === order._id && <span style={{ fontSize: '0.8rem', color: '#a78b71' }}>Updating...</span>}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'my-orders' && (
              <div className="profile-card tab-card tutor-applications-card">
                <div className="card-header-tab">
                  <div className="tab-header-left">
                    <div className="tab-indicator"></div>
                    <h2 className="card-title">
                      <i className="fa-solid fa-shopping-bag"></i> My Orders
                    </h2>
                  </div>
                </div>

                <div className="card-content">
                  {loadingMyOrders ? (
                    <div className="tutor-applications-loading">Loading your orders...</div>
                  ) : myOrders.length === 0 ? (
                    <div className="tutor-applications-empty">
                      <i className="fa-solid fa-inbox"></i>
                      <h3>No orders yet</h3>
                      <p>Start shopping to see your orders here.</p>
                    </div>
                  ) : (
                    <div className="tutor-applications-list blocked-users-list">
                      {myOrders.map((order) => (
                        <article className="tutor-application-item blocked-user-item order-item" key={order._id}>
                          <div className="blocked-user-meta">
                            <h3>Order #{order.orderNumber || order._id}</h3>
                            <p><strong>Status:</strong> <span className={`order-status ${order.status}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
                            <p><strong>Total Amount:</strong> PKR {order.totalAmount?.toLocaleString() || 'N/A'}</p>
                            <p><strong>Items:</strong> {order.items?.length || 0} item(s)</p>
                            <div className="order-items-preview">
                              {order.items?.map((item, idx) => (
                                <span key={idx} className="order-item-tag">{item.title} x{item.quantity}</span>
                              ))}
                            </div>
                            <p><strong>Shipping Address:</strong> {order.shippingDetails?.fullAddress || 'N/A'}</p>
                            <span className="application-date">Ordered on {formatBlockedDate(order.createdAt)}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}



          </div>
        </div>
      </main>

      {showDeleteTutorModal && (
        <div className="profile-delete-modal-overlay" onClick={closeDeleteTutorModal}>
          <div
            className="profile-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Delete tutor application"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-delete-modal-icon">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3>Delete this tutor application?</h3>
            <p>This action cannot be undone.</p>
            <div className="profile-delete-modal-actions">
              <button
                type="button"
                className="profile-delete-cancel"
                onClick={closeDeleteTutorModal}
                disabled={Boolean(deletingApplicationId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-delete-confirm"
                onClick={confirmDeleteTutorApplication}
                disabled={Boolean(deletingApplicationId)}
              >
                <i className="fa-solid fa-trash"></i> {deletingApplicationId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnblockModal && unblockingUser && (
        <div className="profile-delete-modal-overlay" onClick={closeUnblockModal}>
          <div
            className="profile-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Unblock user"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-delete-modal-icon">
              <Unlock size={32} aria-hidden="true" />
            </div>
            <h3>Unblock {unblockingUser?.fullName}?</h3>
            <p>You will be able to chat and exchange messages with this user again.</p>
            <div className="profile-delete-modal-actions">
              <button
                type="button"
                className="profile-delete-cancel"
                onClick={closeUnblockModal}
                disabled={unblockingInProgress}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-delete-confirm"
                onClick={handleConfirmUnblock}
                disabled={unblockingInProgress}
              >
                <Unlock size={16} aria-hidden="true" /> {unblockingInProgress ? 'Unblocking...' : 'Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-content">
            <div className="footer-section">
              <h4>CareerMap</h4>
              <p>Your trusted guide for academic and career success.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <div className="footer-links">
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/mentorship">Mentorship</Link>
                <Link to="/marketplace">Marketplace</Link>
                <Link to="/profile">Profile</Link>
              </div>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <div className="footer-links">
                <Link to="/help">Help Center</Link>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="muted">© {new Date().getFullYear()} CareerMap Limited. All rights reserved.</div>
          </div>
        </div>
      </footer>

      <ConfirmModal
        isOpen={showDeleteItemConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={confirmDeleteItem}
        onCancel={() => {
          setShowDeleteItemConfirm(false)
          setItemToDelete(null)
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={showDeleteAgreementConfirm}
        title="Delete Learning Agreement"
        message="Are you sure you want to delete this learning agreement? This action cannot be undone."
        onConfirm={confirmDeleteLearningAgreement}
        onCancel={() => {
          setShowDeleteAgreementConfirm(false)
          setAgreementToDelete(null)
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
