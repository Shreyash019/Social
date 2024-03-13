const mongoose = require('mongoose');

const PostLikesSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
        },
        posts: [
            {
                type: mongoose.Schema.Types.ObjectId
            }
        ]
    }, 
    {
        timestamps: true
    }
);

const PostLikes = mongoose.model('PostLikes', PostLikesSchema);
module.exports = PostLikes;