import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    attachment: {
      type: {
        type: String,
        enum: ['image', 'pdf']
      },
      name: {
        type: String,
        trim: true,
        maxlength: 255
      },
      mimeType: {
        type: String,
        trim: true,
        maxlength: 120
      },
      size: {
        type: Number,
        min: 0,
        max: 8 * 1024 * 1024
      },
      dataUrl: {
        type: String,
        maxlength: 12 * 1024 * 1024
      }
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
)

MessageSchema.index({ conversationId: 1, createdAt: 1 }) // it fast the message

MessageSchema.pre('validate', function validateMessage(next) {
  const hasContent = Boolean(String(this.content || '').trim())
  const hasAttachment = Boolean(this.attachment?.dataUrl) //

  if (!hasContent && !hasAttachment) {
    return next(new Error('Message content or attachment is required'))
  }

  if (hasAttachment && !this.attachment?.type) {
    return next(new Error('Attachment type is required'))
  }

  return next()
})

const Message = mongoose.model('Message', MessageSchema)

export default Message
