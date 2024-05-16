import express from "express";
// import authToken from "../../utils/authToken";
// import UserAuthController from "../../controllers/User/userAuthController";
// import UserFriendGroupController from "../../controllers/User/userFriendGroupController";

const router = express.Router();

/*
    Index:
        01) User Sign Up
        02) User Sign In
        03) User Sign Out
        04) User Account Verification
        05) Resend OTP
        06) Forgot Password
        07) Reset OTP verification
        08) Reset Password
        09) Password Update
        10) User Profile Information
        11) Other User Profile Information
        12) User Profile Information Update
        13) Address Update
        14) Location Update
        15) User Profile Picture Update
        16) Gallery Image Upload
        17) All Gallery Images
        18) Switch User Account Type
        19) Get All Users
        20) Follow/UnFollow A User
        21) User Follower/Following Count
        22) User Followers List
        23) User Followings List
        24) Remove a Follower
        25) Block A User
        26) Unblock a User
        27) All Blocked Users
        28) New Group Creation
        29) Group Details Update
        30) Delete A User
        31) Group Details
        32) Member Addition To The Group
        33) Member Removal From A Group
        34) All Groups
        35) User Created Group
        36) Delete A User Account
        37) Enable/Disable a User Account
*/

// // 01) --- USER SIGN UP ---
// router.route("/signup")
//   .post(UserAuthController.events_ZAR_New_User_Account_Sign_Up);

// // 02) --- USER SIGN IN ---
// router.route("/signin")
//   .post(UserAuthController.eventsZAR_Account_Sign_In);

// router.route("/social/signin")
//   .post(UserAuthController.eventsZar_User_Social_Login);

// // 03) --- USER SIGN OUT ---
// router.route("/signout").put(
//   authToken.isAuthenticated,
//   UserAuthController.eventsZAR_Account_Sign_Out
// );

// // 04) --- USER ACCOUNT VERIFICATION ---
// router.route("/verify/otp").put(
//   authToken.isAuthenticated,
//   UserAuthController.eventsZAR_Account_OTP_Verification
// );

// // 05) --- RESEND OTP ---
// router.route("/resend/otp").get(
//   authToken.isAuthenticated,
//   UserAuthController.eventsZAR_Account_Resend_OTP
// );

// // 06) --- FORGOT PASSWORD ---
// router.route("/forgot/password")
//   .put(UserAuthController.eventsZAR_Account_Forgot_Password);

// // 07) --- RESET OTP VERIFICATION ---
// router.route("/reset/verification")
//   .put(UserAuthController.eventsZAR_Account_Forgot_Password_OTP_Verify);

// // 08) --- RESET PASSWORD ---
// router.route("/reset/password")
//   .put(UserAuthController.eventsZAR_Account_Reset_Password);

// // 09) --- PASSWORD UPDATE ---
// router.route("/password/update").put(
//   authToken.isAuthenticated,
//   UserAuthController.eventsZAR_Account_Password_Update
// );

// // 10) --- USER PROFILE INFORMATION ---
// router.route("/profile").get(
//   authToken.isAuthenticated,
//   UserAuthController.eventsZAR_User_Account_Information
// );

// // 11) --- OTHER USER PROFILE INFORMATION ---
// router.route("/profile/:id").get(
//   authToken.isAuthenticated,
//   UserAuthController.eventsZAR_User_Account_Information_By_Other_User
// );

// // 12) --- USER PROFILE INFORMATION UPDATE ---
// router.route("/profile/update").put(
//   authToken.isAuthenticated,
//   UserAuthController.eventZAR_User_Profile_Information_Update
// );

// // 13) --- ADDRESS UPDATE ---
// router.route("/address/update").put(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserAuthController.eventsZAR_Account_Address_Update
// );

// // 14) --- LOCATION UPDATE ---
// router.route("/location/update").put(
//   authToken.isAuthenticated,
//   // authToken.isProfileVerified,
//   UserAuthController.eventsZAR_Account_Address_Location_Update
// );

// // 15) --- USER PROFILE PICTURE UPDATE ---
// router.route("/profilepicture").put(
//   authToken.isAuthenticated,
//   UserAuthController.eventsZAR_Account_Profile_Image_Update
// );

// // GALLERY
// router.route("/gallery/images")
//   // 16) --- GALLERY IMAGE UPLOAD ---
//   .put(
//     authToken.isAuthenticated,
//     authToken.isProfileVerified,
//     UserAuthController.eventsZAR_Account_Gallery_Images_Upload
//   )
//   // 17) --- ALL GALLERY IMAGES ---
//   .get(
//     authToken.isAuthenticated,
//     authToken.isProfileVerified,
//     UserAuthController.eventsZAR_Account_All_Gallery_Images
//   );

// // 18) --- SWITCH USER ACCOUNT TYPE ---
// router.route("/switch/account").put(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserAuthController.eventZAR_Change_User_Account_Type
// );

// // 19) --- GET ALL USERS ---
// router.route("/all/list").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZAR_Account_All_Users_List
// );

// // 20) --- FOLLOW/UN-FOLLOW A USER
// router.route("/flw/uflw/:uid").put(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZAR_Account_Follow_UnFollow_A_User
// );

// // 21) --- USER FOLLOWER/FOLLOWING COUNT ---
// router.route("/followers/following/count").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZAR_Account_Followers_Followings_Count
// );

// // 22) --- USER FOLLOWERS LIST ---
// router.route("/followers/list").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZAR_Account_Fetching_Followers_List
// );

