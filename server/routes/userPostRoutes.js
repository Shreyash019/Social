import express from 'express';
import {
    socio_Get_All_Posts,
    socio_Get_Single_Post,
    socio_Get_All_Post_Auth_User,
    socio_Get_All_Posts_User,
    socio_Creating_User_Post,
    socio_Deleting_User_Post,
    socio_Like_Dislike_User_Post,
    socio_Creating_Updating_Post_Comment,
    socio_Deleting_Comment_Post,
} from '../controller/postController.js';
import authToken from '../utils/authToken.js';

const router = express.Router();

// Post related routes
router.route('/all').get(authToken.isUserAuthenticated, socio_Get_All_Posts);
router.route('/single/:id').get(authToken.isUserAuthenticated, socio_Get_Single_Post)
router.route('/auth/all').get(authToken.isUserAuthenticated, socio_Get_All_Post_Auth_User);
router.route('/user/:id').get(authToken.isUserAuthenticated, socio_Get_All_Posts_User)
router.route('/create').post(authToken.isUserAuthenticated, socio_Creating_User_Post);
router.route('/delete/:id').delete(authToken.isUserAuthenticated, socio_Deleting_User_Post);


// Like and comment related routes
router.route('/like/:id').get(authToken.isUserAuthenticated, socio_Like_Dislike_User_Post);
router.route('/comment/:id').put(authToken.isUserAuthenticated, socio_Creating_Updating_Post_Comment);
router.route('/comment/delete/:id').delete(authToken.isUserAuthenticated, socio_Deleting_Comment_Post);


export default router;