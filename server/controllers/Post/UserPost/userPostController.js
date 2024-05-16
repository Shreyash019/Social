import Users from '../../../models/User/Users';
import PostDataContainer from '../../../models/Post/PostDataContainer';
import EventDataContainer from '../../../models/Post/EventDataContainer'
import PostLikes from '../../../models/Post/PostLikes';
import Questions from '../../../models/Post/Questions';
import BookMarkedPosts from '../../../models/Post/QueriesAndReports/BookMarkedPosts';
import LocationService from '../../../Services/locationService';
import APIFeatures from '../../../utils/apiFeatures';
import ErrorHandler from '../../../utils/errorHandler';
import { HttpStatusCode } from '../../../enums/httpHeaders';
import { UtilsKeywords } from '../../../enums/utilsEnum';
import CatchAsync from '../../../error/catchAsync';
import responseMSG from '../../../utils/responses';
import FileProcessor from '../../../Services/fileProcessing/fileProcessorService';
import { convertStringToDateTime, generateEventUniqueID } from '../../../Services/TimeFormatService';
import { PostFilteringAndRestructuring } from '../../../Services/PostResponses/postResponses';

/*
    Index:
        02) 🔥 User New Post
        03) 🔥 User New Post Event
        04) ⛈️ (GENERAL) Users Public Posts
        05) ⛈️ (GENERAL) Users Private Posts
        06) ⛈️ (Event) Users Public Posts
        07) ⛈️ (Event) Users Private Posts
*/

