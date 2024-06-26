// Builtin Modules Import
import jwt from 'jsonwebtoken';
import ErrorHandler from './errorHandler.js';
import Users from '../models/User/Users.js';
import catchAsync from '../error/catchAsync.js';
import { HttpStatusCode } from '../enums/httpHeaders.js';
import { fetchingBlockedUsersId } from '../Services/FollowBlockIdService/GettingIDsFromFetchedData.js';
import zlib from 'zlib';

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
        res.cookie('usertoken', token, options);

        // Return values
        return { success: true, userToken: token }
    },

    // 03) <<<<<<<<|| AUTHENTICATION CHECK ||>>>>>>>>
    isAuthenticated: catchAsync(async function (req, res, next) {

        // a) Fetching token 
        let token = undefined;

        if (req.cookies.usertoken) {
            token = req.cookies.usertoken
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
        let user = await Users.findById(jwtReturnData.decoded.id)
            .select('username +isAccountVerified +isProfileCompleted +isAccountActive country')

        // d) Setting Authenticated User
        if (!user) {
            return next(new ErrorHandler(`Please login again`, 401))
        } else {
            const blockedUsers = await fetchingBlockedUsersId(user);
            req.user = {
                id: user._id,
                username: user.username,
                isAccountVerified: user.isAccountVerified,
                isProfileCompleted: user.isProfileCompleted,
                isAccountActive: user.isAccountActive,
                country: user?.country ? user.country : 'world',
                blockedUsers: blockedUsers,
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


    payLoadProcessing: catchAsync(async (req, res, next) => {
        try {
            if (req.headers['content-encoding'] === 'gzip') {
                console.log("start")            
                // Decoding logic is required
                let compressedData = req.body;
                zlib.gunzip(compressedData, (err, decompressedData) => {
                    if (err) {
                        // Handle error
                        console.log(err)
                        return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                            success: false,
                            message: `Something went wrong!`
                        })
                    } else {
                        // Process the decompressed data as usual (e.g., JSON.parse())
                        req.body = JSON.parse(decompressedData.toString());
                        // ... use the data
                        console.log(req.body)
                    }
                });
            }
        } catch (error) {
            console.log("Error", error)
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: `Something went wrong!`
            })
        }
        next()
    })
}

export default authToken;