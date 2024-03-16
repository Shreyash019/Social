import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ConsumerSchemaModel = new mongoose.Schema(
    {
        isAccountVerified: {
            type: Boolean,
            default: false,
            select: false
        },
        isProfileCompleted: {
            type: Boolean,
            default: false,
            select: false
        },
        isAccountActive: {
            type: Boolean,
            default: false,
            select: false
        },
        isPrivate: {
            type: Boolean,
            default: false,
            select: false
        },
        username: {
            type: String,
            required: true,
            unique: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        role: {
            type: String,
            default: 'consumer',
            enum: ['consumer'],
            select: false
        },

        // Details
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        profileSummary: {
            type: String,
        },
        profilePicture: {
            name: {
                type: String,
                default: "user"
            },
            public_id: {
                type: String,
                default: "221EFRVEF"
            },
            url: {
                type: String,
                DEFAULT: 'https://www.computerhope.com/jargon/r/random-dice.png'
            }
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'others']
        },
        dateOfBirth: {
            type: Date
        },
        plotNumber: {
            type: String,
        },
        address: {
            type: String,
        },
        city: {
            type: String,
        },
        state: {
            type: String,
        },
        country: {
            type: String,
        },
        zipCode: {
            type: Number,
        },
        location: {
            type: { type: String },
            coordinates: [Number]
        },

        // Passwords
        password: {
            type: String,
            minLength: 8,
            select: false
        },
        userOTP: {
            otp: {
                type: Number,
                minLength: 6,
                maxLength: 6,
            },
            timeToExpire: {
                type: Date,
            },
            OTPVerified: {
                type: Boolean,
                default: false
            },
        },
        forgotOTP: {
            otp: {
                type: Number,
                minLength: 6,
                maxLength: 6,
            },
            timeToExpire: {
                type: Date,
            },
            OTPVerified: {
                type: Boolean,
                default: false
            },
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    { timestamps: true }
);

// Add a 2dSphere index on the location field
ConsumerSchemaModel.index({ location: '2dsphere' });

ConsumerSchemaModel.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 12)
    next()
});

ConsumerSchemaModel.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
};

ConsumerSchemaModel.methods.getResetPasswordToken = async function () {
    // 1) generate token
    const resetToken = crypto.randomBytes(20).toString("hex");
    // 2) generate hash token and add to db
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 960000;
    return resetToken;
}

const Consumer = mongoose.model('Consumer', ConsumerSchemaModel);
export default Consumer;