import mongoose from 'mongoose';

const UserActivityTrackerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            require: true,
            unique: true
        },
        loginTime: {
            type: Date
        },
        logoutTime: {
            type: Date
        },
    },
    {
        timestamps: true
    }
)

const UserActivityTracker = mongoose.model('UserActivityTracker', UserActivityTrackerSchema);
export default UserActivityTracker;