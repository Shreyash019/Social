import mongoose from 'mongoose';

const NormalPublicPostModelSchema = new mongoose.Schema(
    {
        containerPost: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: "ContainerPost",
            required: true
        },
        surveyType: {
            type: String,
            enum: ['survey', 'poll']
        },
        postTitle: {
            type: String,
        },
        postSummary: {
            type: String
        },
        postAssets: [
            {
                fileType: {
                    type: String,
                    enum: ['video', 'image']
                },
                thumbnail: {
                    type: Object,
                    default: undefined
                },
                name: {
                    type: String,
                },
                public_id: {
                    type: String,
                },
                url: {
                    type: String,
                }
            }
        ]
    }, 
    { timestamps: true }
)

const NormalPost = mongoose.model('NormalPost', NormalPublicPostModelSchema);
export default NormalPost;