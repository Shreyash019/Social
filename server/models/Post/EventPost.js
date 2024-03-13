const mongoose = require('mongoose');

const EventPostModelSchema = new mongoose.Schema(
    {
        containerPost: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: "ContainerPost",
            required: true
        },
        eventType: {
            type: String,
            required: true,
            enum: ['virtual', 'physical']
        },
        postTitle: {
            type: String,
            required: true
        },
        postSummary: {
            type: String
        },
        postImages: [
            {
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
            required: true
        },
        startTime: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        },
        freePass: {
            type: Boolean,
            default: false
        },
        tickets: [
            {
                ticketName: {
                    type: String,
                    required: true
                },
                noOfTickets: {
                    type: Number,
                    require: true
                },
                tickerPrice: {
                    type: Number,
                    required: true
                },
                currency: {
                    type:  String,
                    required: true
                }
            }
        ],
        eventLink: {
            type: String,
        },
        canUserPost: {
            type: Boolean,
            default:true,
            select: false
        },
        moreInformation:{
            type: Object,
        },
        sharedWith: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Users"
                }
            ],
            default: [],
            select: false
        }
    }, 
    { timestamps: true }
)

const EventPost = mongoose.model('EventPost', EventPostModelSchema);
module.exports = EventPost;