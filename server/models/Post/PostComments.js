import mongoose from "mongoose";

const PostCommentsSchema = new mongoose.Schema(
    {
        postDataContainer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PostDataContainer',
            required: true
        },
        content: {
            type: String,
            required: true
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true
        }
    },
    { timestamps: true }
);

// Pre-save hook to update updated_at timestamp
PostCommentsSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const PostComments = mongoose.model('PostComments', PostCommentsSchema);

export default PostComments;
