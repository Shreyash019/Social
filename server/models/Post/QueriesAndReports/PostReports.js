import mongoose from "mongoose";

const PostReportsSchema = new mongoose.Schema(
    { 
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PostDataContainer',
            required: true
        },
        reportReason: {
            type: String,
            required: true
        }
    },
    {timestamps: true}
)

const PostReports = mongoose.model('PostReports', PostReportsSchema);
export default PostReports;