import express from "express";
import authToken from "../../utils/authToken.js";
import {
    social_Media_User_Account_Information,
    social_Media_User_Profile_Information_Update,
    social_Media_User_Account_Profile_Image_Update,
    social_Media_User_Account_Location_Update,
    social_Media_User_Account_Information_By_Other_User,
    social_Media_User_Account_Delete,
    social_Media_User_Account_Enable_Disable,
} from '../../controllers/User/userProfileController.js';

const router = express.Router();

// 01) User Profile Information
router.route("/information").get(
    authToken.isAuthenticated,
    social_Media_User_Account_Information
);

// 02) User Profile Information Update
router.route("/information-update").post(
    authToken.isAuthenticated,
    social_Media_User_Profile_Information_Update
);

// 03) User Profile Image Upload
router.route("/image-update").put(
    authToken.isAuthenticated,
    social_Media_User_Account_Profile_Image_Update
);

// 05) User Location Update
router.route("/address-update").post(
    authToken.isAuthenticated,
    social_Media_User_Account_Location_Update
);

// 06) Other User Profile View
router.route("/other-information").post(
    authToken.isAuthenticated,
    social_Media_User_Account_Information_By_Other_User
);

// 07) User Account Delete
router.route("/account-delete").post(
    authToken.isAuthenticated,
    social_Media_User_Account_Delete
);

// 08) User Account Enable/Disable
router.route("/enable-disable").post(
    authToken.isAuthenticated,
    social_Media_User_Account_Enable_Disable
);



export default router;
