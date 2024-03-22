import mongoose from 'mongoose';

const PostLikesSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Consumer',
        },
        posts: [
            { type: mongoose.Schema.Types.ObjectId }
        ]
    }, 
    {
        timestamps: true
    }
);

const PostLikes = mongoose.model('PostLikes', PostLikesSchema);
export default PostLikes;