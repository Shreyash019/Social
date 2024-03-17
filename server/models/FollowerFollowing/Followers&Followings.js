import mongoose from 'mongoose';

const FollowerFollowingsModel = new mongoose.Schema(
    {
        followedByUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true
        },
        followedToUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true
        }
    },
    { timestamps: true }
)

const FollowerFollowings = mongoose.model('FollowerFollowings', FollowerFollowingsModel);
export default FollowerFollowings;