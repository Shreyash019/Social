import express from "express";
import authToken from "../../utils/authToken.js";
import { social_Media_User_New_Post } from "../../controllers/Post/new_Posts_Creation_Controller.js";
import { social_Media_Users_Fetching_All_Posts, social_media_Single_Post } from "../../controllers/Post/post_Fetching_Controller.js";
import {
    social_Media_Like_A_Post_By_User,
    social_Media_New_Comment_On_A_Post,
    social_Media_Reply_On_A_Comment_Of_A_Post,
    social_Media_Single_Post_Comment_Details,
    social_Media_Single_Post_Likes_Details,
    social_Media_User_Post_Comment_Delete,
    social_Media_Deleting_User_Comment_Reply
} from "../../controllers/Post/posts_Like_Comment_Controller.js"

const router = express.Router();

router.route("/new-post").post(authToken.isAuthenticated, authToken.payLoadProcessing, social_Media_User_New_Post);
router.route("/all-post").get(authToken.isAuthenticated, social_Media_Users_Fetching_All_Posts);
router.route("/post/:id")
    .get(authToken.isAuthenticated, social_media_Single_Post)
    .put(authToken.isAuthenticated, social_media_Single_Post)
    .delete(authToken.isAuthenticated, social_media_Single_Post);


router.route("/post-like").put(authToken.isAuthenticated, social_Media_Like_A_Post_By_User)
router.route("/new-comment").post(authToken.isAuthenticated, social_Media_New_Comment_On_A_Post)
router.route("/new-reply").post(authToken.isAuthenticated, social_Media_Reply_On_A_Comment_Of_A_Post)
router.route("/comment-list").get(authToken.isAuthenticated, social_Media_Single_Post_Comment_Details)
router.route("/likes-list").get(authToken.isAuthenticated, social_Media_Single_Post_Likes_Details)
router.route("/comment-delete").delete(authToken.isAuthenticated, social_Media_User_Post_Comment_Delete)
router.route("/reply-delete").delete(authToken.isAuthenticated, social_Media_Deleting_User_Comment_Reply)

export default router;
