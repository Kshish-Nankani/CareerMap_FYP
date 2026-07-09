import mongoose from 'mongoose'

const LearningAgreementSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tutorName: {
      type: String,
      required: true,
      trim: true
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    subjectCourse: {
      type: String,
      required: true,
      trim: true
    },
    sessionDateTime: {
      type: Date,
      required: true
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    learningObjectives: {
      type: String,
      required: true,
      trim: true
    },
    sessionNotesPlan: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
)

const LearningAgreement = mongoose.model('LearningAgreement', LearningAgreementSchema) // model stores the learning agreement data in monogoDB collection named 'learningagreements'

export default LearningAgreement
