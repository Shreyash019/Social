import {legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { userAuthReducer,socio_profile_Password_Update, socio_All_User } from '../utils/reducers/UserReducers.js';
import { postReducer } from '../utils/reducers/PostReducers.js';


const reducer = combineReducers({
    user: userAuthReducer,
    posts: postReducer,
    profile: socio_profile_Password_Update,
    friends: socio_All_User,
})

let initialState = {};

const middleware = [thunk];

const store = createStore(reducer, initialState, composeWithDevTools(applyMiddleware(...middleware)));

export default store;