// // 23) --- USER FOLLOWINGS LIST ---
// router.route("/followings/list").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZAR_Account_Fetching_Followings_List
// );

// // 24) --- OTHER USER FOLLOWERS LIST ---
// router.route("/other/followers/:uid").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZar_Fetching_Other_User_Followers
// );

// // 25) --- OTHER USER FOLLOWINGS LIST ---
// router.route("/other/followings/:uid").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZar_Fetching_Other_User_Followings
// );

// // 26) --- OTHER USER FOLLOWERS AND FOLLOWING COUNT ---
// router.route("/other/follower-following-count/:uid").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZar_Fetching_Other_User_Follower_Following_Count
// )
// // 27) --- REMOVE A FOLLOWER ---
// router.route("/follower/remove/:id").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.evenZar_User_Account_Remove_Followers_From_A_List
// );

// // 28) --- BLOCK A USER ---
// router.route("/block/user").put(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZAR_User_Blocks_A_User
// );

// // 29) --- UNBLOCK A USER ---
// router.route("/unblock/user").put(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZAR_User_Unblocks_A_User
// );

// // 30) --- ALL BLOCKED USERS ---
// router.route("/all/block/users").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZAR_Account_All_Blocked_User
// );

// router.route("/group")
//   // 31) --- NEW GROUP CREATION ---
//   .post(
//     authToken.isAuthenticated,
//     authToken.isProfileVerified,
//     UserFriendGroupController.eventZAR_User_New_Group_Creation
//   )
//   // 32) --- GROUP DETAILS UPDATE ---
//   .put(
//     authToken.isAuthenticated,
//     authToken.isProfileVerified,
//     UserFriendGroupController.eventZAR_User_Group_Details_Modification
//   )
//   // 33) --- DELETE A GROUP ---
//   .delete(
//     authToken.isAuthenticated,
//     authToken.isProfileVerified,
//     UserFriendGroupController.eventZAR_User_Group_Members_Deletion
//   );

// // 34) --- GROUP DETAILS ---
// router.route("/group/detail").put(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventZAR_User_User_Group_Information
// );

// // 35) --- MEMBER ADDITION TO THE GROUP ---
// router.route("/group/add/members").put(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventZAR_User_Group_Members_Addition
// );

// // 36) --- MEMBER REMOVAL FROM THE GROUP ---
// router.route("/group/remove/members").put(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventZAR_User_Group_Members_Removal
// );

// // 37) --- ALL GROUPS ---
// router.route("/all/group").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventZAR_Users_All_Groups
// );

// // 38) --- USER CREATED GROUP ---
// router.route("/crtd/grp").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventZAR_All_Created_Group_By_A_User
// );

// // 39) --- DELETE A USER ACCOUNT ---
// router.route("/delete").delete(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserAuthController.eventZar_Account_Delete
// );

// // 40) --- ENABLE/DISABLE A USER ACCOUNT ---
// router.route("/enable/disable/:id").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserAuthController.evenZar_User_Account_Enable_Disable
// );

// router.route("/group")
//   // 41) --- NEW GROUP CREATION ---
//   .post(
//     authToken.isAuthenticated,
//     authToken.isProfileVerified,
//     UserFriendGroupController.eventZAR_User_New_Group_Creation
//   )
//   // 42) --- MODIFY USER GROUP INFORMATION ---
//   .put(
//     authToken.isAuthenticated,
//     authToken.isProfileVerified,
//     UserFriendGroupController.eventZAR_User_Group_Details_Modification
//   )
//   // 43) --- DELETE A SPECIFIC GROUP DELETE ---
//   .delete(
//     authToken.isAuthenticated,
//     authToken.isProfileVerified,
//     UserFriendGroupController.eventZAR_User_Group_Members_Deletion
//   );

// // 44) --- FETCHING GROUP INFORMATION ---
// router.route("/group/detail").put(
//   authToken.isAuthenticated,
//   UserFriendGroupController.eventZAR_User_User_Group_Information
// );

// // 45) --- ADDING NEW MEMBER TO THE GROUP ---
// router.route("/group/add/members").put(
//   authToken.isAuthenticated,
//   UserFriendGroupController.eventZAR_User_Group_Members_Addition
// );

// // 46) --- REMOVING A MEMBER FROM THE GROUP ---
// router.route("/group/remove/members").put(
//   authToken.isAuthenticated,
//   UserFriendGroupController.eventZAR_User_Group_Members_Removal
// );

// // 47) --- ALL AVAILABLE GROUPS ---
// router.route("/all/group").get(
//   authToken.isAuthenticated,
//   UserFriendGroupController.eventZAR_Users_All_Groups
// );

// // 48) --- USER ALL CREATED GROUPS ---
// router.route("/crtd/grp").get(
//   authToken.isAuthenticated,
//   UserFriendGroupController.eventZAR_All_Created_Group_By_A_User
// );

// // 49) --- USER SOCIAL LINKS SAVING ---
// router.route("/social-links")
//   .put(
//     authToken.isAuthenticated,
//     authToken.isProfileVerified,
//     UserAuthController.eventZAR_User_Adding_Social_Link
//   )
//   .get(
//     authToken.isAuthenticated,
//     authToken.isProfileVerified,
//     UserAuthController.eventsZar_User_All_Social_Links
//   );

// router.route("/follower-following-single-list").get(
//   authToken.isAuthenticated,
//   authToken.isProfileVerified,
//   UserFriendGroupController.eventsZar_Fetching_User_Followers_Followings
// )

export default router;
