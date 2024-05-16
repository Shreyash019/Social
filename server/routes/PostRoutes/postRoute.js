const express = require('express');
const router = express.Router();
const authToken = require('../../utils/authToken');
const userPostRoute = require('./UserPosts');
const buzzPostRoute = require('./BusinessPostsRoutes');
const userController = require('../../controllers/Post/UserPost/userPostController');
const postImpressionController = require('../../controllers/Post/PostImpressions/postImpressionController');
const postQueriesRoute = require('./postQueriesRoutes');
const postQueriesController = require('../../controllers/Post/PostQueries/postQueriesController');

/*
    Index:
        01) User Post Routes
        02) Business Post Routes
        03) Post Queries Routes(View & Click Count and Reporting)
        04) New Post In a Event
        05) Fetch All event In a Post
        06) Like/Dislike a Post
        07) New Comment on a Post
        08) Reply on a comment
        09) Single Post Details
        10) All Likes of A Post
        11) All Comments of A Post
        12) Join a Event
        13) Delete a reply of a comment
        14) Join a Event
        15) My(User) All Post
        16) My(Business) All Post
        17) Delete a Post
        18) Delete a Post Event
        19) Normal Post Edit
        20) Event Post Edit
*/

// 01) User Post Routes
router.use('/user', userPostRoute);

// 02) Business Post Route
router.use('/buzz', buzzPostRoute);

// 03) Post Queries Routes(View & Click Count and Reporting)
router.use('/queries', postQueriesRoute)

// 04) 🅿️⛈️ New Post in a event
router.route('/new/post/in/event').post(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    userController.eventZAR_New_Post_In_A_User_Created_Event
);

// 05) 🅿️⛈️ Fetch All Event in a post
router.route('/all/post/in/event/:eid').get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    userController.eventsZar_Fetch_All_Posts_Of_Event
);

// 06) 🅱🔥 Like/Dislike A Post
router.route('/like').put(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_Like_A_Post_By_User
);

// 07) 🅱🔥 New Comment On A Post
router.route('/comment').post(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_New_Comment_On_A_Post
);

// 08) 🅱🔥 Reply On A Comment
router.route('/reply/comment').post(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_Reply_On_A_Comment_Of_A_Post
);

// 09) 🅱🔥⛈️ Single Post Details
router.route('/post/:postID').get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_Account_Single_Post_Details
);

// 10) All Likes of A Post
router.route('/likes/:pid').get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_Account_Single_Post_Likes_Details
);

// 11) All Comments of A Post
router.route('/comment/:pid').get(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        postImpressionController.eventsZar_Account_Single_Post_Comment_Details
    );

// 12) Delete a Comment
router.route('/comment/:pid/:cid').delete(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_User_Post_Comment_Delete
);

// 13) Delete a reply of a comment
router.route('/comment/reply').delete(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_Deleting_User_Comment_Reply
);

// 14) Join a Event
router.route('/join/a/event/:id').put(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    userController.eventsZar_Join_A_Event
);

// 15) My(User) All Post
router.route(`/my/all`).get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_User_Account_All_Owned_Posts
);

// 16) My(Business) All Post
router.route(`/my/buzz/all`).get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_Business_Account_All_Owned_Posts
);

// 17) Getting Other User All Public Post
router.route(`/user/all/:uid`).get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_Other_User_Account_All_Posts
)
// 17) Delete a Post
router.route(`/delete/post/:pid`).delete(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_Deleting_A_Post
);

// 18) Delete a Post Event
router.route(`/delete/post/:pid`).delete(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postImpressionController.eventsZar_Deleting_A_Post
);

// 19) Normal Post Edit
router.route('/modify/normal').put(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postQueriesController.eventsZar_Normal_Post_Content_Edit
)
// 20) Event Post Edit
router.route('/modify/event').put(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postQueriesController.eventsZar_Event_Post_Content_Edit
)

// 21) Poll and Survey Response
router.route('/question/responses').post(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postQueriesController.eventsZar_Poll_Survey_Question_Response
)

module.exports = router;