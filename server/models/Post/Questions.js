import mongoose from "mongoose";

const QuestionsSchema = new mongoose.Schema(
    {
        surveyPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SurveyPost',
            select: false,
            required: true
        },
        questions: [
            {
                questionType: {
                    type: String,
                    enum: ['poll', 'survey', 'multiple_choice', 'select', 'text', 'number', 'ranking', 'rating'], // Add additional types as needed
                    required: true,
                },
                questionText: {
                    type: String,
                    required: true,
                },
                questionOptions: {
                    type: Array,
                    of: Object, // Only for specific question types (e.g., multiple choice, select)
                },
                rankingScale: {
                    type: Object, // Optional for ranking or rating questions
                    properties: {
                        min: {
                            type: Number,
                        },
                        max: {
                            type: Number,
                        },
                        labels: {
                            type: Array,
                            of: String,
                        },
                    },
                },
            }
        ]
    },
    { timestamps: true }
)

const Questions = mongoose.model('Questions', QuestionsSchema);
export default Questions;