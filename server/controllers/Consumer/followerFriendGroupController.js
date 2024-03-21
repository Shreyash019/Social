// Database
import Consumer from "../../models/Consumer/Consumer.js";
import FollowerFollowings from '../../models/FollowerFollowing/Followers&Followings.js';

// Created Middleware
import CatchAsync from "../../middlewares/catchAsync.js";
import ErrorHandler from "../../utils/errorHandler.js";
import HttpStatusCode from "../../enums/httpHeaders.js";
import APIFeatures from "../../utils/apiFeatures.js";
import {socioGeneralResponse} from '../../utils/responses.js'

/* 
    Index: 
        01) Fetching All users
        02) Follow or UnFollow A User
        03) Followers/Following Counts
        04) All Followers List
        05) All Followings List
        06) Remove A Follower By Logged In User
*/

async function UserExistenceCheck(data) {

    let result = false;
    await Consumer.find({ _id: { $in: data } })
        .countDocuments()
        .then(count => {
            if (count === data.length) {
                result = true;
            }
            else if (count !== data.length) {
                result = false;
            }
        })
        .catch(err => {
            result = false;
        });
    return result;
}

// ✅ 01) --- FETCHING ALL USERS ---
export const socio_User_Account_All_Users_Account_List = CatchAsync(async (req, res, next) => {
    // Fetching total users count

    let totalUsers = await Consumer.countDocuments({ _id: { $ne: req.user.id }, isAccountVerified: true });

    // Fetching All
    let apiFeature = new APIFeatures(Consumer.find({ _id: { $ne: req.user.id }, isAccountVerified: true })
        .select("username +role +isAccountVerified +isActive profilePicture"), req.query)
        .search()
        .pagination(20);

    const isConsumer = await apiFeature.query;

    socioGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: "User list.",
        usersCount: totalUsers,
        users: isConsumer
    })
});

// ✅ 02) --- FOLLOW/UN-FOLLOW A USER ---
export const socio_User_Account_Follow_UnFollow_A_User = CatchAsync(async (req, res, next) => {

        // Response Msg
        let responseObject = {
        msgContent: '',
            isError: false
        };
        // Destructuring User and Receiver ID
        const user_Id = req.user.id;
        const receiver_Id = req.params.uid;

        // Checking if Receiver Id provided
        if (!receiver_Id || !user_Id) {
            return next(
                new ErrorHandler("Bad request!", HttpStatusCode.NOT_ACCEPTABLE)
            );
        }

        // Fetching Follower
        const followerByUser = await Consumer.findById({ _id: user_Id })
            .select('username')
            .catch((err) => { responseObject.isError = true });

        // Fetching Following
        const followingToUser = await Consumer.findById({ _id: receiver_Id })
            .select('username')
            .catch((err) => { responseObject.isError = true });

        // For Error
        if (responseObject.isError) {
            return next(new ErrorHandler(`Server error while processing your request`, HttpStatusCode.INTERNAL_SERVER_ERROR));
        }

        // Fetching If Followed
        const isFollowed = await FollowerFollowings.findOne({ followedByUser: followerByUser._id, followedToUser: followingToUser._id });
        if (!isFollowed) {
            await FollowerFollowings.create({ followedByUser: followerByUser._id, followedToUser: followingToUser._id });
            responseObject.msgContent = `You are now following ${followingToUser.username}!`;
        } else {
            await FollowerFollowings.findByIdAndDelete({ _id: isFollowed._id });
            responseObject.msgContent = `You have un-followed ${followingToUser.username}!`
        }

        // Sending response
        socioGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
            success: true,
            message: responseObject.msgContent,
        })
    }
);

// ✅ 03) --- FOLLOWERS/FOLLOWING COUNT ---
export const socio_User_Account_Followers_Followings_Count = CatchAsync(
    async (req, res, next) => {
        // Destructuring User and Receiver ID

        // Fetching follower count
        const followerCount = await FollowerFollowings.countDocuments({ followedToUser: req.user.id })
        const followingCount = await FollowerFollowings.countDocuments({ followedByUser: req.user.id })

        // Sending response
        socioGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
            success: true,
            message: "Your followers and followings",
            followInfo: {
                followers: followerCount,
                followings: followingCount,
            },
        })
    }
);

// ✅ 04) --- ALL FOLLOWERS LIST ---
export const socio_User_Account_Fetching_Followers_List = CatchAsync(async (req, res, next) => {

    // Fetching Followers
    const followerCount = await FollowerFollowings.countDocuments({ followedToUser: req.user.id })

    if (followerCount === 0) {
        return next(new ErrorHandler(`No followers`, HttpStatusCode.SUCCESS));
    }

    // Fetching Followings
    const apiFeature = new APIFeatures(FollowerFollowings.find({ followedToUser: req.user.id })
        .populate({
            path: 'followedByUser',
            select: 'username profilePicture firstName lastName',
        })
        .sort({ createdAt: -1 }),
        req.query
    ).pagination(2)
    const consumerFollowers = await apiFeature.query;

    // Response Array
    const responseArray = consumerFollowers.map((data) => {
        let temp = {
            userID: data.followedByUser._id,
            username: data.followedByUser.username,
            name: data.followedByUser.firstName.charAt(0).toUpperCase() + data.followedByUser.firstName.slice(1) + " " + data.followedByUser.lastName.charAt(0).toUpperCase() + data.followedByUser.lastName.slice(1),
            profilePicture: data.followedByUser.profilePicture
        }
        return temp
    })


    // Sending response
    socioGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: "Your followers!",
        followersCount: followerCount,
        followers: responseArray
    })
}
);

// ✅ 05) --- ALL FOLLOWINGS LIST ---
export const socio_User_Account_Fetching_Followings_List = CatchAsync(async (req, res, next) => {
    // Destructuring User and Receiver ID

    const followingCount = await FollowerFollowings.countDocuments({ followedByUser: req.user.id })

    if (followingCount === 0) {
        return next(new ErrorHandler("No followings", HttpStatusCode.SUCCESS));
    }

    // Fetching Followings
    const apiFeature = new APIFeatures(FollowerFollowings.find({ followedByUser: req.user.id })
        .populate({
            path: 'followedToUser',
            select: 'username profilePicture firstName lastName',
        })
        .sort({ createdAt: -1 }),
        req.query
    ).pagination(2)
    const consumerFollowings = await apiFeature.query;

    // Response Array
    const responseArray = consumerFollowings.map((data) => {
        let temp = {
            userID: data.followedToUser._id,
            username: data.followedToUser.username,
            name: data.followedToUser.firstName.charAt(0).toUpperCase() + data.followedToUser.firstName.slice(1) + " " + data.followedToUser.lastName.charAt(0).toUpperCase() + data.followedToUser.lastName.slice(1),
            profilePicture: data.followedToUser.profilePicture
        }
        return temp
    })

    // Sending response
    socioGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: "Your followings!",
        followingsCount: followingCount,
        followings: responseArray
    })
}
);

// ✅ 06) ---- REMOVE A FOLLOWER (BY USER) ---
export const socio_User_Account_Remove_Followers_From_A_List = CatchAsync(async (req, res, next) => {

    // Remover User
    const removerUser = await FollowerFollowings.findByIdAndDelete({ followedToUser: req.user.id });

    // Checking for already been removed
    if (!removerUser) {
        return next(new ErrorHandler(`Follower already been removed!`))
    }

    // Sending response
    socioGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Follower removed successfully!`
    })
})

// Deletion
export const socio_User_Account_Delete = CatchAsync(async (req, res, next) => {});

export const socio_User_Account_Enable_Disable = CatchAsync(async (req, res, next) => {});