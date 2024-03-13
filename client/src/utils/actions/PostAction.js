import axios from 'axios';
import {
    POST_GET_ALL_REQUEST, POST_GET_ALL_SUCCESS, POST_GET_ALL_FAIL,
    POST_GET_SINGLE_REQUEST, POST_GET_SINGLE_SUCCESS, POST_GET_SINGLE_FAIL,
    POST_AUTH_ALL_POST_REQUEST, POST_AUTH_ALL_POST_SUCCESS, POST_AUTH_ALL_POST_FAIL,
    POST_RANDOM_ALL_POST_REQUEST,POST_RANDOM_ALL_POST_SUCCESS, POST_RANDOM_ALL_POST_FAIL,
    POST_CREATE_REQUEST, POST_CREATE_SUCCESS, POST_CREATE_FAIL,
    POST_USER_LIKE_REQUEST, POST_USER_LIKE_SUCCESS, POST_USER_LIKE_FAIL,
    POST_USER_DELETE_REQUEST, POST_USER_DELETE_SUCCESS, POST_USER_DELETE_FAIL,
    CLEAR_ERRORS,
} from '../constants/Constants.js';

// Getting all posts
export const socio_Get_All_Posts = async(dispath)=>{
    try{
        dispath({type: POST_GET_ALL_REQUEST})
        const { data } = await axios.get(`/post/all`);
        dispath({
            type: POST_GET_ALL_SUCCESS,
            payload: data.posts
        })

    } catch(error){
        dispath({
            type: POST_GET_ALL_FAIL,
            payload: error.response.data.message 
        })
    }
}

// Getting single post
export const socio_Get_Single_Post = async(dispath)=>{
    try{
        dispath({type: POST_GET_SINGLE_REQUEST})

        const { data } = await axios.get(`post/single/:id`);

        dispath({
            type: POST_GET_SINGLE_SUCCESS,
            payload: data.posts
        })

    } catch(error){
        dispath({
            type: POST_GET_SINGLE_FAIL, 
            payload: error.response.data.message 
        })
    }
}

// Getting auth user posts
export const socio_Auth_User_Posts = async(dispath)=>{
    try{
        dispath({type: POST_AUTH_ALL_POST_REQUEST})

        const { data } = await axios.get(`/post/auth/all`);

        dispath({
            type: POST_AUTH_ALL_POST_SUCCESS,
            payload: data.posts
        })

    } catch(error){
        dispath({
            type: POST_AUTH_ALL_POST_FAIL, 
            payload: error.response.data.message 
        })
    }
}

// Getting random user posts
export const socio_Random_User_Posts = async(dispath)=>{
    try{
        dispath({type: POST_RANDOM_ALL_POST_REQUEST})

        const { data } = await axios.get(`/url/:id`);

        dispath({
            type: POST_RANDOM_ALL_POST_SUCCESS,
            payload: data.posts
        })

    } catch(error){
        dispath({
            type: POST_RANDOM_ALL_POST_FAIL,
            payload: error.response.data.message 
        })
    }
}

// Creating Post
export const socio_Create_Post = (postData) => async(dispath)=>{
    try{
        dispath({type: POST_CREATE_REQUEST})

        const config = {headers: { "Content-Type": "application/json"}};

        const { data } = await axios.post(`/post/create`, postData, config);

        dispath({
            type: POST_CREATE_SUCCESS,
            payload: data.posts
        })

    } catch(error){
        dispath({
            type: POST_CREATE_FAIL,
            payload: error.response.data.message 
        })
    }
}

// Post Delete  /delete/:id
export const socio_Deleting_User_Post = (id) => async(dispath)=>{
    try{
        dispath({type: POST_USER_DELETE_REQUEST})
        const { data } = await axios.delete(`/post/delete/${id}`);
        dispath({
            type: POST_USER_DELETE_SUCCESS,
            payload: data.posts
        })

    } catch(error){
        dispath({
            type: POST_USER_DELETE_FAIL,
            payload: error.response.data.message 
        })
    }
}

// Post Liking  /like/:id
export const socio_Like_Dislike_User_Post = (id) => async(dispath)=>{
    try{
        dispath({type: POST_USER_LIKE_REQUEST})
        const { data } = await axios.get(`/post/like/${id}`);
        dispath({
            type: POST_USER_LIKE_SUCCESS,
            payload: data.posts
        })

    } catch(error){
        dispath({
            type: POST_USER_LIKE_FAIL,
            payload: error.response.data.message 
        })
    }
}

// Clearing Error
export const clearError = async(dispath)=>{
    dispath({type: CLEAR_ERRORS});
}