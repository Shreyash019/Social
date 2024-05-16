import express from "express";
import user_Authentication_Routes from "./UserRoutes/userAuthRoutes.js";
import user_Profile_Routes from "./UserRoutes/userProfileRoutes.js";
import user_Follow_Routes from "./UserRoutes/userFollowRoutes.js";

const router = express.Router();

router.use("/user-auth", user_Authentication_Routes);
router.use("/user-profile", user_Profile_Routes);
router.use("/user-follow", user_Follow_Routes);

export default router;
