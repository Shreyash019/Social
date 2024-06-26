import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const UserSchemaModel = new mongoose.Schema(
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
        isChatAllowed: {
            type: Boolean,
            default: true
        },
        isViewPortfolioAllowed: {
            type: Boolean,
            default: true
        },
        isViewEventAllowed: {
            type: Boolean,
            default: true
        },
        isViewPostAllowed: {
            type: Boolean,
            default: true
        },
        isPrivate: {
            type: Boolean,
            default: false,
            select: false
        },

        username: {
            type: String,
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
            select: false
        },

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
                default: 'https://www.computerhope.com/jargon/r/random-dice.png'
            }
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'others']
        },
        dateOfBirth: {
            type: Date
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
        socialLinks: [
            {
                platform: String,
                link: String
            }
        ],

        deviceId: {
            type: String,
        },
        fcmToken: {
            type: String,
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
        followerCount: {
            type: Number,
            default: 0,
            select: false
        },
        followingCount: {
            type: Number,
            default: 0,
            select: false
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    { timestamps: true }
);

// Add a 2dSphere index on the location field
UserSchemaModel.index({ location: '2dsphere' });


UserSchemaModel.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 12)
    next()
});

UserSchemaModel.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
};

UserSchemaModel.methods.getResetPasswordToken = async function () {
    // 1) generate token
    const resetToken = crypto.randomBytes(20).toString("hex");
    // 2) generate hash token and add to db
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 960000;
    return resetToken;
}

const Users = mongoose.model('Users', UserSchemaModel);
export default Users;