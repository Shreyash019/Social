import mongoose from 'mongoose';
import Users from "../../models/User/Users.js";
import FollowerFollowings from '../../models/FollowerFollowing/Followers&Followings.js';
import BlockedUsers from '../../models/User/BlockedUsers.js'
import CatchAsync from "../../error/catchAsync.js";
import ErrorHandler from "../../utils/errorHandler.js";
import { HttpStatusCode } from "../../enums/httpHeaders.js";
import { UtilsKeywords } from "../../enums/utilsEnum.js";
import APIFeatures from "../../utils/apiFeatures.js";

/* 
    Index: 
        01) Fetching All users
        02) Follow or UnFollow A User
        03) Followers/Following Counts
        04) All Followers List
        05) All Followings List
        06) Remove A Follower By Logged In User
        07) Block a user
        08) Unblock a user
        09) All blocked user
        10) Account Deletion
        11) Account enable/disable
*/

// ✅ 01) --- FETCHING ALL USERS ---
export const social_Media_All_Users_List = CatchAsync(async (req, res, next) => {
    // Fetching user current country
    const userCountry = req.user.country;

    // Pagination Query
    const pageLimit = parseInt(req.query.pageLimit || UtilsKeywords.PAGE_LIMIT);

    // MongoDB Query Filter
    let postsQuery = {
        $and: [
            { _id: { $ne: req.user.id } },
            { _id: { $nin: req.user.blockedUsers } },
            { isAccountVerified: true },
            // { country: userCountry }
        ]
    };

    // Fetching total users count
    let totalUsers = await Users.countDocuments(postsQuery);

    // Fetching All
    let apiFeature = new APIFeatures(Users.find(postsQuery)
        .select("username firstName lastName profilePicture")
        .sort({ createdAt: -1 }),
        req.query
    )
        .search()
        .pagination(pageLimit)
    const isUsers = await apiFeature.query;

    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "User list.",
        usersCount: totalUsers,
        isUsers,
    })
});

// ✅ 02) --- FOLLOW/UN-FOLLOW A USER ---
export const social_Media_Account_Follow_UnFollow_A_User = CatchAsync(async (req, res, next) => {
    // Response Msg
    let responseObject = { msgContent: '', isError: false };

    // Destructuring User and Receiver ID
    const user_Id = req.user.id;
    const { canFollow = true, toUser } = req.body
    const receiver_Id = toUser._id || toUser;

    let Error = false; // Example string value from the client

    const boolValue = canFollow === "true" || canFollow === "false" ? canFollow === "true" :
        typeof canFollow === 'boolean' ? canFollow : Error = true;

    if (Error) {
        return next(new ErrorHandler("Bad request!", HttpStatusCode.NOT_ACCEPTABLE));
    }

    // Checking if Receiver Id provided
    if (!receiver_Id || !user_Id) {
        return next(new ErrorHandler("Bad request!", HttpStatusCode.NOT_ACCEPTABLE));
    }

    // Fetching Following
    const followingUser = await Users.findById({ _id: receiver_Id })
        .select('username')
        .catch((err) => { responseObject.isError = true });

    // FOr Error
    if (responseObject.isError) {
        return next(new ErrorHandler(`Server error while processing your request`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }
    // Fetching If Followed
    if (boolValue) {
        const result = await FollowerFollowings.findOneAndUpdate(
            { followedByUser: user_Id, followedToUser: receiver_Id },
            { followedByUser: user_Id, followedToUser: receiver_Id },
            { upsert: true, new: true }
        );
        if (result) {
            responseObject.msgContent = `You are now following ${followingUser.username}!`;
        } else {
            responseObject.msgContent = `Failed to follow ${followingUser.username}.`;
        }
    } else {
        await FollowerFollowings.findOneAndDelete({ followedByUser: user_Id, followedToUser: receiver_Id });
        responseObject.msgContent = `You have un-followed ${followingUser.username}!`
    }

    // Sending response
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: responseObject.msgContent,
    })
}
);

