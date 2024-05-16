import mongoose from "mongoose";

const PostDataContainerSchema = new mongoose.Schema(
  {
    postOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    ownerType: {
      type: String,
      default: "consumer",
      enum: ["consumer"],
    },
    postType: {
      type: String,
      enum: ["general", "event", "survey", "poll"],
      required: true,
    },
    postVisibility: {
      type: String,
      enum: ["public", "private"],
      required: true,
    },
    dateOfPost: {
      type: Date,
      default: Date.now()
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
    address: {
      type: String,
      select: false
    },
    city: {
      type: String,
      select: false
    },
    country: {
      type: String,
      select: false
    },
    likeAllowed: {
      type: Boolean,
      default: true
    },
    commentAllowed: {
      type: Boolean,
      default: true
    },
    likeCommentHide: {
      type: Boolean,
      default: false
    },
    userLikes: { count: { type: Number, default: 0 }, recentLikedBy: [String] },
    commentCount: { type: Number, default: 0 },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number], // First element: Longitude, Second element: Latitude
        index: "2dsphere", // Create a 2dsphere index for geospatial queries
      },
    },
    viewCounter: {
      type: Number,
      default: 0,
    },
    clickCounter: {
      type: Number,
      default: 0,
    },
    shareCounter: {
      type: Number,
      default: 0,
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
    responses: [
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
    moreInformation: {
      type: Array
    },
    sharedWith: {
      type: [
          {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Users"
          }
      ],
      default: [],
      select: false
  }
  },
  { timestamps: true }
);

// Add a 2dSphere index on the location field
PostDataContainerSchema.index({ location: "2dsphere" });

const PostDataContainer = mongoose.model("PostDataContainer", PostDataContainerSchema);
export default PostDataContainer;
