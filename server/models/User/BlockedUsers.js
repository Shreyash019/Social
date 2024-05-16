import mongoose from 'mongoose';

const BlockedUsersSchema = new mongoose.Schema(
    {
        blockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },
        blockedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },
        blockedAt:{
            type: Date,
            default: Date.now(),
            required: true
        }
    },
    { timestamps: true}
)

const BlockedUsers = mongoose.model('BlockedUsers', BlockedUsersSchema);
export default BlockedUsers;