import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            min: 2,
            max: 30,
        },
        lastName: {
            type: String,
            required: true,
            min: 2,
            max: 30,
        },
        email: {
            type: String,
            unique: true,
            required: true,
            max: 30,
        },
        password: {
            type: String,
            required: true,
            min: 5,
            select: false
        },
        picturePath: {
            type: String,
            default: "https://th.bing.com/th/id/OIP.52T8HHBWh6b0dwrG6tSpVQHaFe?pid=ImgDet&rs=1",
        },
        friends: {
            type: Array,
            default: [],
        },
        sentFriend: {
            type: Array,
            default: [],
        },
        pendingFriends: {
            type: Array,
            default: [],
        },
        contact: {
            type: Number,
            default: 0
        },
        location: String,
        occupation: String,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    this.password  = await bcrypt.hash(this.password, 12);
    next();
})

userSchema.methods.correctPassword = async function(passwordProvided){
    return await bcrypt.compare(passwordProvided, this.password);
}

const User = mongoose.model('User', userSchema);

export default User;