// ✅ 03) --- FOLLOWERS/FOLLOWING COUNT ---
export const social_Media_Account_Followers_Followings_Count = CatchAsync(async (req, res, next) => {
    // Fetching follower count
    const followerCount = await FollowerFollowings.countDocuments({ followedToUser: req.user.id })
    const followingCount = await FollowerFollowings.countDocuments({ followedByUser: req.user.id })

    // Sending response
    res.status(HttpStatusCode.SUCCESS).json({
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
export const social_Media_Account_Fetching_Followers_List = CatchAsync(async (req, res, next) => {

    // Page Limit setup
    const pageLimit = parseInt(req.query.pageLimit || UtilsKeywords.PAGE_LIMIT);

    // Fetching Followers
    const followerCount = await FollowerFollowings.countDocuments({ followedToUser: req.user.id })
    if (followerCount === 0) {
        return next(new ErrorHandler(`No followers`, HttpStatusCode.SUCCESS));
    }

    // Fetching Followings
    const apiFeature = new APIFeatures(FollowerFollowings.find({ followedToUser: req.user.id })
        .populate({
            path: 'followedByUser',
            select: 'username firstName lastName profilePicture'
        }),
        req.query
    )
        .pagination(pageLimit)
        .followerFollowingFilter()
    const queryData = await apiFeature.query;
    const ids = await FollowerFollowings.find({
        followedByUser: req.user.id,
        followedToUser: { $in: queryData.map(data => data.followedByUser._id) }
    }).select('followedByUser followedToUser');

    const userFollowers = queryData.map((data) => {
        const follows = ids.filter(id => id.followedToUser.toString() === data.followedByUser._id.toString())
        return {
            id: data.followedByUser._id,
            firstName: data.followedByUser.firstName || "",
            lastName: data.followedByUser.firstName || "",
            profilePicture: data.followedByUser.profilePicture,
            follows: follows.length > 0
        };
    })
    // Sending response
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Your followers!",
        followersCount: followerCount,
        followers: userFollowers,
    })
});

// ✅ 05) --- ALL FOLLOWINGS LIST ---
export const social_Media_Account_Fetching_Followings_List = CatchAsync(async (req, res, next) => {

    // Page Limit setup
    const pageLimit = parseInt(req.query.pageLimit || UtilsKeywords.PAGE_LIMIT);

    const followingCount = await FollowerFollowings.countDocuments({ followedByUser: req.user.id })
    if (followingCount === 0) {
        return next(new ErrorHandler("No followings", HttpStatusCode.SUCCESS));
    }

    // Fetching Followings
    const apiFeature = new APIFeatures(FollowerFollowings.find({ followedByUser: req.user.id })
        .populate({
            path: 'followedToUser',
            select: 'username firstName lastName profilePicture',
        }),
        req.query
    )
        .pagination(pageLimit)
        .followerFollowingFilter()
    const queryData = await apiFeature.query;
    const ids = await FollowerFollowings.find({
        followedByUser: { $in: queryData.map(data => data.followedToUser._id) },
        followedToUser: req.user.id
    }).select('followedByUser followedToUser');

    const userFollowings = queryData.map((data) => {
        const follows = ids.filter(id => id.followedByUser.toString() === data.followedToUser._id.toString())
        return {
            id: data.followedToUser._id,
            firstName: data.followedToUser.firstName || "",
            lastName: data.followedToUser.firstName || "",
            profilePicture: data.followedToUser.profilePicture,
            follows: follows.length > 0
        };
    })

    // Sending response 
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Your followings!",
        followingsCount: followingCount,
        followings: userFollowings,
    })
});

