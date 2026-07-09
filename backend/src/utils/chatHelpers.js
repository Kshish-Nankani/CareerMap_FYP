import { isUserOnline } from '../socket/presenceStore.js'

const trimText = (value = '') => String(value || '').trim()
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
const ALLOWED_ATTACHMENT_MIME_TYPES = ['application/pdf']

const serializeUser = (user) => {
  if (!user) return null
  return {
    _id: user._id,
    fullName: user.fullName || '',
    email: user.email || '',
    profileImage: user.profileImage || '',
    isTutor: Boolean(user.isTutor),
    isOnline: isUserOnline(user._id)
  }
}

const parseAttachment = (rawAttachment = {}) => {
  if (!rawAttachment || typeof rawAttachment !== 'object') return null

  const name = trimText(rawAttachment.name).slice(0, 255)
  const mimeType = trimText(rawAttachment.mimeType).toLowerCase()
  const dataUrl = trimText(rawAttachment.dataUrl)
  const size = Number(rawAttachment.size || 0)

  if (!dataUrl) return null

  const isImage = mimeType.startsWith('image/')
  const isPdf = ALLOWED_ATTACHMENT_MIME_TYPES.includes(mimeType)
  if (!isImage && !isPdf) {
    throw new Error('Only image and PDF attachments are allowed')
  }

  if (!Number.isFinite(size) || size <= 0 || size > MAX_ATTACHMENT_BYTES) {
    throw new Error('Attachment exceeds maximum allowed size')
  }

  if (!dataUrl.startsWith(`data:${mimeType};base64,`)) {
    throw new Error('Invalid attachment payload')
  }

  return {
    type: isPdf ? 'pdf' : 'image',
    name: name || (isPdf ? 'document.pdf' : 'image'),
    mimeType,
    size,
    dataUrl
  }
}

const getMessagePreviewText = (content = '', attachment = null) => {
  const trimmed = trimText(content)
  if (trimmed) return trimmed
  if (attachment?.type === 'image') return '[Image]'
  if (attachment?.type === 'pdf') return '[PDF]'
  return ''
}

const getConversationBlockState = (conversation, currentUserId) => {
  const blockedById = String(conversation?.blockedBy?._id || conversation?.blockedBy || '')
  const userId = String(currentUserId || '')
  const isBlocked = Boolean(blockedById)
  const isBlockedByMe = isBlocked && blockedById === userId
  const isBlockedByOther = isBlocked && blockedById !== userId

  return {
    blockedBy: blockedById || null,
    blockedAt: conversation?.blockedAt || null,
    isBlocked,
    isBlockedByMe,
    isBlockedByOther,
    canSendMessages: !isBlocked
  }
}

const getBlockedSendMessage = (conversation, currentUserId) => {
  const state = getConversationBlockState(conversation, currentUserId)
  if (!state.isBlocked) return ''
  if (state.isBlockedByMe) return 'You blocked this user. Unblock to continue chatting.'
  return 'You cannot send messages in this chat because you were blocked by the other user.'
}

export {
  trimText,
  MAX_ATTACHMENT_BYTES,
  ALLOWED_ATTACHMENT_MIME_TYPES,
  serializeUser,
  parseAttachment,
  getMessagePreviewText,
  getConversationBlockState,
  getBlockedSendMessage
}
