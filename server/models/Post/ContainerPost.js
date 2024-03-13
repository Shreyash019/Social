const mongoose = require('mongoose');

const ContainerPostModelSchema = new mongoose.Schema(
    {
        postOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
        ownerType: {
            type: String,
            enum: ['user', 'business']
        },
        postType: {
            type: String,
            enum: ['normal', 'event', 'survey','poll', 'buzzads'],
            required: true
        },
        postVisibility: {
            type: String,
            enum: ['public', 'private'],
            required: true
        },
        postCategory: { type: String, required: true },
        postSubCategory: { type: String, required: true },
        normalPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NormalPost",
            select: false
        },
        eventPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EventPost",
            select: false
        },
        surveyPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SurveyPost",
            select: false
        },
        dateOfPost: { type: Date, default: Date.now() },
        taggedGroup:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserGroups",
            select: false
        },
        privateMembers: {
            type: [
                {   type: mongoose.Schema.Types.ObjectId,
                    ref: "Users",
                }
            ],
            default: [],
            select: false
        },
        address: { type: String, select: false },
        city: { type: String, select: false },
        country: { type: String },
        likeAllowed: { type: Boolean, default: false },
        commentAllowed: { type: Boolean, default: false },
        userLikes: { count: { type: Number, default: 0 }, recentLikedBy: [String] },
        commentCount: { count: { type: Number, default: 0 }, recentCommentBy: [String] },
        location: { type: { type: String }, coordinates: [Number] },
    },
    { timestamps: true }
)

// Add a 2dSphere index on the location field
ContainerPostModelSchema.index({ location: '2dsphere' });

const ContainerPost = mongoose.model('ContainerPost', ContainerPostModelSchema);
module.exports = ContainerPost;