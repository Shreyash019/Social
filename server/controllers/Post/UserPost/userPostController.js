// const Users = require('../../../models/User/Users');
import ContainerPost from '../../../models/Post/ContainerPost';
import NormalPost from '../../../models/Post/NormalPost';
import PostLikes from '../../../models/Post/PostLikes';
import LocationService from '../../../Services/locationService';
import APIFeatures from '../../../utils/apiFeatures';
import ErrorHandler from '../../../utils/errorHandler';
import { HttpStatusCode } from '../../../enums/httpHeaders';
import { UtilsKeywords } from '../../../enums/utilsEnum';
import CatchAsync from '../../../error/catchAsync';
import PostFilter from '../../../utils/postFilter';
import FileProcessor from '../../../Services/fileProcessing/fileProcessorService';
import { socioGeneralResponse } from '../../../utils/responses';

/*
    Index:
        01) 🔥 New Post
        02) 🔥 New Poll
        03) 🔥 New Survey
        04) ⛈️ Users All Posts
        05) ⛈️ User Single Post
        06) ⛈️ User All My Post
*/

// ⏰Time Format Function
function convertStringToDateTime(timeString) {
    try {
        // Extract hour, minute, and meridian (AM or PM)
        const [hour, minute, meridian] = timeString.split(':');
        const parsedHour = parseInt(hour, 10);
        const parsedMinute = parseInt(minute, 10);

        if (isNaN(parsedHour) || isNaN(parsedMinute)) {
            throw new Error("Invalid time format. Please use HH:MM[AM|PM].");
        }

        // Adjust hour for 12-hour format
        let adjustedHour = parsedHour;
        if (meridian === 'PM' && adjustedHour !== 12) {
            adjustedHour += 12;
        } else if (meridian === 'AM' && adjustedHour === 12) {
            adjustedHour = 0;
        }
        let currentTime = new Date();
        let currentYear = currentTime.getFullYear();
        let currentMonth = currentTime.getMonth();
        let currentDate = currentTime.getDate();

        // Create a JavaScript Date object
        return new Date(currentYear, currentMonth, currentDate, adjustedHour, parsedMinute); // Replace with actual date if needed
    } catch (error) {
        throw error; // Re-throw the error for handling in the calling code
    }
}

