const mongoose = require('mongoose');

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
        postImages: [
            {
                fileType: {
                    type: String,
                    enum: ['video', 'image']
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
module.exports = NormalPost;