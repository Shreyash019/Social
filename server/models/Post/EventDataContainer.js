import mongoose from "mongoose";

const EventDataContainerSchema = new mongoose.Schema(
    {
        eventUniqueID: {
            type: String,
            unique: true,
            required: true,
        },
        eventOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
        ownerType: {
            type: String,
            default: "consumer",
            enum: ["consumer"],
        },
        eventVisibility: {
            type: String,
            enum: ["public", "private"],
            required: true,
        },
        dateOfPost: {
            type: Date,
            default: Date.now()
        },
        eventType: {
            type: String,
            required: true,
            enum: ['virtual', 'physical']
        },
        eventTitle: {
            type: String,
            required: true
        },
        eventSummary: {
            type: String
        },
        eventAssets: [
            {
                fileType: {
                    type: String,
                    enum: ['video', 'image']
                },
                thumbnail: {
                    type: String,
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
        address: {
            type: String,
            select: false
        },
        city: {
            type: String,
            select: false
        },
        country: {
            type: String,
            select: false
        },
        freePass: {
            type: Boolean,
            default: false
        },
        eventLink: {
            type: String,
        },
        canUserPost: {
            type: Boolean,
            default: true,
            select: false
        },
        moreInformation: {
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
        },
        joinedUsers: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Users"
                }
            ],
            default: [],
            select: false
        },
        viewCounter: {
            type: Number,
            default: 0,
        },
        clickCounter: {
            type: Number,
            default: 0,
        },
        shareCounter: {
            type: Number,
            default: 0,
        },
        reportCount: {
            type: Number,
            default: 0,
            select: false,
        },
        isEventEdited: {
            type: Boolean,
            default: false,
            select: false,
        },
        eventEditTime: {
            type: Date,
            default: undefined,
            select: false,
        },
        moreInformation: {
            type: Array
        },
        location: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: {
                type: [Number], // First element: Longitude, Second element: Latitude
                index: "2dsphere", // Create a 2dsphere index for geospatial queries
            },
        },
    },
    { timestamps: true }
)

const EventDataContainer = mongoose.model('EventDataContainer', EventDataContainerSchema);
export default EventDataContainer;