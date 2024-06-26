import express from "express";
import authToken from "../../utils/authToken.js";
import {social_Media_User_New_Post} from "../../controllers/Post/new_Posts_Creation_Controller.js";
import { social_Media_Users_Fetching_All_Posts, social_media_Single_Post } from "../../controllers/Post/post_Fetching_Controller.js"

const router = express.Router();

router.route("/new-post").post(authToken.isAuthenticated, authToken.payLoadProcessing, social_Media_User_New_Post);
router.route("/all-post").get(authToken.isAuthenticated, social_Media_Users_Fetching_All_Posts);
router.route("/post/:id").get(authToken.isAuthenticated, social_media_Single_Post);

export default router;
