import mongoose from 'mongoose';

const CommentRepliesSchema = new mongoose.Schema(
    {
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PostComments',
            required: true
        },
        content: {
            type: String,
            required: true
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Consumer',
            required: true
        }
    },
    { timestamps: true }
);

// Pre-save hook to update updated_at timestamp
CommentRepliesSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const CommentReplies = mongoose.model('CommentReplies', CommentRepliesSchema);

export default CommentReplies;
