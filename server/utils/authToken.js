// Builtin Modules Import
import jwt from 'jsonwebtoken';

// Created middleware Import
import ErrorHandler from './errorHandler.js';

// Database Import
import Consumer from '../models/Consumer/Consumer.js';
import catchAsync from '../middlewares/catchAsync.js';
import HttpStatusCode from '../enums/httpHeaders.js';

const authToken = {

    // 01) <<<<<<<<|| TOKEN GENERATION ||>>>>>>>>
    userSignToken: function (id) {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        })
    },

    // 02) <<<<<<<<|| TOKEN SETUP FOR USER ||>>>>>>>>
    userSendToken: async function (res, user, actionType) {

        // a) Token Generation
        const token = this.userSignToken(user._id);

        // b) Cookie validation days setup
        const options = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            httpOnly: true,
        }

        // c) Token setting in header
        res.cookie('consumerToken', token, options);

        // Return values
        return {success: true, userToken: token}
    },

    // 03) <<<<<<<<|| AUTHENTICATION CHECK ||>>>>>>>>
    isAuthenticated: catchAsync(async function (req, res, next) {

        // a) Fetching token 
        let token = undefined;

        if (req.cookies.consumerToken) {
            token = req.cookies.consumerToken
        }
        // else if (req.headers.authorization && req.headers.authorization.startsWith('bearer')) {
        else if (req.headers.authorization && req.headers.authorization.startsWith('bearer')) {
            if (req.headers.authorization.split(' ')[1].toString().toLowerCase() !== 'null') {
                token = req.headers.authorization.split(' ')[1];
            }
        }

        // b) Returning if no token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: `Please login.`
            })
        }

        // c) Decoding user using token
        function verifyToken(token) {
            return new Promise((resolve, reject) => {
                jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                    if (err && err.name === 'JsonWebTokenError' && err.message === 'jwt malformed') {
                        reject(new Error('Invalid token'));
                    } else if (err) {
                        reject(err);
                    } else {
                        resolve(decoded);
                    }
                });
            });
        }

        let jwtReturnData = {
            decoded: undefined,
            err: undefined
        };
        await verifyToken(token)
            .then(data => {
                jwtReturnData.decoded = data
            })
            .catch(err => {
                jwtReturnData.err = err.message
            });

        if (jwtReturnData.err) {
            return next(new ErrorHandler(`Unauthorized`, 401))
        }
        // const decoded = jwt.verify(token, process.env.JWT_SECRET)
        let user = await Consumer.findById(jwtReturnData.decoded.id)
            .select('+isAccountVerified +isProfileCompleted +isAccountActive +role +hasBusiness userAccount businessAccount')

        // d) Setting Authenticated User
        if (!user) {
            return next(new ErrorHandler(`Please login again`, 401))
        } else {
            req.user = {
                id: user._id,
                isAccountVerified: user.isAccountVerified,
                isProfileCompleted: user.isProfileCompleted,
                isAccountActive: user.isAccountActive,
                role: user.role,
            }
        }

        // e) Calling next function
        next();
    }),

    // 04) <<<<<<<<|| PROFILE VERIFICATION CHECK||>>>>>>>>
    isProfileVerified: async function (req, res, next) {

        // Getting User From Request Object
        let user = req.user

        // Object For Error If Detected
        let isError = {
            error: false,
            errStatus: undefined,
            errMsg: undefined
        }

        // Checking User Account Status
        if (!user) {
            isError.error = true;
            isError.errStatus = HttpStatusCode.NOT_FOUND;
            isError.errMsg = `Either user not exist or not logged in!`;
        } else if (!user.isAccountVerified) {
            isError.error = true;
            isError.errStatus = HttpStatusCode.UNAUTHORIZED;
            isError.errMsg = `Your account is not verified, Please verify it first!`;
        } else if (user.isAccountVerified && !user.isAccountActive) {
            isError.error = true;
            isError.errStatus = HttpStatusCode.FORBIDDEN;
            isError.errMsg = `Your account is not active!`;
        } else if (user.isAccountVerified && !user.isProfileCompleted) {
            isError.error = true;
            isError.errStatus = HttpStatusCode.FORBIDDEN;
            isError.errMsg = `Your profile is not updated yet, Please update it first!`;
        }
        if (isError.error) {
            req.user = undefined;
            return next(new ErrorHandler(isError.errMsg, isError.errStatus))
        }
        next();
    },

}

export default authToken;