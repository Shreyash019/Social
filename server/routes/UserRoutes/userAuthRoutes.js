import express from "express";
import authToken from "../../utils/authToken.js";
import {
    social_Media_New_User_Account_Sign_Up,
    social_Media_Account_Sign_In,
    social_Media_Account_Sign_Out,
    social_Media_Account_OTP_Verification,
    social_Media_Account_Resend_OTP,
    social_Media_Account_Forgot_Password,
    social_Media_Account_Forgot_Password_OTP_Verify,
    social_Media_Account_Reset_Password,
    social_Media_Account_Password_Update
} from '../../controllers/User/userAuthenticationController.js';

const router = express.Router();

// 01) User Sign Up
router.route("/sign-up")
    .post(social_Media_New_User_Account_Sign_Up);

// 02) User Sign In
router.route("/sign-in")
    .post(social_Media_Account_Sign_In);

// 03) User Sign Out
router.route("/sign-out")
    .put(social_Media_Account_Sign_Out);

// 04) User Sign Out
router.route("/account-verification").put(
    authToken.isAuthenticated,
    social_Media_Account_OTP_Verification
);

// 05) User Sign Out
router.route("/otp-resend").put(
    authToken.isAuthenticated,
    social_Media_Account_Resend_OTP
);

// 06) User Sign Out
router.route("/forgot-password")
    .post(social_Media_Account_Forgot_Password);

// 07) User Sign Out
router.route("/forgot-password-verification")
    .post(social_Media_Account_Forgot_Password_OTP_Verify);

// 08) User Sign Out
router.route("/reset-password")
    .post(social_Media_Account_Reset_Password);

// 09) User Sign Out
router.route("/update-password").put(
    authToken.isAuthenticated,
    social_Media_Account_Password_Update
);

export default router;