// 🅿️🔥✅ 01) ---- NEW POST ----
export const socio_User_Account_New_Post = CatchAsync(async (req, res, next) => {

    // Destructuring data
    const { postLocation, likeAllowed, commentAllowed, onlyWith } = req.body;

    // Checking if all fields provided
    if (typeof postLocation !== 'boolean' && typeof postLocation !== 'string' || !['true', 'false'].includes(postLocation.toLowerCase())) {
        return next(new ErrorHandler(`Please provide correct details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (typeof likeAllowed !== 'boolean' && typeof likeAllowed !== 'string' || !['true', 'false'].includes(likeAllowed.toLowerCase())) {
        return next(new ErrorHandler(`Please provide correct details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (typeof commentAllowed !== 'boolean' && typeof commentAllowed !== 'string' || !['true', 'false'].includes(commentAllowed.toLowerCase())) {
        return next(new ErrorHandler(`Please provide correct details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (onlyWith && !Array.isArray(onlyWith) && onlyWith.length< 1) {
        return next(new ErrorHandler(`Provide at least one user to with him!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking for private post
    if (req.body.onlyWith) {
    }

    // Checking location service
    if (req.body.postLocation.toLowerCase() === 'true' || req.body.postLocation === true) {
        let geoData = req.body.coordinates.split(',');
        req.body.coordinates = geoData
        if (!req.body.coordinates || !req.body.coordinates[0] || !req.body.coordinates[1]) return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        const isLoc = await LocationService.get_Coordinates_Details(req.body.coordinates[0], req.body.coordinates[1])
        if (!isLoc.country) return next(new ErrorHandler(`Something went wrong in location coordinates!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        req.body.address = isLoc.address.toLowerCase();
        req.body.city = isLoc.city.toLowerCase();
        req.body.latitude = isLoc.latitude;
        req.body.longitude = isLoc.longitude;
        req.body.country = isLoc.country.toLowerCase();
    }

    // Checking for image and video
    if (req.files && req.files.postAssets) {
        const processedFileResponse = await FileProcessor(req.files.postAssets, `socio/user/${req.user.id}/posts`, req.user.id.toString());
        if (!processedFileResponse.success) {
            return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
        } else {
            req.body.postAssets = processedFileResponse.results;
        }
    }

    // Creating new post
    let newPost = await ContainerPost.create({
        author: req.user.id,
        onlyWith: onlyWith,
        postType: 'post',
        address: req.body.address || undefined,
        city: req.body.city || undefined,
        country: req.body.country || 'world',
        likeAllowed: req.body.likeAllowed,
        commentAllowed: req.body.commentAllowed,
        location: req.body.postLocation ? { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] } : undefined,
    }).catch((err) => console.log(err.toString()));

    // Catching error encounter 
    if (!newPost) return next(new ErrorHandler(`Either post type or visibility input not provided!`, HttpStatusCode.UNPROCESSABLE_ENTITY));

    // Create Post
    let isPost = await NormalPost.create({
        containerPost: newPost._id,
        postTitle: req.body.postTitle ? req.body.postTitle : req.body.postTitle,
        postSummary: req.body.postSummary ? req.body.postSummary : undefined,
        postAssets: req.body.postAssets ? req.body.postAssets : undefined,
    }).catch((err) => console.log(err.toString()));

    if (!isPost) {
        await ContainerPost.findByIdAndDelete({ _id: newPost._id })
        return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Saving reference
    newPost.normalPost = isPost._id;
    await newPost.save();

    // Sending response
    socioGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Post created successfully!`
    })
});

// 🅿️🔥✅ 02) ---- NEW POLL ----
export const socio_User_Account_New_Poll = CatchAsync(async (req, res, next) => {

    // Destructuring data
    const { postLocation, likeAllowed, commentAllowed, onlyWith } = req.body;

    // Checking if all fields provided
    if (typeof postLocation !== 'boolean' && typeof postLocation !== 'string' || !['true', 'false'].includes(postLocation.toLowerCase())) {
        return next(new ErrorHandler(`Please provide correct details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (typeof likeAllowed !== 'boolean' && typeof likeAllowed !== 'string' || !['true', 'false'].includes(likeAllowed.toLowerCase())) {
        return next(new ErrorHandler(`Please provide correct details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (typeof commentAllowed !== 'boolean' && typeof commentAllowed !== 'string' || !['true', 'false'].includes(commentAllowed.toLowerCase())) {
        return next(new ErrorHandler(`Please provide correct details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (onlyWith && !Array.isArray(onlyWith) && onlyWith.length< 1) {
        return next(new ErrorHandler(`Provide at least one user to with him!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking for private post
    if (req.body.onlyWith) {
    }

    // Checking location service
    if (req.body.postLocation.toLowerCase() === 'true' || req.body.postLocation === true) {
        let geoData = req.body.coordinates.split(',');
        req.body.coordinates = geoData
        if (!req.body.coordinates || !req.body.coordinates[0] || !req.body.coordinates[1]) return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        const isLoc = await LocationService.get_Coordinates_Details(req.body.coordinates[0], req.body.coordinates[1])
        if (!isLoc.country) return next(new ErrorHandler(`Something went wrong in location coordinates!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        req.body.address = isLoc.address.toLowerCase();
        req.body.city = isLoc.city.toLowerCase();
        req.body.latitude = isLoc.latitude;
        req.body.longitude = isLoc.longitude;
        req.body.country = isLoc.country.toLowerCase();
    }

    // Checking for image and video
    if (req.files && req.files.postAssets) {
        const processedFileResponse = await FileProcessor(req.files.postAssets, `socio/user/${req.user.id}/posts`, req.user.id.toString());
        if (!processedFileResponse.success) {
            return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
        } else {
            req.body.postAssets = processedFileResponse.results;
        }
    }

    // Creating new post
    let newPost = await ContainerPost.create({
        author: req.user.id,
        onlyWith: onlyWith,
        postType: 'post',
        address: req.body.address || undefined,
        city: req.body.city || undefined,
        country: req.body.country || 'world',
        likeAllowed: req.body.likeAllowed,
        commentAllowed: req.body.commentAllowed,
        location: req.body.postLocation ? { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] } : undefined,
    }).catch((err) => console.log(err.toString()));

    // Catching error encounter 
    if (!newPost) return next(new ErrorHandler(`Either post type or visibility input not provided!`, HttpStatusCode.UNPROCESSABLE_ENTITY));

    // Create Post
    let isPost = await NormalPost.create({
        containerPost: newPost._id,
        postTitle: req.body.postTitle ? req.body.postTitle : req.body.postTitle,
        postSummary: req.body.postSummary ? req.body.postSummary : undefined,
        postAssets: req.body.postAssets ? req.body.postAssets : undefined,
    }).catch((err) => console.log(err.toString()));

    if (!isPost) {
        await ContainerPost.findByIdAndDelete({ _id: newPost._id })
        return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Saving reference
    newPost.normalPost = isPost._id;
    await newPost.save();

    // Sending response
    socioGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Post created successfully!`
    })
});

// 🅿️🔥✅ 03) ---- NEW Survey ----
export const socio_User_Account_New_Survey = CatchAsync(async (req, res, next) => {

    // Destructuring data
    const { postLocation, likeAllowed, commentAllowed, onlyWith } = req.body;

    // Checking if all fields provided
    if (typeof postLocation !== 'boolean' && typeof postLocation !== 'string' || !['true', 'false'].includes(postLocation.toLowerCase())) {
        return next(new ErrorHandler(`Please provide correct details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (typeof likeAllowed !== 'boolean' && typeof likeAllowed !== 'string' || !['true', 'false'].includes(likeAllowed.toLowerCase())) {
        return next(new ErrorHandler(`Please provide correct details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (typeof commentAllowed !== 'boolean' && typeof commentAllowed !== 'string' || !['true', 'false'].includes(commentAllowed.toLowerCase())) {
        return next(new ErrorHandler(`Please provide correct details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (onlyWith && !Array.isArray(onlyWith) && onlyWith.length< 1) {
        return next(new ErrorHandler(`Provide at least one user to with him!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking for private post
    if (req.body.onlyWith) {
    }

    // Checking location service
    if (req.body.postLocation.toLowerCase() === 'true' || req.body.postLocation === true) {
        let geoData = req.body.coordinates.split(',');
        req.body.coordinates = geoData
        if (!req.body.coordinates || !req.body.coordinates[0] || !req.body.coordinates[1]) return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        const isLoc = await LocationService.get_Coordinates_Details(req.body.coordinates[0], req.body.coordinates[1])
        if (!isLoc.country) return next(new ErrorHandler(`Something went wrong in location coordinates!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        req.body.address = isLoc.address.toLowerCase();
        req.body.city = isLoc.city.toLowerCase();
        req.body.latitude = isLoc.latitude;
        req.body.longitude = isLoc.longitude;
        req.body.country = isLoc.country.toLowerCase();
    }

    // Checking for image and video
    if (req.files && req.files.postAssets) {
        const processedFileResponse = await FileProcessor(req.files.postAssets, `socio/user/${req.user.id}/posts`, req.user.id.toString());
        if (!processedFileResponse.success) {
            return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
        } else {
            req.body.postAssets = processedFileResponse.results;
        }
    }

    // Creating new post
    let newPost = await ContainerPost.create({
        author: req.user.id,
        onlyWith: onlyWith,
        postType: 'post',
        address: req.body.address || undefined,
        city: req.body.city || undefined,
        country: req.body.country || 'world',
        likeAllowed: req.body.likeAllowed,
        commentAllowed: req.body.commentAllowed,
        location: req.body.postLocation ? { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] } : undefined,
    }).catch((err) => console.log(err.toString()));

    // Catching error encounter 
    if (!newPost) return next(new ErrorHandler(`Either post type or visibility input not provided!`, HttpStatusCode.UNPROCESSABLE_ENTITY));

    // Create Post
    let isPost = await NormalPost.create({
        containerPost: newPost._id,
        postTitle: req.body.postTitle ? req.body.postTitle : req.body.postTitle,
        postSummary: req.body.postSummary ? req.body.postSummary : undefined,
        postAssets: req.body.postAssets ? req.body.postAssets : undefined,
    }).catch((err) => console.log(err.toString()));

    if (!isPost) {
        await ContainerPost.findByIdAndDelete({ _id: newPost._id })
        return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Saving reference
    newPost.normalPost = isPost._id;
    await newPost.save();

    // Sending response
    socioGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Post created successfully!`
    })
});

// 🅿️⛈️✅ 04) ---- USERS ALL POSTS ----
export const socio_User_Account_All_Posts = CatchAsync(async (req, res, next) => {

    // Pagination Query
    let pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

    // MongoDB Query Filter
    let postsQuery = {
        $and: [
            { ownerType: 'user' },
            { postVisibility: 'public' },
            { postType: 'normal' },
        ]
    };

    // Fetching  all my posts counts
    const getCounts = await ContainerPost.countDocuments(postsQuery)

    // Fetching user post 
    const apiFeature = new APIFeatures(ContainerPost.find(postsQuery)
        .select('+address')
        .populate('normalPost')
        .populate({
            path: 'postOwner',
            select: 'userAccount businessAccount +role +hasBusiness',
            populate: ([
                {
                    path: 'userAccount',
                    select: 'firstname lastname profilePicture'
                },
                {
                    path: 'businessAccount',
                    select: 'name profilePicture'
                }
            ])
        })
        .sort({ createdAt: -1 })
        , req.query).pagination(pageLimit)
    const isPost = await apiFeature.query;

    // Checking if post exist
    if (!isPost || isPost.length === 0) return next(new ErrorHandler(`No posts found!`, HttpStatusCode.SUCCESS));

    const isLiked = await PostLikes.findOne({ user: req.user.id }).catch((err) => console.log(err));
    let user = {
        id: req.user.id,
        postArray: isLiked?.posts ? isLiked.posts : undefined
    }

    // Filter
    const result = PostFilter.allPostFilterAndRestructure(isPost, user);

    // Sending response
    socioGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `All feeds`,
        length: getCounts,
        feeds: result
    })
});

// 🅿️⛈️✅ 05) ---- USER SINGLE POST ----
export const socio_User_Account_Single_Post = CatchAsync(async (req, res, next) => {
});

// 🅿️⛈️✅ 06) ---- USER ALL MY POST ----
export const socio_User_Account_My_Posts = CatchAsync(async (req, res, next) => {
});