// ✅ 06) --- FETCHING OTHER USER FOLLOWERS ---
export const social_Media_Fetching_Other_User_Followers = CatchAsync(async (req, res, next) => {

    // Checking If User ID provided or not
    if (!req.params.uid) {
        return next(new ErrorHandler(`User data is not provided`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    const userID = req.params.uid;

    // Page Limit setup
    const pageLimit = parseInt(req.query.pageLimit || UtilsKeywords.PAGE_LIMIT);

    // Fetching Followers
    const followerCount = await FollowerFollowings.countDocuments({ followedToUser: userID })
    if (followerCount === 0) {
        return next(new ErrorHandler(`No followers`, HttpStatusCode.SUCCESS));
    }

    // Fetching Followings
    const apiFeature = new APIFeatures(FollowerFollowings.find({ followedToUser: userID })
        .populate({
            path: 'followedByUser',
            select: 'username firstName lastName profilePicture'
        }),
        req.query
    )
        .pagination(pageLimit)
        .followerFollowingFilter()
    const queryData = await apiFeature.query;
    const ids = await FollowerFollowings.find({
        followedByUser: req.user.id,
        followedToUser: { $in: queryData.map(data => data.followedByUser._id) }
    }).select('followedByUser followedToUser');

    const userFollowers = queryData.map((data) => {
        const follows = ids.filter(id => id.followedToUser.toString() === data.followedByUser._id.toString())
        return {
            id: data.followedByUser._id,
            firstName: data.followedByUser.firstName || "",
            lastName: data.followedByUser.firstName || "",
            profilePicture: data.followedByUser.profilePicture,
            follows: follows.length > 0
        };
    })
    // Sending response
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Your followers!",
        followersCount: followerCount,
        followers: userFollowers,
    })
});

// ✅ 07) --- FETCHING OTHER USER FOLLOWINGS ---
export const social_Media_Fetching_Other_User_Followings = CatchAsync(async (req, res, next) => {

    // Checking If User ID provided or not
    if (!req.params.uid) {
        return next(new ErrorHandler(`User data is not provided`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    const userID = req.params.uid;
    // Verifying provided ID is correct or not
    if (!mongoose.Types.ObjectId.isValid(userID)) {
        return next(new ErrorHandler(`You are trying to fetch information using wrong information`, HttpStatusCode.FORBIDDEN));
    }

    // Page Limit setup
    const pageLimit = parseInt(req.query.pageLimit || UtilsKeywords.PAGE_LIMIT);

    const followingCount = await FollowerFollowings.countDocuments({ followedByUser: userID })
    if (followingCount === 0) {
        return next(new ErrorHandler("No followings", HttpStatusCode.SUCCESS));
    }

    // Fetching Followings
    const apiFeature = new APIFeatures(FollowerFollowings.find({ followedByUser: userID })
        .populate({
            path: 'followedToUser',
            select: 'username firstName lastName profilePicture',
        }),
        req.query
    )
        .pagination(pageLimit)
        .followerFollowingFilter()
    const queryData = await apiFeature.query;
    const ids = await FollowerFollowings.find({
        followedByUser: { $in: queryData.map(data => data.followedToUser._id) },
        followedToUser: req.user.id
    }).select('followedByUser followedToUser');

    const userFollowings = queryData.map((data) => {
        const follows = ids.filter(id => id.followedByUser.toString() === data.followedToUser._id.toString())
        return {
            id: data.followedToUser._id,
            firstName: data.followedToUser.firstName || "",
            lastName: data.followedToUser.firstName || "",
            profilePicture: data.followedToUser.profilePicture,
            follows: follows.length > 0
        };
    })

    // Sending response 
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Your followings!",
        followingsCount: followingCount,
        followings: userFollowings,
    })
});

// ✅ 08) --- FETCHING OTHER USER FOLLOWER AND FOLLOWING COUNT ---
export const social_Media_Fetching_Other_User_Follower_Following_Count = CatchAsync(async (req, res, next) => {

    //  Getting User ID from params and checking if it exists
    const userID = req.params.uid;
    if (!userID) {
        return next(new ErrorHandler(`Trying to fetch information without providing target user data`, HttpStatusCode.BAD_REQUEST));
    }
    if (!mongoose.Types.ObjectId.isValid(userID)) {
        return next(new ErrorHandler(`You are trying to fetch information using wrong information`, HttpStatusCode.FORBIDDEN));
    }

    // Fetching User Follower and Following Counts
    const followerCount = await FollowerFollowings.countDocuments({ followedToUser: userID });

    // Fetching User Follower and Following Counts
    const followingCount = await FollowerFollowings.countDocuments({ followedByUser: userID });

    // Creating response object
    let response = {
        followers: followerCount,
        followings: followingCount
    }

    // Returning response
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: 'User all followers and following',
        followInfo: response
    });
})

// ✅ 09) --- REMOVE A FOLLOWER (BY USER) ---
export const social_Media_User_Account_Remove_Followers_From_A_List = CatchAsync(async (req, res, next) => {

    // Remover User
    try {
        await FollowerFollowings.findOneAndDelete({ followedToUser: req.user.id });
    } catch (error) {
        console.log(error.message)
        return next(new ErrorHandler(error.message, HttpStatusCode.BAD_REQUEST));
    }

    // Sending response
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `Follower removed successfully!`
    })
})

