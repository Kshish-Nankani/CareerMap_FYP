import express from 'express'
import mongoose from 'mongoose'
import authenticate from '../middleware/auth.js'
import Conversation from '../models/Conversation.js'
import LearningAgreement from '../models/LearningAgreement.js'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { 
  trimText, 
  serializeUser, 
  parseAttachment, 
  getMessagePreviewText, 
  getConversationBlockState, 
  getBlockedSendMessage 
} from '../utils/chatHelpers.js'

const router = express.Router()

const buildPairKey = (userA, userB) => [String(userA), String(userB)].sort().join(':')
const parseSessionDateTime = (value) => {
  const trimmed = trimText(value)
  if (!trimmed) return null

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const serializeConversation = (conversation, currentUserId, unreadCount = 0) => {
  
  const counterpart = conversation.participants.find(
    (participant) => String(participant._id) !== String(currentUserId)
  )
  const blockState = getConversationBlockState(conversation, currentUserId)

  return {
    _id: conversation._id,
    type: conversation.type,
    counterpart: serializeUser(counterpart),
    participants: conversation.participants.map(serializeUser),
    lastMessageText: conversation.lastMessageText || '',
    lastMessageAt: conversation.lastMessageAt || null,
    unreadCount,
    updatedAt: conversation.updatedAt,
    ...blockState
  }
}

router.use(authenticate)

router.post('/conversations/start', async (req, res) => {
  try {
    const tutorUserId = trimText(req.body?.tutorUserId)

    if (!mongoose.Types.ObjectId.isValid(tutorUserId)) {
      return res.status(400).json({ success: false, message: 'Valid tutor user id is required' })
    }

    if (String(req.user.id) === tutorUserId) {
      return res.status(400).json({ success: false, message: 'You cannot chat with yourself' })
    }

    const tutor = await User.findById(tutorUserId).select('fullName email profileImage isTutor')
    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor user not found' })
    }

    const pairKey = buildPairKey(req.user.id, tutorUserId) 

    let conversation = await Conversation.findOne({ pairKey })
      .populate(
      'participants',
      'fullName email profileImage isTutor'
      )
      .populate('blockedBy', 'fullName email profileImage isTutor')

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [req.user.id, tutorUserId],
        pairKey,
        lastMessageText: '',
        lastMessageAt: null
      })
      conversation = await conversation.populate('participants', 'fullName email profileImage isTutor')
      conversation = await conversation.populate('blockedBy', 'fullName email profileImage isTutor')
    }

    return res.json({
      success: true,
      conversation: serializeConversation(conversation, req.user.id, 0)
    })
  } catch (error) {
    console.error('Error starting conversation:', error)
    return res.status(500).json({ success: false, message: 'Failed to start conversation' })
  }
})
 
router.get('/conversations', async (req, res) => {
  try {
    const query = { participants: req.user.id }  
    
    const conversations = await Conversation.find(query) // the cur
      .populate('participants', 'fullName email profileImage isTutor')
      .populate('blockedBy', 'fullName email profileImage isTutor')
      .sort({ lastMessageAt: -1, updatedAt: -1 })  

    const conversationIds = conversations.map((conversation) => conversation._id)

    const unreadCounts = new Map() 
    if (conversationIds.length > 0) {
      const unread = await Message.aggregate([
        {
          $match: {
            conversationId: { $in: conversationIds }, 
            sender: { $ne: new mongoose.Types.ObjectId(req.user.id) }, 
            readBy: { $nin: [new mongoose.Types.ObjectId(req.user.id)] } 
          }
        },
        {
          $group: {
            _id: '$conversationId',
            count: { $sum: 1 }
          }
        }
      ])

      unread.forEach((entry) => {
        unreadCounts.set(String(entry._id), Number(entry.count || 0))
      })
    }

    const serialized = conversations.map((conversation) =>
      serializeConversation(conversation, req.user.id, unreadCounts.get(String(conversation._id)) || 0) // acha matlab hum ne serialize as a response ki tarah banaya he  
    )

    return res.json({ success: true, conversations: serialized })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch conversations' })
  }
})

router.get('/blocked-users', async (req, res) => {
  try {
    
    const allConversations = await Conversation.find({
      participants: req.user.id,
      blockedBy: { $exists: true, $ne: null }
    })
      .populate('participants', 'fullName email profileImage isTutor')
      .populate('blockedBy', '_id fullName email')
      .sort({ blockedAt: -1, updatedAt: -1 }) 

    
    const blockedConversations = allConversations.filter((conversation) => {
      const blockedById = String(conversation.blockedBy?._id || conversation.blockedBy || '')
      return blockedById === String(req.user.id) // ids string me convert kar k compare kar rahe he taki type mismatch na ho, matlab blockedBy field me se wo conversation select karo jaha blockedBy ka id current user ke id ke barabar ho
    })
       
    const blockedUsers = blockedConversations .map((conversation) => {
        const counterpart = conversation.participants.find(  // current user skip and select other user 
          (participant) => String(participant._id) !== String(req.user.id)
        )

        if (!counterpart) return null

        return {
          conversationId: String(conversation._id),
          blockedAt: conversation.blockedAt || conversation.updatedAt || null,
          user: serializeUser(counterpart)
        }
      })
      .filter(Boolean)

    return res.json({ success: true, blockedUsers })
  } catch (error) {
    console.error('Error fetching blocked users:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch blocked users' })
  }
})

