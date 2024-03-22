import mongoose from 'mongoose';

const SurveyPostModelSchema = new mongoose.Schema(
    {
        containerPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ContainerPost",
            required: true
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
        ],
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        // Reference to a separate schema for question details
        questions: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Questions',
        },
        responses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Consumer', // Reference to your User schema (assuming it exists)
            },
            {
                type: Object, // Response specific to the question type
            },
            {
                type: String, // Optional text for open-ended answers
            },
        ],
        moreInformation: {
            type: Array
        }
    },
    { timestamps: true }
)

const SurveyPost = mongoose.model('SurveyPost', SurveyPostModelSchema);
export default SurveyPost;