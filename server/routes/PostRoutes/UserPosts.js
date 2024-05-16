const express = require('express');
const router = express.Router();
const authToken = require('../../utils/authToken');
const userController = require('../../controllers/Post/UserPost/userPostController');
const {updateUserPostCachedDataMiddleware} = require('../../Services/caching/postCachingData');

/*
    Index:
        01) 🅿️⛈️ User post categories
        02) 🅿️🔥 User New (GENERAL) Post
        03) 🅿️⛈️ User (GENERAL) Public Posts
        04) 🅿️⛈️ User (GENERAL)Private Posts
        05) 🅿️🔥 User New (EVENT) Post
        06) 🅿️⛈️ User (EVENT) Public Posts
        07) 🅿️⛈️ User (EVENT) Private Posts
*/


// 01) 🅿️⛈️ User Post Category Routes
router.route('/category').get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    userController.eventZAR_User_Account_All_Post_Category
);

// 02) 🅿️🔥 User New (GENERAL) Post
router.route('/new/general/post').post(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    updateUserPostCachedDataMiddleware,
    userController.eventZAR_User_Account_New_General_Post
)

// 03) 🅿️⛈️ User (GENERAL) Public Posts
router.route('/public/post').get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    userController.eventZAR_User_Account_General_All_Public_Posts
);

// 04) 🅿️⛈️ User (GENERAL) Private Posts
router.route('/private/post').get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    userController.eventZAR_User_Account_General_All_Private_Posts
);

// 05) 🅿️🔥 User New (EVENT) Post
router.route('/new/event/post').post(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    updateUserPostCachedDataMiddleware,
    userController.eventZAR_User_Account_Event_New_Public_Post
)

// 06) 🅿️⛈️ User (EVENT) Public Posts
router.route('/public/event').get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    userController.eventZAR_User_Account_Event_All_Public_Events
);

// 07) 🅿️⛈️ User (EVENT) Private Posts
router.route('/private/event').get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    userController.eventZAR_User_Account_Event_All_Private_Events
);

// 07) 🅿️⛈️ User (EVENT) Private Posts
router.route('/private/event').get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    userController.eventZAR_User_Account_Event_All_Private_Events
);

// 08) 🅿️⛈️ User New (Poll) Posts
router.route('/new/poll/post').post(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    updateUserPostCachedDataMiddleware,
    userController.eventZAR_User_Account_Poll_New_Public_Post
);

// 08) 🅿️⛈️ User New (Poll) Posts
router.route('/new/survey/post').post(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    updateUserPostCachedDataMiddleware,
    userController.eventZAR_User_Account_Survey_New_Public_Post
);

module.exports = router;