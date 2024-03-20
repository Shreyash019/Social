import express from 'express';
import authToken from '../../utils/authToken.js';
import {
    socio_User_Account_Sign_Up,
    socio_User_Account_Sign_In,
    socio_User_Account_Sign_Out,
    socio_User_Account_OTP_Verification,
    socio_User_Account_Resend_OTP,
    socio_User_Account_Forgot_Password,
    socio_User_Account_Forgot_Password_OTP_Verify,
    socio_User_Account_Reset_Password,
    socio_User_Account_Password_Update,
    socio_User_Account_Information,
    socio_User_Account_Information_Update,
    socio_User_Account_Profile_Image_Update,
    socio_User_Account_Address_Update,
    socio_User_Account_Address_Location_Update,
    socio_User_Account_Information_By_Other_User
} from '../../controllers/Consumer/consumerAuthController.js';

import {
    socio_User_Account_All_Users_Account_List,
    socio_User_Account_Follow_UnFollow_A_User,
    socio_User_Account_Followers_Followings_Count,
    socio_User_Account_Fetching_Followers_List,
    socio_User_Account_Fetching_Followings_List,
    socio_User_Account_Remove_Followers_From_A_List,
} from '../../controllers/Consumer/followerFriendGroupController.js';

const router = express.Router();

router.route('/signup').post(
    socio_User_Account_Sign_Up
);

router.route('/sign/in').post(
    socio_User_Account_Sign_In
);

router.route('/sign/out').put(
    authToken.isAuthenticated,
    socio_User_Account_Sign_Out
);

router.route('/verify/otp')
    .get(
        authToken.isAuthenticated,
        socio_User_Account_Resend_OTP
    )
    .put(
        authToken.isAuthenticated,
        socio_User_Account_OTP_Verification
    );

router.route('/forgot/password').put(
    socio_User_Account_Forgot_Password
);

router.route('/reset/verification').put(
    socio_User_Account_Forgot_Password_OTP_Verify
);

router.route('/reset/password').put(
    socio_User_Account_Reset_Password
);

router.route('/password/update').put(
    authToken.isAuthenticated,
    socio_User_Account_Password_Update
);

router.route('/profile')
    .get(
        authToken.isAuthenticated,
        socio_User_Account_Information
    )
    .put(
        authToken.isAuthenticated,
        socio_User_Account_Information_Update
    );

router.route('/address')
    .put(
        authToken.isAuthenticated,
        authToken.isProfileVerified,
        socio_User_Account_Address_Update
    );

router.route('/location/update').put(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    socio_User_Account_Address_Location_Update
);

router.route('/profile/picture').put(
    authToken.isAuthenticated,
    socio_User_Account_Profile_Image_Update
);

router.route('/profile/:id').get(
    authToken.isAuthenticated,
    
    socio_User_Account_Information_By_Other_User
);

router.route('/all/accounts').get(
    authToken.isAuthenticated, 
    socio_User_Account_All_Users_Account_List
);

router.route('follow/unfollow').get(
    authToken.isAuthenticated,
    socio_User_Account_Follow_UnFollow_A_User
);

router.route('/follower/following/count').get(
    authToken.isAuthenticated,
    socio_User_Account_Followers_Followings_Count
);

router.route('/followers/list').get(
    authToken.isAuthenticated,
    socio_User_Account_Fetching_Followers_List
);

router.route('/following/list').get(
    authToken.isAuthenticated,
    socio_User_Account_Fetching_Followings_List
);

router.route('/remove/follower').get(
    authToken.isAuthenticated,
    socio_User_Account_Remove_Followers_From_A_List
);

router.route('/profile/:id').get(
    authToken.isAuthenticated,
    socio_User_Account_Information_By_Other_User
);


export default router;