// 🅿️🔥✅ 02) ---- (GENERAL) NEW PUBLIC POST ----
export const social_Media_User_New_Post = CatchAsync(async (req, res, next) => {

    // Destructuring data
    const { postLocation, likeAllowed, commentAllowed } = req.body;

    // Checking for location details
    if (!postLocation && !postLocation.latitude && !postLocation.longitude) {
        return next(new ErrorHandler(`Please provide correct details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    // Checking for if like allowed or not
    if (typeof likeAllowed !== 'boolean' && typeof likeAllowed !== 'string') {
        return next(new ErrorHandler(`Provide details whether like allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    } else if (typeof likeAllowed === 'string' && !['true', 'false'].includes(likeAllowed.toLowerCase())) {
        return next(new ErrorHandler(`Provide details whether like allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    // Checking for if comment allowed or not
    if (typeof commentAllowed !== 'boolean' && typeof commentAllowed !== 'string') {
        return next(new ErrorHandler(`Provide details whether comment allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    } else if (typeof commentAllowed === 'string' && !['true', 'false'].includes(commentAllowed.toLowerCase())) {
        return next(new ErrorHandler(`Provide details whether comment allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    if (req.body.postSummary && req.body.postSummary.length > 800) {
        return next(new ErrorHandler(`Summary should not be more than 800 character long!`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    }

    // Checking location service
    if (postLocation && postLocation.latitude && postLocation.longitude) {

        const isLoc = await LocationService.get_Coordinates_Details(postLocation.latitude, postLocation.longitude)
        if (!isLoc.country) return next(new ErrorHandler(`Something went wrong in location coordinates!`, HttpStatusCode.FORBIDDEN));
        if (isLoc.address) req.body.address = isLoc.address.toLowerCase();
        if (isLoc.city) req.body.city = isLoc.city.toLowerCase();
        req.body.country = isLoc.country.toLowerCase();

    }

    // Checking for image and video
    let postAssets = [];
    if (req.files && req.files.postAssets) {
        const processedFileResponse = await FileProcessor(req.files.postAssets, `eventsZar/customer/${req.user.id}/posts`, req.user.id.toString());
        if (!processedFileResponse.success) {
            return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
        } else {
            postAssets = processedFileResponse.results;
        }
    }

    // Creating new post
    try{
        await PostDataContainer.create({
            postOwner: req.user.id,
            postType: 'general',
            postVisibility: req.body.postVisibility ?? 'public',
            postSummary: req.body.postSummary ? req.body.postSummary.toLowerCase() : undefined,
            postAssets: postAssets.length > 0 ? postAssets : undefined,
            address: req.body.address || undefined,
            city: req.body.city || undefined,
            country: req.body.country ?? undefined,
            likeAllowed: req.body.likeAllowed,
            commentAllowed: req.body.commentAllowed,
            location: req.body.longitude && req.body.latitude ? { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] } : { type: 'Point', coordinates: [0, 0] },
            isPostActive: true
        })
    } catch(error){
        return next(new ErrorHandler(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Sending response
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `Post created successfully!`
    });
})

// 🅿️🔥✅ 03) ---- (EVENT) USER NEW PUBLIC POST ----
export const social_Media_User_New_Event_Creation = CatchAsync(async (req, res, next) => {

    // Destructuring the request body
    const { postCategory, postSubCategory, postTitle, postLocation, eventType, startDate, startTime, endDate, endTime } = req.body;

    // Checking if all fields provided
    if (!postCategory || !postSubCategory || !postTitle || !eventType || !startDate || !startTime || !endDate || !endTime) {
        return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    // Checking for location details
    if (typeof postLocation !== 'boolean' && typeof postLocation !== 'string') {
        return next(new ErrorHandler(`Please provide correct details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    } else if (typeof postLocation === 'string' && !['true', 'false'].includes(postLocation.toLowerCase())) {
        return next(new ErrorHandler(`Please provide current location!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking for location details
    if (typeof req.body.eventType !== 'string') {
        return next(new ErrorHandler(`Provide event type detail!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    } else if (typeof req.body.eventType === 'string' && !['physical', 'virtual'].includes(req.body.eventType.toLowerCase())) {
        return next(new ErrorHandler(`Provide event type detail!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking if link provided for virtual event
    if (req.body.eventType.toLowerCase() === 'virtual') {
        if (!req.body.eventLink) return next(new ErrorHandler('Please provide event link', HttpStatusCode.UNPROCESSABLE_ENTITY))
    }

    // Check For Post Title and summary
    if (req.body.postTitle && req.body.postTitle.length > 70) {
        return next(new ErrorHandler(`Title should not be more than 70 character long!`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    }
    if (req.body.postSummary && req.body.postSummary.length > 800) {
        return next(new ErrorHandler(`Summary should not be more than 800 character long!`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    }

    // Checking for private post
    let groupExist = undefined;
    if (req.body.groupID) {
        try {
            const isGroup = await UserGroups.findById({ _id: req.body.groupID });
            if (!isGroup) {
                return next(new ErrorHandler(`Tagged group not found`, HttpStatusCode.NOT_FOUND));
            } else {
                groupExist = isGroup;
            }
        } catch (err) {
            return next(new ErrorHandler(`Tagged group not found`, HttpStatusCode.NOT_FOUND));
        }
    }

    // Checking location service
    if (typeof req.body.postLocation === 'string' && req.body.postLocation.toLowerCase() === 'true' || req.body.postLocation === true) {
        if (req.body.coordinates) {
            if (!Array.isArray(req.body.coordinates)) {
                let geoData = req.body.coordinates.split(',');
                req.body.coordinates = geoData;
            }
            if (!req.body.coordinates || !req.body.coordinates[0] || !req.body.coordinates[1]) return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
            const isLoc = await LocationService.get_Coordinates_Details(req.body.coordinates[0], req.body.coordinates[1])
            if (!isLoc.country) return next(new ErrorHandler(`Something went wrong in location coordinates!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
            if (isLoc.address) req.body.address = isLoc.address.toLowerCase();
            if (isLoc.city) req.body.city = isLoc.city.toLowerCase();
            if (isLoc.latitude) req.body.latitude = isLoc.latitude;
            if (isLoc.longitude) req.body.longitude = isLoc.longitude;
            req.body.country = isLoc.country.toLowerCase();
        }
    }

    // Checking for image and video
    let postAssets = [];
    if (req.files && req.files.postAssets) {
        const processedFileResponse = await FileProcessor(req.files.postAssets, `eventsZar/customer/${req.user.id}/posts`, req.user.id.toString());
        if (!processedFileResponse.success) {
            return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
        } else {
            postAssets = processedFileResponse.results;
        }
    }

    // Formatting date to be used in the database
    let eventStartTime = convertStringToDateTime(req.body.startDate, req.body.startTime);
    let eventEndTime = convertStringToDateTime(req.body.endDate, req.body.endTime);
    const eventUniqueID = generateEventUniqueID('customer');

    // Creating new post
    let newPost = await PostDataContainer.create({
        postOwner: req.user.id,
        ownerType: 'customer',
        postType: 'event',
        postVisibility: req.body.groupID ? 'private' : 'public',
        postCategory: req.body.postCategory.toLowerCase(),
        postSubCategory: req.body.postSubCategory.toLowerCase(),
        address: req.body.address || undefined,
        city: req.body.city || undefined,
        country: req.body.country || 'world',
        taggedGroup: req.body.groupID ? groupExist._id : undefined,
        privateMembers: req.body.groupID ? groupExist.groupMembers : undefined,
        expireDate: eventEndTime,
        location: req.body.longitude && req.body.latitude ? { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] } : { type: 'Point', coordinates: [0, 0] },
        isPostActive: true
    }).catch((err) => console.log(err.toString()));

    // Catching error encounter 
    if (!newPost) return next(new ErrorHandler(`Either post type or visibility input not provided!`, HttpStatusCode.UNPROCESSABLE_ENTITY));

    // Event Creation
    let isPost = await EventDataContainer.create({
        eventUniqueID: eventUniqueID,
        PostDataContainer: newPost._id,
        eventType: req.body.eventType.toLowerCase(),
        postTitle: req.body.postTitle.toLowerCase(),
        postSummary: req.body.postSummary.toLowerCase(),
        startDate: req.body.startDate,
        startTime: eventStartTime,
        endDate: req.body.endDate,
        endTime: eventEndTime,
        freePass: req.body.freePass.toLowerCase() === 'yes' ? true : false,
        moreInformation: req.body.moreInformation ? req.body.moreInformation : undefined,
        eventLink: req.body.eventType.toLowerCase() === 'virtual' ? req.body.eventLink : undefined,
        postAssets: postAssets.length > 0 ? postAssets : undefined,
    }).catch((err) => console.log(err.toString()));

    if (!isPost) {
        await PostDataContainer.findByIdAndDelete({ _id: newPost._id });
        return next(new ErrorHandler(`The specified user group does not exist.`, HttpStatusCode.NOT_FOUND));
    }

    // Saving reference
    newPost.eventPost = isPost._id;
    await newPost.save();

    // Sending response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Event created Successfully!`
    })
})

// 🅱️🔥✅ 04) ---- (POLL) USER NEW PUBLIC POST ----
export const social_Media_User_New_Poll_Creation = CatchAsync(async (req, res, next) => {

    // Error Catcher
    let errorOccur = false;
    let createdPost = {
        PostDataContainer: undefined,
        surveyPost: undefined,
        questionnaire: undefined
    }
    // Destructuring the request body
    const { postCategory, postSubCategory, postLocation, questions } = req.body;

    // Checking if all fields provided with correct format
    if (!postCategory || !postSubCategory || !questions) {
        return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking for location details
    if (typeof postLocation !== 'boolean' && typeof postLocation !== 'string') {
        return next(new ErrorHandler(`Please provide correct details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    } else if (typeof postLocation === 'string' && !['true', 'false'].includes(postLocation.toLowerCase())) {
        return next(new ErrorHandler(`Please provide current location!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    // // Checking for if like allowed or not
    // if (typeof likeAllowed !== 'boolean' && typeof likeAllowed !== 'string') {
    //     return next(new ErrorHandler(`Provide details whether like allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    // } else if (typeof likeAllowed === 'string' && !['true', 'false'].includes(likeAllowed.toLowerCase())) {
    //     return next(new ErrorHandler(`Provide details whether like allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    // }
    // // Checking for if comment allowed or not
    // if (typeof commentAllowed !== 'boolean' && typeof commentAllowed !== 'string') {
    //     return next(new ErrorHandler(`Provide details whether comment allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    // } else if (typeof commentAllowed === 'string' && !['true', 'false'].includes(commentAllowed.toLowerCase())) {
    //     return next(new ErrorHandler(`Provide details whether comment allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    // }
    if (!questions.length || questions.length > 1) return next(new ErrorHandler(`Please provide all details in correct format!`, HttpStatusCode.UNPROCESSABLE_ENTITY));

    // Checking for duplicate questions and options
    let formattedQuestions = [];
    let checkQuestions = [];
    for (let i = 0; i < questions.length; i++) {
        if (!questions[i].questionType && !questions[i].questionText && !questions[i].questionOptions) {
            return next(new ErrorHandler(`Please provide all details in correct format!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        } else {
            let canPush = true;
            if (checkQuestions.length === 0) {
                canPush = true;
            }
            else {
                checkQuestions.forEach((data) => {
                    let isFQOptions = data.questionOptions.join('')
                    let isQQptions = questions[i].questionOptions.join('')
                    if (data.questionType === questions[i].questionType.toLowerCase() && data.questionText.toLowerCase() === questions[i].questionText.toLowerCase() && isFQOptions === isQQptions) {
                        canPush = false;
                    }
                })
            }
            let temp = {
                questionType: questions[i].questionType.toLowerCase(),
                questionText: questions[i].questionText,
                questionOptions: questions[i].questionOptions.map((opt, index) => {
                    let objKey = index
                    // let temp = { [objKey]: opt }
                    // For Responses
                    let temp = { [objKey]: opt, users: [] }
                    return temp;
                }),
            }
            if (canPush) {
                checkQuestions.push({
                    questionType: questions[i].questionType.toLowerCase(),
                    questionText: questions[i].questionText,
                    questionOptions: questions[i].questionOptions
                })
                formattedQuestions.push(temp)
            };
        }
    }

    // Checking location service
    if (typeof req.body.postLocation === 'string' && req.body.postLocation.toLowerCase() === 'true' || req.body.postLocation === true) {
        if (req.body.coordinates) {
            if (!Array.isArray(req.body.coordinates)) {
                let geoData = req.body.coordinates.split(',');
                req.body.coordinates = geoData;
            }
            if (!req.body.coordinates || !req.body.coordinates[0] || !req.body.coordinates[1]) return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
            const isLoc = await LocationService.get_Coordinates_Details(req.body.coordinates[0], req.body.coordinates[1])
            if (!isLoc.country) return next(new ErrorHandler(`Something went wrong in location coordinates!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
            if (isLoc.address) req.body.address = isLoc.address.toLowerCase();
            if (isLoc.city) req.body.city = isLoc.city.toLowerCase();
            if (isLoc.latitude) req.body.latitude = isLoc.latitude;
            if (isLoc.longitude) req.body.longitude = isLoc.longitude;
            req.body.country = isLoc.country.toLowerCase();
        }
    }

    // Checking for image and video
    let postAssets = [];
    if (req.files && req.files.postAssets) {
        const processedFileResponse = await FileProcessor(req.files.postAssets, `eventsZar/business/${req.user.id}/posts`, req.user.id.toString());
        if (!processedFileResponse.success) {
            return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
        } else {
            postAssets = processedFileResponse.results;
        }
    }

    // Checking for private post
    let groupExist = undefined;
    if (req.body.groupID) {
        try {
            const isGroup = await UserGroups.findById({ _id: req.body.groupID });
            if (!isGroup) {
                return next(new ErrorHandler(`Tagged group not found`, HttpStatusCode.NOT_FOUND));
            } else {
                groupExist = isGroup;
            }
        } catch (err) {
            return next(new ErrorHandler(`Tagged group not found`, HttpStatusCode.NOT_FOUND));
        }
    }

    // Container Object
    const containerObject = {
        postOwner: req.user.id,
        ownerType: 'customer',
        postType: 'poll',
        postVisibility: req.body.groupID && groupExist ? 'private' : 'public',
        postCategory: req.body.postCategory.toLowerCase(),
        postSubCategory: req.body.postSubCategory.toLowerCase(),
        address: req.body.address || undefined,
        city: req.body.city || undefined,
        country: req.body.country || 'world',
        likeAllowed: false,
        commentAllowed: false,
        likeCommentHide: true,
        privateMembers: req.body.groupID && groupExist ? groupExist.groupMembers : undefined,
        taggedGroup: req.body.groupID && groupExist ? req.body.groupID : undefined,
        location: req.body.longitude && req.body.latitude ? { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] } : { type: 'Point', coordinates: [0, 0] },
        isPostActive: true
    }

    try {
        createdPost.PostDataContainer = await PostDataContainer.create(containerObject);
    } catch (error) {
        // Handle the error here
        errorOccur = true;
    }

    // // Survey Object
    const surveyPost = {
        PostDataContainer: createdPost.PostDataContainer._id,
        postTitle: undefined,
        // postTitle: req.body.postTitle.toLowerCase(),
        postSummary: undefined,
        // postSummary: req.body.postSummary.toLowerCase(),
        startDate: undefined,
        endDate: undefined,
        // startDate: req.body.startDate,
        // endDate: req.body.endDate,
        responses: [],
        moreInformation: req.body.moreInformation ? req.body.moreInformation : undefined,
        postAssets: postAssets
    }

    try {
        createdPost.surveyPost = await SurveyPost.create(surveyPost);
    } catch (error) {
        // Handle the error here
        errorOccur = true;
    }

    // Questions Object
    const questionObject = {
        surveyPost: createdPost.surveyPost._id,
        questions: formattedQuestions
    }
    try {
        createdPost.questionnaire = await Questions.create(questionObject);
        await createdPost.questionnaire.save();
    } catch (error) {
        errorOccur = true;
    }

    // Saving each other references
    if (errorOccur) {
        if (createdPost.PostDataContainer) {
            await PostDataContainer.findByIdAndDelete({ _id: createdPost.PostDataContainer._id })
        }
        if (createdPost.surveyPost) {
            await SurveyPost.findByIdAndDelete({ _id: createdPost.surveyPost._id })
        }
        if (createdPost.questionnaire) {
            await Questions.findByIdAndDelete({ _id: createdPost.questionnaire._id })
        }
        return next(new ErrorHandler(`Something went wrong while saving, It may be due to some input field mismatch or wrong input type`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    } else {
        createdPost.surveyPost.questions = createdPost.questionnaire._id;
        await createdPost.surveyPost.save();
        createdPost.PostDataContainer.surveyPost = createdPost.surveyPost._id;
        await createdPost.PostDataContainer.save();
    }

    // Sending Response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Poll Post created Successfully!`,
        createdPost
    })
})

// 🅱️🔥✅ 05) ---- (SURVEY) BUSINESS NEW PUBLIC POST ----
export const social_Media_User_New_Survey_Creation = CatchAsync(async (req, res, next) => {

    // Error Catcher
    let errorOccur = false;
    let createdPost = { PostDataContainer: undefined, surveyPost: undefined, questionnaire: undefined }
    // Destructuring the request body
    const { postCategory, postSubCategory, postLocation, questions } = req.body;

    // Checking if all fields provided with correct format
    if (!postCategory || !postSubCategory || !questions) {
        return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    // Checking for location details
    if (typeof postLocation !== 'boolean' && typeof postLocation !== 'string') {
        return next(new ErrorHandler(`Please provide correct details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    } else if (typeof postLocation === 'string' && !['true', 'false'].includes(postLocation.toLowerCase())) {
        return next(new ErrorHandler(`Please provide current location!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // // Checking for if like allowed or not
    // if (typeof likeAllowed !== 'boolean' && typeof likeAllowed !== 'string') {
    //     return next(new ErrorHandler(`Provide details whether like allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    // } else if (typeof likeAllowed === 'string' && !['true', 'false'].includes(likeAllowed.toLowerCase())) {
    //     return next(new ErrorHandler(`Provide details whether like allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    // }
    // // Checking for if comment allowed or not
    // if (typeof commentAllowed !== 'boolean' && typeof commentAllowed !== 'string') {
    //     return next(new ErrorHandler(`Provide details whether comment allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    // } else if (typeof commentAllowed === 'string' && !['true', 'false'].includes(commentAllowed.toLowerCase())) {
    //     return next(new ErrorHandler(`Provide details whether comment allowed or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    // }
    if (!questions.length) {
        return next(new ErrorHandler(`Please provide all details in correct format!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking for duplicate questions and options
    let formattedQuestions = [];
    let checkQuestions = [];
    for (let i = 0; i < questions.length; i++) {
        if (!questions[i].questionType && !questions[i].questionText && !questions[i].questionOptions) {
            return next(new ErrorHandler(`Please provide all details in correct format!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        } else {
            let canPush = true;
            if (checkQuestions.length === 0) {
                canPush = true;
            }
            else {
                checkQuestions.forEach((data) => {
                    let isFQOptions = data.questionOptions.join('')
                    let isQQptions = questions[i].questionOptions.join('')
                    if (data.questionType === questions[i].questionType.toLowerCase() && data.questionText.toLowerCase() === questions[i].questionText.toLowerCase() && isFQOptions === isQQptions) {
                        canPush = false;
                    }
                })
            }
            let temp = {
                questionType: questions[i].questionType.toLowerCase(),
                questionText: questions[i].questionText,
                questionOptions: questions[i].questionOptions.map((opt, index) => {
                    let objKey = index
                    // let temp = { [objKey]: opt }
                    // For Responses
                    let temp = { [objKey]: opt, users: [] }
                    return temp
                }),
            }
            if (canPush) {
                checkQuestions.push({
                    questionType: questions[i].questionType.toLowerCase(),
                    questionText: questions[i].questionText,
                    questionOptions: questions[i].questionOptions
                })
                formattedQuestions.push(temp)
            };
        }
    }

    // Checking for private post
    let groupExist = undefined;
    if (req.body.groupID) {
        try {
            const isGroup = await UserGroups.findById({ _id: req.body.groupID });
            if (!isGroup) {
                return next(new ErrorHandler(`Tagged group not found`, HttpStatusCode.NOT_FOUND));
            } else {
                groupExist = isGroup;
            }
        } catch (err) {
            return next(new ErrorHandler(`Tagged group not found`, HttpStatusCode.NOT_FOUND));
        }
    }

    // Checking location service
    if (typeof req.body.postLocation === 'string' && req.body.postLocation.toLowerCase() === 'true' || req.body.postLocation === true) {
        if (req.body.coordinates) {
            if (!Array.isArray(req.body.coordinates)) {
                let geoData = req.body.coordinates.split(',');
                req.body.coordinates = geoData;
            }
            if (!req.body.coordinates || !req.body.coordinates[0] || !req.body.coordinates[1]) return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
            const isLoc = await LocationService.get_Coordinates_Details(req.body.coordinates[0], req.body.coordinates[1])
            if (!isLoc.country) return next(new ErrorHandler(`Something went wrong in location coordinates!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
            if (isLoc.address) req.body.address = isLoc.address.toLowerCase();
            if (isLoc.city) req.body.city = isLoc.city.toLowerCase();
            if (isLoc.latitude) req.body.latitude = isLoc.latitude;
            if (isLoc.longitude) req.body.longitude = isLoc.longitude;
            req.body.country = isLoc.country.toLowerCase();
        }
    }

    // Checking for image and video
    let postAssets = [];
    if (req.files && req.files.postAssets) {
        const processedFileResponse = await FileProcessor(req.files.postAssets, `eventsZar/customer/${req.user.id}/posts`, req.user.id.toString());
        if (!processedFileResponse.success) {
            return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
        } else {
            postAssets = processedFileResponse.results;
        }
    }

    // Container Object
    const containerObject = {
        postOwner: req.user.id,
        ownerType: 'customer',
        postType: 'survey',
        postVisibility: req.body.groupID ? 'private' : 'public',
        postCategory: req.body.postCategory.toLowerCase(),
        postSubCategory: req.body.postSubCategory.toLowerCase(),
        address: req.body.address || undefined,
        city: req.body.city || undefined,
        country: req.body.country || 'world',
        likeAllowed: false,
        commentAllowed: false,
        likeCommentHide: true,
        taggedGroup: req.body.groupID ? groupExist._id : undefined,
        privateMembers: req.body.groupID ? groupExist.groupMembers : undefined,
        location: req.body.longitude && req.body.latitude ? { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] } : { type: 'Point', coordinates: [0, 0] },
        isPostActive: true
    }

    try {
        createdPost.PostDataContainer = await PostDataContainer.create(containerObject);
    } catch (error) {
        // Handle the error here
        errorOccur = true;
    }

    // // Survey Object
    const surveyPost = {
        PostDataContainer: createdPost.PostDataContainer._id,
        postTitle: undefined,
        // postTitle: req.body.postTitle.toLowerCase(),
        postSummary: undefined,
        // postSummary: req.body.postSummary.toLowerCase(),
        startDate: undefined,
        endDate: undefined,
        // startDate: req.body.startDate,
        // endDate: req.body.endDate,
        responses: [],
        moreInformation: req.body.moreInformation ? req.body.moreInformation : undefined,
        postAssets: postAssets
    }

    try {
        createdPost.surveyPost = await SurveyPost.create(surveyPost);
    } catch (error) {
        // Handle the error here
        errorOccur = true;
    }

    // Questions Object
    const questionObject = {
        surveyPost: createdPost.surveyPost._id,
        questions: formattedQuestions
    }
    try {
        createdPost.questionnaire = await Questions.create(questionObject);
        await createdPost.questionnaire.save();
    } catch (error) {
        errorOccur = true;
    }

    // Saving each other references
    if (errorOccur) {
        if (createdPost.PostDataContainer) {
            await PostDataContainer.findByIdAndDelete({ _id: createdPost.PostDataContainer._id })
        }
        if (createdPost.surveyPost) {
            await SurveyPost.findByIdAndDelete({ _id: createdPost.surveyPost._id })
        }
        if (createdPost.questionnaire) {
            await Questions.findByIdAndDelete({ _id: createdPost.questionnaire._id })
        }
        return next(new ErrorHandler(`Something went wrong while saving, It may be due to some input field mismatch or wrong input type`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    } else {
        createdPost.surveyPost.questions = createdPost.questionnaire._id;
        await createdPost.surveyPost.save();
        createdPost.PostDataContainer.surveyPost = createdPost.surveyPost._id;
        await createdPost.PostDataContainer.save();
    }

    // Sending Response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Survey Post created Successfully!`,
    })
})

// 🅿️⛈️✅ 06) ---- ALL USERS PUBLIC POSTS ----
export const social_Media_All_Public_Posts = CatchAsync(async (req, res, next) => {

    // Fetching user current country
    let userCountry = req.user.country;
    if (req.query?.allLoc) {
        userCountry = req.query.allLoc.toString().toLowerCase() === 'world' ? 'world' : req.user.country;
    }

    // Pagination Query
    let pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

    // MongoDB Query Filter
    let postsQuery = {
        $and: [
            { ownerType: 'customer' },
            { postVisibility: 'public' },
            { postType: { $ne: 'event' } },
            { isEventPost: false },
            { postOwner: { $nin: req.user.blockedUsers } },
            { country: new RegExp(userCountry, 'i') }
        ]
    };

    // Post Filter
    if (req.query.postCategory) {
        postsQuery.$and.push({ postCategory: new RegExp(req.query.postCategory, 'i') })
    }

    if (req.query.postSubCategory) {
        postsQuery.$and.push({ postSubCategory: new RegExp(req.query.postSubCategory, 'i') })
    }

    // Fetching  all my posts counts
    const getCounts = await PostDataContainer.countDocuments(postsQuery)

    // Fetching user post 
    const apiFeature = new APIFeatures(PostDataContainer.find(postsQuery)
        .select('+address')
        .populate('normalPost')
        .populate({
            path: 'surveyPost',
            populate: ({
                path: 'questions responses'
            })
        })
        .populate({
            path: 'postOwner',
            select: 'userAccount businessAccount +role +hasBusiness',
            populate: ([
                {
                    path: 'userAccount',
                    select: 'firstname lastname profilePicture'
                }
            ])
        })
        .sort({ createdAt: -1 })
        , req.query)
        .feedPostSearch()
        .pagination(pageLimit)
    const isPost = await apiFeature.query;

    // Checking if post exist
    if (!isPost || isPost.length === 0) {
        return next(new ErrorHandler(`No posts found!`, HttpStatusCode.SUCCESS));
    }
    const isLiked = await PostLikes.findOne({ user: req.user.id }).catch((err) => console.log(err));

    let user = {
        _id: req.user.id,
        postArray: isLiked?.posts ? isLiked.posts : undefined
    }
    // Fetching User Bookmarked posts
    const bookMarkedPost = await BookMarkedPosts.findOne({ user: req.user.id })
        .catch((err) => console.log(err));
    if (!bookMarkedPost) {
        console.error('Error in fetching bookmarked posts');
    } else {
        user.bookMarkedPost = bookMarkedPost.posts;
    }

    // Filter
    // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
    const result = await PostFilteringAndRestructuring(isPost, user);

    // Sending response
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `All feeds`,
        feedCount: getCounts,
        feeds: result
    })
})

// 🅿️⛈️✅ 07) ---- ALL USERS PRIVATE POSTS ----
export const social_Media_User_All_Private_Posts = CatchAsync(async (req, res, next) => {

    // Fetching user current country
    let userCountry = req.user.country;
    if (req.query?.allLoc) {
        userCountry = req.query.allLoc.toString().toLowerCase() === 'world' ? 'world' : req.user.country;
    }

    // MongoDB Filter Query
    let postsQuery = {
        $or: [
            {
                $and: [
                    { ownerType: 'customer' }, // Public posts
                    { postVisibility: 'private' },
                    // { postType: 'normal' },
                    { postType: { $ne: 'event' } },
                    { privateMembers: { $in: [req.user.id] } },
                    { postOwner: { $nin: req.user.blockedUsers } },
                    { isEventPost: false },
                ]
            },
            {
                $and: [
                    { ownerType: 'customer' }, // Public posts
                    { postVisibility: 'private' },
                    { postType: 'normal' },
                    // { postType: {$ne: 'event'} },
                    { postOwner: req.user.id },
                    { isEventPost: false },
                ]
            }
        ]
    };

    // Post filter
    if (req.query.postCategory) {
        postsQuery.$or[0].$and.push({ postCategory: new RegExp(req.query.postCategory, 'i') })
        postsQuery.$or[1].$and.push({ postCategory: new RegExp(req.query.postCategory, 'i') })
    }

    if (req.query.postSubCategory) {
        postsQuery.$or[0].$and.push({ postSubCategory: new RegExp(req.query.postSubCategory, 'i') })
        postsQuery.$or[1].$and.push({ postSubCategory: new RegExp(req.query.postSubCategory, 'i') })
    }

    // Fetching  all my posts counts
    const getCounts = await PostDataContainer.countDocuments(postsQuery);

    // Pagination Query
    let pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

    // Fetching user post 
    const apiFeature = new APIFeatures(PostDataContainer.find(postsQuery)
        .select("+privateMembers")
        .populate('normalPost')
        .populate({
            path: 'surveyPost',
            populate: ({
                path: 'questions'
            })
        })
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
                    select: 'businessName profilePicture'
                }
            ])
        })
        .sort({ createdAt: -1 })
        , req.query)
        .feedPostSearch()
        .pagination(pageLimit);

    const isPost = await apiFeature.query;

    // Checking if post exist
    if (!isPost || isPost.length === 0) {
        return next(new ErrorHandler(`No posts found!`, HttpStatusCode.SUCCESS));
    }

    const isLiked = await PostLikes.findOne({ user: req.user.id }).catch((err) => console.log(err));
    let user = {
        _id: req.user.id,
        postArray: isLiked?.posts ? isLiked.posts : undefined
    }
    // Fetching User Bookmarked posts
    const bookMarkedPost = await BookMarkedPosts.findOne({ user: req.user.id })
        .catch((err) => console.log(err));
    if (!bookMarkedPost) {
        console.error('Error in fetching bookmarked posts');
    } else {
        user.bookMarkedPost = bookMarkedPost.posts;
    }

    // Filter
    // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
    const result = await PostFilteringAndRestructuring(isPost, user);

    // Sending response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `All Private feeds`,
        feedCount: getCounts,
        feeds: result
    })
})

// 🅿️⛈️✅ 08) ---- All USER's PUBLIC EVENTs ----
export const social_Media_User_All_Public_Events = CatchAsync(async (req, res, next) => {

    // Fetching user current country
    let userCountry = req.user.country;
    if (req.query?.allLoc) {
        userCountry = req.query.allLoc.toString().toLowerCase() === 'world' ? 'world' : req.user.country;
    }

    // MongoDB Query Filter
    let postsQuery = {
        $and: [
            { ownerType: 'customer' }, // Public posts
            { postVisibility: 'public' },
            { postType: 'event' },
            { isEventPost: false },
            { postOwner: { $nin: req.user.blockedUsers } },
            { country: new RegExp(userCountry, 'i') },
        ]
    };

    // Post filter
    if (req.query.city) {
        postsQuery.$and.push({ city: new RegExp(req.query.city, 'i') })
    }

    if (!req.query.seeAll) {
        postsQuery.$and.push({ expireDate: { $gt: new Date() } })
    }
    if (req.query.postCategory) {
        postsQuery.$and.push({ postCategory: new RegExp(req.query.postCategory, 'i') })
    }

    if (req.query.postSubCategory) {
        postsQuery.$and.push({ postSubCategory: new RegExp(req.query.postSubCategory, 'i') })
    }

    // Pagination Query
    let pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

    // Fetch EventPost IDs based on search postTitle
    let eventPostIds = [];
    if (req.query.event) {
        const EventDataContainer = await EventDataContainer.find({ postTitle: new RegExp(req.query.event, 'i') })
            .select('PostDataContainer')
            .limit(pageLimit) // Apply pagination as needed
            .exec();
        eventPostIds = EventDataContainer.map(post => post.PostDataContainer.toString());
        postsQuery.$and.push({ _id: { $in: eventPostIds } })
    }

    // Fetching  all my posts counts
    const getCounts = await PostDataContainer.countDocuments(postsQuery);

    // Fetching user post 
    const apiFeature = new APIFeatures(PostDataContainer.find(postsQuery)
        .select("+address +privateMembers")
        .populate({
            path: 'eventPost',
            select: "+sharedWith +eventUniqueID"
        })
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
                    select: 'businessName profilePicture'
                }
            ])
        })
        .sort({ createdAt: -1 })
        , req.query)
        // .feedPostSearch()
        .pagination(pageLimit)

    const isPost = await apiFeature.query;

    // Checking if post exist
    if (!isPost || isPost.length === 0) {
        return next(new ErrorHandler(`No event posts found!`, HttpStatusCode.SUCCESS))
    }

    const isLiked = await PostLikes.findOne({ user: req.user.id }).catch((err) => console.log(err));
    let user = {
        _id: req.user.id,
        postArray: isLiked?.posts ? isLiked.posts : undefined
    }
    // Fetching User Bookmarked posts
    const bookMarkedPost = await BookMarkedPosts.findOne({ user: req.user.id })
        .catch((err) => console.log(err));
    if (!bookMarkedPost) {
        console.error('Error in fetching bookmarked posts');
    } else {
        user.bookMarkedPost = bookMarkedPost.posts;
    }

    // Filter
    // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
    const result = await PostFilteringAndRestructuring(isPost, user);

    // Sending response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `All Public Events`,
        feedCount: getCounts,
        feeds: result
    })
})

// 🅿️⛈️✅ 09) ---- All USER's PRIVATE EVENTs ----
export const social_Media_User_All_Private_Events = CatchAsync(async (req, res, next) => {

    // Fetching user current country
    let userCountry = req.user.country;
    if (req.query?.allLoc) {
        userCountry = req.query.allLoc.toString().toLowerCase() === 'world' ? 'world' : req.user.country;
    }

    // MongoDB Query Filter
    let postsQuery = {
        $or: [
            {
                $and: [
                    { ownerType: 'customer' },
                    { postVisibility: 'private' },
                    { postType: 'event' },
                    { privateMembers: { $in: [req.user.id] } },
                    { postOwner: { $nin: req.user.blockedUsers } },
                    { isEventPost: false },
                ]
            },
            {
                $and: [
                    { ownerType: 'customer' },
                    { postVisibility: 'private' },
                    { postType: 'event' },
                    { postOwner: req.user.id },
                    { isEventPost: false },
                ]
            }
        ]
    };

    // Post filter
    if (req.query.city) {
        postsQuery.$or[0].$and.push({ city: new RegExp(req.query.city, 'i') })
        postsQuery.$or[1].$and.push({ city: new RegExp(req.query.city, 'i') })
    }

    if (!req.query.seeAll) {
        postsQuery.$or[0].$and.push({ expireDate: { $gt: new Date() } })
        postsQuery.$or[1].$and.push({ expireDate: { $gt: new Date() } })
    }
    if (req.query.postCategory) {
        postsQuery.$or[0].$and.push({ postCategory: new RegExp(req.query.postCategory, 'i') })
        postsQuery.$or[1].$and.push({ postCategory: new RegExp(req.query.postCategory, 'i') })
    }

    if (req.query.postSubCategory) {
        postsQuery.$or[0].$and.push({ postSubCategory: new RegExp(req.query.postSubCategory, 'i') })
        postsQuery.$or[1].$and.push({ postSubCategory: new RegExp(req.query.postSubCategory, 'i') })
    }

    // Pagination Query
    let pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

    // Fetch EventPost IDs based on search postTitle
    let eventPostIds = [];
    if (req.query.event) {
        const EventDataContainer = await EventDataContainer.find({ postTitle: new RegExp(req.query.event, 'i') })
            .select('PostDataContainer')
            .limit(pageLimit) // Apply pagination as needed
            .exec();
        eventPostIds = EventDataContainer.map(post => post.PostDataContainer.toString());
        postsQuery.$or[0].$and.push({ _id: { $in: eventPostIds } })
        postsQuery.$or[1].$and.push({ _id: { $in: eventPostIds } })
    }

    // Fetching  all my posts counts
    const getCounts = await PostDataContainer.countDocuments(postsQuery);


    // Fetching user post 
    const apiFeature = new APIFeatures(PostDataContainer.find(postsQuery)
        .select("+address +privateMembers")
        .populate({
            path: 'eventPost',
            select: "+sharedWith"
        })
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
                    select: 'businessName profilePicture'
                }
            ])
        })
        .sort({ createdAt: -1 })
        , req.query)
        .feedPostSearch()
        .pagination(pageLimit)

    const isPost = await apiFeature.query;

    // Checking if post exist
    if (!isPost || isPost.length === 0) return next(new ErrorHandler(`No posts found!`, HttpStatusCode.SUCCESS));

    const isLiked = await PostLikes.findOne({ user: req.user.id }).catch((err) => console.log(err));
    let user = {
        _id: req.user.id,
        postArray: isLiked?.posts ? isLiked.posts : undefined
    }
    // Fetching User Bookmarked posts
    const bookMarkedPost = await BookMarkedPosts.findOne({ user: req.user.id })
        .catch((err) => console.log(err));
    if (!bookMarkedPost) {
        console.error('Error in fetching bookmarked posts');
    } else {
        user.bookMarkedPost = bookMarkedPost.posts;
    }

    // Filter
    // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
    const result = await PostFilteringAndRestructuring(isPost, user);

    // Sending response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `All Private Events`,
        feedCount: getCounts,
        feeds: result
    })
})

