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

export const postReducer = (state = {posts: {}}, action)=>{
    switch(action.type){
        case POST_GET_ALL_REQUEST:
        case POST_GET_SINGLE_REQUEST:
        case POST_AUTH_ALL_POST_REQUEST:
        case POST_RANDOM_ALL_POST_REQUEST:
        case POST_CREATE_REQUEST:
        case POST_USER_LIKE_REQUEST:
        case POST_USER_DELETE_REQUEST:
            return {
                loading: true,
                posts: null
            }

        case POST_GET_ALL_SUCCESS:
        case POST_GET_SINGLE_SUCCESS:
        case POST_AUTH_ALL_POST_SUCCESS:
        case POST_RANDOM_ALL_POST_SUCCESS:
        case POST_CREATE_SUCCESS:
        case POST_USER_LIKE_SUCCESS:
        case POST_USER_DELETE_SUCCESS:
            return {
                ...state,
                loading: false,
                posts: action.payload
            }


        case POST_GET_ALL_FAIL:
        case POST_GET_SINGLE_FAIL:
        case POST_AUTH_ALL_POST_FAIL:
        case POST_RANDOM_ALL_POST_FAIL:
        case POST_CREATE_FAIL:
        case POST_USER_LIKE_FAIL:
        case POST_USER_DELETE_FAIL:
            return {
                ...state,
                loading: false,
                posts: null,
                error: action.payload,
            }

        case CLEAR_ERRORS:
            return {
                ...state,
                error: null,
            }
        default:
            return state;
    }
}