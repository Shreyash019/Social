import express from 'express';
import authToken from '../../utils/authToken';
import UserAuthController from '../../controllers/Consumer/consumerAuthController';

const router = express.Router();

// Common Routes
router.route('/signup').post(
    UserAuthController.socio_User_Account_Sign_Up
);

router.route('/signin').post(
    UserAuthController.socio_User_Account_Sign_In
);

router.route('/signout').put(
    authToken.isAuthenticated,
    UserAuthController.socio_User_Account_Sign_Out
);

router.route('/verify/otp')
    .get(
        authToken.isAuthenticated,
        UserAuthController.socio_User_Account_Resend_OTP
    )
    .put(
        authToken.isAuthenticated,
        UserAuthController.socio_User_Account_OTP_Verification
    );

router.route('/forgot/password').put(
    UserAuthController.socio_User_Account_Forgot_Password
);

router.route('/reset/verification').put(
    UserAuthController.socio_User_Account_Forgot_Password_OTP_Verify
);

router.route('/reset/password').put(
    UserAuthController.socio_User_Account_Reset_Password
);

router.route('/password/update').put(
    authToken.isAuthenticated,
    UserAuthController.socio_User_Account_Password_Update
);

router.route('/profile')
    .get(
        authToken.isAuthenticated,
        authToken.isAccountTypeCustomer,
        UserAuthController.socio_User_Account_Information
    )
    .put(
        authToken.isAuthenticated,
        authToken.isAccountTypeCustomer,
        UserAuthController.socio_User_Account_Information_Update
    );

router.route('/address/update').put(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    authToken.isAccountTypeCustomer,
    UserAuthController.socio_User_Account_Address_Update
);

router.route('/location/update').put(
    authToken.isAuthenticated,
    authToken.isProfileVerified,
    authToken.isAccountTypeCustomer,
    UserAuthController.socio_User_Account_Address_Location_Update
);

router.route('/profile/picture').put(
    authToken.isAuthenticated,
    authToken.isAccountTypeCustomer,
    UserAuthController.socio_User_Account_Profile_Image_Update
);

router.route('/profile/:id').get(
    authToken.isAuthenticated,
    authToken.isAccountTypeCustomer,
    UserAuthController.socio_User_Account_Information_By_Other_User
);


export default router;