import mongoose from "mongoose";

const BookMarkedPostSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        posts: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'PostDataContainer'
                }
            ],
        }
    },
    { timestamps: true }
)

const BookMarkedPosts = mongoose.model('BookMarkedPosts', BookMarkedPostSchema);
export default BookMarkedPosts;