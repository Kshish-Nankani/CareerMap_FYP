import jwt from 'jsonwebtoken'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { markUserConnected, markUserDisconnected, isUserOnline } from './presenceStore.js'
import {
  trimText,
  serializeUser,
  parseAttachment,
  getMessagePreviewText,
  getConversationBlockState,
  getBlockedSendMessage
} from '../utils/chatHelpers.js'
import { uploadToCloudinary } from '../utils/cloudinary.js'

const getTokenFromHandshake = (socket) => {
  const rawToken =
    socket.handshake?.auth?.token ||
    socket.handshake?.headers?.authorization ||
    ''

  if (typeof rawToken !== 'string') return ''
  if (rawToken.startsWith('Bearer ')) {
    return rawToken.slice(7)
  }
  return rawToken
}

export function registerChatSocket(io) {
  io.use((socket, next) => {  // Middleware to authenticate socket connection
    try {
      const token = getTokenFromHandshake(socket)
      if (!token) {
        console.warn('Socket auth failed: No token provided')
        return next(new Error('Unauthorized: No token provided'))
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET)  // 
      socket.userId = String(payload.sub)  // Attach user ID to socket for later use
      console.log(`Socket authenticated for user: ${socket.userId}`)
      return next()
    } catch (error) {
      console.error('Socket auth error:', error?.message || error)
      return next(new Error( 'Unauthorized: Invalid token'))
    }
  })

  io.on('connection', (socket) => { // Handle new socket connection
    console.log(`User connected: ${socket.userId}`)
    markUserConnected(socket.userId)  

    socket.join(`user:${socket.userId}`) // Join a personal room for the user to receive direct events

    io.emit('chat:presence-changed', { // Notify all clients about the user's online status
      userId: String(socket.userId),
      isOnline: true
    })
     // Set up event handlers for chat functionality
    socket.on('chat:join-conversation', async (payload = {}, ack) => {
      try {
        const conversationId = trimText(payload.conversationId)
        if (!conversationId) {
          if (typeof ack === 'function') ack({ ok: false, message: 'Conversation id is required' })
          return
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId  // Ensure the user is a participant of the conversation before allowing to join
        }).select('_id')

        if (!conversation) {
          if (typeof ack === 'function') ack({ ok: false, message: 'Conversation not found' })
          return
        }

        socket.join(`conversation:${conversationId}`)  // Join the socket room for the conversation to receive messages and updates
        if (typeof ack === 'function') ack({ ok: true })
      } catch (_error) {
        if (typeof ack === 'function') ack({ ok: false, message: 'Failed to join conversation' })
      }
    })

    socket.on('chat:send', async (payload = {}, ack) => {
      try {
        const conversationId = trimText(payload.conversationId)
        const content = trimText(payload.content)
        const attachment = parseAttachment(payload.attachment)

        if (!conversationId || (!content && !attachment)) {
          if (typeof ack === 'function') ack({ ok: false, message: 'Conversation and message content are required' })
          return
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        }).select('_id participants blockedBy blockedAt')

        if (!conversation) {
          if (typeof ack === 'function') ack({ ok: false, message: 'Conversation not found' })
          return
        }

        const blockedSendMessage = getBlockedSendMessage(conversation, socket.userId)
        if (blockedSendMessage) {
          if (typeof ack === 'function') ack({ ok: false, message: blockedSendMessage })
          return
        }

        // Upload attachment to Cloudinary before saving to MongoDB
        let cloudinaryAttachment = attachment
        if (attachment?.dataUrl) {
          try {
            const folder = attachment.type === 'pdf'
              ? 'careermap/chat/documents'
              : 'careermap/chat/images'
            const cloudinaryUrl = await uploadToCloudinary(attachment.dataUrl, folder)
            cloudinaryAttachment = {
              ...attachment,
              dataUrl: cloudinaryUrl   // Replace base64 with Cloudinary URL
            }
          } catch (uploadErr) {
            console.error('[Chat] Cloudinary upload failed, storing base64 fallback:', uploadErr.message)
            // Fallback: keep original dataUrl so message still sends
          }
        }

        const message = await Message.create({
          conversationId,
          sender: socket.userId,
          content,
          attachment: cloudinaryAttachment,
          readBy: [socket.userId]
        })

        await Conversation.updateOne(  // Update conversation's last message info for preview and sorting
          { _id: conversationId },
          {
            lastMessageText: getMessagePreviewText(content, attachment),
            lastMessageSender: socket.userId,
            lastMessageAt: message.createdAt
          }
        )

        const sender = await User.findById(socket.userId).select('fullName email profileImage isTutor')

        const messagePayload = {
          _id: message._id,
          conversationId: message.conversationId,
          content: message.content,
          attachment: message.attachment || null,
          sender: serializeUser(sender),
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          isMine: false
        }
      // Emit the new message to all participants in the conversation except the sender
        io.to(`conversation:${conversationId}`).emit('chat:new-message', messagePayload)

        conversation.participants
          .map((participant) => String(participant))
          .filter((participantId) => participantId !== String(socket.userId))
          .forEach((participantId) => {
            io.to(`user:${participantId}`).emit('chat:conversation-updated', {
              conversationId,
              byUserId: String(socket.userId)
            })
          })

        if (typeof ack === 'function') ack({ ok: true, messageId: String(message._id) })
      } catch (error) {
        if (typeof ack === 'function') {
          ack({ ok: false, message: error?.message || 'Failed to send message' })
        }
      }
    })

    socket.on('chat:mark-read', async (payload = {}, ack) => {
      try {
        const conversationId = trimText(payload.conversationId)
        if (!conversationId) {
          if (typeof ack === 'function') ack({ ok: false, message: 'Conversation id is required' })
          return
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        }).select('participants blockedBy blockedAt')

        if (!conversation) {
          if (typeof ack === 'function') ack({ ok: false, message: 'Conversation not found' })
          return
        }

        const blockState = getConversationBlockState(conversation, socket.userId)
        if (blockState.isBlocked) {
          if (typeof ack === 'function') ack({ ok: false, message: 'Typing is disabled for blocked chats' })
          return
        }

        await Message.updateMany(
          {
            conversationId,
            sender: { $ne: socket.userId },
            readBy: { $ne: socket.userId }
          },
          {
            $addToSet: { readBy: socket.userId }
          }
        )

        conversation.participants
          .map((participant) => String(participant))
          .filter((participantId) => participantId !== String(socket.userId))
          .forEach((participantId) => {
            io.to(`user:${participantId}`).emit('chat:conversation-updated', {
              conversationId,
              byUserId: String(socket.userId)
            })
          })

        if (typeof ack === 'function') ack({ ok: true })
      } catch (_error) {
        if (typeof ack === 'function') ack({ ok: false, message: 'Failed to mark conversation as read' })
      }
    })

    socket.on('chat:typing', async (payload = {}, ack) => {
      try {
        const conversationId = trimText(payload.conversationId)
        const isTyping = Boolean(payload.isTyping)

        if (!conversationId) {
          if (typeof ack === 'function') ack({ ok: false, message: 'Conversation id is required' })
          return
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        }).select('participants')

        if (!conversation) {
          if (typeof ack === 'function') ack({ ok: false, message: 'Conversation not found' })
          return
        }

        socket.join(`conversation:${conversationId}`)

        conversation.participants
          .map((participant) => String(participant))
          .filter((participantId) => participantId !== String(socket.userId))
          .forEach((participantId) => {
            io.to(`user:${participantId}`).emit('chat:typing', {
              conversationId,
              userId: String(socket.userId),
              isTyping
            })
          })

        if (typeof ack === 'function') ack({ ok: true })
      } catch (_error) {
        if (typeof ack === 'function') ack({ ok: false, message: 'Failed to update typing status' })
      }
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`)
      markUserDisconnected(socket.userId)
      io.emit('chat:presence-changed', {
        userId: String(socket.userId),
        isOnline: isUserOnline(socket.userId)
      })
    })
  })
}