// 🅿️🔥❌ 10) ---- New Post In a Event ----
export const social_Media_New_Post_In_A_Event = CatchAsync(async (req, res, next) => {

    // Destructuring data
    const { ownerType, eventID, postCategory, postSubCategory, postTitle, postLocation } = req.body;

    // Checking if all fields provided
    if (!ownerType || !eventID || !postCategory || !postSubCategory || !postTitle) {
        return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (typeof postLocation !== 'boolean' && typeof postLocation !== 'string' || !['true', 'false'].includes(postLocation.toLowerCase())) {
        return next(new ErrorHandler(`Please provide correct details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    // if (typeof likeAllowed !== 'boolean' && typeof likeAllowed !== 'string' || !['true', 'false'].includes(likeAllowed.toLowerCase())) {
    //     return next(new ErrorHandler(`Please provide correct details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    // }
    // if (typeof commentAllowed !== 'boolean' && typeof commentAllowed !== 'string' || !['true', 'false'].includes(commentAllowed.toLowerCase())) {
    //     return next(new ErrorHandler(`Please provide correct details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    // }
    if (typeof ownerType !== 'string') {
        return next(new ErrorHandler(`Please provide correct details aa!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    } else if (typeof ownerType === 'string' && !['customer', 'business'].includes(ownerType.toLowerCase())) {
        return next(new ErrorHandler(`Please provide correct details nn!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    if (ownerType === "business") {
        const isUserBusiness = await Users.findById({ _id: req.user.id })
            .select('+hasBusiness +isBusinessVerified +isBusinessActive')
            .catch((err) => console.log(err));
        if (!isUserBusiness) {
            return next(new ErrorHandler(`Please try after sometime or login again!`, HttpStatusCode.FORBIDDEN))
        }
        if (!isUserBusiness.hasBusiness) {
            return next(new ErrorHandler(`You don't have a business!`, HttpStatusCode.FORBIDDEN))
        }
        if (isUserBusiness.hasBusiness && !isUserBusiness.isBusinessVerified) {
            return next(new ErrorHandler(`You business is not verified!`, HttpStatusCode.FORBIDDEN))
        }
        if (isUserBusiness.hasBusiness && isUserBusiness.isBusinessVerified && !isUserBusiness.isBusinessActive) {
            return next(new ErrorHandler(`You business account is active as you currently don't have a plan!`, HttpStatusCode.FORBIDDEN))
        }
    }

    // Checking for an event existence
    // const isEventExistAndOpen = await EventDataContainer.findOne({ eventUniqueID: eventID, endDate: { $gt: Date.now() }, endTime: { $gt: Date.now() } });
    const isEventExistAndOpen = await EventDataContainer.findOne({ eventUniqueID: eventID, endTime: { $gt: Date.now() } });

    if (!isEventExistAndOpen) {
        return next(new ErrorHandler(`Event is closed so no new post can be created!`, HttpStatusCode.BAD_REQUEST));
    }

    // Checking location service
    if (req.body.postLocation.toLowerCase() === 'true' || req.body.postLocation === true) {
        if (!Array.isArray(req.body.coordinates)) {
            let geoData = req.body.coordinates.split(',');
            req.body.coordinates = geoData;
        }
        if (!req.body.coordinates || !req.body.coordinates[0] || !req.body.coordinates[1]) return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        const isLoc = await LocationService.get_Coordinates_Details(req.body.coordinates[0], req.body.coordinates[1])
        if (!isLoc.country) return next(new ErrorHandler(`Something went wrong in location coordinates!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        if (isLoc.address) req.body.address = isLoc.address.toLowerCase();
        if (isLoc.city) req.body.city = isLoc.city.toLowerCase();
        if (isLoc.latitude) req.body.latitude = isLoc.latitude;
        if (isLoc.longitude) req.body.longitude = isLoc.longitude;
        req.body.country = isLoc.country.toLowerCase();
    }

    // Checking for image and video
    let postAssets = [];
    if (req.files && req.files.postAssets) {
        const processedFileResponse = await FileProcessor(req.files.postAssets, `eventsZar/customer/${req.user.id}/posts`, req.user.id.toString());
        if (!processedFileResponse.success) {
            return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
        } else {
            postAssets = processedFileResponse.results;
        }
    }

    // Creating new post
    let newPost = await PostDataContainer.create({
        postOwner: req.user.id,
        ownerType: ownerType,
        postType: 'normal',
        postVisibility: 'public',
        // postCategory: req.body.postCategory.toLowerCase(),
        // postSubCategory: req.body.postSubCategory.toLowerCase(),
        address: req.body.address || undefined,
        city: req.body.city || undefined,
        country: req.body.country || 'world',
        likeAllowed: req.body.likeAllowed,
        commentAllowed: req.body.commentAllowed,
        eventID: req.body.eventID,
        isEventPost: true,
        location: req.body.postLocation ? { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] } : undefined,
    }).catch((err) => console.log(err));

    // Catching error encounter 
    if (!newPost) return next(new ErrorHandler(`Either post type or visibility input not provided!`, HttpStatusCode.UNPROCESSABLE_ENTITY));

    // Create Post
    let isPost = await NormalPost.create({
        PostDataContainer: newPost._id,
        postTitle: req.body.postTitle.toLowerCase(),
        postSummary: req.body.postSummary ? req.body.postSummary.toLowerCase() : undefined,
        postAssets: postAssets.length > 0 ? postAssets : undefined
    }).catch((err) => console.log(err.toString()));

    if (!isPost) {
        await PostDataContainer.findByIdAndDelete({ _id: newPost._id })
        return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Saving reference
    newPost.normalPost = isPost._id;
    await newPost.save();

    // Sending response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Post In event created successfully!`
    })
})

// 🅿️⛈️❌ 11) ---- Fetch All Events Post ---- 
export const social_Media_Fetch_All_Posts_Of_Event = CatchAsync(async (req, res, next) => {

    // Fetching user current country
    const userCountry = req.user.country;
    // Fetching Event ID
    const { eid } = req.params;
    let searchOwner = 'customer'

    if (!eid) {
        return next(new ErrorHandler(`Please provide event ID`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    if (eid.includes('USER')) {
        searchOwner = 'customer'
    } else if (eid.includes('EVENT')) {
        searchOwner = 'business'
    }

    // Pagination Query
    let pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

    // MongoDB Query Filter
    let postsQuery = {
        $and: [
            { postVisibility: 'public' },
            { isEventPost: true },
            { eventID: eid },
            { postType: { $ne: "event" } }
        ]
    };

    // Fetching  all my posts counts
    const getCounts = await PostDataContainer.countDocuments(postsQuery)

    // Fetching user post 
    const apiFeature = new APIFeatures(PostDataContainer.find(postsQuery)
        .select("+address")
        .populate('normalPost')
        .populate({
            path: 'eventPost',
            select: "+eventUniqueID"
        })
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
                    select: 'businessName profilePicture'
                }
            ])
        })
        .sort({ createdAt: -1 })
        , req.query).pagination(pageLimit)

    const isPost = await apiFeature.query;

    // Checking if post exist
    if (!isPost || isPost.length === 0) {
        return next(new ErrorHandler(`No event posts found!`, HttpStatusCode.SUCCESS))
    }

    const isLiked = await PostLikes.findOne({ user: req.user.id }).catch((err) => console.log(err));
    let user = {
        _id: req.user.id,
        postArray: isLiked?.posts ? isLiked.posts : undefined
    }

    // Filter
    // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
    const result = await PostFilteringAndRestructuring(isPost, user);

    // Sending response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `All posts of an Event!`,
        feedCount: getCounts,
        feeds: result
    })
});

// 🅿️⛈️❌ 12) ---- Join A Event ----
export const social_Media_Join_A_Public_Event = CatchAsync(async (req, res, next) => {

    // Checking for user
    if (!req.user.id) {
        return next(new ErrorHandler(`Please login again!`, HttpStatusCode.UNAUTHORIZED))
    }
    const { id } = req.params;

    const isEventExist = await PostDataContainer.findOne({ _id: id })
        .select("+privateMembers")
        .populate('eventPost');

    if (!isEventExist || !isEventExist.eventPost) {
        return next(new ErrorHandler(`Requested event not exit`, HttpStatusCode.NOT_FOUND));
    }

    // Checking if event active or not
    if (isEventExist.eventPost.eventEndTime < Date.now()) {
        return next(new ErrorHandler(`Requested event is not active!`, HttpStatusCode.NOT_FOUND));
    }

    // Checking for public event
    if (isEventExist.postVisibility === 'private') {
        return next(new ErrorHandler(`This is a private event so not allowed to join!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // If active then allowing to join
    if (isEventExist.privateMembers && isEventExist.privateMembers.includes(req.user.id)) {
        return next(new ErrorHandler(`You are already a member of this event`, HttpStatusCode.CONFLICT));
    } else {
        if (!isEventExist.privateMembers) {
            isEventExist.privateMembers = [req.user.id];
            await isEventExist.save()
        } else {
            isEventExist.privateMembers.push(req.user.id);
            await isEventExist.save()
        }
    }
    res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: 'You have joined the event!'
    })
})