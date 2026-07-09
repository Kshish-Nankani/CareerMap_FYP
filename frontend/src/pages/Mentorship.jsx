import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, LoaderCircle, Users, BadgeCheck, Star, Video, Clock3, Wallet, Circle, Mail, MessageCircle, UserRound,
  User, AtSign, Phone, IdCard, GraduationCap, BookOpen, Briefcase, ShieldCheck, Link2, FileUp, CheckCircle2, AlertCircle, SendHorizontal, ArrowLeft,
  Trash2, X, Paperclip, MoreVertical, FileText, Download, MapPin, Unlock, Crown, Lock, Image
} from 'lucide-react'
import { io } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import '../styles/logoAnimations.css'
import api, { API_BASE_URL } from '../utils/api'
import { getAuthToken } from '../utils/authStorage'
import ConfirmModal from '../components/ConfirmModal'
import '../styles/Mentorship.css'

const RESPONSE_TIME_LABELS = ['Within 30 mins', 'Within 1 hour', 'Within 2 hours', 'Within 4 hours']
const AVAILABILITY_STATUSES = ['Available', 'Limited', 'Busy']
const MAX_TEACHING_EXPERIENCE_WORDS = 400
const MEDIA_ACCEPT = 'image/*,video/*,application/pdf'
const RESUME_ACCEPT = 'application/pdf'
const CHAT_MEDIA_ACCEPT = 'image/*,application/pdf'
const MAX_CHAT_ATTACHMENT_BYTES = 8 * 1024 * 1024

const HERO_PLACEHOLDER_MENTORS = [
  { _id: 'ph1', fullName: 'Mentor 1', userId: { profileImage: '/images/tutor 7.jpg' } },
  { _id: 'ph2', fullName: 'Mentor 2', userId: { profileImage: '/images/mentor.webp' } },
  { _id: 'ph3', fullName: 'Mentor 3', userId: { profileImage: '/images/tutor 8.jpg' } },
]

const hashText = (value = '') =>
  value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

const getWordCount = (value = '') => {
  const words = value.trim().split(/\s+/).filter(Boolean)
  return words.length
}

const getTutorDisplayMeta = (tutorApp = {}) => {
  const seed = hashText(tutorApp._id || tutorApp.email || tutorApp.fullName || 'tutor')
  return {
    availability: AVAILABILITY_STATUSES[seed % AVAILABILITY_STATUSES.length]
  }
}

const getTutorTags = (tutorApp = {}) => {
  const tags = new Set()
  if (Array.isArray(tutorApp.tutorOfferings)) {
    tutorApp.tutorOfferings.forEach((offering) => {
      if (offering?.course) tags.add(offering.course)
      if (offering?.subject) tags.add(offering.subject)
      if (offering?.expertise) tags.add(offering.expertise)
    })
  }
  if (Array.isArray(tutorApp.subjects)) {
    tutorApp.subjects.forEach((subject) => tags.add(subject))
  }
  return Array.from(tags).slice(0, 8)
}

const getAvailabilityClass = (availability = '') => availability.toLowerCase().replace(/\s+/g, '-')

const resolveTutorUserId = (tutorApp = {}) => {
  if (!tutorApp?.userId) return ''

  if (typeof tutorApp.userId === 'string') return tutorApp.userId
  if (typeof tutorApp.userId === 'object') {
    return tutorApp.userId._id || tutorApp.userId.id || ''
  }

  return ''
}

const createUploadItem = (file) => {
  const isPreviewable = file.type.startsWith('image/') || file.type.startsWith('video/')
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    file,
    name: file.name,
    type: file.type,
    size: file.size,
    previewUrl: isPreviewable ? URL.createObjectURL(file) : ''
  }
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsDataURL(file)
  })

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const isChatImageAttachment = (attachment = {}) =>
  attachment?.type === 'image' || String(attachment?.mimeType || '').startsWith('image/')

const isChatPdfAttachment = (attachment = {}) =>
  attachment?.type === 'pdf' || String(attachment?.mimeType || '').toLowerCase() === 'application/pdf'

const createBlobUrlFromDataUrl = (dataUrl = '') => {
  const [metaPart, base64Part] = String(dataUrl || '').split(',')
  const mimeMatch = String(metaPart || '').match(/^data:(.*?);base64$/i)
  if (!mimeMatch || !base64Part) throw new Error('Invalid attachment payload')

  const mimeType = mimeMatch[1] || 'application/octet-stream'
  const binary = atob(base64Part)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return URL.createObjectURL(new Blob([bytes], { type: mimeType }))
}

const buildFormDataFromUser = (user) => ({
  fullName: user?.fullName || '',
  email: user?.email || '',
  phone: user?.phone || '',
  cnic: '',
  university: user?.schoolUniversity || '',
  degreeProgram: user?.department || '',
  currentSemester: user?.semesterYear || '',
  subjects: '',
  specialization: '',
  gpa: user?.cgpaPercentage || '',
  hourlyRate: '',
  responseTime: '',
  teachingExperience: '',
  certifications: '',
  achievements: '',
  linkedinPortfolio: '',
  cnicDocument: '',
  resumeDocument: '',
  certificateDocuments: ''
})

const buildFormDataFromApplication = (application, user) => ({
  fullName: application?.fullName || user?.fullName || '',
  email: application?.email || user?.email || '',
  phone: application?.phone || user?.phone || '',
  cnic: application?.cnic || '',
  university: application?.university || user?.schoolUniversity || '',
  degreeProgram: application?.degreeProgram || user?.department || '',
  currentSemester: application?.currentSemester || user?.semesterYear || '',
  subjects: Array.isArray(application?.subjects) ? application.subjects.join(', ') : '',
  specialization: application?.specialization || '',
  gpa: application?.gpa || user?.cgpaPercentage || '',
  hourlyRate: application?.hourlyRate ? String(application.hourlyRate) : '',
  responseTime: application?.responseTime || '',
  teachingExperience: application?.teachingExperience || '',
  certifications: application?.certifications || '',
  achievements: application?.achievements || '',
  linkedinPortfolio: application?.linkedinPortfolio || '',
  cnicDocument: application?.cnicDocument || '',
  resumeDocument: application?.resumeDocument || '',
  certificateDocuments: Array.isArray(application?.certificateDocuments)
    ? application.certificateDocuments.join(', ')
    : ''
})

const getDisplayName = (profile = {}) =>
  profile.fullName || profile.name || profile.email || 'User'

const getUserDisplayName = (user = {}) =>
  user.fullName || user.name || user.email || 'User'

const getSocketBaseUrl = () => API_BASE_URL.replace(/\/api\/?$/, '')

const formatConversationTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const today = new Date()
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const getUnreadTotal = (conversations = []) =>
  conversations.reduce((total, item) => total + Number(item.unreadCount || 0), 0)

