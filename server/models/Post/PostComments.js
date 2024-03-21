const mongoose = require('mongoose');

const PostCommentsSchema = new mongoose.Schema(
    {
        containerPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ContainerPost',
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

module.exports = PostComments;