// ✅ 10) --- BLOCK A USER ---
export const social_Media_User_Blocks_A_User = CatchAsync(async (req, res, next) => {

    // Destructuring user and params
    const userId = req.user.id;
    const { requested_Id } = req.body;

    // Checking if requested user provided
    if (!requested_Id) {
        return next(new ErrorHandler("Please provide the requested user", HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking if requested user provided
    if (requested_Id.toString().toLowerCase() === userId.toString().toLowerCase()) {
        return next(new ErrorHandler(`You are not allowed to block yourself!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // fetching users
    const user = await Users.findById({ _id: userId })
        .catch((err) => { return next(new ErrorHandler("Server error", HttpStatusCode.INTERNAL_SERVER)) });

    // Checking if requested user exist
    const target_User = await Users.findById({ _id: requested_Id })
        .catch((err) => { return next(new ErrorHandler("Server error", HttpStatusCode.INTERNAL_SERVER)); });

    if (!target_User) {
        return next(new ErrorHandler("User not found", HttpStatusCode.NOT_FOUND));
    }

    // Block A User (And Remove From Followers and Followings)
    // Checking if already blocked
    const isAlreadyBlocked = await BlockedUsers.findOne({ blockedBy: user._id, blockedTo: target_User._id });
    if (isAlreadyBlocked) {
        return next(new ErrorHandler('This user has already been blocked', HttpStatusCode.CONFLICT));
    }
    else {
        await BlockedUsers.create({
            blockedBy: user._id,
            blockedTo: target_User._id,
            blockedAt: Date.now()
        });
        await FollowerFollowings.findOneAndDelete({ followedByUser: user._id, followedToUser: target_User._id }).catch((err) => { console.log(err) });
        await FollowerFollowings.findOneAndDelete({ followedByUser: target_User._id, followedToUser: user._id }).catch((err) => { console.log(err) });
    }

    // Sending response
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `User blocked Successfully!`,
    });
});

// ✅ 11) --- UNBLOCK A USER ---
export const social_Media_User_Unblocks_A_User = CatchAsync(async (req, res, next) => {

    // Destructuring user and params
    const userId = req.user.id;
    const { requested_Id } = req.body;

    // Checking if requested user provided
    if (!requested_Id)
        return next(new ErrorHandler("Please provide the requested user", HttpStatusCode.UNPROCESSABLE_ENTITY));

    // fetching users
    const user = await Users.findById({ _id: userId })
        .catch((err) => { return next(new ErrorHandler("Server error", HttpStatusCode.INTERNAL_SERVER)) });

    // Checking if requested user exist
    const target_User = await Users.findById({ _id: requested_Id })
        .catch((err) => { return next(new ErrorHandler("Server error", HttpStatusCode.INTERNAL_SERVER)); });

    if (!target_User) {
        return next(new ErrorHandler("User not found", HttpStatusCode.NOT_FOUND));
    }

    // Unblocking a user
    const isAlreadyBlockedBy = await BlockedUsers.findOne({ blockedBy: user._id, blockedTo: target_User._id });
    const isAlreadyBlockedTo = await BlockedUsers.findOne({ blockedBy: target_User._id, blockedTo: user._id });
    if (!isAlreadyBlockedBy && !isAlreadyBlockedTo) {
        return next(new ErrorHandler('This user is not currently blocked!', HttpStatusCode.CONFLICT));
    } else if (!isAlreadyBlockedBy && isAlreadyBlockedTo) {
        return next(new ErrorHandler(`You can't unblock him!`, HttpStatusCode.CONFLICT));
    } else if (isAlreadyBlockedBy && !isAlreadyBlockedTo) {
        try {
            await BlockedUsers.findOneAndDelete({ blockedBy: user._id, blockedTo: target_User._id });
        } catch (error) {
            console.log(error);
            return next(new ErrorHandler(`Internal server error`, HttpStatusCode.INTERNAL_SERVER_ERROR))
        }
    }

    // Sending response
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `User unblocked Successfully!`,
    });
});

// ✅ 12) --- ALL BLOCKED USER ---
export const social_Media_Account_All_Blocked_User = CatchAsync(async (req, res, next) => {
    // Destructuring user
    const user_Id = req.user.id;

    // Fetching user blocked user lists 
    let pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

    // Counting Total Blocked Users
    const blockLength = await BlockedUsers.find({ blockedBy: user_Id })

    // Fetching Block List
    const apiFeature = new APIFeatures(BlockedUsers.find({ blockedBy: user_Id })
        .populate({
            path: 'blockedTo',
            select: 'username firstName lastName profilePicture',
        }), req.query).pagination(pageLimit);

    const isAllBlockedUsers = await apiFeature.query;

    // Checking if block list exist
    if (!isAllBlockedUsers || isAllBlockedUsers.length === 0) {
        return next(new ErrorHandler(`No blocked user exist!`, HttpStatusCode.SUCCESS));
    }

    // Sending response
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `All Blocked User's List!`,
        blockCount: blockLength,
        blockedUser: isAllBlockedUsers,
    });
}
);