import express from 'express';
import {
    socio_User_Registration,
    socio_User_Login,
    socio_User_Logout,
    socio_User_Profile,
    socio_User_Profile_Update,
    socio_User_Profile_Delete,
    socio_User_Password_Update,
    socio_User_Password_Forgot,
    socio_User_Password_Reset,
    // socio_Other_User_Profile,
    socio_User_Friends_List,
    socio_Get_All_Users,
    socio_Send_Cancel_Friend_Request,
    socio_Accepting_Frined_Request,
    socio_Remove_User_Friend,
} from '../controller/userControllers.js';
import authToken from '../utils/authToken.js';

const router = express.Router();

// User authentication routes
router.route('/signup').post(socio_User_Registration);
router.route('/login').post(socio_User_Login);
router.route('/logout').get(authToken.isUserAuthenticated, socio_User_Logout);

// User Profile routes
router.route('/profile').get(authToken.isUserAuthenticated, socio_User_Profile);
router.route('/profile/update').patch(authToken.isUserAuthenticated, socio_User_Profile_Update);
router.route('/profile/delete').delete(authToken.isUserAuthenticated, socio_User_Profile_Delete);
// router.route('/:id').get(authToken.isUserAuthenticated, socio_Other_User_Profile);

// User Password routes
router.route('/password/update').put(authToken.isUserAuthenticated, socio_User_Password_Update);
router.route('/password/forgot').post(authToken.isUserAuthenticated, socio_User_Password_Forgot);
router.route('/password/reset/:code').post(authToken.isUserAuthenticated, socio_User_Password_Reset);

// Other routes
router.route('/all').get(authToken.isUserAuthenticated, socio_Get_All_Users);
router.route('/friend/list').get(authToken.isUserAuthenticated, socio_User_Friends_List)
router.route('/friends/:ops/:id').get(authToken.isUserAuthenticated, socio_Send_Cancel_Friend_Request);
router.route('/friend/accept/:id').get(authToken.isUserAuthenticated, socio_Accepting_Frined_Request);
router.route('/friend/remove/:id').get(authToken.isUserAuthenticated, socio_Remove_User_Friend);

export default router;