router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation id' })
    }

    const query = { _id: conversationId, participants: req.user.id } //specidic conversation ko find karo jisme current user participant ho,  aur sirf wahi conversation mile jisme current user involved ho

    const conversation = await Conversation.findOne(query).select('_id participants') // find the conversation by id and make sure the current user is a participant, select only id and participants fields

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    const messages = await Message.find({ conversationId }) // 
      .sort({ createdAt: 1 }) 
      .populate('sender', 'fullName email profileImage')

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user.id },
        readBy: { $ne: req.user.id }
      },
      {
        $addToSet: { readBy: req.user.id } 
      }
    )
    
    const io = req.app.get('io')
    if (io) {
      conversation.participants
        .map((participant) => String(participant))
        .filter((participantId) => participantId !== String(req.user.id))
        .forEach((participantId) => {
          io.to(`user:${participantId}`).emit('chat:conversation-updated', {
            conversationId,
            byUserId: String(req.user.id)
          })
        })
    }

    return res.json({
      success: true,
      messages: messages.map((message) => ({
        _id: message._id,
        conversationId: message.conversationId,
        content: message.content,
        attachment: message.attachment || null,
        sender: serializeUser(message.sender),
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        isMine: String(message.sender?._id) === String(req.user.id)
      }))
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' })
  }
})

router.post('/messages', async (req, res) => {
  try {
    const conversationId = trimText(req.body?.conversationId)
    const content = trimText(req.body?.content)
    const attachment = parseAttachment(req.body?.attachment)

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation id' })
    }

    if (!content && !attachment) {
      return res.status(400).json({ success: false, message: 'Message content or attachment is required' })
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    }).select('_id participants blockedBy blockedAt')

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    const blockedSendMessage = getBlockedSendMessage(conversation, req.user.id)
    if (blockedSendMessage) {
      return res.status(403).json({ success: false, message: blockedSendMessage })
    }

    const message = await Message.create({
      conversationId,
      sender: req.user.id,
      content,
      attachment,
      readBy: [req.user.id]
    })

    conversation.lastMessageText = getMessagePreviewText(content, attachment)
    conversation.lastMessageAt = message.createdAt
    await conversation.save()

    const populatedMessage = await Message.findById(message._id).populate('sender', 'fullName email profileImage')

    const payload = {
      _id: populatedMessage._id,
      conversationId: populatedMessage.conversationId,
      content: populatedMessage.content,
      attachment: populatedMessage.attachment || null,
      sender: serializeUser(populatedMessage.sender),
      createdAt: populatedMessage.createdAt,
      updatedAt: populatedMessage.updatedAt,
      isMine: true
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`conversation:${conversationId}`).emit('chat:new-message', payload)
      conversation.participants
        .map((participant) => String(participant))
        .filter((participantId) => participantId !== String(req.user.id))
        .forEach((participantId) => {
          io.to(`user:${participantId}`).emit('chat:conversation-updated', {
            conversationId,
            byUserId: String(req.user.id)
          })
        })
    }

    return res.status(201).json({ success: true, message: payload })
  } catch (error) {
    console.error('Error sending message:', error)
    if (error.message?.includes('attachment') || error.message?.includes('Attachment')) {
      return res.status(400).json({ success: false, message: error.message })
    }
    return res.status(500).json({ success: false, message: 'Failed to send message' })
  }
})

router.delete('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation id' })
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    }).select('_id participants')

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    await Message.deleteMany({ conversationId: conversation._id })
    await Conversation.deleteOne({ _id: conversation._id })

    const io = req.app.get('io')
    if (io) {
      conversation.participants
        .map((participant) => String(participant))
        .forEach((participantId) => {
          io.to(`user:${participantId}`).emit('chat:conversation-deleted', {
            conversationId: String(conversation._id),
            deletedBy: String(req.user.id)
          })
        })
    }

    return res.json({ success: true, conversationId: String(conversation._id) })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return res.status(500).json({ success: false, message: 'Failed to delete conversation' })
  }
})

