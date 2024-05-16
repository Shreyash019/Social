import express from "express";
import authToken from "../../utils/authToken.js";
import {
    social_Media_All_Users_List,
    social_Media_Account_Follow_UnFollow_A_User,
    social_Media_Account_Followers_Followings_Count,
    social_Media_Account_Fetching_Followers_List,
    social_Media_Account_Fetching_Followings_List,
    social_Media_User_Account_Remove_Followers_From_A_List,
    social_Media_User_Blocks_A_User,
    social_Media_User_Unblocks_A_User,
    social_Media_Account_All_Blocked_User,
    social_Media_Fetching_Other_User_Followers,
    social_Media_Fetching_Other_User_Followings,
    social_Media_Fetching_Other_User_Follower_Following_Count
} from "../../controllers/User/userFollowController.js";

const router = express.Router();

// 01) Fetch All Users
router.route("/all-users").post(
    authToken.isAuthenticated,
    social_Media_All_Users_List
);

// 02) Follow/UnFollow A User
router.route("/follow-un-follow").post(
    authToken.isAuthenticated,
    social_Media_Account_Follow_UnFollow_A_User
);

// 03) Follower Following Count
router.route("/follower-following-count").post(
    authToken.isAuthenticated,
    social_Media_Account_Followers_Followings_Count
);

// 04) Follower List
router.route("/followers-list").post(
    authToken.isAuthenticated,
    social_Media_Account_Fetching_Followers_List
);

// 05) Following List
router.route("/followings-list").post(
    authToken.isAuthenticated,
    social_Media_Account_Fetching_Followings_List
);

// 06) Remove a Follower
router.route("/remove-follower").post(
    authToken.isAuthenticated,
    social_Media_User_Account_Remove_Followers_From_A_List
);

// 07) Block A User
router.route("/block-user").post(
    authToken.isAuthenticated,
    social_Media_User_Blocks_A_User
);

// 08) Unblock A User
router.route("/unblock-user").post(
    authToken.isAuthenticated,
    social_Media_User_Unblocks_A_User
);

// 09) All Blocked Users List
router.route("/all-blocked-users").post(
    authToken.isAuthenticated,
    social_Media_Account_All_Blocked_User
);

// 10) Other User Followers
router.route("/other-user-followers").post(
    authToken.isAuthenticated,
    social_Media_Fetching_Other_User_Followers
);

// 11) User User Followings
router.route("/other-user-followings").post(
    authToken.isAuthenticated,
    social_Media_Fetching_Other_User_Followings
);

// 12) Other User Follower Following Count
router.route("/other-user-follower-following").post(
    authToken.isAuthenticated,
    social_Media_Fetching_Other_User_Follower_Following_Count
)


export default router;
