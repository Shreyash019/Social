import axios from 'axios';
import {
    SIGN_UP_REQUEST, SIGN_UP_SUCCESS, SIGN_UP_FAIL,
    LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAIL,
    LOGOUT_SUCCESS, LOGOUT_FAIL,
    LOAD_USER_REQUEST, LOAD_USER_SUCCESS, LOAD_USER_FAIL,
    UPDATE_USER_PROFILE_REQUEST, UPDATE_USER_PROFILE_SUCCESS, UPDATE_USER_PROFILE_FAIL,
    UPDATE_USER_PASSWORD_REQUEST, UPDATE_USER_PASSWORD_SUCCESS, UPDATE_USER_PASSWORD_FAIL, 
    LOAD_ALL_USER_REQUEST, LOAD_ALL_USER_SUCCESS, LOAD_ALL_USER_FAIL,
    FRIEND_REQUEST_SEND_CANCEL_REQUEST, FRIEND_REQUEST_SEND_CANCEL_SUCCESS, FRIEND_REQUEST_SEND_CANCEL_FAIL,
    FRIEND_REQUEST_ACCEPT_REQUEST, FRIEND_REQUEST_ACCEPT_SUCCESS, FRIEND_REQUEST_ACCEPT_FAIL,
    USER_FRIEND_REMOVE_REQUEST, USER_FRIEND_REMOVE_SUCCESS, USER_FRIEND_REMOVE_FAIL,
    CLEAR_ERRORS,
} from '../constants/Constants.js';

// Sign up
export const socio_Sign_Up = ( firstName, lastName, email, password ) => async(dispath)=>{
    try{
        dispath({ type: SIGN_UP_REQUEST });
        const config = {headers: { "Content-Type": "application/json"}};
        const {data} = await axios.post(`/user/signup`, {
                firstName, 
                lastName, 
                email, 
                password
            },
            config
        );
        dispath({
            type: SIGN_UP_SUCCESS,
            payload: data
        })

    } catch(error){
        dispath({
            type: SIGN_UP_FAIL,
            payload: error.response.data.message
        })
    }
}

// Sign in
export const socio_Sign_In = (email, password) => async(dispath)=>{
    try{
        dispath({ type: LOGIN_REQUEST });

        const config = {headers: { "Content-Type": "application/json"}};

        await axios.post(`/user/login`, { email, password }, config);

        dispath({
            type: LOGIN_SUCCESS,
            // payload: data.user
        })

    } catch(error){
        dispath({
            type: LOGIN_FAIL,
            payload: error.response.data.message
        })
    }
}

// Sign out
export const socio_Sign_Out = async(dispath)=>{
    try{
        await axios.get(`/user/logout`);
        
        dispath({
            type: LOGOUT_SUCCESS
        })

    } catch(error){
        dispath({
            type: LOGOUT_FAIL,
            payload: error.response.data.message
        })
    }
}

// Load user
export const socio_Load_User = async(dispath)=>{
    try{
        dispath({type: LOAD_USER_REQUEST})

        const {data} = await axios.get(`/user/profile`);
        dispath({
            type: LOAD_USER_SUCCESS,
            payload: data.user
        })

    } catch(error){
        dispath({
            type: LOAD_USER_FAIL,
            payload: error.response.data.message
        })
    }
}

// Profile update
export const socio_User_Profile_Update =(userData) => async(dispath)=>{
    try{
        dispath({type: UPDATE_USER_PROFILE_REQUEST})
        const config = {headers: { "Content-Type": "application/json"}};
        const { data } = await axios.patch(`/user/profile/update`, userData, config);
        dispath({
            type: UPDATE_USER_PROFILE_SUCCESS,
            payload: data.user
        })
    } catch(error){
        dispath({
            type: UPDATE_USER_PROFILE_FAIL,
            payload: error.response.data.message
        })
    }
}

// Password update
export const socio_User_Password_Update = (formData) => async(dispath)=>{
    try{
        dispath({type: UPDATE_USER_PASSWORD_REQUEST})     
        const config = {headers: { "Content-Type": "application/json"}};
        const { data } = await axios.put(`/user/password/update`, {
            oldPassword: formData.oldPassword,
            newPassword: formData.newPassword,
            confirmPassword: formData.confirmPassword,
        }, config);

        dispath({
            type: UPDATE_USER_PASSWORD_SUCCESS,
            payload: data.success
        })
    } catch(error){
        dispath({
            type: UPDATE_USER_PASSWORD_FAIL,
            payload: error.response.data.message
        })
    }
}


// Get All users
export const socio_Get_All_Users = () => async(dispath)=>{
    try{
        dispath({type: LOAD_ALL_USER_REQUEST})     

        const {data} = await axios.get(`/user/all`);
        dispath({
            type: LOAD_ALL_USER_SUCCESS,
            payload: data
        })
    } catch(error){
        dispath({
            type: LOAD_ALL_USER_FAIL,
            payload: error.response.data.message
        })
    }
}

// Sending and Cancelling Friend request
export const socio_Send_Cancel_Friend_Request = (ops, id) => async(dispath)=>{
    try{
        dispath({type: FRIEND_REQUEST_SEND_CANCEL_REQUEST})     
        const {data} = await axios.get(`/user/friends/${ops}/${id}`);
        dispath({
            type: FRIEND_REQUEST_SEND_CANCEL_SUCCESS,
            payload: data
        })
    } catch(error){
        dispath({
            type: FRIEND_REQUEST_SEND_CANCEL_FAIL,
            payload: error.response.data.message
        })
    }
}

// /user/friends/${id}
export const socio_User_Friend_Accept = (id) => async(dispath)=>{
    try{
        dispath({type: FRIEND_REQUEST_ACCEPT_REQUEST})     
        const {data} = await axios.get(`/user/friend/accept/${id}`);
        dispath({
            type: FRIEND_REQUEST_ACCEPT_SUCCESS,
            payload: data
        })
    } catch(error){
        dispath({
            type: FRIEND_REQUEST_ACCEPT_FAIL,
            payload: error.response.data.message
        })
    }
}

// /user/friends/remove/${id}
export const socio_User_Friend_Remove = (id) => async(dispath)=>{
    try{
        dispath({type: USER_FRIEND_REMOVE_REQUEST})     
        const {data} = await axios.get(`/user/friend/remove/${id}`);
        dispath({
            type: USER_FRIEND_REMOVE_SUCCESS,
            payload: data
        })
    } catch(error){
        dispath({
            type: USER_FRIEND_REMOVE_FAIL,
            payload: error.response.data.message
        })
    }
}


// Clearing Error
export const clearErrors = async(dispath)=>{
    dispath({type: CLEAR_ERRORS});
}