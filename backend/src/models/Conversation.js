import mongoose from 'mongoose'

const ConversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct'],
      default: 'direct'
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    pairKey: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    lastMessageText: {
      type: String,
      default: ''
    },
    lastMessageSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastMessageAt: {
      type: Date,
      default: null
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    blockedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

ConversationSchema.index({ participants: 1 })  
ConversationSchema.index({ lastMessageAt: -1 })

const Conversation = mongoose.model('Conversation', ConversationSchema) // 

export default Conversation
