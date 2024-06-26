import mongoose from "mongoose";

const PostDataContainerSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    postType: {
      type: String,
      default: "general",
      enum: ["general", "survey", "poll"],
      required: true,
      select: false
    },
    dateOfPost: {
      type: Date,
      default: new Date()
    },
    postAssets: [
      {
        fileType: {
          type: String,
          enum: ['video', 'image']
        },
        thumbnail: {
          type: Object,
          default: undefined
        },
        name: {
          type: String,
        },
        public_id: {
          type: String,
        },
        url: {
          type: String,
        }
      }
    ],
    postCaptions: [{
      type: String,
    }],
    postSummary: {
      type: String
    },
    isEventPost: {
      type: Boolean,
      default: false,
      select: false,
    },
    eventID: {
      type: String,
      select: false,
    },
    country: {
      type: String,
      select: false
    },
    isPostPublic: {
      type: Boolean,
      default: true,
    },
    isPostActive: {
      type: Boolean,
      default: true,
    },
    allowComment: {
      type: Boolean,
      default: true,
    },
    likeCountVisible: {
      type: Boolean,
      default: true
    },
    likeCommentVisible: {
      type: Boolean,
      default: true
    },
    userLikes: {
      type: {
        count: { type: Number, default: 0 },
        recentLikedBy: String
      },
      select: false
    },
    commentCount: {
      type: Number,
      default: 0,
      select: false
    },
    viewCounter: {
      type: Number,
      default: 0,
      select: false
    },
    clickCounter: {
      type: Number,
      default: 0,
      select: false
    },
    shareCounter: {
      type: Number,
      default: 0,
      select: false
    },
    reportCount: {
      type: Number,
      default: 0,
      select: false,
    },
    isPostEdited: {
      type: Boolean,
      default: false,
      select: false,
    },
    postEditTime: {
      type: Date,
      default: undefined,
      select: false,
    },
    startDate: {
      type: Date,
      select: false
    },
    endDate: {
      type: Date,
      select: false
    },
    // Reference to a separate schema for question details
    questions: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Questions',
      select: false
    },
    responses: {
      type: [
        {
          userId: {  // New field to store user ID
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users', // Reference to your User schema 
          },
          questionResponses: [  // Array to hold responses for all questions
            {
              questionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Questions', // Reference to your Questions schema
              },
              answerIndex: {  // Optional for multiple choice (index of chosen option)
                type: Number,
              },
              answerText: {  // Optional for text answers
                type: String,
              },
            },
            // ... Add more questionResponses objects for other questions
          ]
        },
      ],
      select: false
    },
    moreInformation: {
      type: Array
    },
    sharedWith: {
      type: [String],
      select: false,
      default: []
    }
  },
  { timestamps: true }
);

// Add a 2dSphere index on the location field
PostDataContainerSchema.index({ location: "2dsphere" });

const PostDataContainer = mongoose.model("PostDataContainer", PostDataContainerSchema);
export default PostDataContainer;