function Mentorship() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [showSubscriptionSelector, setShowSubscriptionSelector] = useState(false)
  const [formStep, setFormStep] = useState(1)
  const [myApplication, setMyApplication] = useState(null)
  const [tutorSubscription, setTutorSubscription] = useState(null)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [selectedSecurityPlan, setSelectedSecurityPlan] = useState('monthly')
  const [securityFormData, setSecurityFormData] = useState({
    fullName: '',
    cnic: '',
    phone: '',
    education: '',
    cnicPicture: '',
    degreeField: '',
    gender: '',
    currently: '',
    cnicDocumentUrl: '',
    verificationFiles: [],
    resumeFile: null
  })
  const [loadingSubscription, setLoadingSubscription] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [approvedTutors, setApprovedTutors] = useState([])
  const [loadingTutors, setLoadingTutors] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('All')
  const [selectedUniversity, setSelectedUniversity] = useState('All')
  const [selectedAvailability, setSelectedAvailability] = useState('All')
  const [expandedTutorId, setExpandedTutorId] = useState(null)
  const [showTutorProfileModal, setShowTutorProfileModal] = useState(false)
  const [selectedTutorForProfile, setSelectedTutorForProfile] = useState(null)
  const [showAdminEditModal, setShowAdminEditModal] = useState(false)
  const [showAdminDeleteModal, setShowAdminDeleteModal] = useState(false)
  const [adminEditingTutor, setAdminEditingTutor] = useState(null)
  const [adminTutorToDelete, setAdminTutorToDelete] = useState(null)
  const [savingAdminTutor, setSavingAdminTutor] = useState(false)
  const [deletingTutorId, setDeletingTutorId] = useState('')
  const [adminTutorForm, setAdminTutorForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    university: '',
    degreeProgram: '',
    currentSemester: '',
    specialization: '',
    subjects: '',
    teachingExperience: '',
    gpa: '',
    hourlyRate: '',
    responseTime: '',
    status: 'Approved'
  })
  const [uploadFiles, setUploadFiles] = useState({
    certifications: [],
    achievements: [],
    verification: [],
    resume: []
  })
  const [dragSection, setDragSection] = useState('')
  const [touchedFields, setTouchedFields] = useState({})
  const [showChatDrawer, setShowChatDrawer] = useState(false)
  const [chatConversations, setChatConversations] = useState([])
  const [chatLoadingConversations, setChatLoadingConversations] = useState(false)
  const [chatLoadingMessages, setChatLoadingMessages] = useState(false)
  const [chatConnected, setChatConnected] = useState(false)
  const [chatConnecting, setChatConnecting] = useState(false)
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const [activeConversationId, setActiveConversationId] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatDraft, setChatDraft] = useState('')
  const [chatAttachment, setChatAttachment] = useState(null)
  const [chatSending, setChatSending] = useState(false)
  const [chatTypingByConversation, setChatTypingByConversation] = useState({})
  const [chatDeletingConversationId, setChatDeletingConversationId] = useState('')
  const [chatUpdatingBlock, setChatUpdatingBlock] = useState(false)
  const [blockAction, setBlockAction] = useState('block') // 'block' or 'unblock'
  const [showChatDeleteModal, setShowChatDeleteModal] = useState(false)
  const [showChatBlockModal, setShowChatBlockModal] = useState(false)
  const [showChatActionsMenu, setShowChatActionsMenu] = useState(false)
  const [showLearningAgreementModal, setShowLearningAgreementModal] = useState(false)
  const [showMyLearningAgreementsModal, setShowMyLearningAgreementsModal] = useState(false)
  const [savingLearningAgreement, setSavingLearningAgreement] = useState(false)
  const [loadingMyLearningAgreements, setLoadingMyLearningAgreements] = useState(false)
  const [myLearningAgreements, setMyLearningAgreements] = useState([])
  const [startingChatTutorId, setStartingChatTutorId] = useState('')
  const [ratingSubmittingByTutor, setRatingSubmittingByTutor] = useState({})
  const uploadFilesRef = useRef(uploadFiles)
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const isTypingSentRef = useRef(false)
  const activeConversationRef = useRef('')
  const chatActionsMenuRef = useRef(null)
  const chatMessagesListRef = useRef(null)
  const chatFileInputRef = useRef(null)
  const certificationInputRef = useRef(null)
  const achievementInputRef = useRef(null)
  const verificationInputRef = useRef(null)
  const resumeInputRef = useRef(null)
  const securityVerificationInputRef = useRef(null)
  const securityResumeInputRef = useRef(null)
  const [formData, setFormData] = useState(buildFormDataFromUser(user))
  const [learningAgreementForm, setLearningAgreementForm] = useState({
    tutorName: '',
    studentName: '',
    subjectCourse: '',
    sessionDateTime: '',
    duration: '',
    learningObjectives: '',
    sessionNotesPlan: ''
  })
  const [showDeleteAgreementConfirm, setShowDeleteAgreementConfirm] = useState(false)
  const [agreementToDelete, setAgreementToDelete] = useState(null)

  const activeConversation = useMemo(
    () => chatConversations.find((item) => String(item._id) === String(activeConversationId)) || null,
    [chatConversations, activeConversationId]
  )

  const activeConversationBlockedByMe = Boolean(activeConversation?.isBlockedByMe)
  const activeConversationBlockedByOther = Boolean(activeConversation?.isBlockedByOther)
  const activeConversationBlocked = activeConversationBlockedByMe || activeConversationBlockedByOther

  useEffect(() => {
    activeConversationRef.current = activeConversationId
  }, [activeConversationId])

  useEffect(() => {
    setShowChatActionsMenu(false)
  }, [activeConversationId, showChatDrawer])

  useEffect(() => {
    if (!showChatActionsMenu) return undefined

    const handleDocumentClick = (event) => {
      if (chatActionsMenuRef.current?.contains(event.target)) return
      setShowChatActionsMenu(false)
    }

    document.addEventListener('mousedown', handleDocumentClick)
    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [showChatActionsMenu])

  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    isTypingSentRef.current = false
  }, [activeConversationId])

  useEffect(() => {
    return () => {
      if (chatAttachment?.previewUrl) {
        URL.revokeObjectURL(chatAttachment.previewUrl)
      }
    }
  }, [chatAttachment])

  useEffect(() => {
    uploadFilesRef.current = uploadFiles
  }, [uploadFiles])

  useEffect(() => {
    return () => {
      Object.values(uploadFilesRef.current)
        .flat()
        .forEach((item) => {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
        })
    }
  }, [])

  useEffect(() => {
    fetchMyApplication()
    fetchTutorSubscription()
    fetchApprovedTutors()
  }, [])

  useEffect(() => {
    if (!user?.id) return undefined

    const token = getAuthToken()
    if (!token) return undefined

    setChatConnecting(true)
    const socket = io(getSocketBaseUrl(), {
      auth: { token },
      transports: ['polling', 'websocket']
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setChatConnected(true)
      setChatConnecting(false)
      fetchConversations()
    })

    socket.on('disconnect', () => {
      setChatConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error?.message || error)
      setChatConnected(false)
      setChatConnecting(false)
    })

    socket.on('chat:new-message', (message) => {
      if (!message?.conversationId) return

      if (String(message.conversationId) === String(activeConversationRef.current)) {
        setChatMessages((prev) => {
          if (prev.some((item) => String(item._id) === String(message._id))) {
            return prev
          }

          const isMine = String(message.sender?._id) === String(user.id)
          return [...prev, { ...message, isMine }]
        })

        if (String(message.sender?._id) !== String(user.id)) {
          socket.emit('chat:mark-read', { conversationId: message.conversationId })
          setChatTypingByConversation((prev) => ({
            ...prev,
            [String(message.conversationId)]: false
          }))
        }
      }

      fetchConversations()
    })

    socket.on('chat:conversation-updated', () => {
      fetchConversations()
    })

    socket.on('chat:typing', (payload = {}) => {
      const conversationId = String(payload.conversationId || '')
      const typingUserId = String(payload.userId || '')

      if (!conversationId || typingUserId === String(user.id)) return

      setChatTypingByConversation((prev) => ({
        ...prev,
        [conversationId]: Boolean(payload.isTyping)
      }))
    })

    socket.on('chat:presence-changed', (payload = {}) => {
      const changedUserId = String(payload.userId || '')
      if (!changedUserId) return

      setChatConversations((prev) =>
        prev.map((conversation) => {
          const counterpartId = String(conversation?.counterpart?._id || '')
          if (counterpartId !== changedUserId) return conversation

          return {
            ...conversation,
            counterpart: {
              ...conversation.counterpart,
              isOnline: Boolean(payload.isOnline)
            }
          }
        })
      )
    })

    socket.on('chat:conversation-deleted', (payload = {}) => {
      const deletedConversationId = String(payload.conversationId || '')
      if (!deletedConversationId) return

      setChatTypingByConversation((prev) => {
        if (!(deletedConversationId in prev)) return prev
        const next = { ...prev }
        delete next[deletedConversationId]
        return next
      })

      setChatConversations((prev) => {
        const nextConversations = prev.filter(
          (conversation) => String(conversation._id) !== deletedConversationId
        )

        setChatUnreadCount(getUnreadTotal(nextConversations))

        if (String(activeConversationRef.current) === deletedConversationId) {
          if (nextConversations.length > 0) {
            setActiveConversationId(String(nextConversations[0]._id))
            loadConversationMessages(String(nextConversations[0]._id))
          } else {
            setActiveConversationId('')
            setChatMessages([])
          }
        }

        return nextConversations
      })
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      isTypingSentRef.current = false
      setChatConnected(false)
      setChatConnecting(false)
    }
  }, [user?.id])

  // Auto-switch conversation if current one is blocked
  useEffect(() => {
    if (activeConversationBlockedByMe && activeConversationId) {
      const availableConversations = chatConversations.filter((conv) => !conv.isBlockedByMe)
      if (availableConversations.length > 0) {
        setActiveConversationId(String(availableConversations[0]._id))
      } else {
        setActiveConversationId('')
        setChatMessages([])
      }
    }
  }, [activeConversationBlockedByMe, activeConversationId, chatConversations])

  useEffect(() => {
    if (!chatMessagesListRef.current) return
    chatMessagesListRef.current.scrollTop = chatMessagesListRef.current.scrollHeight
  }, [chatMessages, showChatDrawer, activeConversationId])

  const fetchConversations = async (focusConversationId = '') => {
    try {
      setChatLoadingConversations(true)
      const response = await api.get('/chat/conversations')
      const conversations = Array.isArray(response?.conversations) ? response.conversations : []

      setChatConversations(conversations)
      setChatUnreadCount(getUnreadTotal(conversations))

      const focusId = focusConversationId || activeConversationRef.current
      if (!focusId && conversations.length > 0) {
        setActiveConversationId(String(conversations[0]._id))
      } else if (focusId) {
        const exists = conversations.some((item) => String(item._id) === String(focusId))
        if (exists) {
          setActiveConversationId(String(focusId))
        } else if (conversations.length > 0) {
          setActiveConversationId(String(conversations[0]._id))
          setChatMessages([])
        } else {
          setActiveConversationId('')
          setChatMessages([])
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setChatLoadingConversations(false)
    }
  }

  const loadConversationMessages = async (conversationId) => {
    if (!conversationId) return

    try {
      setChatLoadingMessages(true)
      const response = await api.get(`/chat/conversations/${conversationId}/messages`)
      const messages = Array.isArray(response?.messages) ? response.messages : []
      setChatMessages(messages)
      setChatTypingByConversation((prev) => ({
        ...prev,
        [String(conversationId)]: false
      }))

      if (socketRef.current?.connected) {
        socketRef.current.emit('chat:join-conversation', { conversationId })
        socketRef.current.emit('chat:mark-read', { conversationId })
      }

      fetchConversations(conversationId)
    } catch (error) {
      showToast(error.message || 'Failed to load messages', 'error')
    } finally {
      setChatLoadingMessages(false)
    }
  }

  const handleOpenChatDrawer = async () => {
    setShowChatDrawer(true)
    await fetchConversations()
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('chat') === 'open' && !showChatDrawer) {
      setShowChatDrawer(true)
      fetchConversations()

      params.delete('chat')
      const nextSearch = params.toString()
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : ''
        },
        { replace: true }
      )
    }
  }, [location.search, location.pathname, showChatDrawer, navigate])

  const emitTypingStatus = (isTyping) => {
    if (!socketRef.current?.connected || !activeConversationRef.current) return

    socketRef.current.emit('chat:typing', {
      conversationId: activeConversationRef.current,
      isTyping
    })
  }

  const handleChatDraftChange = (event) => {
    if (activeConversationBlocked) return

    const nextValue = event.target.value
    setChatDraft(nextValue)

    if (!activeConversationRef.current || !socketRef.current?.connected) return

    if (nextValue.trim()) {
      if (!isTypingSentRef.current) {
        emitTypingStatus(true)
        isTypingSentRef.current = true
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        emitTypingStatus(false)
        isTypingSentRef.current = false
        typingTimeoutRef.current = null
      }, 1200)
    } else if (isTypingSentRef.current) {
      emitTypingStatus(false)
      isTypingSentRef.current = false

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }

  const handleSelectConversation = async (conversationId) => {
    setActiveConversationId(String(conversationId))
    setChatDraft('')
    setChatAttachment((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
    await loadConversationMessages(String(conversationId))
  }

  const handleStartChatWithTutor = async (tutorApp) => {
    const tutorUserId = resolveTutorUserId(tutorApp)
    if (!tutorUserId) {
      showToast('Tutor profile is missing user details', 'error')
      return
    }

    const existingConversation = chatConversations.find(
      (conversation) => String(conversation?.counterpart?._id) === String(tutorUserId)
    )

    if (existingConversation?._id) {
      setShowChatDrawer(true)
      setActiveConversationId(String(existingConversation._id))
      await loadConversationMessages(String(existingConversation._id))
      return
    }

    if (String(tutorUserId) === String(user?.id)) {
      showToast('You cannot start chat with your own tutor profile', 'error')
      return
    }

    try {
      setStartingChatTutorId(String(tutorApp._id))
      const response = await api.post('/chat/conversations/start', { tutorUserId })
      const conversationId = response?.conversation?._id

      if (!conversationId) {
        showToast('Unable to open chat for this tutor', 'error')
        return
      }

      setShowChatDrawer(true)
      setActiveConversationId(String(conversationId))
      await fetchConversations(String(conversationId))
      await loadConversationMessages(String(conversationId))
    } catch (error) {
      showToast(error.message || 'Unable to start chat', 'error')
    } finally {
      setStartingChatTutorId('')
    }
  }

  const handleTutorCardClick = (tutorApp) => {
    if (String(resolveTutorUserId(tutorApp)) === String(user?.id)) {
      handleOpenChatDrawer()
      return
    }
    handleStartChatWithTutor(tutorApp)
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()

    if (activeConversationBlocked) {
      showToast(
        activeConversationBlockedByMe
          ? 'You blocked this user. Unblock to continue chatting.'
          : 'You cannot send messages in this chat because you were blocked by the other user.',
        'error'
      )
      return
    }

    const content = chatDraft.trim()
    if ((!content && !chatAttachment) || !activeConversationId || chatSending) return

    try {
      setChatSending(true)

      let attachmentPayload = null
      if (chatAttachment?.file) {
        const dataUrl = await readFileAsDataUrl(chatAttachment.file)
        attachmentPayload = {
          name: chatAttachment.name,
          mimeType: chatAttachment.type,
          size: chatAttachment.size,
          dataUrl: String(dataUrl || '')
        }
      }

      // Send media through REST to avoid socket acknowledgement stalls on larger payloads.
      const shouldSendViaRest = Boolean(attachmentPayload)

      if (socketRef.current?.connected && !shouldSendViaRest) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Message send timed out'))
          }, 7000)

          socketRef.current.emit(
            'chat:send',
            {
              conversationId: activeConversationId,
              content,
              attachment: attachmentPayload
            },
            (ack) => {
              clearTimeout(timeout)
              if (ack?.ok) {
                resolve()
              } else {
                reject(new Error(ack?.message || 'Message failed to send'))
              }
            }
          )
        }).catch(async () => {
          await api.post('/chat/messages', {
            conversationId: activeConversationId,
            content,
            attachment: attachmentPayload
          })
        })
      } else {
        await api.post('/chat/messages', {
          conversationId: activeConversationId,
          content,
          attachment: attachmentPayload
        })
      }

      setChatDraft('')
      setChatAttachment((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
        return null
      })
      if (isTypingSentRef.current) {
        emitTypingStatus(false)
        isTypingSentRef.current = false
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      fetchConversations(activeConversationId)
    } catch (error) {
      showToast(error.message || 'Unable to send message', 'error')
    } finally {
      setChatSending(false)
    }
  }

  const closeChatDrawer = () => {
    if (isTypingSentRef.current) {
      emitTypingStatus(false)
      isTypingSentRef.current = false
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    setShowChatDrawer(false)
    setShowChatActionsMenu(false)
    setShowChatBlockModal(false)
    setShowLearningAgreementModal(false)
    setChatDraft('')
    setChatAttachment((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
  }

  const handleSelectChatAttachment = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'

    if (!isImage && !isPdf) {
      showToast('Only image and PDF files can be sent', 'error')
      return
    }

    if (file.size > MAX_CHAT_ATTACHMENT_BYTES) {
      showToast('Attachment must be 8MB or smaller', 'error')
      return
    }

    setChatAttachment((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
      return {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: isImage ? URL.createObjectURL(file) : ''
      }
    })
  }

  const handleRemoveChatAttachment = () => {
    setChatAttachment((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
  }

  const handleOpenPdfAttachment = (attachment) => {
    try {
      const blobUrl = createBlobUrlFromDataUrl(attachment?.dataUrl)
      const openedWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer')

      // If popup/tab opening is blocked by browser, fallback to download.
      if (!openedWindow) {
        const downloadLink = document.createElement('a')
        downloadLink.href = blobUrl
        downloadLink.download = attachment?.name || 'document.pdf'
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        showToast('Browser blocked preview. File downloaded instead.', 'info')
      }

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 60 * 1000)
    } catch (_error) {
      showToast('Unable to open this PDF attachment', 'error')
    }
  }

  const handleDeleteConversation = async () => {
    if (!activeConversationId || chatDeletingConversationId) return

    try {
      setChatDeletingConversationId(String(activeConversationId))
      const deletedConversationId = String(activeConversationId)
      await api.delete(`/chat/conversations/${deletedConversationId}`)

      setChatTypingByConversation((prev) => {
        if (!(deletedConversationId in prev)) return prev
        const next = { ...prev }
        delete next[deletedConversationId]
        return next
      })

      const nextConversations = chatConversations.filter(
        (conversation) => String(conversation._id) !== deletedConversationId
      )

      setChatConversations(nextConversations)
      setChatUnreadCount(getUnreadTotal(nextConversations))

      if (nextConversations.length > 0) {
        const nextConversationId = String(nextConversations[0]._id)
        setActiveConversationId(nextConversationId)
        await loadConversationMessages(nextConversationId)
      } else {
        setActiveConversationId('')
        setChatMessages([])
      }

      setShowChatDeleteModal(false)
      showToast('Chat deleted successfully', 'success')
    } catch (error) {
      showToast(error.message || 'Failed to delete chat', 'error')
    } finally {
      setChatDeletingConversationId('')
    }
  }

  const openChatDeleteModal = () => {
    if (!activeConversationId || chatDeletingConversationId) return
    setShowChatActionsMenu(false)
    setShowChatDeleteModal(true)
  }

  const handleToggleBlockConversation = async (action) => {
    if (!activeConversationId) return

    setShowChatActionsMenu(false)
    setShowChatBlockModal(true)
    setBlockAction(action) // 'block' or 'unblock'
  }

  const closeChatBlockModal = () => {
    if (chatUpdatingBlock) return
    setShowChatBlockModal(false)
  }

  const confirmToggleBlockConversation = async () => {
    if (!activeConversationId || chatUpdatingBlock) return

    const isUnblocking = blockAction === 'unblock'

    try {
      setChatUpdatingBlock(true)
      if (isUnblocking) {
        await api.delete(`/chat/conversations/${activeConversationId}/block`)
        showToast('User unblocked successfully', 'success')
      } else {
        await api.post(`/chat/conversations/${activeConversationId}/block`, {})
        showToast('User blocked successfully', 'success')
      }

      setShowChatBlockModal(false)

      // If blocking, remove the conversation from the list and select next one
      if (!isUnblocking) {
        const filteredConversations = chatConversations.filter(
          (conv) => String(conv._id) !== String(activeConversationId)
        )
        setChatConversations(filteredConversations)

        if (filteredConversations.length > 0) {
          setActiveConversationId(String(filteredConversations[0]._id))
        } else {
          setActiveConversationId('')
          setChatMessages([])
        }
      } else {
        // If unblocking, refresh conversations
        await fetchConversations(activeConversationId)
      }
    } catch (error) {
      showToast(error.message || 'Failed to update block status', 'error')
    } finally {
      setChatUpdatingBlock(false)
    }
  }

  const closeChatDeleteModal = () => {
    if (chatDeletingConversationId) return
    setShowChatDeleteModal(false)
  }

  const buildLearningAgreementDefaults = (conversation) => {
    const counterpart = conversation?.counterpart || {}
    const currentUserName = getUserDisplayName(user)
    const counterpartName = getDisplayName(counterpart)
    const tutorName = user?.isTutor
      ? currentUserName
      : counterpart?.isTutor
        ? counterpartName
        : ''
    const studentName = user?.isTutor
      ? counterpartName
      : counterpart?.isTutor
        ? currentUserName
        : counterpartName

    return {
      tutorName,
      studentName,
      subjectCourse: '',
      sessionDateTime: '',
      duration: '',
      learningObjectives: '',
      sessionNotesPlan: ''
    }
  }

  const openLearningAgreementModal = () => {
    if (!activeConversation) return

    if (!user?.isTutor) {
      showToast('Only tutors can create learning agreements', 'error')
      setShowChatActionsMenu(false)
      return
    }

    setLearningAgreementForm(buildLearningAgreementDefaults(activeConversation))
    setShowLearningAgreementModal(true)
    setShowChatActionsMenu(false)
  }

  const closeLearningAgreementModal = () => {
    if (savingLearningAgreement) return
    setShowLearningAgreementModal(false)
  }

  const openMyLearningAgreementsModal = async () => {
    if (!user?.isTutor) {
      showToast('Only tutors can view learning agreements', 'error')
      setShowChatActionsMenu(false)
      return
    }

    try {
      setLoadingMyLearningAgreements(true)
      const response = await api.get('/chat/agreements/mine')
      setMyLearningAgreements(Array.isArray(response?.agreements) ? response.agreements : [])
      setShowMyLearningAgreementsModal(true)
    } catch (error) {
      showToast(error.message || 'Failed to load learning agreements', 'error')
    } finally {
      setLoadingMyLearningAgreements(false)
      setShowChatActionsMenu(false)
    }
  }

  const closeMyLearningAgreementsModal = () => {
    if (loadingMyLearningAgreements) return
    setShowMyLearningAgreementsModal(false)
  }

  const handleDeleteLearningAgreement = async (agreementId) => {
    setAgreementToDelete(agreementId)
    setShowDeleteAgreementConfirm(true)
  }

  const confirmDeleteLearningAgreement = async () => {
    if (!agreementToDelete) return

    try {
      const response = await api.delete(`/chat/agreements/${agreementToDelete}`)
      showToast('Learning agreement deleted successfully', 'success')
      // Refresh the list
      openMyLearningAgreementsModal()
    } catch (error) {
      showToast(error.message || 'Failed to delete learning agreement', 'error')
    } finally {
      setShowDeleteAgreementConfirm(false)
      setAgreementToDelete(null)
    }
  }

  const handleLearningAgreementInputChange = (event) => {
    const { name, value } = event.target
    setLearningAgreementForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitLearningAgreement = async (event) => {
    event.preventDefault()
    if (!activeConversationId || savingLearningAgreement) return

    try {
      setSavingLearningAgreement(true)

      await api.post(`/chat/conversations/${activeConversationId}/agreements`, {
        tutorName: learningAgreementForm.tutorName,
        studentName: learningAgreementForm.studentName,
        subjectCourse: learningAgreementForm.subjectCourse,
        sessionDateTime: learningAgreementForm.sessionDateTime,
        duration: learningAgreementForm.duration,
        learningObjectives: learningAgreementForm.learningObjectives,
        sessionNotesPlan: learningAgreementForm.sessionNotesPlan
      })

      showToast('Learning agreement saved successfully', 'success')
      setShowLearningAgreementModal(false)
    } catch (error) {
      showToast(error.message || 'Failed to save learning agreement', 'error')
    } finally {
      setSavingLearningAgreement(false)
    }
  }

  const handleDownloadLearningAgreement = async () => {
    const requiredFields = [
      learningAgreementForm.tutorName,
      learningAgreementForm.studentName,
      learningAgreementForm.subjectCourse,
      learningAgreementForm.sessionDateTime,
      learningAgreementForm.duration,
      learningAgreementForm.learningObjectives,
      learningAgreementForm.sessionNotesPlan
    ]

    if (requiredFields.some((value) => !String(value || '').trim())) {
      showToast('Please fill all agreement fields before downloading', 'error')
      return
    }

    try {
      const { jsPDF } = await import('jspdf')

      const formattedDateTime = learningAgreementForm.sessionDateTime
        ? new Date(learningAgreementForm.sessionDateTime).toLocaleString()
        : ''

      const sections = [
        { label: 'Tutor Name', value: learningAgreementForm.tutorName },
        { label: 'Student Name', value: learningAgreementForm.studentName },
        { label: 'Subject / Course', value: learningAgreementForm.subjectCourse },
        { label: 'Session Date and Time', value: formattedDateTime },
        { label: 'Duration', value: learningAgreementForm.duration },
        { label: 'Learning Objectives', value: learningAgreementForm.learningObjectives },
        { label: 'Session Notes / Plan', value: learningAgreementForm.sessionNotesPlan }
      ]

      const normalizeAgreementCellText = (value = '') => {
        const raw = String(value || '').trim()
        if (!raw) return '-'

        // Force wrap long unbroken chunks (e.g. repeated letters/URLs) to prevent right-side overflow.
        return raw
          .split('\n')
          .map((line) => line.replace(/(\S{22})(?=\S)/g, '$1 '))
          .join('\n')
      }

      const toDataUrl = (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })

      let logoDataUrl = ''
      try {
        const logoResponse = await fetch('/images/career.png')
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob()
          const loaded = await toDataUrl(logoBlob)
          logoDataUrl = typeof loaded === 'string' ? loaded : ''
        }
      } catch (error) {
        logoDataUrl = ''
      }

      const pdfWidth = 210
      // Center the table on the page with equal margins
      const marginLeft = 25
      const marginRight = 25
      const tableWidth = pdfWidth - marginLeft - marginRight
      const labelColumnWidth = 30
      const valueColumnWidth = tableWidth - labelColumnWidth
      const cellPaddingX = 2.5
      const cellPaddingY = 2.5
      const lineHeight = 4.5
      const headerRowHeight = 7.5
      const generatedDate = new Date().toLocaleDateString()

      // Aggressive wrap width to ensure text stays within cell bounds with safety margin
      const labelWrapWidth = labelColumnWidth - cellPaddingX * 2 - 2
      const valueWrapWidth = valueColumnWidth - cellPaddingX * 2 - 3

      const dataRows = [
        { type: 'section', title: 'PARTICIPANTS' },
        { type: 'field', label: 'Tutor Name', value: learningAgreementForm.tutorName },
        { type: 'field', label: 'Student Name', value: learningAgreementForm.studentName },
        { type: 'section', title: 'SESSION DETAILS' },
        { type: 'field', label: 'Subject / Course', value: learningAgreementForm.subjectCourse },
        { type: 'field', label: 'Session Date and Time', value: formattedDateTime },
        { type: 'field', label: 'Duration', value: learningAgreementForm.duration },
        { type: 'section', title: 'LEARNING PLAN' },
        { type: 'field', label: 'Learning Objectives', value: learningAgreementForm.learningObjectives },
        { type: 'field', label: 'Session Notes / Plan', value: learningAgreementForm.sessionNotesPlan }
      ]

      const measuringDocument = new jsPDF({ unit: 'mm', format: [pdfWidth, 400] })
      measuringDocument.setFontSize(9.5)

      // Calculate guidelines height
      const overviewText = 'This learning agreement outlines the roles, responsibilities, and expectations between the tutor and the learner to ensure a smooth, effective, and goal-oriented learning experience. It promotes clear communication, mutual respect, and active participation from both sides, helping to create a supportive environment where learning objectives can be successfully achieved.'
      measuringDocument.setFontSize(9)
      const guidelineWrapWidth = tableWidth - cellPaddingX * 2 - 2
      const overviewLines = measuringDocument.splitTextToSize(overviewText, guidelineWrapWidth)
      let guidelinesHeight = overviewLines.length * lineHeight + 8 // overview section with proper line spacing

      const tutorGuidelines = [
        '• Provide clear, accurate, and well-structured explanations according to the learner\'s level.',
        '• Be punctual, prepared for sessions, and maintain a professional attitude.',
        '• Monitor progress and give regular, constructive feedback to support improvement.'
      ]
      measuringDocument.setFontSize(8.5)
      guidelinesHeight += 5 // title height
      tutorGuidelines.forEach((guideline) => {
        const lines = measuringDocument.splitTextToSize(guideline, guidelineWrapWidth - 4)
        guidelinesHeight += lines.length * lineHeight + 2
      })
      guidelinesHeight += 3 // spacing

      const learnerGuidelines = [
        '• Attend sessions on time and actively participate in learning activities.',
        '• Complete assigned tasks and be open to feedback for improvement.',
        '• Communicate clearly with the tutor and take responsibility for your learning progress.'
      ]
      guidelinesHeight += 5 // title height
      learnerGuidelines.forEach((guideline) => {
        const lines = measuringDocument.splitTextToSize(guideline, guidelineWrapWidth - 4)
        guidelinesHeight += lines.length * lineHeight + 2
      })
      guidelinesHeight += 8 // extra spacing

      const preparedRows = dataRows.map((row) => {
        if (row.type === 'section') {
          return { ...row, rowHeight: 7.5 }
        }

        const normalizedLabel = normalizeAgreementCellText(row.label)
        const normalizedValue = normalizeAgreementCellText(row.value)

        const labelLines = measuringDocument.splitTextToSize(
          normalizedLabel,
          labelWrapWidth
        )
        const valueLines = measuringDocument.splitTextToSize(
          normalizedValue,
          valueWrapWidth
        )
        const lineCount = Math.max(labelLines.length, valueLines.length)
        const rowHeight = lineCount * lineHeight + cellPaddingY * 2
        return { ...row, labelLines, valueLines, rowHeight }
      })

      const hasLogo = Boolean(logoDataUrl)
      const headerHeight = hasLogo ? 40.8 : 24.8
      const rowsHeight = preparedRows.reduce((sum, row) => sum + row.rowHeight, 0)
      const contentEndY = headerHeight + guidelinesHeight + headerRowHeight + rowsHeight
      const signatureY = contentEndY + 9
      const footerLineY = signatureY + 7
      const footerTextY = footerLineY + 5
      const pdfHeight = footerTextY + 6

      const document = new jsPDF({ unit: 'mm', format: [pdfWidth, pdfHeight] })
      const pageWidth = document.internal.pageSize.getWidth()
      const pageHeight = document.internal.pageSize.getHeight()
      const centerX = pageWidth / 2
      const dividerX = marginLeft + labelColumnWidth

      const drawHeader = () => {
        let currentY = logoDataUrl ? 12 : 14

        if (logoDataUrl) {
          const logoWidth = 30
          const logoHeight = 12
          // document.addImage(logoDataUrl, 'PNG', centerX - logoWidth / 2, currentY, logoWidth, logoHeight)
          currentY += logoHeight + 6
        }

        document.setFontSize(16)
        document.setFont('helvetica', 'bold')
        document.text('CAREER MAP LEARNING AGREEMENT', centerX, currentY, { align: 'center' })
        currentY += 4

        document.setDrawColor(110, 110, 110)
        document.setLineWidth(0.35)
        document.line(marginLeft, currentY, pageWidth - marginRight, currentY)
        currentY += 1.8
        document.setLineWidth(0.15)
        document.line(marginLeft, currentY, pageWidth - marginRight, currentY)
        currentY += 5

        return currentY
      }

      const drawTableColumnHeader = (startY) => {
        document.setFillColor(236, 236, 236)
        document.rect(marginLeft, startY, tableWidth, headerRowHeight, 'F')
        document.setDrawColor(110, 110, 110)
        document.setLineWidth(0.4)
        document.rect(marginLeft, startY, tableWidth, headerRowHeight)
        document.line(dividerX, startY, dividerX, startY + headerRowHeight)
        document.line(marginLeft + tableWidth, startY, marginLeft + tableWidth, startY + headerRowHeight)

        document.setFontSize(10)
        document.setFont('helvetica', 'bold')
        document.text('Field', marginLeft + cellPaddingX, startY + 5.2)
        document.text('Information', dividerX + cellPaddingX, startY + 5.2)

        return startY + headerRowHeight
      }

      const drawRow = (row, topY) => {
        if (row.type === 'section') {
          document.setFillColor(246, 246, 246)
          document.rect(marginLeft, topY, tableWidth, row.rowHeight, 'F')
          document.setDrawColor(110, 110, 110)
          document.setLineWidth(0.4)
          document.rect(marginLeft, topY, tableWidth, row.rowHeight)
          document.line(marginLeft + tableWidth, topY, marginLeft + tableWidth, topY + row.rowHeight)
          document.setFontSize(9.5)
          document.setFont('helvetica', 'bold')
          document.text(row.title, marginLeft + cellPaddingX, topY + 4.9)
          return
        }

        document.setDrawColor(110, 110, 110)
        document.setLineWidth(0.4)
        document.rect(marginLeft, topY, tableWidth, row.rowHeight)
        document.line(dividerX, topY, dividerX, topY + row.rowHeight)
        document.line(marginLeft + tableWidth, topY, marginLeft + tableWidth, topY + row.rowHeight)

        document.setFontSize(9.5)
        document.setFont('helvetica', 'normal')
        const textStartY = topY + cellPaddingY + 3
        document.text(row.labelLines, marginLeft + cellPaddingX, textStartY, { maxWidth: labelWrapWidth })
        document.text(row.valueLines, dividerX + cellPaddingX, textStartY, { maxWidth: valueWrapWidth })
      }

      const drawGuidelines = (startY) => {
        let currentY = startY
        const guidelineMarginLeft = marginLeft

        // Overview description
        document.setFontSize(9)
        document.setFont('helvetica', 'normal')
        const overviewText = 'This learning agreement outlines the roles, responsibilities, and expectations between the tutor and the learner to ensure a smooth, effective, and goal-oriented learning experience. It promotes clear communication, mutual respect, and active participation from both sides, helping to create a supportive environment where learning objectives can be successfully achieved.'
        const overviewLines = document.splitTextToSize(overviewText, guidelineWrapWidth)
        document.text(overviewLines, guidelineMarginLeft + cellPaddingX, currentY)
        currentY += overviewLines.length * lineHeight + 6

        // Tutor Guidelines
        document.setFontSize(9)
        document.setFont('helvetica', 'bold')
        document.text('Guidelines for the Tutor', guidelineMarginLeft, currentY)
        currentY += 5

        document.setFontSize(8.5)
        document.setFont('helvetica', 'normal')
        const tutorGuidelines = [
          '• Provide clear, accurate, and well-structured explanations according to the learner\'s level.',
          '• Be punctual, prepared for sessions, and maintain a professional attitude.',
          '• Monitor progress and give regular, constructive feedback to support improvement.'
        ]
        tutorGuidelines.forEach((guideline) => {
          const lines = document.splitTextToSize(guideline, guidelineWrapWidth - 4)
          document.text(lines, guidelineMarginLeft + cellPaddingX + 3, currentY)
          currentY += lines.length * lineHeight + 2
        })
        currentY += 3

        // Learner Guidelines
        document.setFontSize(9)
        document.setFont('helvetica', 'bold')
        document.text('Guidelines for the Learner (User)', guidelineMarginLeft, currentY)
        currentY += 5

        document.setFontSize(8.5)
        document.setFont('helvetica', 'normal')
        const learnerGuidelines = [
          '• Attend sessions on time and actively participate in learning activities.',
          '• Complete assigned tasks and be open to feedback for improvement.',
          '• Communicate clearly with the tutor and take responsibility for your learning progress.'
        ]
        learnerGuidelines.forEach((guideline) => {
          const lines = document.splitTextToSize(guideline, guidelineWrapWidth - 4)
          document.text(lines, guidelineMarginLeft + cellPaddingX + 3, currentY)
          currentY += lines.length * lineHeight + 2
        })

        currentY += 6

        return currentY
      }

      let currentY = drawHeader()
      currentY = drawGuidelines(currentY)
      currentY = drawTableColumnHeader(currentY)

      preparedRows.forEach((row) => {
        drawRow(row, currentY)
        currentY += row.rowHeight
      })

      const signatureName = String(getUserDisplayName(user) || learningAgreementForm.tutorName || 'User').trim() || 'User'
      document.setDrawColor(180, 180, 180)
      document.setLineWidth(0.2)
      document.line(marginLeft, footerLineY, pageWidth - marginRight, footerLineY)

      document.setFontSize(8.5)
      document.setFont('helvetica', 'normal')
      document.text(`Generated: ${generatedDate}`, marginLeft, footerTextY)
      document.text('Page 1 of 1', pageWidth - marginRight, footerTextY, { align: 'right' })
      document.text(`Signature: ${signatureName}`, pageWidth - marginRight, signatureY, { align: 'right' })

      const safeTutor = learningAgreementForm.tutorName.trim().replace(/[^a-zA-Z0-9]+/g, '-') || 'tutor'
      const safeStudent = learningAgreementForm.studentName.trim().replace(/[^a-zA-Z0-9]+/g, '-') || 'student'
      document.save(`learning-agreement-${safeTutor}-${safeStudent}.pdf`)
    } catch (error) {
      showToast('Failed to generate PDF', 'error')
    }
  }

  const fetchMyApplication = async () => {
    try {
      const response = await api.get('/tutors/my-applications')
      if (response.success && response.applications && response.applications.length > 0) {
        setMyApplication(response.applications[0])
      }
    } catch (error) {
      console.error('Error fetching application:', error)
    }
  }

  const fetchTutorSubscription = async () => {
    try {
      setLoadingSubscription(true)
      const response = await api.get('/tutors/my-subscription')
      if (response.success) {
        setTutorSubscription(response)
      }
    } catch (error) {
      console.error('Error fetching tutor subscription:', error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const fetchApprovedTutors = async () => {
    try {
      setLoadingTutors(true)
      const response = await api.get('/tutors/approved')
      if (response.success && response.tutors) {
        setApprovedTutors(response.tutors)
      }
    } catch (error) {
      console.error('Error fetching approved tutors:', error)
    } finally {
      setLoadingTutors(false)
    }
  }

  const applyTutorRatingLocally = (tutorId, nextRating) => {
    setApprovedTutors((prevTutors) =>
      prevTutors.map((tutor) => {
        if (String(tutor._id) !== String(tutorId)) return tutor

        return {
          ...tutor,
          ratingAverage: Number(nextRating.ratingAverage || 0),
          ratingCount: Number(nextRating.ratingCount || 0),
          currentUserRating: Number(nextRating.currentUserRating || 0)
        }
      })
    )
  }

  const handleRateTutor = async (tutorApp, ratingValue) => {
    if (!tutorApp?._id || !ratingValue) return

    const tutorId = String(tutorApp._id)
    const previousAverage = Number(tutorApp.ratingAverage || 0)
    const previousCount = Number(tutorApp.ratingCount || 0)
    const previousUserRating = Number(tutorApp.currentUserRating || 0)

    const optimisticCount = previousUserRating > 0 ? previousCount : previousCount + 1
    const optimisticTotal = previousAverage * previousCount - previousUserRating + ratingValue
    const optimisticAverage = optimisticCount > 0 ? Number((optimisticTotal / optimisticCount).toFixed(1)) : 0

    applyTutorRatingLocally(tutorId, {
      ratingAverage: optimisticAverage,
      ratingCount: optimisticCount,
      currentUserRating: ratingValue
    })

    setRatingSubmittingByTutor((prev) => ({ ...prev, [tutorId]: true }))

    try {
      const response = await api.post(`/tutors/applications/${tutorId}/rating`, { rating: ratingValue })
      if (response.success) {
        applyTutorRatingLocally(tutorId, {
          ratingAverage: response.ratingAverage,
          ratingCount: response.ratingCount,
          currentUserRating: response.currentUserRating
        })
      }
    } catch (error) {
      applyTutorRatingLocally(tutorId, {
        ratingAverage: previousAverage,
        ratingCount: previousCount,
        currentUserRating: previousUserRating
      })
      showToast(error.message || 'Failed to save rating', 'error')
    } finally {
      setRatingSubmittingByTutor((prev) => {
        const next = { ...prev }
        delete next[tutorId]
        return next
      })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === 'teachingExperience') {
      const words = value.trim().split(/\s+/).filter(Boolean)
      const limitedValue = words.length > MAX_TEACHING_EXPERIENCE_WORDS
        ? words.slice(0, MAX_TEACHING_EXPERIENCE_WORDS).join(' ')
        : value

      setFormData(prev => ({ ...prev, [name]: limitedValue }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const tutorsForDisplay = useMemo(() => {
    return approvedTutors.map((tutorApp) => {
      const tutorMeta = getTutorDisplayMeta(tutorApp)
      const tags = getTutorTags(tutorApp)
      const defaultBioSubjects = tags.length > 0 ? tags.slice(0, 2).join(' & ') : 'Mentorship'
      const bio = tutorApp.tutorBio || tutorApp.teachingExperience || `${defaultBioSubjects} focused tutor.`
      const academicLevel = tutorApp.currentSemester || 'Academic level not specified'
      const ratingAverage = Number(tutorApp.ratingAverage || 0)
      const ratingCount = Number(tutorApp.ratingCount || 0)
      const currentUserRating = Number(tutorApp.currentUserRating || 0)
      const hourlyRate = Number(tutorApp.hourlyRate || 0)
      const responseTime = tutorApp.responseTime || 'Response time not set'

      return {
        ...tutorApp,
        ...tutorMeta,
        rating: Number(ratingAverage.toFixed(1)),
        ratingCount,
        currentUserRating,
        hourlyRate,
        responseTime,
        tags,
        bio,
        academicLine: `${tutorApp.degreeProgram || 'Degree Program'} • ${academicLevel}`
      }
    })
  }, [approvedTutors])

  const specialtyOptions = useMemo(() => {
    const values = new Set()
    tutorsForDisplay.forEach((tutor) => {
      tutor.tags.forEach((tag) => values.add(tag))
    })
    return ['All', ...Array.from(values).sort((a, b) => a.localeCompare(b))]
  }, [tutorsForDisplay])

  const universityOptions = useMemo(() => {
    const values = new Set(tutorsForDisplay.map((tutor) => tutor.university).filter(Boolean))
    return ['All', ...Array.from(values).sort((a, b) => a.localeCompare(b))]
  }, [tutorsForDisplay])

  const filteredTutors = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return tutorsForDisplay.filter((tutor) => {
      const matchesSearch =
        !query ||
        [
          tutor.fullName,
          tutor.university,
          tutor.degreeProgram,
          tutor.specialization,
          tutor.bio,
          ...tutor.tags
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)

      const matchesSpecialty =
        selectedSpecialty === 'All' || tutor.tags.some((tag) => tag.toLowerCase() === selectedSpecialty.toLowerCase())

      const matchesUniversity =
        selectedUniversity === 'All' || tutor.university === selectedUniversity

      const matchesAvailability =
        selectedAvailability === 'All' || tutor.availability === selectedAvailability

      return matchesSearch && matchesSpecialty && matchesUniversity && matchesAvailability
    })
  }, [searchTerm, selectedSpecialty, selectedUniversity, selectedAvailability, tutorsForDisplay])

  const teachingExperienceWordCount = useMemo(
    () => getWordCount(formData.teachingExperience),
    [formData.teachingExperience]
  )

  const formSteps = [
    { id: 1, label: 'Personal Information' },
    { id: 2, label: 'Academic Information' },
    { id: 3, label: 'Experience & Qualifications' }
  ]

  const validationErrors = useMemo(() => {
    const errors = {}
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

    requiredFields.forEach((field) => {
      if (!String(formData[field] || '').trim()) {
        errors[field] = 'This field is required.'
      }
    })

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }

    if (formData.cnic && !/^\d{5}-\d{7}-\d$/.test(formData.cnic.trim())) {
      errors.cnic = 'Use CNIC format: 12345-1234567-1'
    }

    return errors
  }, [formData])

  const getFieldStateClass = (fieldName) => {
    if (!touchedFields[fieldName]) return ''
    return validationErrors[fieldName] ? 'is-invalid' : 'is-valid'
  }

  const markStepFieldsTouched = (step) => {
    const stepFieldMap = {
      1: ['fullName', 'email', 'phone', 'cnic', 'university', 'degreeProgram', 'currentSemester'],
      2: ['subjects', 'specialization'],
      3: [],
      4: []
    }
    const fields = stepFieldMap[step] || []
    if (!fields.length) return
    setTouchedFields((prev) => {
      const next = { ...prev }
      fields.forEach((field) => { next[field] = true })
      return next
    })
  }

  const validateStep = (step) => {
    const stepFieldMap = {
      1: ['fullName', 'email', 'phone', 'cnic', 'university', 'degreeProgram', 'currentSemester'],
      2: ['subjects', 'specialization'],
      3: [],
      4: []
    }
    const fields = stepFieldMap[step] || []
    if (!fields.length) return true

    const hasErrors = fields.some((field) => Boolean(validationErrors[field]))
    markStepFieldsTouched(step)
    if (hasErrors) {
      showToast('Please complete required fields before continuing.', 'error')
      return false
    }
    return true
  }

  const handleStepNext = () => {
    if (formStep >= formSteps.length) return
    if (!validateStep(formStep)) return
    setFormStep((prev) => prev + 1)
  }

  const handleStepClick = (targetStep) => {
    if (targetStep === formStep) return

    if (targetStep < formStep) {
      setFormStep(targetStep)
      return
    }

    // Ensure users cannot jump ahead without satisfying required fields.
    for (let step = formStep; step < targetStep; step += 1) {
      if (!validateStep(step)) return
    }

    setFormStep(targetStep)
  }

  const handleStepBack = () => {
    setFormStep((prev) => Math.max(1, prev - 1))
  }

  const handleFieldBlur = (event) => {
    const { name } = event.target
    if (!name) return
    setTouchedFields((prev) => ({ ...prev, [name]: true }))
  }

  const handleUploadDragOver = (event, section) => {
    event.preventDefault()
    setDragSection(section)
  }

  const handleUploadDragLeave = (event) => {
    event.preventDefault()
    setDragSection('')
  }

  const handleUploadDrop = (event, section) => {
    event.preventDefault()
    setDragSection('')
    handleUploadFiles(section, event.dataTransfer?.files)
  }

  const openApplicationEditor = () => {
    if (!tutorSubscription || !tutorSubscription.hasActiveSubscription) {
      showToast('Purchase a membership plan to list your courses as a tutor.', 'info')
      setShowSubscriptionSelector(true)
      return
    }

    if ((tutorSubscription.coursesRemaining ?? 0) <= 0) {
      showToast(`You've used all ${tutorSubscription.coursesLimit} listing slots. Purchase a new subscription to add more courses.`, 'warning')
      setShowSubscriptionSelector(true)
      return
    }

    // Always open a fresh form for a new listing
    setFormData(buildFormDataFromUser(user))
    setUploadFiles({ certifications: [], achievements: [], verification: [], resume: [] })
    setFormStep(1)
    setTouchedFields({})
    setShowApplicationForm(true)
  }

  const handleViewTutorProfile = (tutorId) => {
    setExpandedTutorId((current) => (current === tutorId ? null : tutorId))
  }

  const handleTutorAvatarHover = (tutorApp) => {
    setSelectedTutorForProfile(tutorApp)
    setShowTutorProfileModal(true)
  }

  const closeTutorProfileModal = () => {
    setShowTutorProfileModal(false)
    setSelectedTutorForProfile(null)
  }

  const openAdminTutorEditor = (tutorApp) => {
    setAdminEditingTutor(tutorApp)
    setAdminTutorForm({
      fullName: tutorApp.fullName || '',
      email: tutorApp.email || '',
      phone: tutorApp.phone || '',
      university: tutorApp.university || '',
      degreeProgram: tutorApp.degreeProgram || '',
      currentSemester: tutorApp.currentSemester || '',
      specialization: tutorApp.specialization || '',
      subjects: Array.isArray(tutorApp.subjects) ? tutorApp.subjects.join(', ') : '',
      teachingExperience: tutorApp.teachingExperience || '',
      gpa: tutorApp.gpa || '',
      hourlyRate: tutorApp.hourlyRate ? String(tutorApp.hourlyRate) : '',
      responseTime: tutorApp.responseTime || '',
      status: tutorApp.status || 'Approved'
    })
    setShowAdminEditModal(true)
  }

  const closeAdminTutorEditor = () => {
    setShowAdminEditModal(false)
    setAdminEditingTutor(null)
  }

  const handleAdminTutorInputChange = (event) => {
    const { name, value } = event.target
    setAdminTutorForm((prev) => ({ ...prev, [name]: value }))
  }

  const submitAdminTutorUpdate = async (event) => {
    event.preventDefault()
    if (!adminEditingTutor?._id) return

    try {
      setSavingAdminTutor(true)

      const payload = {
        ...adminTutorForm,
        subjects: adminTutorForm.subjects
          .split(',')
          .map((subject) => subject.trim())
          .filter(Boolean)
      }

      await api.put(`/tutors/admin/applications/${adminEditingTutor._id}`, payload)
      showToast('Tutor card updated successfully', 'success')
      closeAdminTutorEditor()
      fetchApprovedTutors()
    } catch (error) {
      showToast(error.message || 'Failed to update tutor card', 'error')
    } finally {
      setSavingAdminTutor(false)
    }
  }

  const openAdminDeleteModal = (tutorApp) => {
    setAdminTutorToDelete(tutorApp)
    setShowAdminDeleteModal(true)
  }

  const closeAdminDeleteModal = () => {
    setShowAdminDeleteModal(false)
    setAdminTutorToDelete(null)
  }

  const deleteAdminTutorCard = async () => {
    if (!adminTutorToDelete?._id) return
    const tutorId = adminTutorToDelete._id

    try {
      setDeletingTutorId(tutorId)
      await api.delete(`/tutors/admin/applications/${tutorId}`)
      showToast('Tutor card deleted successfully', 'success')
      closeAdminDeleteModal()
      fetchApprovedTutors()
    } catch (error) {
      showToast(error.message || 'Failed to delete tutor card', 'error')
    } finally {
      setDeletingTutorId('')
    }
  }

  const handleUploadFiles = (section, fileList) => {
    if (!fileList?.length) return
    const nextItems = Array.from(fileList).map(createUploadItem)
    setUploadFiles((prev) => ({
      ...prev,
      [section]: [...prev[section], ...nextItems]
    }))
  }

  const handleDeleteUploadFile = (section, fileId) => {
    setUploadFiles((prev) => {
      const target = prev[section].find((item) => item.id === fileId)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return {
        ...prev,
        [section]: prev[section].filter((item) => item.id !== fileId)
      }
    })
  }

  const handleReplaceUploadFile = (section, fileId, replacementFile) => {
    if (!replacementFile) return
    const replacement = createUploadItem(replacementFile)
    setUploadFiles((prev) => {
      const current = prev[section].find((item) => item.id === fileId)
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl)
      return {
        ...prev,
        [section]: prev[section].map((item) => (item.id === fileId ? replacement : item))
      }
    })
  }

  const resetUploadFiles = () => {
    setUploadFiles((prev) => {
      Object.values(prev)
        .flat()
        .forEach((item) => {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
        })
      return {
        certifications: [],
        achievements: [],
        verification: [],
        resume: []
      }
    })
  }

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault()

    if (!validateStep(1) || !validateStep(2)) {
      setFormStep(1)
      return
    }

    setLoading(true)

    if (teachingExperienceWordCount > MAX_TEACHING_EXPERIENCE_WORDS) {
      showToast(`Teaching experience cannot exceed ${MAX_TEACHING_EXPERIENCE_WORDS} words.`, 'error')
      setLoading(false)
      return
    }

    try {
      // Convert subjects string to array
      const subjectsArray = formData.subjects.split(',').map(s => s.trim()).filter(s => s)

      // Convert certificate documents string to array
      const certificatesArray = formData.certificateDocuments
        ? formData.certificateDocuments.split(',').map(s => s.trim()).filter(s => s)
        : []

      const certificationMedia = await Promise.all(
        uploadFiles.certifications.map((item) => readFileAsDataUrl(item.file))
      )
      const achievementMedia = await Promise.all(
        uploadFiles.achievements.map((item) => readFileAsDataUrl(item.file))
      )
      const verificationMedia = await Promise.all(
        uploadFiles.verification.map((item) => readFileAsDataUrl(item.file))
      )
      const resumeMedia = await Promise.all(
        uploadFiles.resume.map((item) => readFileAsDataUrl(item.file))
      )

      const applicationData = {
        ...formData,
        subjects: subjectsArray,
        certificateDocuments: [
          ...certificatesArray,
          ...certificationMedia,
          ...achievementMedia,
          ...verificationMedia.slice(1)
        ],
        cnicDocument: verificationMedia[0] || formData.cnicDocument,
        resumeDocument: resumeMedia[0] || formData.resumeDocument
      }

      let response
      try {
        response = await api.post('/tutors/my-applications', applicationData)
      } catch (err) {
        // Backward compatibility: older backend accepts /apply.
        response = await api.post('/tutors/apply', applicationData)
      }

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

        showToast('Tutor listing submitted and approved! Your course is now live on the Mentorship page.', 'success')
        // Reset form state so user can open a fresh form for their next listing
        setMyApplication(null)
        await fetchTutorSubscription()
        await fetchApprovedTutors()
        setShowApplicationForm(false)
        setFormStep(1)
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to submit application'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCnicPicture = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast('CNIC picture must be less than 5MB', 'warning')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setSecurityFormData((prev) => ({
        ...prev,
        cnicPicture: reader.result
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleOpenSecurityVerification = (planType) => {
    setSelectedSecurityPlan(planType)
    setSecurityFormData({
      fullName: user?.fullName || '',
      cnic: '',
      phone: user?.phone || '',
      education: user?.schoolUniversity || '',
      cnicPicture: '',
      degreeField: '',
      gender: '',
      currently: '',
      cnicDocumentUrl: '',
      verificationFiles: [],
      resumeFile: null
    })
    setShowSecurityModal(true)
  }

  const handleSubmitSecurityForm = async (e) => {
    e.preventDefault()
    
    // Validate inputs
    const { fullName, cnic, phone, education, cnicPicture, degreeField, gender, currently } = securityFormData
    if (!fullName || !cnic || !phone || !education || !cnicPicture || !degreeField || !gender || !currently) {
      showToast('All security details and uploads are required.', 'warning')
      return
    }

    // Basic CNIC Regex: 5 digits - 7 digits - 1 digit
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/
    if (!cnicRegex.test(cnic.trim())) {
      showToast('Please enter a valid CNIC in 12345-1234567-1 format.', 'warning')
      return
    }

    // Phone number should not contain letters
    if (/[a-zA-Z]/.test(phone)) {
      showToast('Mobile number must not contain letters.', 'warning')
      return
    }

    try {
      setLoading(true)
      showToast('Registering security application...', 'info')
      
      // Convert verification files and resume to base64
      const verificationFileData = await Promise.all(
        (securityFormData.verificationFiles || []).map((f) => readFileAsDataUrl(f))
      )
      const resumeFileData = securityFormData.resumeFile
        ? await readFileAsDataUrl(securityFormData.resumeFile)
        : null

      const payload = {
        planType: selectedSecurityPlan,
        fullName: fullName.trim(),
        cnic: cnic.trim(),
        phone: phone.trim(),
        education: education.trim(),
        cnicPicture,
        degreeField: degreeField.trim(),
        gender: gender.trim(),
        currently: currently,
        cnicDocumentUrl: (securityFormData.cnicDocumentUrl || '').trim(),
        verificationFiles: verificationFileData,
        resumeFile: resumeFileData
      }

      const response = await api.post('/tutors/subscribe', payload)
      
      if (response?.success && response.paymentRequired && response.redirectUrl && response.fields) {
        showToast('Security details recorded. Redirecting to Sandbox gateway...', 'success')
        
        // Short delay for user readability
        setTimeout(() => {
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
        }, 1500)
      } else {
        showToast(response?.message || 'Failed to initialize payment gateway.', 'error')
      }
    } catch (error) {
      console.error('Subscription purchase error:', error)
      showToast(error.message || 'Failed to initialize subscription payment', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseSubscription = async (planType) => {
    handleOpenSecurityVerification(planType)
  }

  useEffect(() => {
    if (showApplicationForm) {
      setFormStep(1)
      setTouchedFields({})
      setDragSection('')
    }
  }, [showApplicationForm])

  useEffect(() => {
    if (!showApplicationForm) return undefined

    const scrollY = window.scrollY || window.pageYOffset || 0
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width
    }
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyStyles.overflow
      document.body.style.position = previousBodyStyles.position
      document.body.style.top = previousBodyStyles.top
      document.body.style.width = previousBodyStyles.width

      // Restore where the user was before opening the modal.
      window.scrollTo(0, scrollY)
    }
  }, [showApplicationForm])
  // ------------------------------------------------
  return (
    <div className="mentorship-container">
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

          <nav className={`nav-links reveal ${mobileMenuOpen ? 'active' : ''}`}>
            <Link to="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/universities" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Universities
            </Link>
            <Link to="/mentorship" className="nav-link active" onClick={() => setMobileMenuOpen(false)}>
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

      {/* Landing Hero Section */}
      <section className="mentor-landing-hero">
        {/* Decorative orbs */}
        <div className="mh-orb mh-orb-1" />
        <div className="mh-orb mh-orb-2" />
        <div className="mh-orb mh-orb-3" />

        <div className="container">
          <div className="mentor-hero-inner">

            {/* ── Left: Heading + CTAs + Stats ── */}
            <div className="mentor-hero-content">
              <div className="hero-badge-pill">
                <Users size={13} />
                <span>Verified Peer-to-Peer Learning</span>
              </div>

              <h1 className="mentor-landing-title">
                Connect with{' '}
                <span className="mentor-title-accent">Expert Mentors</span>
              </h1>

              <p className="mentor-landing-desc">
                Find verified tutors and mentors to guide your academic and career journey
                through real-time support and structured learning.
              </p>

              <div className="mentor-cta-row">
                <button
                  className="mentor-btn-find"
                  onClick={() => {
                    const el = document.querySelector('.mentor-discovery')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <Search size={16} />
                  Find a Mentor
                </button>
                {tutorSubscription?.hasActiveSubscription && (tutorSubscription?.coursesRemaining ?? 1) > 0 ? (
                  <button
                    className="mentor-btn-apply"
                    onClick={openApplicationEditor}
                    title="Premium Feature — List a Course"
                  >
                    <Crown size={16} style={{ color: '#FFD700', marginRight: '4px' }} />
                    Become a Tutor
                  </button>
                ) : tutorSubscription?.subscription?.status === 'pending_review' ? (
                  <button
                    className="mentor-btn-apply mentor-btn-locked"
                    onClick={() => {
                      const el = document.getElementById('pricing-plans-section')
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                    }}
                    style={{
                      background: 'rgba(251, 191, 36, 0.15)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      color: '#b7791f',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: 0.98
                    }}
                    title="Your verification is under admin review"
                  >
                    <Clock3 size={16} style={{ color: '#d97706', marginRight: '4px' }} />
                    Verification Under Review
                  </button>
                ) : (
                  <button
                    className="mentor-btn-apply mentor-btn-locked"
                    onClick={() => {
                      const el = document.getElementById('pricing-plans-section')
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' })
                      } else {
                        showToast('Purchase a membership to list your courses as a tutor.', 'info')
                        setShowSubscriptionSelector(true)
                      }
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#a0aec0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: 0.95
                    }}
                    title="Purchase a Membership Plan to become a tutor"
                  >
                    <Lock size={16} style={{ color: '#a0aec0', marginRight: '4px' }} />
                    Become a Tutor {tutorSubscription?.hasActiveSubscription ? '(Quota Full)' : '(Locked)'}
                  </button>
                )}
              </div>

              {/* Stats strip */}
              <div className="mentor-stats-strip">
                <div className="mentor-stat">
                  <span className="mstat-num">
                    {approvedTutors.length > 0 ? `${approvedTutors.length}+` : '10+'}
                  </span>
                  <span className="mstat-label">Verified Tutors</span>
                </div>
                <div className="mstat-sep" />
                <div className="mentor-stat">
                  <span className="mstat-num">500+</span>
                  <span className="mstat-label">Sessions Completed</span>
                </div>
                <div className="mstat-sep" />
                <div className="mentor-stat">
                  <span className="mstat-num">4.8★</span>
                  <span className="mstat-label">Avg Rating</span>
                </div>
              </div>

            </div>

            {/* ── Right: Vertical portrait image cards ── */}
            <div className="mentor-hero-cards">
              {HERO_PLACEHOLDER_MENTORS.map((card, idx) => (
                <div key={card._id} className={`hero-vcard hvc-${idx}`}>
                  <div className="hvc-glimmer" />
                  <img
                    className="hvc-photo"
                    src={card.userId?.profileImage}
                    alt="hero"
                  />
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-it-works">
        <div className="container">
          <div className="hiw-head">
            <span className="hiw-eyebrow">Simple Process</span>
            <h2 className="hiw-title">How It Works</h2>
            <p className="hiw-subtitle">Get started with peer mentorship in three easy steps</p>
          </div>

          <div className="hiw-steps">
            {/* Step 1 */}
            <div className="hiw-card">
              <div className="hiw-icon hiw-icon-1">
                <Search size={26} />
              </div>
              <span className="hiw-step-num">01</span>
              <h3 className="hiw-step-title">Find a Tutor</h3>
              <p className="hiw-step-desc">
                Browse verified peer mentors filtered by subject, university, or availability to find your perfect match.
              </p>
            </div>

            <div className="hiw-connector" aria-hidden="true">
              <span /><span /><span /><span /><span />
            </div>

            {/* Step 2 */}
            <div className="hiw-card">
              <div className="hiw-icon hiw-icon-2">
                <Video size={26} />
              </div>
              <span className="hiw-step-num">02</span>
              <h3 className="hiw-step-title">Book a Session</h3>
              <p className="hiw-step-desc">
                Reach out directly to your chosen tutor, agree on a time, and lock in your learning session.
              </p>
            </div>

            <div className="hiw-connector" aria-hidden="true">
              <span /><span /><span /><span /><span />
            </div>

            {/* Step 3 */}
            <div className="hiw-card">
              <div className="hiw-icon hiw-icon-3">
                <BadgeCheck size={26} />
              </div>
              <span className="hiw-step-num">03</span>
              <h3 className="hiw-step-title">Start Learning</h3>
              <p className="hiw-step-desc">
                Join your session, learn from a verified peer mentor, and fast-track your academic and career goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tutor Subscription Plans Section (Dynamic Inline Section) ── */}
      <section className="how-it-works" id="pricing-plans-section" style={{ background: '#faf7f2', padding: '5rem 0', borderTop: '1px solid #f0eae1' }}>
        <div className="container">
          <div className="hiw-head">
            <span className="hiw-eyebrow">Unlock Teaching</span>
            <h2 className="hiw-title">Tutor Membership Plans</h2>
            <p className="hiw-subtitle">
              Verify your security credentials and subscribe to a membership tier to register academic courses and mentor peers.
            </p>
          </div>

          {tutorSubscription?.subscription?.status === 'pending_review' ? (
            <div 
              style={{ 
                background: 'rgba(250, 247, 242, 0.9)', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid #e2dcd5', 
                borderRadius: '24px', 
                padding: '3rem', 
                textAlign: 'center', 
                maxWidth: '800px', 
                margin: '0 auto', 
                boxShadow: '0 10px 30px rgba(167, 139, 113, 0.08)' 
              }}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '70px', 
                  height: '70px', 
                  background: '#faf7f2', 
                  borderRadius: '50%', 
                  margin: '0 auto 1.5rem auto' 
                }}
              >
                <Clock3 size={36} style={{ color: '#a78b71' }} />
              </div>
              <h3 style={{ fontSize: '1.6rem', color: '#7a5e44', fontWeight: '700', marginBottom: '1rem' }}>
                Application Under Admin Review
              </h3>
              <p style={{ color: '#4a5568', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Thank you for submitting your security verification. Your subscription application is currently being reviewed by the CareerMap Admin Team.
              </p>
              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.5rem', background: '#fff', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid #f0eae1', textAlign: 'left' }}>
                <div style={{ fontSize: '0.95rem', color: '#718096' }}><strong>Verification Details:</strong></div>
                <div style={{ fontSize: '0.95rem', color: '#4a5568' }}>• Name: {tutorSubscription.subscription.fullName}</div>
                <div style={{ fontSize: '0.95rem', color: '#4a5568' }}>• CNIC: {tutorSubscription.subscription.cnic}</div>
                <div style={{ fontSize: '0.95rem', color: '#4a5568' }}>• Phone: {tutorSubscription.subscription.phone}</div>
                <div style={{ fontSize: '0.95rem', color: '#4a5568' }}>• Education: {tutorSubscription.subscription.education}</div>
                <div style={{ fontSize: '0.95rem', color: '#4a5568' }}>• Tier: <span style={{ textTransform: 'capitalize' }}>{tutorSubscription.subscription.planType.replace('_', ' ')}</span></div>
              </div>
              <p style={{ color: '#718096', fontSize: '0.9rem', marginTop: '1.5rem' }}>
                We will send an email notification once the security checks are completed and your onboarding is unlocked.
              </p>
            </div>
          ) : tutorSubscription?.hasActiveSubscription ? (
            <div className="tutor-active-subscription-card">
              {/* Left Column: Content */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '70px', 
                    height: '70px', 
                    background: '#f1f4f0', 
                    borderRadius: '50%', 
                    marginBottom: '1.5rem' 
                  }}
                >
                  <ShieldCheck size={36} style={{ color: '#596c56' }} />
                </div>
                <h3 style={{ fontSize: '1.6rem', color: '#3d4f3b', fontWeight: '700', marginBottom: '1rem', textAlign: 'left' }}>
                  Your Tutor Membership is Active
                </h3>
                <p style={{ color: '#4a5568', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem', textAlign: 'left' }}>
                  Your security credentials are verified. List your courses below — each listing uses one slot from your membership quota.
                </p>
                {(tutorSubscription.coursesRemaining ?? 0) > 0 ? (
                  <button 
                    onClick={openApplicationEditor}
                    className="mentor-btn-apply"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      padding: '0.9rem 2.5rem', 
                      fontSize: '1.05rem', 
                      border: 'none', 
                      borderRadius: '12px', 
                      background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', 
                      color: '#fff', 
                      cursor: 'pointer', 
                      fontWeight: '700', 
                      boxShadow: '0 4px 12px rgba(167, 139, 113, 0.2)' 
                    }}
                  >
                    <Crown size={18} style={{ color: '#FFD700', marginRight: '6px' }} />
                    List a New Course
                  </button>
                ) : (
                  <div>
                    <p style={{ color: '#e53e3e', fontWeight: '600', fontSize: '1rem', marginBottom: '1.5rem' }}>
                      You have used all your listing slots. Purchase a new subscription to add more courses.
                    </p>
                    <button 
                      onClick={() => setShowSubscriptionSelector(true)}
                      className="mentor-btn-apply"
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        padding: '0.9rem 2.5rem', 
                        fontSize: '1.05rem', 
                        border: 'none', 
                        borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', 
                        color: '#fff', 
                        cursor: 'pointer', 
                        fontWeight: '700', 
                        boxShadow: '0 4px 12px rgba(167, 139, 113, 0.2)' 
                      }}
                    >
                      <Crown size={18} style={{ color: '#FFD700', marginRight: '6px' }} />
                      Get More Listings
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Stats */}
              <div className="tutor-active-subscription-stats">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem', fontWeight: '600' }}>Plan Tier</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#2d3748', textTransform: 'capitalize' }}>{tutorSubscription.subscription.planType.replace('_', ' ')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem', fontWeight: '600' }}>Total Quota</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#2d3748' }}>{tutorSubscription.coursesLimit} Listings</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem', fontWeight: '600' }}>Slots Used</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: (tutorSubscription.coursesUsed >= tutorSubscription.coursesLimit) ? '#e53e3e' : '#596c56' }}>{tutorSubscription.coursesUsed} / {tutorSubscription.coursesLimit}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem', fontWeight: '600' }}>Slots Remaining</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: (tutorSubscription.coursesRemaining ?? 0) > 0 ? '#596c56' : '#e53e3e' }}>{tutorSubscription.coursesRemaining ?? 0} Remaining</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="subscription-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
              
              {/* Monthly Plan */}
              <div className="pricing-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2D3748', margin: '0 0 0.5rem 0' }}>Monthly Membership</h3>
                  <p style={{ fontSize: '0.9rem', color: '#718096', margin: 0 }}>Perfect for testing the peer teaching marketplace</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1A202C' }}>Rs. 5,000</span>
                  <span style={{ fontSize: '0.95rem', color: '#718096', marginLeft: '0.25rem' }}>/ month</span>
                </div>
                <ul style={{ padding: 0, margin: '0 0 2.5rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.95rem', color: '#4A5568' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Apply and list up to <strong>10 courses</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>No separate fee per course application</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Instant approved discovery list presence</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Membership active for 30 days</span>
                  </li>
                </ul>
                <button 
                  onClick={() => handlePurchaseSubscription('monthly')}
                  disabled={loading}
                  style={{ width: '100%', padding: '0.95rem 1.25rem', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s ease', marginTop: 'auto', boxShadow: '0 4px 12px rgba(167, 139, 113, 0.2)' }}
                >
                  Subscribe Monthly
                </button>
              </div>

              {/* 6-Month Plan */}
              <div className="pricing-card" style={{ background: '#FFFFFF', border: '2px solid #a78b71', borderRadius: '24px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 20px 40px rgba(167, 139, 113, 0.08)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={{ position: 'absolute', top: '-15px', right: '30px', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Best Value
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2D3748', margin: '0 0 0.5rem 0' }}>6-Month Membership</h3>
                  <p style={{ fontSize: '0.9rem', color: '#a78b71', margin: 0, fontWeight: '600' }}>Save big & teach continuously</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1A202C' }}>Rs. 25,000</span>
                  <span style={{ fontSize: '0.95rem', color: '#718096', marginLeft: '0.25rem' }}>/ 6 months</span>
                </div>
                <ul style={{ padding: 0, margin: '0 0 2.5rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.95rem', color: '#4A5568' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Apply and list up to <strong>20 courses</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>No separate fee per course application</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Instant approved discovery list presence</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Membership active for 180 days</span>
                  </li>
                </ul>
                <button 
                  onClick={() => handlePurchaseSubscription('six_months')}
                  disabled={loading}
                  style={{ width: '100%', padding: '0.95rem 1.25rem', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s ease', marginTop: 'auto', boxShadow: '0 4px 12px rgba(167, 139, 113, 0.2)' }}
                >
                  Subscribe 6-Months
                </button>
              </div>

              {/* Annual Plan */}
              <div className="pricing-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2D3748', margin: '0 0 0.5rem 0' }}>Annual Membership</h3>
                  <p style={{ fontSize: '0.9rem', color: '#718096', margin: 0 }}>Ultimate plan for top academic earners</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1A202C' }}>Rs. 45,000</span>
                  <span style={{ fontSize: '0.95rem', color: '#718096', marginLeft: '0.25rem' }}>/ year</span>
                </div>
                <ul style={{ padding: 0, margin: '0 0 2.5rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.95rem', color: '#4A5568' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Apply and list up to <strong>50 courses</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>No separate fee per course application</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Instant approved discovery list presence</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Membership active for 365 days</span>
                  </li>
                </ul>
                <button 
                  onClick={() => handlePurchaseSubscription('annual')}
                  disabled={loading}
                  style={{ width: '100%', padding: '0.95rem 1.25rem', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s ease', marginTop: 'auto', boxShadow: '0 4px 12px rgba(167, 139, 113, 0.2)' }}
                >
                  Subscribe Annually
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tutor Security Verification Form Modal */}
      {showSecurityModal && (
        <div className="modal-overlay" onClick={() => setShowSecurityModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(26, 32, 44, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, padding: '1.5rem' }}>
          <div className="tutor-verification-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #edf2f7', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <div style={{ background: '#faf5ee', borderRadius: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={26} style={{ color: '#a78b71' }} />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1a202c', letterSpacing: '-0.02em', margin: 0 }}>Tutor Verification Console</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <p style={{ color: '#718096', fontSize: '0.9rem', margin: 0 }}>Protecting student safety through secure identity reviews</p>
                  <span style={{ background: '#ebf8ff', color: '#2b6cb0', fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>128-bit Encrypted</span>
                </div>
              </div>
              <button className="close-btn" style={{ fontSize: '2rem', padding: '0.25rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#a0aec0', transition: 'color 0.2s', marginTop: '-4px' }} onClick={() => setShowSecurityModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitSecurityForm} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* ── 2-Column Responsive Body Column Layout ── */}
              <div className="tutor-verification-grid">
                
                {/* ── Left Column: Personal Information ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <User size={16} style={{ color: '#a78b71' }} />
                      Personal Information
                    </h3>
                  </div>

                  {/* Full Name */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Full Name (As on CNIC) *</label>
                    <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                      <User size={16} style={{ color: '#a0aec0' }} />
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={securityFormData.fullName}
                        onChange={(e) => setSecurityFormData({ ...securityFormData, fullName: e.target.value })}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent' }}
                      />
                    </div>
                  </div>

                  {/* CNIC Number */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>CNIC Number (with dashes) *</label>
                    <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                      <IdCard size={16} style={{ color: '#a0aec0' }} />
                      <input
                        type="text"
                        required
                        placeholder="12345-1234567-1"
                        value={securityFormData.cnic}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[0-9-]*$/.test(val)) {
                            setSecurityFormData({ ...securityFormData, cnic: val });
                          }
                        }}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent' }}
                      />
                    </div>
                    <small style={{ color: '#a0aec0', fontSize: '0.75rem', marginTop: '0.1rem', display: 'block' }}>Format: 12345-1234567-1</small>
                  </div>

                  {/* Phone */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Active Mobile Number *</label>
                    <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                      <Phone size={16} style={{ color: '#a0aec0' }} />
                      <input
                        type="tel"
                        required
                        placeholder="03XXXXXXXXX"
                        value={securityFormData.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[0-9]*$/.test(val)) {
                            setSecurityFormData({ ...securityFormData, phone: val });
                          }
                        }}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent' }}
                      />
                    </div>
                  </div>

                  {/* Highest Level of Education */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Highest Level of Education / Institution *</label>
                    <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                      <GraduationCap size={16} style={{ color: '#a0aec0' }} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. BS Computer Science (FAST-NUCES)"
                        value={securityFormData.education}
                        onChange={(e) => setSecurityFormData({ ...securityFormData, education: e.target.value })}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent' }}
                      />
                    </div>
                  </div>

                  {/* Degree Field & Gender */}
                  <div className="tutor-verification-row-2col">
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Degree Field *</label>
                      <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                        <GraduationCap size={16} style={{ color: '#a0aec0' }} />
                        <input
                          type="text"
                          required
                          placeholder="e.g. BSCS, BBA"
                          value={securityFormData.degreeField}
                          onChange={(e) => setSecurityFormData({ ...securityFormData, degreeField: e.target.value })}
                          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Gender *</label>
                      <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                        <User size={16} style={{ color: '#a0aec0' }} />
                        <select
                          required
                          value={securityFormData.gender}
                          onChange={(e) => setSecurityFormData({ ...securityFormData, gender: e.target.value })}
                          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent', cursor: 'pointer' }}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Current Status & Plan Tier */}
                  <div className="tutor-verification-row-2col">
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Current Status *</label>
                      <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                        <Briefcase size={16} style={{ color: '#a0aec0' }} />
                        <select
                          required
                          value={securityFormData.currently}
                          onChange={(e) => setSecurityFormData({ ...securityFormData, currently: e.target.value })}
                          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent', cursor: 'pointer' }}
                        >
                          <option value="">Select Status</option>
                          <option value="student">Student</option>
                          <option value="employer">Employer</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Selected Plan Tier</label>
                      <div className="input-shell" style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.65rem 0.85rem', background: '#f7fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Crown size={16} style={{ color: '#a78b71' }} />
                        <input
                          type="text"
                          disabled
                          value={String(selectedSecurityPlan || '').toUpperCase().replace('_', ' ')}
                          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#4a5568', background: 'transparent', fontWeight: 'bold' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CNIC Document URL */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>CNIC Document URL (Optional)</label>
                    <div className="input-shell" style={{ border: '1.5px solid #cbd5e0', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', transition: 'all 0.2s' }}>
                      <ShieldCheck size={16} style={{ color: '#a0aec0' }} />
                      <input
                        type="text"
                        placeholder="Paste URL to your CNIC scan/photo"
                        value={securityFormData.cnicDocumentUrl}
                        onChange={(e) => setSecurityFormData({ ...securityFormData, cnicDocumentUrl: e.target.value })}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#2d3748', background: 'transparent' }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Right Column: Identity Documents & Guidelines ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <IdCard size={16} style={{ color: '#a78b71' }} />
                      Identity Documents
                    </h3>
                  </div>

                  {/* Upload CNIC Picture Card */}
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600' }}>Upload CNIC Photo *</label>
                    <div className="verification-card-upload" style={{ border: '2px dashed #cbd5e0', borderRadius: '16px', padding: '1.25rem', textAlign: 'center', background: '#fcfaf7', position: 'relative', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', overflow: 'hidden' }}>
                      {securityFormData.cnicPicture ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <img src={securityFormData.cnicPicture} alt="CNIC Preview" style={{ maxHeight: '115px', maxWidth: '100%', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }} />
                          <button type="button" onClick={() => setSecurityFormData({ ...securityFormData, cnicPicture: '' })} style={{ position: 'absolute', top: '0px', right: '0px', background: 'rgba(229, 62, 62, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>×</button>
                        </div>
                      ) : (
                        <div style={{ cursor: 'pointer', width: '100%' }} onClick={() => document.getElementById('cnicPictureInput').click()}>
                          <Image size={24} style={{ color: '#a0aec0', marginBottom: '0.35rem' }} />
                          <div style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '700' }}>CNIC Photo</div>
                          <div style={{ fontSize: '0.72rem', color: '#a0aec0', marginTop: '0.15rem' }}>Click or drag front side of CNIC</div>
                          <input
                            id="cnicPictureInput"
                            type="file"
                            required
                            accept="image/*"
                            onChange={handleSelectCnicPicture}
                            style={{ display: 'none' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Uploads side-by-side */}
                  <div className="tutor-verification-row-2col">
                    {/* Upload Verification Documents */}
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600', minHeight: '36px', display: 'flex', alignItems: 'flex-end', paddingBottom: '0.4rem' }}>Verification Files (Optional)</label>
                      <div className="verification-card-upload" style={{ border: '2px dashed #cbd5e0', borderRadius: '16px', padding: '1rem', textAlign: 'center', background: '#fcfaf7', position: 'relative', minHeight: '105px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden' }} onClick={() => securityVerificationInputRef.current?.click()}>
                        <input
                          ref={securityVerificationInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            setSecurityFormData((prev) => ({ ...prev, verificationFiles: [...(prev.verificationFiles || []), ...files] }))
                            e.target.value = ''
                          }}
                        />
                        <FileUp size={20} style={{ color: '#a0aec0', marginBottom: '0.25rem' }} />
                        <div style={{ fontSize: '0.8rem', color: '#4a5568', fontWeight: '700' }}>Attach Files</div>
                        <div style={{ fontSize: '0.68rem', color: '#a0aec0', marginTop: '0.1rem' }}>Degree / certifications</div>
                      </div>
                    </div>

                    {/* Upload Resume / CV */}
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: '600', minHeight: '36px', display: 'flex', alignItems: 'flex-end', paddingBottom: '0.4rem' }}>Resume / CV (Optional)</label>
                      <div className="verification-card-upload" style={{ border: '2px dashed #cbd5e0', borderRadius: '16px', padding: '1rem', textAlign: 'center', background: '#fcfaf7', position: 'relative', minHeight: '105px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden' }} onClick={() => securityResumeInputRef.current?.click()}>
                        <input
                          ref={securityResumeInputRef}
                          type="file"
                          accept="application/pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setSecurityFormData((prev) => ({ ...prev, resumeFile: file }))
                            e.target.value = ''
                          }}
                        />
                        <FileUp size={20} style={{ color: '#a0aec0', marginBottom: '0.25rem' }} />
                        {securityFormData.resumeFile ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
                            <span style={{ fontSize: '0.8rem', color: '#7a5e44', fontWeight: '600', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{securityFormData.resumeFile.name}</span>
                            <button type="button" onClick={() => setSecurityFormData((prev) => ({ ...prev, resumeFile: null }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontWeight: '700', fontSize: '0.9rem' }}>×</button>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: '0.8rem', color: '#4a5568', fontWeight: '700' }}>Upload PDF</div>
                            <div style={{ fontSize: '0.68rem', color: '#a0aec0', marginTop: '0.1rem' }}>PDF under 5MB</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* List of verification files if uploaded */}
                  {(securityFormData.verificationFiles || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '-0.5rem' }}>
                      {securityFormData.verificationFiles.map((file, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#faf5ee', border: '1px solid #e7dbcb', borderRadius: '8px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#7a5e44' }}>
                          <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setSecurityFormData((prev) => ({ ...prev, verificationFiles: prev.verificationFiles.filter((_, idx) => idx !== i) })) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontWeight: '700', padding: '0', lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submission Guidelines to beautifully fill vertical space and remove whitespace */}
                  <div style={{ background: '#faf5ee', border: '1px dashed #e7dbcb', borderRadius: '14px', padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#634f37', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontWeight: '700', color: '#a78b71', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={16} /> Submission Guidelines
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', lineHeight: '1.4', textAlign: 'left' }}>
                      <li>Please ensure all uploaded images and PDF documents are clear and legible.</li>
                      <li>CNIC details must match the full name entered on the left.</li>
                      <li>Education level and degree field should match your institutional records.</li>
                      <li>Supported formats: JPEG, PNG, PDF under 5MB per file.</li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Secure statement disclaimer badge */}
              <div style={{ background: '#fcf8f2', border: '1px solid #f3e5d0', borderRadius: '14px', padding: '0.85rem 1.25rem', display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '0.25rem' }}>
                <ShieldCheck size={20} style={{ color: '#a78b71', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: '#7a5e44', lineHeight: '1.4', textAlign: 'left' }}>
                  <strong>🔒 Secure Identity Review:</strong> Your credentials are encrypted and strictly reviewed by the CareerMap Safety Operations team. Documents are verified solely to authorize your tutor account and prevent fraudulent offerings, maintaining student community safety.
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', borderTop: '1px solid #edf2f7', paddingTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowSecurityModal(false)} style={{ flex: 1, padding: '0.9rem', borderRadius: '14px', border: '1px solid #cbd5e0', color: '#4a5568', background: '#fff', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 1.5, padding: '0.9rem', borderRadius: '14px', border: 'none', color: '#fff', background: 'linear-gradient(135deg, #a78b71, #634f37)', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(167, 139, 113, 0.25)', transition: 'all 0.2s' }}>
                  <ShieldCheck size={18} />
                  {loading ? 'Processing...' : 'Submit Credentials & Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutor Subscription Pricing Plans Modal */}
      {showSubscriptionSelector && (
        <div className="modal-overlay" onClick={() => setShowSubscriptionSelector(false)}>
          <div className="modal-content subscription-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '2rem' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Crown size={28} style={{ color: '#FFD700' }} />
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #7a5e44 0%, #a78b71 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Choose Your Tutor Plan
                </h2>
              </div>
              <button className="close-btn" style={{ fontSize: '2rem', padding: '0.5rem' }} onClick={() => setShowSubscriptionSelector(false)}>
                ×
              </button>
            </div>

            <p style={{ textAlign: 'center', color: '#718096', fontSize: '1.05rem', marginTop: '-0.5rem', marginBottom: '2.5rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
              Select a premium membership plan to start applying and teaching. Purchase your subscription to unlock course requests directly sent to administrators.
            </p>

            <div className="subscription-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              
              {/* Monthly Plan */}
              <div className="pricing-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '2.2rem 1.8rem', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#2D3748', margin: '0 0 0.5rem 0' }}>Monthly Membership</h3>
                  <p style={{ fontSize: '0.85rem', color: '#A0AEC0', margin: 0 }}>Perfect for short-term teaching</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: '#1A202C' }}>Rs. 5,000</span>
                  <span style={{ fontSize: '0.9rem', color: '#718096', marginLeft: '0.25rem' }}>/ month</span>
                </div>
                <ul style={{ padding: 0, margin: '0 0 2rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', color: '#4A5568' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Apply to teach up to <strong>10 courses</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Instant Admin notification</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Peer mentor chat enabled</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Active for 30 days</span>
                  </li>
                </ul>
                <button 
                  onClick={() => handlePurchaseSubscription('monthly')}
                  disabled={loading}
                  style={{ width: '100%', padding: '0.85rem 1rem', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'background-color 0.2s ease', marginTop: 'auto', boxShadow: '0 4px 12px rgba(167, 139, 113, 0.15)' }}
                >
                  Get Started
                </button>
              </div>

              {/* 6-Month Plan */}
              <div className="pricing-card" style={{ background: '#FFFFFF', border: '2px solid #a78b71', borderRadius: '20px', padding: '2.2rem 1.8rem', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 20px 25px -5px rgba(167, 139, 113, 0.15)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Best Value
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#2D3748', margin: '0 0 0.5rem 0' }}>6-Month Membership</h3>
                  <p style={{ fontSize: '0.85rem', color: '#a78b71', margin: 0, fontWeight: '600' }}>Save up to 17% overall</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: '#1A202C' }}>Rs. 25,000</span>
                  <span style={{ fontSize: '0.9rem', color: '#718096', marginLeft: '0.25rem' }}>/ 6 months</span>
                </div>
                <ul style={{ padding: 0, margin: '0 0 2rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', color: '#4A5568' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Apply to teach up to <strong>20 courses</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Instant Admin notification</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Peer mentor chat enabled</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Active for 180 days</span>
                  </li>
                </ul>
                <button 
                  onClick={() => handlePurchaseSubscription('six_months')}
                  disabled={loading}
                  style={{ width: '100%', padding: '0.85rem 1rem', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'background-color 0.2s ease', marginTop: 'auto', boxShadow: '0 4px 12px rgba(167, 139, 113, 0.2)' }}
                >
                  Subscribe Now
                </button>
              </div>

              {/* Annual Plan */}
              <div className="pricing-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '2.2rem 1.8rem', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#2D3748', margin: '0 0 0.5rem 0' }}>Annual Membership</h3>
                  <p style={{ fontSize: '0.85rem', color: '#A0AEC0', margin: 0 }}>Ultimate long-term commitment</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: '#1A202C' }}>Rs. 45,000</span>
                  <span style={{ fontSize: '0.9rem', color: '#718096', marginLeft: '0.25rem' }}>/ year</span>
                </div>
                <ul style={{ padding: 0, margin: '0 0 2rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', color: '#4A5568' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Apply to teach up to <strong>50 courses</strong></span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Instant Admin notification</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Peer mentor chat enabled</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#38A169', flexShrink: 0 }} />
                    <span>Active for 365 days</span>
                  </li>
                </ul>
                <button 
                  onClick={() => handlePurchaseSubscription('annual')}
                  disabled={loading}
                  style={{ width: '100%', padding: '0.85rem 1rem', background: 'linear-gradient(135deg, #a78b71 0%, #7a5e44 100%)', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'background-color 0.2s ease', marginTop: 'auto', boxShadow: '0 4px 12px rgba(167, 139, 113, 0.15)' }}
                >
                  Join Annually
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Tutor Application Form Modal */}
      {showApplicationForm && (
        <div className="modal-overlay" onClick={() => setShowApplicationForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tutor Application Form</h2>
              <button className="close-btn" onClick={() => {
                setShowApplicationForm(false)
                setFormStep(1)
                setTouchedFields({})
              }}>
                ×
              </button>
            </div>

            {tutorSubscription && tutorSubscription.hasActiveSubscription && (
              <div style={{ background: '#faf7f2', border: '1px solid #e2dcd5', color: '#7a5e44', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 2rem 0 2rem', fontSize: '0.9rem', fontWeight: '500' }}>
                <span>Active Membership: <strong style={{ textTransform: 'capitalize' }}>{tutorSubscription.subscription.planType.replace('_', ' ')}</strong></span>
                <span>Allowance Usage: <strong>{tutorSubscription.coursesUsed} / {tutorSubscription.coursesLimit}</strong> courses applied</span>
              </div>
            )}

            <form className="tutor-application-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-progress-wrap">
                <div className="form-progress-head">
                  <p>Step {formStep} of {formSteps.length}</p>
                  <span>{Math.round((formStep / formSteps.length) * 100)}% complete</span>
                </div>
                <div className="form-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round((formStep / formSteps.length) * 100)}>
                  <span style={{ width: `${(formStep / formSteps.length) * 100}%` }} />
                </div>
                <div className="form-stepper" aria-label="Application steps">
                  {formSteps.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      className={`step-pill ${step.id === formStep ? 'active' : ''} ${step.id < formStep ? 'done' : ''}`}
                      onClick={() => handleStepClick(step.id)}
                    >
                      <span className="step-number">{step.id}</span>
                      <span className="step-label">{step.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formStep === 1 && (
                <div className="form-section form-section-card">
                  <h3>Personal Information</h3>
                  <p className="section-subtext">Tell us who you are so students can trust your profile.</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name *</label>
                      <div className={`input-shell ${getFieldStateClass('fullName')}`}>
                        <User size={17} className="input-icon" />
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          placeholder="Enter your full legal name"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                          required
                        />
                        {touchedFields.fullName && !validationErrors.fullName && <CheckCircle2 size={16} className="status-icon success" />}
                        {touchedFields.fullName && validationErrors.fullName && <AlertCircle size={16} className="status-icon error" />}
                      </div>
                      {touchedFields.fullName && validationErrors.fullName && <small className="field-error">{validationErrors.fullName}</small>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email *</label>
                      <div className={`input-shell ${getFieldStateClass('email')}`}>
                        <AtSign size={17} className="input-icon" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                          required
                        />
                        {touchedFields.email && !validationErrors.email && <CheckCircle2 size={16} className="status-icon success" />}
                        {touchedFields.email && validationErrors.email && <AlertCircle size={16} className="status-icon error" />}
                      </div>
                      {touchedFields.email && validationErrors.email && <small className="field-error">{validationErrors.email}</small>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <div className={`input-shell ${getFieldStateClass('phone')}`}>
                        <Phone size={17} className="input-icon" />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          placeholder="03XX-XXXXXXX"
                          value={formData.phone}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                          required
                        />
                        {touchedFields.phone && !validationErrors.phone && <CheckCircle2 size={16} className="status-icon success" />}
                        {touchedFields.phone && validationErrors.phone && <AlertCircle size={16} className="status-icon error" />}
                      </div>
                      {touchedFields.phone && validationErrors.phone && <small className="field-error">{validationErrors.phone}</small>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="cnic">CNIC *</label>
                      <div className={`input-shell ${getFieldStateClass('cnic')}`}>
                        <IdCard size={17} className="input-icon" />
                        <input
                          type="text"
                          id="cnic"
                          name="cnic"
                          placeholder="12345-1234567-1"
                          value={formData.cnic}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                          required
                        />
                        {touchedFields.cnic && !validationErrors.cnic && <CheckCircle2 size={16} className="status-icon success" />}
                        {touchedFields.cnic && validationErrors.cnic && <AlertCircle size={16} className="status-icon error" />}
                      </div>
                      {touchedFields.cnic && validationErrors.cnic && <small className="field-error">{validationErrors.cnic}</small>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="university">University *</label>
                      <div className={`input-shell ${getFieldStateClass('university')}`}>
                        <GraduationCap size={17} className="input-icon" />
                        <input
                          type="text"
                          id="university"
                          name="university"
                          placeholder="Your university name"
                          value={formData.university}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                          required
                        />
                        {touchedFields.university && !validationErrors.university && <CheckCircle2 size={16} className="status-icon success" />}
                        {touchedFields.university && validationErrors.university && <AlertCircle size={16} className="status-icon error" />}
                      </div>
                      {touchedFields.university && validationErrors.university && <small className="field-error">{validationErrors.university}</small>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="degreeProgram">Degree Program *</label>
                      <div className={`input-shell ${getFieldStateClass('degreeProgram')}`}>
                        <BookOpen size={17} className="input-icon" />
                        <input
                          type="text"
                          id="degreeProgram"
                          name="degreeProgram"
                          placeholder="e.g., BS Computer Science"
                          value={formData.degreeProgram}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                          required
                        />
                        {touchedFields.degreeProgram && !validationErrors.degreeProgram && <CheckCircle2 size={16} className="status-icon success" />}
                        {touchedFields.degreeProgram && validationErrors.degreeProgram && <AlertCircle size={16} className="status-icon error" />}
                      </div>
                      {touchedFields.degreeProgram && validationErrors.degreeProgram && <small className="field-error">{validationErrors.degreeProgram}</small>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="currentSemester">Current Semester *</label>
                      <div className={`input-shell ${getFieldStateClass('currentSemester')}`}>
                        <GraduationCap size={17} className="input-icon" />
                        <input
                          type="text"
                          id="currentSemester"
                          name="currentSemester"
                          placeholder="e.g., 6th Semester"
                          value={formData.currentSemester}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                          required
                        />
                        {touchedFields.currentSemester && !validationErrors.currentSemester && <CheckCircle2 size={16} className="status-icon success" />}
                        {touchedFields.currentSemester && validationErrors.currentSemester && <AlertCircle size={16} className="status-icon error" />}
                      </div>
                      {touchedFields.currentSemester && validationErrors.currentSemester && <small className="field-error">{validationErrors.currentSemester}</small>}
                    </div>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="form-section form-section-card">
                  <h3>Academic Information</h3>
                  <p className="section-subtext">Set your core teaching strengths and expertise areas.</p>

                  <div className="form-group">
                    <label htmlFor="subjects">Subjects You Can Teach *</label>
                    <div className={`input-shell ${getFieldStateClass('subjects')}`}>
                      <BookOpen size={17} className="input-icon" />
                      <input
                        type="text"
                        id="subjects"
                        name="subjects"
                        placeholder="Mathematics, Physics, Programming"
                        value={formData.subjects}
                        onChange={handleInputChange}
                        onBlur={handleFieldBlur}
                        required
                      />
                      {touchedFields.subjects && !validationErrors.subjects && <CheckCircle2 size={16} className="status-icon success" />}
                      {touchedFields.subjects && validationErrors.subjects && <AlertCircle size={16} className="status-icon error" />}
                    </div>
                    {touchedFields.subjects && validationErrors.subjects && <small className="field-error">{validationErrors.subjects}</small>}
                    <small>Enter subjects separated by commas.</small>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="specialization">Specialization *</label>
                      <div className={`input-shell ${getFieldStateClass('specialization')}`}>
                        <Briefcase size={17} className="input-icon" />
                        <input
                          type="text"
                          id="specialization"
                          name="specialization"
                          placeholder="e.g., Software Engineering, Data Science"
                          value={formData.specialization}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                          required
                        />
                        {touchedFields.specialization && !validationErrors.specialization && <CheckCircle2 size={16} className="status-icon success" />}
                        {touchedFields.specialization && validationErrors.specialization && <AlertCircle size={16} className="status-icon error" />}
                      </div>
                      {touchedFields.specialization && validationErrors.specialization && <small className="field-error">{validationErrors.specialization}</small>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="gpa">GPA/CGPA (Optional)</label>
                      <div className="input-shell">
                        <Star size={17} className="input-icon" />
                        <input
                          type="text"
                          id="gpa"
                          name="gpa"
                          placeholder="e.g., 3.8/4.0"
                          value={formData.gpa}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="hourlyRate">PKR/Hour (Optional)</label>
                      <div className="input-shell">
                        <Wallet size={17} className="input-icon" />
                        <input
                          type="number"
                          id="hourlyRate"
                          name="hourlyRate"
                          placeholder="e.g., 2500"
                          min="0"
                          step="1"
                          value={formData.hourlyRate}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="responseTime">Response Time (Optional)</label>
                      <div className="input-shell">
                        <Clock3 size={17} className="input-icon" />
                        <select
                          id="responseTime"
                          name="responseTime"
                          value={formData.responseTime}
                          onChange={handleInputChange}
                          onBlur={handleFieldBlur}
                        >
                          <option value="">Select response time</option>
                          {RESPONSE_TIME_LABELS.map((label) => (
                            <option key={label} value={label}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="form-section form-section-card">
                  <h3>Experience & Qualifications</h3>
                  <p className="section-subtext">Highlight your teaching background and share supporting evidence.</p>

                  <div className="form-group">
                    <label htmlFor="teachingExperience">Teaching Experience</label>
                    <textarea
                      id="teachingExperience"
                      name="teachingExperience"
                      rows="4"
                      placeholder="Describe your teaching or tutoring experience (max 400 words)..."
                      value={formData.teachingExperience}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                    />
                    <small>
                      {teachingExperienceWordCount}/{MAX_TEACHING_EXPERIENCE_WORDS} words
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="certifications">Certifications</label>
                    <textarea
                      id="certifications"
                      name="certifications"
                      rows="3"
                      placeholder="List any relevant certifications..."
                      value={formData.certifications}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="certificationFiles">Attach Certification Files</label>
                    <div
                      className={`upload-dropzone ${dragSection === 'certifications' ? 'drag-active' : ''}`}
                      onDragOver={(e) => handleUploadDragOver(e, 'certifications')}
                      onDragLeave={handleUploadDragLeave}
                      onDrop={(e) => handleUploadDrop(e, 'certifications')}
                    >
                      <FileUp size={18} />
                      <p>
                        Drag & drop files here or{' '}
                        <button
                          type="button"
                          className="upload-browse-btn"
                          onClick={() => certificationInputRef.current?.click()}
                        >
                          browse files
                        </button>
                      </p>
                      <small>Images, videos, and PDFs are supported.</small>
                    </div>
                    <input
                      ref={certificationInputRef}
                      type="file"
                      id="certificationFiles"
                      className="hidden-file-input"
                      accept={MEDIA_ACCEPT}
                      multiple
                      onChange={(e) => {
                        handleUploadFiles('certifications', e.target.files)
                        e.target.value = ''
                      }}
                    />
                    {uploadFiles.certifications.length > 0 && (
                      <div className="uploaded-files-grid">
                        {uploadFiles.certifications.map((item) => (
                          <div key={item.id} className="uploaded-file-item">
                            {item.type.startsWith('image/') ? (
                              <img src={item.previewUrl} alt={item.name} className="uploaded-file-preview" />
                            ) : item.type.startsWith('video/') ? (
                              <video src={item.previewUrl} className="uploaded-file-preview" controls />
                            ) : (
                              <div className="uploaded-file-preview uploaded-file-generic">PDF</div>
                            )}
                            <div className="uploaded-file-meta">
                              <span>{item.name}</span>
                              <small>{formatBytes(item.size)}</small>
                            </div>
                            <div className="uploaded-file-actions">
                              <label className="file-action-btn">
                                Replace
                                <input
                                  type="file"
                                  accept={MEDIA_ACCEPT}
                                  onChange={(e) => {
                                    handleReplaceUploadFile('certifications', item.id, e.target.files?.[0])
                                    e.target.value = ''
                                  }}
                                  hidden
                                />
                              </label>
                              <button
                                type="button"
                                className="file-action-btn delete"
                                onClick={() => handleDeleteUploadFile('certifications', item.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="achievements">Academic Achievements</label>
                    <textarea
                      id="achievements"
                      name="achievements"
                      rows="3"
                      placeholder="List your academic achievements, awards, honors..."
                      value={formData.achievements}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="achievementFiles">Attach Academic Achievement Files</label>
                    <div
                      className={`upload-dropzone ${dragSection === 'achievements' ? 'drag-active' : ''}`}
                      onDragOver={(e) => handleUploadDragOver(e, 'achievements')}
                      onDragLeave={handleUploadDragLeave}
                      onDrop={(e) => handleUploadDrop(e, 'achievements')}
                    >
                      <FileUp size={18} />
                      <p>
                        Drag & drop files here or{' '}
                        <button
                          type="button"
                          className="upload-browse-btn"
                          onClick={() => achievementInputRef.current?.click()}
                        >
                          browse files
                        </button>
                      </p>
                      <small>Upload supporting files for your achievements.</small>
                    </div>
                    <input
                      ref={achievementInputRef}
                      type="file"
                      id="achievementFiles"
                      className="hidden-file-input"
                      accept={MEDIA_ACCEPT}
                      multiple
                      onChange={(e) => {
                        handleUploadFiles('achievements', e.target.files)
                        e.target.value = ''
                      }}
                    />
                    {uploadFiles.achievements.length > 0 && (
                      <div className="uploaded-files-grid">
                        {uploadFiles.achievements.map((item) => (
                          <div key={item.id} className="uploaded-file-item">
                            {item.type.startsWith('image/') ? (
                              <img src={item.previewUrl} alt={item.name} className="uploaded-file-preview" />
                            ) : item.type.startsWith('video/') ? (
                              <video src={item.previewUrl} className="uploaded-file-preview" controls />
                            ) : (
                              <div className="uploaded-file-preview uploaded-file-generic">PDF</div>
                            )}
                            <div className="uploaded-file-meta">
                              <span>{item.name}</span>
                              <small>{formatBytes(item.size)}</small>
                            </div>
                            <div className="uploaded-file-actions">
                              <label className="file-action-btn">
                                Replace
                                <input
                                  type="file"
                                  accept={MEDIA_ACCEPT}
                                  onChange={(e) => {
                                    handleReplaceUploadFile('achievements', item.id, e.target.files?.[0])
                                    e.target.value = ''
                                  }}
                                  hidden
                                />
                              </label>
                              <button
                                type="button"
                                className="file-action-btn delete"
                                onClick={() => handleDeleteUploadFile('achievements', item.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="linkedinPortfolio">LinkedIn / Portfolio Link (Optional)</label>
                    <div className="input-shell">
                      <Link2 size={17} className="input-icon" />
                      <input
                        type="url"
                      id="linkedinPortfolio"
                      name="linkedinPortfolio"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.linkedinPortfolio}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                    />
                  </div>
                </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowApplicationForm(false)
                    setFormStep(1)
                    setTouchedFields({})
                  }}
                >
                  Cancel
                </button>

                <div className="form-actions-right">
                  {formStep > 1 && (
                    <button type="button" className="btn-secondary-step" onClick={handleStepBack}>
                      Back
                    </button>
                  )}

                  {formStep < formSteps.length ? (
                    <button type="button" className="btn-submit" onClick={handleStepNext}>
                      Continue
                    </button>
                  ) : (
                    <button type="button" className="btn-submit" disabled={loading} onClick={handleSubmit}>
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mentor Discovery Section */}
      <div className="mentor-discovery">
        <h2>Find Your Mentor</h2>
        <p className="section-description">
          Explore verified tutors through filters for specialties, universities, and availability.
        </p>

        <div className="discovery-filters">
          <div className="tutor-search-wrap">
            <Search className="search-icon" size={18} aria-hidden="true" />
            <input
              type="text"
              className="tutor-search-input"
              placeholder="Search mentors by name, expertise, course, or skill"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
          >
            {specialtyOptions.map((option) => (
              <option key={option} value={option}>{option === 'All' ? 'All Specialties' : option}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedUniversity}
            onChange={(e) => setSelectedUniversity(e.target.value)}
          >
            {universityOptions.map((option) => (
              <option key={option} value={option}>{option === 'All' ? 'All Universities' : option}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
          >
            <option value="All">All Availability</option>
            {AVAILABILITY_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {loadingTutors ? (
          <div className="loading-tutors">
            <LoaderCircle className="loading-icon" size={34} aria-hidden="true" />
            <p>Loading tutors...</p>
          </div>
        ) : filteredTutors.length > 0 ? (
          <div className="tutors-grid">
            {filteredTutors.map((tutorApp) => {
              const isOwnTutorProfile = String(resolveTutorUserId(tutorApp)) === String(user?.id)
              const isTutorOverviewVisible =
                String(expandedTutorId) === String(tutorApp._id)

              return (
                <div
                  key={tutorApp._id}
                  className={`tutor-card ${isOwnTutorProfile ? '' : 'tutor-card-clickable'}`}
                  onClick={() => {
                    if (!isOwnTutorProfile) {
                      handleTutorCardClick(tutorApp)
                    }
                  }}
                  role={isOwnTutorProfile ? undefined : 'button'}
                  tabIndex={isOwnTutorProfile ? -1 : 0}
                  onKeyDown={(event) => {
                    if (!isOwnTutorProfile && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault()
                      handleTutorCardClick(tutorApp)
                    }
                  }}
                >
                  <div className="tutor-header">
                    <div
                      className="tutor-avatar"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTutorAvatarHover(tutorApp)
                      }}
                    >
                      {tutorApp.userId?.profileImage ? (
                        <img src={tutorApp.userId.profileImage} alt={tutorApp.fullName} />
                      ) : (
                        <span>{tutorApp.fullName?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="tutor-info">
                      <div className="tutor-name-row">
                        <h3>{tutorApp.fullName}</h3>
                        <span className="verification-badge">
                          <BadgeCheck size={14} aria-hidden="true" />
                          Verified
                        </span>
                      </div>
                      <p className="tutor-university">{tutorApp.university || 'University not specified'}</p>
                      <p className="tutor-academics">{tutorApp.academicLine}</p>
                    </div>
                  </div>

                  <div className="tutor-metrics">
                    <div className="metric-item">
                      <Star size={14} aria-hidden="true" />
                      <span>
                        {tutorApp.ratingCount > 0
                          ? `${tutorApp.rating} • ${tutorApp.ratingCount} ratings`
                          : 'No ratings yet'}
                      </span>
                    </div>
                  </div>

                  {!isOwnTutorProfile && (
                    <div className="tutor-rating-input" onClick={(event) => event.stopPropagation()}>
                      <span className="tutor-rating-label">Your rating</span>
                      <div className="tutor-rating-stars" role="group" aria-label={`Rate ${tutorApp.fullName}`}>
                        {[1, 2, 3, 4, 5].map((value) => {
                          const isActive = tutorApp.currentUserRating >= value
                          const isSubmitting = Boolean(ratingSubmittingByTutor[String(tutorApp._id)])

                          return (
                            <button
                              key={`${tutorApp._id}-rating-${value}`}
                              type="button"
                              className={`rating-star-btn ${isActive ? 'active' : ''}`}
                              onClick={() => handleRateTutor(tutorApp, value)}
                              disabled={isSubmitting}
                              aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                              title={`${value} star${value > 1 ? 's' : ''}`}
                            >
                              <Star size={14} fill={isActive ? 'currentColor' : 'none'} aria-hidden="true" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <p className="tutor-bio">{tutorApp.bio}</p>

                  <div className="subjects-list">
                    {tutorApp.tags.length > 0 ? (
                      tutorApp.tags.map((tag, index) => (
                        <span key={`${tag}-${index}`} className="subject-tag">{tag}</span>
                      ))
                    ) : (
                      <span className="subject-tag">General Mentorship</span>
                    )}
                  </div>

                  <div className="tutor-extra-details">
                    <div className="detail-item">
                      <Clock3 size={14} aria-hidden="true" />
                      <span>{tutorApp.responseTime}</span>
                    </div>
                    <div className="detail-item">
                      <Wallet size={14} aria-hidden="true" />
                      <span>{tutorApp.hourlyRate > 0 ? `PKR ${tutorApp.hourlyRate}/hour` : 'Rate not set'}</span>
                    </div>
                    <div className={`detail-item availability ${getAvailabilityClass(tutorApp.availability)}`}>
                      <Circle className="status-dot" size={10} fill="currentColor" aria-hidden="true" />
                      <span>{tutorApp.availability}</span>
                    </div>
                  </div>

                  {isTutorOverviewVisible && (
                    <div className="expanded-profile">
                      <h4>Teaching Background</h4>
                      {tutorApp.teachingExperience && <p><strong>Experience:</strong> {tutorApp.teachingExperience}</p>}
                      {tutorApp.certifications && <p><strong>Certifications:</strong> {tutorApp.certifications}</p>}
                      {tutorApp.achievements && <p><strong>Achievements:</strong> {tutorApp.achievements}</p>}
                    </div>
                  )}

                  <div className="tutor-actions" onClick={(event) => event.stopPropagation()}>
                    {isOwnTutorProfile ? (
                      <button type="button" className="btn-connect" disabled>
                        <UserRound size={16} aria-hidden="true" />
                        Your Profile
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`btn-connect ${startingChatTutorId === String(tutorApp._id) ? 'is-loading' : ''}`}
                        onClick={() => handleStartChatWithTutor(tutorApp)}
                        disabled={startingChatTutorId === String(tutorApp._id)}
                      >
                        <Mail size={16} aria-hidden="true" />
                        {startingChatTutorId === String(tutorApp._id) ? 'Opening Chat...' : 'Connect'}
                      </button>
                    )}
                    {!user?.isAdmin && (
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => handleStartChatWithTutor(tutorApp)}
                        disabled={isOwnTutorProfile}
                        aria-label={`Open chat with ${tutorApp.fullName}`}
                        title={isOwnTutorProfile ? "You can't message yourself" : 'Open chat'}
                      >
                        <MessageCircle size={16} aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => handleViewTutorProfile(tutorApp._id)}
                      aria-label={`View profile of ${tutorApp.fullName}`}
                      title="View profile"
                    >
                      <UserRound size={16} aria-hidden="true" />
                    </button>

                    {user?.isAdmin && (
                      <>
                        <button
                          type="button"
                          className="icon-action-btn admin-card-btn"
                          onClick={() => openAdminTutorEditor(tutorApp)}
                          aria-label={`Edit tutor card for ${tutorApp.fullName}`}
                          title="Edit tutor card"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn admin-card-btn admin-delete-btn"
                          onClick={() => openAdminDeleteModal(tutorApp)}
                          aria-label={`Delete tutor card for ${tutorApp.fullName}`}
                          title="Delete tutor card"
                          disabled={deletingTutorId === tutorApp._id}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="no-tutors">
            <Users className="empty-icon" size={42} aria-hidden="true" />
            <p>No tutors match your selected filters yet.</p>
          </div>
        )}
      </div>

      {showChatDrawer && (
        <div className="chat-overlay" onClick={closeChatDrawer}>
          <section className="chat-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="chat-drawer-header">
              <div>
                <h3>Mentorship Chat</h3>
                <p>
                  {chatConnecting
                    ? 'Connecting...'
                    : chatConnected
                      ? 'Live and online'
                      : 'Offline mode'}
                </p>
              </div>
              <button
                type="button"
                className="chat-close-btn"
                onClick={closeChatDrawer}
                aria-label="Close chat panel"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={`chat-drawer-body ${activeConversationId ? 'has-active-chat' : 'no-active-chat'}`}>
              <aside className="chat-conversations-panel">
                <div className="chat-panel-title-row">
                  <h4>Conversations</h4>
                  <span>{chatConversations.filter((conv) => !conv.isBlockedByMe).length}</span>
                </div>

                {chatLoadingConversations ? (
                  <div className="chat-empty">Loading conversations...</div>
                ) : chatConversations.filter((conv) => !conv.isBlockedByMe).length > 0 ? (
                  <div className="chat-conversations-list">
                    {chatConversations.filter((conv) => !conv.isBlockedByMe).map((conversation) => {
                      const isActive = String(conversation._id) === String(activeConversationId)
                      const counterpart = conversation.counterpart || {}

                      return (
                        <button
                          key={conversation._id}
                          type="button"
                          className={`chat-conversation-item ${isActive ? 'active' : ''}`}
                          onClick={() => handleSelectConversation(conversation._id)}
                        >
                          <div className="chat-conversation-avatar" aria-hidden="true">
                            {counterpart.profileImage ? (
                              <img src={counterpart.profileImage} alt={getDisplayName(counterpart)} />
                            ) : (
                              <span>{getDisplayName(counterpart).charAt(0).toUpperCase()}</span>
                            )}
                            <span
                              className={`chat-presence-dot ${counterpart.isOnline ? 'online' : 'offline'}`}
                              title={counterpart.isOnline ? 'Online' : 'Offline'}
                            />
                          </div>

                          <div className="chat-conversation-meta">
                            <div className="chat-conversation-top">
                              <strong>{getDisplayName(counterpart)}</strong>
                              <small>{formatConversationTime(conversation.lastMessageAt)}</small>
                            </div>
                            <p>{conversation.lastMessageText || 'No messages yet. Start the conversation.'}</p>
                          </div>

                          {conversation.isBlocked && (
                            <span className="chat-conversation-status-pill">
                              {conversation.isBlockedByMe ? 'Blocked by you' : 'Blocked'}
                            </span>
                          )}

                          {Number(conversation.unreadCount || 0) > 0 && (
                            <span className="chat-unread-pill">{conversation.unreadCount}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="chat-empty">No conversations yet. Tap Connect on any tutor card.</div>
                )}
              </aside>

              <section className="chat-thread-panel">
                {activeConversation ? (
                  <>
                    <div className="chat-thread-header">
                      <button
                        type="button"
                        className="chat-back-btn"
                        onClick={() => setActiveConversationId('')}
                        aria-label="Back to conversations list"
                      >
                        <ArrowLeft size={20} aria-hidden="true" />
                      </button>
                      <div className="chat-thread-avatar" aria-hidden="true">
                        {activeConversation.counterpart?.profileImage ? (
                          <img
                            src={activeConversation.counterpart.profileImage}
                            alt={getDisplayName(activeConversation.counterpart)}
                          />
                        ) : (
                          <span>{getDisplayName(activeConversation.counterpart).charAt(0).toUpperCase()}</span>
                        )}
                        <span
                          className={`chat-presence-dot ${activeConversation.counterpart?.isOnline ? 'online' : 'offline'}`}
                          title={activeConversation.counterpart?.isOnline ? 'Online' : 'Offline'}
                        />
                      </div>
                      <div className="chat-thread-meta">
                        <h4>{getDisplayName(activeConversation.counterpart)}</h4>
                        <p>
                          {activeConversation.counterpart?.isOnline
                            ? 'Online'
                            : chatConnected
                              ? 'Offline'
                              : 'Reconnecting...'}
                        </p>
                      </div>
                      <div className="chat-thread-actions" ref={chatActionsMenuRef}>
                        <button
                          type="button"
                          className="chat-menu-btn"
                          onClick={() => setShowChatActionsMenu((prev) => !prev)}
                          aria-label="Open chat actions"
                          title="Chat actions"
                        >
                          <MoreVertical size={16} aria-hidden="true" />
                        </button>

                        {showChatActionsMenu && (
                          <div className="chat-actions-menu" role="menu" aria-label="Chat actions menu">
                            <button
                              type="button"
                              className="chat-actions-item warning"
                              onClick={() => handleToggleBlockConversation('block')}
                              disabled={activeConversationBlocked || chatUpdatingBlock}
                              role="menuitem"
                              title={activeConversationBlocked ? 'Cannot block - already blocked' : 'Block user'}
                            >
                              <AlertCircle size={14} aria-hidden="true" />
                              <span>Block User</span>
                            </button>
                            {activeConversationBlockedByMe && (
                              <button
                                type="button"
                                className="chat-actions-item success"
                                onClick={() => handleToggleBlockConversation('unblock')}
                                disabled={chatUpdatingBlock}
                                role="menuitem"
                                title="Unblock user"
                              >
                                <Unlock size={14} aria-hidden="true" />
                                <span>Unblock User</span>
                              </button>
                            )}
                            {user?.isTutor && (
                              <>
                                <button
                                  type="button"
                                  className="chat-actions-item"
                                  onClick={openLearningAgreementModal}
                                  role="menuitem"
                                  title="Create learning agreement"
                                >
                                  <FileText size={14} aria-hidden="true" />
                                  <span>Create Agreement</span>
                                </button>
                                <button
                                  type="button"
                                  className="chat-actions-item"
                                  onClick={openMyLearningAgreementsModal}
                                  role="menuitem"
                                  title="View all your learning agreements"
                                >
                                  <FileText size={14} aria-hidden="true" />
                                  <span>View all your learning agreements</span>
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className="chat-actions-item danger"
                              onClick={openChatDeleteModal}
                              disabled={chatDeletingConversationId === String(activeConversationId)}
                              role="menuitem"
                            >
                              <Trash2 size={14} aria-hidden="true" />
                              <span>
                                {chatDeletingConversationId === String(activeConversationId)
                                  ? 'Deleting...'
                                  : 'Delete Chat'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="chat-messages-list" ref={chatMessagesListRef}>
                      {chatLoadingMessages ? (
                        <div className="chat-empty">Loading messages...</div>
                      ) : chatMessages.length > 0 ? (
                        chatMessages.map((message) => (
                          <div
                            key={message._id}
                            className={`chat-message-row ${message.isMine ? 'mine' : ''}`}
                          >
                            <div className="chat-message-bubble">
                              {message.content ? <p>{message.content}</p> : null}

                              {message.attachment?.dataUrl && (
                                <div className="chat-message-attachment">
                                  {isChatImageAttachment(message.attachment) ? (
                                    <a
                                      href={message.attachment.dataUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="chat-attachment-image-link"
                                    >
                                      <img
                                        src={message.attachment.dataUrl}
                                        alt={message.attachment.name || 'Shared image'}
                                        className="chat-attachment-image"
                                      />
                                    </a>
                                  ) : isChatPdfAttachment(message.attachment) ? (
                                    <button
                                      type="button"
                                      className="chat-attachment-doc"
                                      onClick={() => handleOpenPdfAttachment(message.attachment)}
                                      title="Open PDF"
                                    >
                                      <FileText size={16} aria-hidden="true" />
                                      <span>{message.attachment.name || 'Shared PDF document'}</span>
                                    </button>
                                  ) : null}
                                </div>
                              )}

                              <span>{formatConversationTime(message.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="chat-empty">No messages yet. Send the first message.</div>
                      )}

                      {chatTypingByConversation[String(activeConversationId)] && (
                        <div className="chat-typing-indicator">
                          <span className="chat-typing-dot"></span>
                          <span className="chat-typing-dot"></span>
                          <span className="chat-typing-dot"></span>
                          <p>{getDisplayName(activeConversation.counterpart)} is typing...</p>
                        </div>
                      )}
                    </div>

                    {activeConversationBlocked && (
                      <div className="chat-blocked-note" role="status" aria-live="polite">
                        <AlertCircle size={15} aria-hidden="true" />
                        <span>
                          {activeConversationBlockedByMe
                            ? 'You blocked this user. Unblock from the menu to continue chatting.'
                            : 'You were blocked by this user. Messaging is disabled for this chat.'}
                        </span>
                      </div>
                    )}

                    <form className="chat-compose-row" onSubmit={handleSendMessage}>
                      <input
                        ref={chatFileInputRef}
                        type="file"
                        className="hidden-file-input"
                        accept={CHAT_MEDIA_ACCEPT}
                        onChange={handleSelectChatAttachment}
                        disabled={
                          chatSending ||
                          activeConversationBlocked ||
                          chatDeletingConversationId === String(activeConversationId)
                        }
                      />

                      <button
                        type="button"
                        className="chat-attach-btn"
                        onClick={() => chatFileInputRef.current?.click()}
                        disabled={
                          chatSending ||
                          activeConversationBlocked ||
                          chatDeletingConversationId === String(activeConversationId)
                        }
                        aria-label="Attach image or PDF"
                        title="Attach image or PDF"
                      >
                        <Paperclip size={16} aria-hidden="true" />
                      </button>

                      <input
                        type="text"
                        placeholder={activeConversationBlocked ? 'Messaging disabled for this chat' : 'Type your message...'}
                        value={chatDraft}
                        onChange={handleChatDraftChange}
                        disabled={
                          chatSending ||
                          activeConversationBlocked ||
                          chatDeletingConversationId === String(activeConversationId)
                        }
                      />
                      <button
                        type="submit"
                        className="chat-send-btn"
                        disabled={
                          chatSending ||
                          activeConversationBlocked ||
                          (!chatDraft.trim() && !chatAttachment) ||
                          chatDeletingConversationId === String(activeConversationId)
                        }
                      >
                        <SendHorizontal size={16} aria-hidden="true" />
                      </button>
                    </form>

                    {chatAttachment && (
                      <div className="chat-attachment-preview-row">
                        <div className="chat-attachment-preview-meta">
                          {chatAttachment.previewUrl ? (
                            <img
                              src={chatAttachment.previewUrl}
                              alt={chatAttachment.name}
                              className="chat-attachment-preview-thumb"
                            />
                          ) : (
                            <span className="chat-attachment-preview-icon">PDF</span>
                          )}
                          <div>
                            <strong>{chatAttachment.name}</strong>
                            <small>{formatBytes(chatAttachment.size)}</small>
                          </div>
                        </div>
                        <button type="button" className="chat-attachment-remove-btn" onClick={handleRemoveChatAttachment}>
                          Remove
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="chat-thread-empty">
                    <h4>Select a conversation</h4>
                    <p>Choose a tutor from the list to view and send messages.</p>
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      )}

      {showChatDeleteModal && activeConversation && (
        <div className="modal-overlay chat-confirm-overlay" onClick={closeChatDeleteModal}>
          <div className="modal-content admin-delete-modal chat-delete-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Chat</h2>
              <button className="close-btn" onClick={closeChatDeleteModal}>×</button>
            </div>

            <div className="tutor-application-form admin-delete-confirm-body">
              <p className="admin-delete-confirm-copy">
                Are you sure you want to delete chat with <strong>{getDisplayName(activeConversation.counterpart)}</strong>? This action cannot be undone.
              </p>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={closeChatDeleteModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-submit btn-danger-theme"
                  onClick={handleDeleteConversation}
                  disabled={chatDeletingConversationId === String(activeConversationId)}
                >
                  {chatDeletingConversationId === String(activeConversationId) ? 'Deleting...' : 'Delete Chat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChatBlockModal && activeConversation && (
        <div className="modal-overlay chat-confirm-overlay" onClick={closeChatBlockModal}>
          <div className="modal-content admin-delete-modal chat-block-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>{blockAction === 'unblock' ? 'Unblock User' : 'Block User'}</h2>
              <button className="close-btn" onClick={closeChatBlockModal}>×</button>
            </div>

            <div className="tutor-application-form admin-delete-confirm-body">
              <p className="admin-delete-confirm-copy">
                {blockAction === 'unblock' ? (
                  <>
                    Unblock <strong>{getDisplayName(activeConversation.counterpart)}</strong>? You will be able to exchange messages again.
                  </>
                ) : (
                  <>
                    Block <strong>{getDisplayName(activeConversation.counterpart)}</strong>? Neither of you will be able to send messages until you unblock them.
                  </>
                )}
              </p>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={closeChatBlockModal} disabled={chatUpdatingBlock}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn-submit ${blockAction === 'unblock' ? '' : 'btn-warning-theme'}`.trim()}
                  onClick={confirmToggleBlockConversation}
                  disabled={chatUpdatingBlock}
                >
                  {chatUpdatingBlock
                    ? blockAction === 'unblock'
                      ? 'Unblocking...'
                      : 'Blocking...'
                    : blockAction === 'unblock'
                      ? 'Unblock User'
                      : 'Block User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLearningAgreementModal && activeConversation && (
        <div className="modal-overlay chat-confirm-overlay" onClick={closeLearningAgreementModal}>
          <div className="modal-content learning-agreement-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Learning Agreement</h2>
              <button className="close-btn" onClick={closeLearningAgreementModal}>×</button>
            </div>

            <form className="tutor-application-form" onSubmit={handleSubmitLearningAgreement}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="agreement-tutorName">Tutor Name</label>
                  <input
                    id="agreement-tutorName"
                    name="tutorName"
                    className="form-input"
                    value={learningAgreementForm.tutorName}
                    onChange={handleLearningAgreementInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="agreement-studentName">Student Name</label>
                  <input
                    id="agreement-studentName"
                    name="studentName"
                    className="form-input"
                    value={learningAgreementForm.studentName}
                    onChange={handleLearningAgreementInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="agreement-subjectCourse">Subject / Course</label>
                  <input
                    id="agreement-subjectCourse"
                    name="subjectCourse"
                    className="form-input"
                    value={learningAgreementForm.subjectCourse}
                    onChange={handleLearningAgreementInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="agreement-sessionDateTime">Session Date and Time</label>
                  <input
                    id="agreement-sessionDateTime"
                    name="sessionDateTime"
                    type="datetime-local"
                    className="form-input"
                    value={learningAgreementForm.sessionDateTime}
                    onChange={handleLearningAgreementInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="agreement-duration">Duration</label>
                <input
                  id="agreement-duration"
                  name="duration"
                  className="form-input"
                  placeholder="e.g., 60 minutes"
                  value={learningAgreementForm.duration}
                  onChange={handleLearningAgreementInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="agreement-learningObjectives">Learning Objectives</label>
                <textarea
                  id="agreement-learningObjectives"
                  name="learningObjectives"
                  className="form-input"
                  rows="4"
                  value={learningAgreementForm.learningObjectives}
                  onChange={handleLearningAgreementInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="agreement-sessionNotesPlan">Session Notes / Plan</label>
                <textarea
                  id="agreement-sessionNotesPlan"
                  name="sessionNotesPlan"
                  className="form-input"
                  rows="4"
                  value={learningAgreementForm.sessionNotesPlan}
                  onChange={handleLearningAgreementInputChange}
                  required
                />
              </div>

              <div className="form-actions learning-agreement-actions">
                <button
                  type="button"
                  className="btn-secondary-step agreement-download-btn"
                  onClick={handleDownloadLearningAgreement}
                >
                  <Download size={15} aria-hidden="true" />
                  Download
                </button>
                <button type="submit" className="btn-submit" disabled={savingLearningAgreement}>
                  {savingLearningAgreement ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMyLearningAgreementsModal && (
        <div className="modal-overlay chat-confirm-overlay" onClick={closeMyLearningAgreementsModal}>
          <div className="modal-content learning-agreement-modal my-learning-agreements-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Your Learning Agreements</h2>
              <button className="close-btn" onClick={closeMyLearningAgreementsModal}>×</button>
            </div>

            <div className="tutor-application-form">
              {loadingMyLearningAgreements ? (
                <div className="chat-empty">Loading your learning agreements...</div>
              ) : myLearningAgreements.length === 0 ? (
                <div className="chat-empty">No learning agreements found yet.</div>
              ) : (
                <div className="my-learning-agreements-list">
                  {myLearningAgreements.map((agreement) => (
                    <article key={agreement._id} className="my-learning-agreement-card">
                      <div className="my-learning-agreement-row"><strong>Tutor:</strong> <span>{agreement.tutorName || 'N/A'}</span></div>
                      <div className="my-learning-agreement-row"><strong>Student:</strong> <span>{agreement.studentName || 'N/A'}</span></div>
                      <div className="my-learning-agreement-row"><strong>Subject / Course:</strong> <span>{agreement.subjectCourse || 'N/A'}</span></div>
                      <div className="my-learning-agreement-row"><strong>Session Date:</strong> <span>{agreement.sessionDateTime ? new Date(agreement.sessionDateTime).toLocaleString() : 'N/A'}</span></div>
                      <div className="my-learning-agreement-row"><strong>Duration:</strong> <span>{agreement.duration || 'N/A'}</span></div>
                      <div className="my-learning-agreement-row"><strong>Learning Objectives:</strong> <span>{agreement.learningObjectives || 'N/A'}</span></div>
                      <div className="my-learning-agreement-row"><strong>Session Notes / Plan:</strong> <span>{agreement.sessionNotesPlan || 'N/A'}</span></div>
                      <div className="my-learning-agreement-row muted-row"><strong>Created:</strong> <span>{agreement.createdAt ? new Date(agreement.createdAt).toLocaleString() : 'N/A'}</span></div>
                      <div className="my-learning-agreement-actions">
                        <button
                          className="btn-delete-agreement"
                          onClick={() => handleDeleteLearningAgreement(agreement._id)}
                          title="Delete this learning agreement"
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
        </div>
      )}

      {showDeleteAgreementConfirm && (
        <div className="modal-overlay chat-confirm-overlay" onClick={() => setShowDeleteAgreementConfirm(false)}>
          <div className="modal-content admin-delete-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Learning Agreement</h2>
              <button className="close-btn" onClick={() => setShowDeleteAgreementConfirm(false)}>×</button>
            </div>

            <div className="tutor-application-form admin-delete-confirm-body">
              <p className="admin-delete-confirm-copy">
                Are you sure you want to delete this learning agreement? This action cannot be undone.
              </p>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowDeleteAgreementConfirm(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-submit btn-danger-theme"
                  onClick={confirmDeleteLearningAgreement}
                  disabled={!agreementToDelete}
                >
                  Delete Agreement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdminEditModal && adminEditingTutor && (
        <div className="modal-overlay" onClick={closeAdminTutorEditor}>
          <div className="modal-content admin-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Tutor Card</h2>
              <button className="close-btn" onClick={closeAdminTutorEditor}>×</button>
            </div>

            <form className="tutor-application-form" onSubmit={submitAdminTutorUpdate}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="admin-fullName">Full Name</label>
                  <input id="admin-fullName" name="fullName" className="form-input" value={adminTutorForm.fullName} onChange={handleAdminTutorInputChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-email">Email</label>
                  <input id="admin-email" name="email" type="email" className="form-input" value={adminTutorForm.email} onChange={handleAdminTutorInputChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="admin-phone">Phone</label>
                  <input id="admin-phone" name="phone" className="form-input" value={adminTutorForm.phone} onChange={handleAdminTutorInputChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-gpa">GPA</label>
                  <input id="admin-gpa" name="gpa" className="form-input" value={adminTutorForm.gpa} onChange={handleAdminTutorInputChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-hourlyRate">PKR/Hour</label>
                  <input id="admin-hourlyRate" name="hourlyRate" type="number" min="0" step="1" className="form-input" value={adminTutorForm.hourlyRate} onChange={handleAdminTutorInputChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-responseTime">Response Time</label>
                  <select id="admin-responseTime" name="responseTime" className="form-input" value={adminTutorForm.responseTime} onChange={handleAdminTutorInputChange}>
                    <option value="">Select response time</option>
                    {RESPONSE_TIME_LABELS.map((label) => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="admin-university">University</label>
                  <input id="admin-university" name="university" className="form-input" value={adminTutorForm.university} onChange={handleAdminTutorInputChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-degreeProgram">Degree Program</label>
                  <input id="admin-degreeProgram" name="degreeProgram" className="form-input" value={adminTutorForm.degreeProgram} onChange={handleAdminTutorInputChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="admin-currentSemester">Semester</label>
                  <input id="admin-currentSemester" name="currentSemester" className="form-input" value={adminTutorForm.currentSemester} onChange={handleAdminTutorInputChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-status">Status</label>
                  <select id="admin-status" name="status" className="form-input" value={adminTutorForm.status} onChange={handleAdminTutorInputChange}>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="admin-specialization">Specialization</label>
                  <input id="admin-specialization" name="specialization" className="form-input" value={adminTutorForm.specialization} onChange={handleAdminTutorInputChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-subjects">Subjects (comma separated)</label>
                  <input id="admin-subjects" name="subjects" className="form-input" value={adminTutorForm.subjects} onChange={handleAdminTutorInputChange} required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="admin-teachingExperience">Teaching Experience</label>
                <textarea id="admin-teachingExperience" name="teachingExperience" className="form-input" rows="3" value={adminTutorForm.teachingExperience} onChange={handleAdminTutorInputChange} />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={closeAdminTutorEditor}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={savingAdminTutor}>
                  {savingAdminTutor ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showAdminDeleteModal}
        title="Delete Tutor Card"
        message={`Are you sure you want to delete ${adminTutorToDelete?.fullName || 'this tutor'}? This will remove the tutor application record.`}
        onConfirm={deleteAdminTutorCard}
        onCancel={closeAdminDeleteModal}
        confirmText={deletingTutorId === adminTutorToDelete?._id ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
      />

      {showTutorProfileModal && selectedTutorForProfile && (
        <div
          className="modal-overlay tutor-profile-modal-overlay"
          onClick={closeTutorProfileModal}
        >
          <div
            className="modal-content tutor-profile-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Premium cover banner */}
            <div className="tutor-modal-cover">
              <button className="close-btn-modal" onClick={closeTutorProfileModal}>×</button>
            </div>

            {/* Header with overlapping avatar */}
            <div className="tutor-modal-header">
              <div className="tutor-modal-avatar-wrapper">
                {selectedTutorForProfile.userId?.profileImage ? (
                  <img
                    src={selectedTutorForProfile.userId.profileImage}
                    alt={selectedTutorForProfile.fullName}
                    className="tutor-modal-avatar"
                  />
                ) : (
                  <div className="tutor-modal-avatar-placeholder">
                    {selectedTutorForProfile.fullName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="tutor-modal-verification">
                  <BadgeCheck size={16} aria-hidden="true" fill="currentColor" />
                </span>
              </div>
            </div>

            {/* Profile Content */}
            <div className="tutor-modal-body">
              {/* Name, University and Location */}
              <div className="tutor-modal-title-section">
                <h2 className="tutor-modal-name">{selectedTutorForProfile.fullName}</h2>
                <p className="tutor-modal-university">
                  <GraduationCap size={16} />
                  <span>{selectedTutorForProfile.university || 'University not specified'}</span>
                  {selectedTutorForProfile.userId?.city && (
                    <>
                      <span className="bullet-dot">•</span>
                      <MapPin size={14} />
                      <span>{selectedTutorForProfile.userId.city}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="tutor-modal-stats">
                <div className="stat-badge">
                  <Star size={16} aria-hidden="true" />
                  <div>
                    <span className="stat-label">Rating</span>
                    <span className="stat-value">
                      {selectedTutorForProfile.ratingCount > 0
                        ? `${selectedTutorForProfile.ratingAverage || selectedTutorForProfile.rating || 0} (${selectedTutorForProfile.ratingCount})`
                        : 'No ratings'}
                    </span>
                  </div>
                </div>
                <div className="stat-badge">
                  <Clock3 size={16} aria-hidden="true" />
                  <div>
                    <span className="stat-label">Response Time</span>
                    <span className="stat-value">{selectedTutorForProfile.responseTime || 'Not set'}</span>
                  </div>
                </div>
                <div className="stat-badge">
                  <Wallet size={16} aria-hidden="true" />
                  <div>
                    <span className="stat-label">Rate</span>
                    <span className="stat-value">{selectedTutorForProfile.hourlyRate > 0 ? `PKR ${selectedTutorForProfile.hourlyRate}/hr` : 'Not set'}</span>
                  </div>
                </div>
              </div>

              {/* Academic & Professional Details Grid */}
              <div className="tutor-modal-details-grid">
                <div className="detail-card">
                  <span className="detail-icon"><GraduationCap size={18} aria-hidden="true" /></span>
                  <div className="detail-content">
                    <span className="detail-label">Degree Program</span>
                    <span className="detail-value">{selectedTutorForProfile.degreeProgram || 'Not specified'}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <span className="detail-icon"><Briefcase size={18} aria-hidden="true" /></span>
                  <div className="detail-content">
                    <span className="detail-label">Department</span>
                    <span className="detail-value">{selectedTutorForProfile.userId?.department || selectedTutorForProfile.degreeProgram || 'Not specified'}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <span className="detail-icon"><BookOpen size={18} aria-hidden="true" /></span>
                  <div className="detail-content">
                    <span className="detail-label">Semester</span>
                    <span className="detail-value">{selectedTutorForProfile.currentSemester || 'Not specified'}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <span className="detail-icon"><Briefcase size={18} aria-hidden="true" /></span>
                  <div className="detail-content">
                    <span className="detail-label">Experience</span>
                    <span className="detail-value">{selectedTutorForProfile.teachingExperience ? `${selectedTutorForProfile.teachingExperience.substring(0, 50)}...` : 'Not specified'}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <span className="detail-icon"><BookOpen size={18} aria-hidden="true" /></span>
                  <div className="detail-content">
                    <span className="detail-label">Teaches</span>
                    <span className="detail-value">{selectedTutorForProfile.tags && selectedTutorForProfile.tags.length > 0 ? selectedTutorForProfile.tags.slice(0, 2).join(', ') : 'Not specified'}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <span className="detail-icon"><Circle size={18} aria-hidden="true" fill="currentColor" /></span>
                  <div className="detail-content">
                    <span className="detail-label">Availability</span>
                    <span className={`detail-value availability-${getTutorDisplayMeta(selectedTutorForProfile).availability.toLowerCase().replace(/\s+/g, '-')}`}>
                      {getTutorDisplayMeta(selectedTutorForProfile).availability}
                    </span>
                  </div>
                </div>

                <div className="detail-card">
                  <span className="detail-icon"><IdCard size={18} aria-hidden="true" /></span>
                  <div className="detail-content">
                    <span className="detail-label">CGPA</span>
                    <span className="detail-value">{selectedTutorForProfile.gpa || 'Not specified'}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <span className="detail-icon"><MapPin size={18} aria-hidden="true" /></span>
                  <div className="detail-content">
                    <span className="detail-label">City</span>
                    <span className="detail-value">{selectedTutorForProfile.userId?.city || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Subjects/Tags */}
              {selectedTutorForProfile.tags && selectedTutorForProfile.tags.length > 0 && (
                <div className="tutor-modal-subjects">
                  <h4>What They Teach</h4>
                  <div className="subjects-badges">
                    {selectedTutorForProfile.tags.map((tag, index) => (
                      <span key={`${tag}-${index}`} className="subject-badge">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Details Sections */}
              {selectedTutorForProfile.teachingExperience && (
                <div className="tutor-modal-section">
                  <h4>Full Teaching Experience</h4>
                  <p>{selectedTutorForProfile.teachingExperience}</p>
                </div>
              )}

              {selectedTutorForProfile.certifications && (
                <div className="tutor-modal-section">
                  <h4>Certifications</h4>
                  <p>{selectedTutorForProfile.certifications}</p>
                </div>
              )}

              {selectedTutorForProfile.achievements && (
                <div className="tutor-modal-section">
                  <h4>Achievements</h4>
                  <p>{selectedTutorForProfile.achievements}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="tutor-modal-footer">
              {!user?.isAdmin && (
                <button
                  type="button"
                  className="btn-modal-connect"
                  onClick={() => {
                    closeTutorProfileModal()
                    handleStartChatWithTutor(selectedTutorForProfile)
                  }}
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  Connect Now
                </button>
              )}
              <button
                type="button"
                className="btn-modal-close"
                onClick={closeTutorProfileModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── About Mentorship ── */}
      <section className="about-mentorship">
        <div className="abm-inner">
          {/* Text column */}
          <div className="abm-text">
            <span className="abm-eyebrow">About Mentorship</span>
            <h2 className="abm-title">Learn Better, Together</h2>
            <p className="abm-desc">
              Career Map pairs students with verified peer mentors who understand
              exactly what you’re going through. Whether you need help with
              coursework, career planning, or university decisions, the right
              mentor is here to guide you.
            </p>
          </div>

          {/* Highlight cards column */}
          <div className="abm-highlights">
            <div className="abm-hl-card">
              <div className="abm-hl-icon abm-hl-icon--brand">
                <Users size={20} />
              </div>
              <div className="abm-hl-body">
                <h4>Peer-to-Peer Learning</h4>
                <p>Get guidance from students who’ve already faced the same challenges — relatable, honest, and practical.</p>
              </div>
            </div>

            <div className="abm-hl-card">
              <div className="abm-hl-icon abm-hl-icon--green">
                <BadgeCheck size={20} />
              </div>
              <div className="abm-hl-body">
                <h4>Verified &amp; Trusted</h4>
                <p>Every mentor is reviewed and approved before going live, so you always connect with qualified peers.</p>
              </div>
            </div>

            <div className="abm-hl-card">
              <div className="abm-hl-icon abm-hl-icon--amber">
                <Star size={20} />
              </div>
              <div className="abm-hl-body">
                <h4>Academic &amp; Career Growth</h4>
                <p>From exam prep to career roadmaps, mentors help you build the skills and confidence to succeed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {!user?.isAdmin && (
        <button
          type="button"
          className="floating-chat-button"
          onClick={handleOpenChatDrawer}
          aria-label="Open chat inbox"
          title="Chat inbox"
        >
          <MessageCircle size={24} aria-hidden="true" />
          {chatUnreadCount > 0 && (
            <span className="floating-chat-badge">{chatUnreadCount > 99 ? '99+' : chatUnreadCount}</span>
          )}
        </button>
      )}
    </div>
  )
}

export default Mentorship