router.post('/conversations/:conversationId/block', async (req, res) => {
  try {
    const { conversationId } = req.params

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation id' })
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    })
      .populate('participants', 'fullName email profileImage isTutor')
      .populate('blockedBy', 'fullName email profileImage isTutor')

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    conversation.blockedBy = req.user.id
    conversation.blockedAt = new Date()
    await conversation.save()
    await conversation.populate('blockedBy', 'fullName email profileImage isTutor')

    const io = req.app.get('io')
    if (io) {
      conversation.participants
        .map((participant) => String(participant._id || participant))
        .forEach((participantId) => {
          io.to(`user:${participantId}`).emit('chat:conversation-updated', {
            conversationId: String(conversation._id),
            byUserId: String(req.user.id)
          })
        })
    }

    return res.json({
      success: true,
      message: 'User blocked in this chat',
      conversation: serializeConversation(conversation, req.user.id, 0)
    })
  } catch (error) {
    console.error('Error blocking conversation:', error)
    return res.status(500).json({ success: false, message: 'Failed to block user in chat' })
  }
})

router.delete('/conversations/:conversationId/block', async (req, res) => {
  try {
    const { conversationId } = req.params

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation id' })
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    })
      .populate('participants', 'fullName email profileImage isTutor')
      .populate('blockedBy', 'fullName email profileImage isTutor')

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    conversation.blockedBy = null
    conversation.blockedAt = null
    await conversation.save()

    const io = req.app.get('io')
    if (io) {
      conversation.participants
        .map((participant) => String(participant._id || participant))
        .forEach((participantId) => {
          io.to(`user:${participantId}`).emit('chat:conversation-updated', {
            conversationId: String(conversation._id),
            byUserId: String(req.user.id)
          })
        })
    }

    return res.json({
      success: true,
      message: 'User unblocked in this chat',
      conversation: serializeConversation(conversation, req.user.id, 0)
    })
  } catch (error) {
    console.error('Error unblocking conversation:', error)
    return res.status(500).json({ success: false, message: 'Failed to unblock user in chat' })
  }
})

router.post('/conversations/:conversationId/agreements', async (req, res) => {
  try {
    const { conversationId } = req.params

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation id' })
    }

    const currentUser = await User.findById(req.user.id).select('isTutor')
    if (!currentUser?.isTutor) {
      return res.status(403).json({ success: false, message: 'Only tutors can create learning agreements' })
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    }).select('_id')

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    const tutorName = trimText(req.body?.tutorName)
    const studentName = trimText(req.body?.studentName)
    const subjectCourse = trimText(req.body?.subjectCourse)
    const sessionDateTime = parseSessionDateTime(req.body?.sessionDateTime)
    const duration = trimText(req.body?.duration)
    const learningObjectives = trimText(req.body?.learningObjectives)
    const sessionNotesPlan = trimText(req.body?.sessionNotesPlan)

    if (
      !tutorName ||
      !studentName ||
      !subjectCourse ||
      !sessionDateTime ||
      !duration ||
      !learningObjectives ||
      !sessionNotesPlan
    ) {
      return res.status(400).json({ success: false, message: 'All learning agreement fields are required' })
    }

    const agreement = await LearningAgreement.create({
      conversationId,
      createdBy: req.user.id,
      tutorName,
      studentName,
      subjectCourse,
      sessionDateTime,
      duration,
      learningObjectives,
      sessionNotesPlan
    })

    return res.status(201).json({
      success: true,
      agreement: {
        _id: agreement._id,
        conversationId: agreement.conversationId,
        tutorName: agreement.tutorName,
        studentName: agreement.studentName,
        subjectCourse: agreement.subjectCourse,
        sessionDateTime: agreement.sessionDateTime,
        duration: agreement.duration,
        learningObjectives: agreement.learningObjectives,
        sessionNotesPlan: agreement.sessionNotesPlan,
        createdAt: agreement.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating learning agreement:', error)
    return res.status(500).json({ success: false, message: 'Failed to create learning agreement' })
  }
})

router.get('/agreements/mine', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select('isTutor')
    if (!currentUser?.isTutor) {
      return res.status(403).json({ success: false, message: 'Only tutors can view learning agreements' })
    }

    const agreements = await LearningAgreement.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .select(
        '_id conversationId tutorName studentName subjectCourse sessionDateTime duration learningObjectives sessionNotesPlan createdAt updatedAt'
      )

    return res.json({ success: true, agreements })
  } catch (error) {
    console.error('Error fetching tutor learning agreements:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch learning agreements' })
  }
})

router.delete('/agreements/:agreementId', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select('isTutor')
    if (!currentUser?.isTutor) {
      return res.status(403).json({ success: false, message: 'Only tutors can delete learning agreements' })
    }

    const { agreementId } = req.params

    const agreement = await LearningAgreement.findById(agreementId)
    if (!agreement) {
      return res.status(404).json({ success: false, message: 'Learning agreement not found' })
    }

    // Check if the tutor owns this agreement
    if (agreement.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own learning agreements' })
    }

    await LearningAgreement.findByIdAndDelete(agreementId)

    return res.json({ success: true, message: 'Learning agreement deleted successfully' })
  } catch (error) {
    console.error('Error deleting learning agreement:', error)
    return res.status(500).json({ success: false, message: 'Failed to delete learning agreement' })
  }
})

export default router
