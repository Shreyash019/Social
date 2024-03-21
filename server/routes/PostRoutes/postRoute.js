import express from 'express';
import authToken from '../../utils/authToken';
import {
    socio_User_Account_New_Post,
    socio_User_Account_New_Poll,
    socio_User_Account_New_Survey,
    socio_User_Account_All_Posts,
    socio_User_Account_Single_Post,
    socio_User_Account_My_Posts
} from '../../controllers/Post/UserPost/userPostController';
import {
    socio_Like_Dislike_A_Post,
    socio_New_Comment_On_A_Post,
    socio_Reply_On_A_Comment_Of_A_Post,
    socio_Likes_Details_Of_A_Post,
    socio_Comment_Details_Of_A_Post
} from '../../controllers/Post/PostImpressions/postImpressionController';

const router = express.Router();
/*
    Index:
        01) 🅿️🔥 User New Post
        02) 🅿️🔥 User New Poll
        03) 🅿️🔥 User New Survey
        04) 🅿️⛈️ User All Posts
        05) 🅿️⛈️ User Single Post
        06) 🅿️⛈️ User My Posts
        07) 🅿️🔥 Like OR Dislike A Post
        08) 🅿️🔥 New Comment On A Post
        09) 🅿️🔥 New Reply On A Comment
        10) 🅿️⛈️ Likes Detail Of A Post
        11) 🅿️⛈️ Comments Details Of A Post
*/

// 01) 🅿️🔥⛈️ User Post
router.route('/new/post')
    .post(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_User_Account_New_Post
    );

// 02) 🅿️🔥⛈️ User Poll
router.route('/new/poll')
    .post(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_User_Account_New_Poll
    )

// 03) 🅿️🔥⛈️ User Survey
router.route('/new/survey')
    .post(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_User_Account_New_Survey
    )

// 04) 🅿️🔥⛈️ Users All Posts
router.route('/all/posts')
    .get(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_User_Account_All_Posts
    );

// 05) 🅿️🔥⛈️ User Single Post
router.route('/single/post')
    .get(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_User_Account_Single_Post
    );

// 06) 🅿️🔥⛈️ Users My Posts
router.route('/my/posts')
    .get(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_User_Account_My_Posts
    );

// 07) 🅿️🔥 Like OR Dislike A Post 
router.route('/post/like')
    .put(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_Like_Dislike_A_Post
    )

// 08) 🅿️🔥 New Comment On A Post
router.route('/post/comment')
    .post(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_New_Comment_On_A_Post
    )

// 09) 🅿️🔥 New Reply On A Comment
router.route('/reply/comment')
    .post(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_Reply_On_A_Comment_Of_A_Post
    )

// 10) 🅿️⛈️ Likes Detail Of A Post
router.route('/post/:postID')
    .get(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_Likes_Details_Of_A_Post
    )

// 11) 🅿️⛈️ Comments Details Of A Post
router.route('/comment/:pid')
    .get(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_Comment_Details_Of_A_Post
    )

export default router;