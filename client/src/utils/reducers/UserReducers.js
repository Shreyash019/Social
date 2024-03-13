import {
    SIGN_UP_REQUEST, SIGN_UP_SUCCESS, SIGN_UP_FAIL,
    LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAIL,
    LOGOUT_SUCCESS, LOGOUT_FAIL,
    LOAD_USER_REQUEST, LOAD_USER_SUCCESS, LOAD_USER_FAIL,
    UPDATE_USER_PROFILE_REQUEST, UPDATE_USER_PROFILE_SUCCESS, UPDATE_USER_PROFILE_FAIL, UPDATE_USER_PROFILE_RESET,
    UPDATE_USER_PASSWORD_REQUEST, UPDATE_USER_PASSWORD_SUCCESS, UPDATE_USER_PASSWORD_FAIL, UPDATE_USER_PASSWORD_RESET,
    LOAD_ALL_USER_REQUEST, LOAD_ALL_USER_SUCCESS, LOAD_ALL_USER_FAIL, 
    FRIEND_REQUEST_SEND_CANCEL_REQUEST, FRIEND_REQUEST_SEND_CANCEL_SUCCESS, FRIEND_REQUEST_SEND_CANCEL_FAIL,
    FRIEND_REQUEST_ACCEPT_REQUEST, FRIEND_REQUEST_ACCEPT_SUCCESS, FRIEND_REQUEST_ACCEPT_FAIL,
    USER_FRIEND_REMOVE_REQUEST, USER_FRIEND_REMOVE_SUCCESS, USER_FRIEND_REMOVE_FAIL,
    CLEAR_ERRORS,
} from '../constants/Constants.js';


export const userAuthReducer = (state = {user: {}}, action)=>{
  switch(action.type){
    case SIGN_UP_REQUEST:
    case LOGIN_REQUEST:
      return {
        loading: true,
        isAuthenticated: false
      }
        
    case LOAD_USER_REQUEST:
      return {
        loading: true,
        isAuthenticated: true
      }
      
    case UPDATE_USER_PROFILE_REQUEST:
      return {
        ...state,
        loading: true,
      };
    
    case LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
      }

    case LOGOUT_SUCCESS:
    case SIGN_UP_SUCCESS:
      return {
        loading: false,
        user: null,
        isAuthenticated: false,
      };
      
    case LOAD_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload
      }

    case UPDATE_USER_PROFILE_SUCCESS:
      return {
        ...state,
        loading: false,
        isUpdated: action.payload,          
        user: action.payload
      };
      
    case SIGN_UP_FAIL:
    case LOGIN_FAIL: 
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      }

    case LOAD_USER_FAIL:
      return {
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      }

    case LOGOUT_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }; 

    case UPDATE_USER_PROFILE_FAIL:
      return{
        ...state,
        loading: false,
        error: action.payload,
      }

    case UPDATE_USER_PROFILE_RESET:
      return {
        ...state,
        isUpdated: false,
      };

    case CLEAR_ERRORS:
      return {
        ...state,
        error: null,
      }
        
    default:
      return state;
    }
}


export const socio_profile_Password_Update = (state = {}, action) => {
    switch (action.type) {
      case UPDATE_USER_PASSWORD_REQUEST:
        return {
          ...state,
          loading: true,
        };
      case UPDATE_USER_PASSWORD_SUCCESS:
        return {
          ...state,
          loading: false,
          isUpdated: action.payload,
        };
      case UPDATE_USER_PASSWORD_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };

      case UPDATE_USER_PASSWORD_RESET:
        return {
          ...state,
          isUpdated: false,
        };
  
      case CLEAR_ERRORS:
        return {
          ...state,
          error: null,
        };
  
      default:
        return state;
    }
  };

  export const socio_All_User = (state = {}, action) => {
    switch (action.type) {
      case LOAD_ALL_USER_REQUEST:
      case FRIEND_REQUEST_SEND_CANCEL_REQUEST:
      case FRIEND_REQUEST_ACCEPT_REQUEST:
      case USER_FRIEND_REMOVE_REQUEST:
        return {
          ...state,
          loading: true,
        };

      case LOAD_ALL_USER_SUCCESS:
      case FRIEND_REQUEST_SEND_CANCEL_SUCCESS:
      case FRIEND_REQUEST_ACCEPT_SUCCESS:
      case USER_FRIEND_REMOVE_SUCCESS:
        return {
          ...state,
          loading: false,
          users: action.payload.users,
          usera: action.payload.usera,
        };

      // case FRIEND_REQUEST_SEND_CANCEL_SUCCESS:
      //       return {
      //         ...state,
      //         loading: false,
      //         status: action.payload,
      //       };

      case LOAD_ALL_USER_FAIL:
      case FRIEND_REQUEST_SEND_CANCEL_FAIL:
      case FRIEND_REQUEST_ACCEPT_FAIL:
      case USER_FRIEND_REMOVE_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
  
      case CLEAR_ERRORS:
        return {
          ...state,
          error: null,
        };
  
      default:
        return state;
    }
  };