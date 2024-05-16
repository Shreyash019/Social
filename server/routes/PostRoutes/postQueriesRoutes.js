const express = require(`express`);
const router = express.Router();
const authToken = require('../../utils/authToken')
const postQueriesController = require('../../controllers/Post/PostQueries/postQueriesController');

/*
    Index:
        01) Increase Post View Counter
        02) Increase a Post Click Controller
        03) Report A Post
        04) Get All Reports Of A Post
        05) Bookmarking posts
*/

// 01) Increase Post View Counter
router.route('/view/counter').put(
    postQueriesController.eventsZar_Increase_A_Post_View_Counter
);

// 02) Increase a Post Click Controller
router.route('/click/counter').put(
    postQueriesController.eventsZar_Increase_A_Post_Click_Counter
);
// 02) Increase a Post Click Controller
router.route('/share/counter').put(
    postQueriesController.eventsZar_Increase_A_Share_Click_Counter
);

// 03) Report A Post
router.route('/report/post').put(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postQueriesController.eventsZar_Report_A_Post_By_User
);

// 04) Get All Reports Of A Post
router.route('/post/reports/:pid').get(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postQueriesController.eventsZar_Get_All_Reports_Of_A_Post_By_Users
);

router.route('/post/bookmark')
    // 05) Bookmarking A Post
    .put(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        postQueriesController.eventsZar_User_Bookmarking_A_New_Post
    )
    // 06)  Getting User's Bookmarks
    .get(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        postQueriesController.eventsZar_Fetching_User_All_BookMarked_Posts
    )

// City Search
router.route('/search-city').put(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    postQueriesController.eventsZar_Search_Cities_For_User
)

module.exports = router;