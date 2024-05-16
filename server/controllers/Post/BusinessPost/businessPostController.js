const Users = require('../../../models/User/Users');
const ContainerPost = require('../../../models/Post/ContainerPost');
const NormalPost = require('../../../models/Post/NormalPost');
const EventPosts = require('../../../models/Post/EventPost')
const UserGroups = require('../../../models/Groups/UserGroups');
const SurveyPost = require('../../../models/Post/SurveyPost');
const Questions = require('../../../models/Post/Questions');
const EventTicket = require('../../../models/Tickets/EventTicket');
const PostLikes = require('../../../models/Post/PostLikes');
const Country = require('../../../models/Country/Country')
const CountryCategories = require('../../../models/Category/CountryCategories');
const BookMarkedPosts = require('../../../models/Post/QueriesAndReports/BookMarkedPosts');
const LocationService = require('../../../Services/locationService');
const APIFeatures = require('../../../utils/apiFeatures');
const ErrorHandler = require('../../../utils/errorHandler');
const { HttpStatusCode } = require('../../../enums/httpHeaders');
const { UtilsKeywords } = require('../../../enums/utilsEnum');
const CatchAsync = require('../../../error/catchAsync');
const responseMSG = require('../../../utils/responses');
const FileProcessor = require('../../../Services/fileProcessing/fileProcessorService');
const { convertStringToDateTime, generateEventUniqueID } = require('../../../Services/TimeFormatService');
const { PostFilteringAndRestructuring } = require('../../../Services/PostResponses/postResponses');

/*
    Index:
        01) ⛈️ Business post categories
        02) 🔥 (GENERAL) Business New Public Post
        04) 🔥 (EVENTS) Business New Public Post
        06) 🔥 (SURVEY) Business New Public Post
        08) 🔥 (POLL) Business New Public Post
        10) 🔥 (ADVERTISEMENT) Business New Public Post
        11) 🔥 (ADVERTISEMENT) Business New Public Post
        12) ⛈️ (GENERAL) Business Public Posts
        13) ⛈️ (GENERAL) Business Private Posts
        14) ⛈️ (Event) Business Public Posts
        15) ⛈️ (Event) Business Private Posts
        16) ⛈️ (SURVEY) Business Public Posts
        17) ⛈️ (SURVEY) Business Private Posts
        18) ⛈️ (POLL) Business Public Posts
        19) ⛈️ (POLL) Business Private Posts
*/

// 🅱️⛈️✅ 01) ---- BUSINESS POST CATEGORY ----
exports.eventZAR_Business_Account_All_Post_Category = CatchAsync(async (req, res, next) => {

    // Fetching user current country
    let userCountry = req.user.country ?? 'world';

    // Fetching User Details
    const user = await Users.findById({ _id: req.user.id })
        .select("userAccount")
        .populate({
            path: 'userAccount',
            select: `country gender`
        })
        .catch((err) => console.log(err));


    if (!user) {
        return next(new ErrorHandler(`Please login again`, HttpStatusCode.UNAUTHORIZED))
    }

    // Checking if user profile is updated or not
    if (!user.userAccount?.country) {
        return next(new ErrorHandler(`Please update your profile and address first`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    }

    // Fetching Country 
    const isCountry = await Country.findOne({ countryName: new RegExp(userCountry, 'i') })

    // Fetching the data from the database
    const categories = await CountryCategories.findOne({ country: isCountry._id })
        .populate({
            path: 'categories.category'
        })
        .populate({
            path: 'categories.subCategories'
        })

    if (!categories) {
        return next(new ErrorHandler(`No category found in your country! Please contact with admin.`, HttpStatusCode.NOT_FOUND))
    }
    // Making a filter to get only the required fields of the
    const responseCategories = []
    categories.categories.forEach((data) => {
        if (user.userAccount?.gender) {
            if (data.category.categoryGender.toLowerCase() === user.userAccount.gender.toLowerCase()) {
                let categoryTemp = {
                    _id: data.category._id,
                    icon: data.category.categoryIcon,
                    name: data.category.categoryName,
                    subcategories: []
                }
                if (data.subCategories.length > 0) {
                    let subCategoryTemp = data.subCategories.map((sData) => {
                        let temp = {
                            _id: sData._id,
                            subCategoryName: sData.subCategoryName
                        }
                        return temp
                    })
                    categoryTemp.subcategories = subCategoryTemp;
                } else {
                    categoryTemp.subcategories = 'No subcategories!'
                }
                responseCategories.push(categoryTemp);
            }
        }
        else {
            let categoryTemp = {
                _id: data.category._id,
                icon: data.category.categoryIcon,
                name: data.category.categoryName,
                subcategories: []
            }
            if (data.subCategories.length > 0) {
                let subCategoryTemp = data.subCategories.map((sData) => {
                    let temp = {
                        _id: sData._id,
                        subCategoryName: sData.subCategoryName
                    }
                    return temp
                })
                categoryTemp.subcategories = subCategoryTemp;
            } else {
                categoryTemp.subcategories = 'No subcategories!'
            }
            responseCategories.push(categoryTemp);
        }
    })

    // Sending Response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: 'Business post categories!',
        categories: responseCategories.length > 0 ? responseCategories : 'There are no categories yet.'
    })
})

// 🅱️🔥✅ 02) ---- (GENERAL) BUSINESS NEW PUBLIC POST ----
exports.eventZAR_Business_Account_General_New_Public_Post = CatchAsync(async (req, res, next) => {

    // Destructuring data
    const { postCategory, postSubCategory, postTitle, postLocation, likeAllowed, commentAllowed } = req.body;
    // const { postCategory, postSubCategory, postTitle, postLocation, likeAllowed, commentAllowed, showCount } = req.body;

    // Checking if all fields provided
    if (!postCategory || !postSubCategory || !postTitle) {
        return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    // Checking for location details
    if (typeof postLocation !== 'boolean' && typeof postLocation !== 'string') {
        return next(new ErrorHandler(`Please provide correct details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    } else if (typeof postLocation === 'string' && !['true', 'false'].includes(postLocation.toLowerCase())) {
        return next(new ErrorHandler(`Please provide current location!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
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
            if (!isGroup) { return next(new ErrorHandler(`Tagged group not found`, HttpStatusCode.NOT_FOUND)) }
            else { groupExist = isGroup; }
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
        const processedFileResponse = await FileProcessor(req.files.postAssets, `eventsZar/business/${req.user.id}/posts`, req.user.id.toString());
        if (!processedFileResponse.success) {
            return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
        } else {
            postAssets = processedFileResponse.results;
        }
    }

    // Creating new post
    let newPost = await ContainerPost.create({
        postOwner: req.user.id,
        ownerType: 'business',
        postType: 'normal',
        postVisibility: req.body.groupID ? 'private' : 'public',
        postCategory: req.body.postCategory.toLowerCase(),
        postSubCategory: req.body.postSubCategory.toLowerCase(),
        address: req.body.address || undefined,
        city: req.body.city || undefined,
        country: req.body.country || 'world',
        likeAllowed: req.body.likeAllowed || false,
        commentAllowed: req.body.commentAllowed || false,
        taggedGroup: req.body.groupID ? groupExist._id : undefined,
        privateMembers: req.body.groupID ? groupExist.groupMembers : undefined,
        location: req.body.longitude && req.body.latitude ? { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] } : { type: 'Point', coordinates: [0, 0] },
        isPostActive: true
    }).catch((err) => console.log(err.toString()));

    // Catching error encounter 
    if (!newPost) return next(new ErrorHandler(`Either post type or visibility input not provided!`, HttpStatusCode.UNPROCESSABLE_ENTITY));

    // Create Post
    let isPost = await NormalPost.create({
        containerPost: newPost._id,
        postTitle: req.body.postTitle.toLowerCase(),
        postSummary: req.body.postSummary ? req.body.postSummary.toLowerCase() : undefined,
        postAssets: postAssets.length > 0 ? postAssets : undefined,
    }).catch((err) => console.log(err.toString()));

    if (!isPost) {
        await ContainerPost.findByIdAndDelete({ _id: newPost._id })
        return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Saving reference
    newPost.normalPost = isPost._id;
    await newPost.save();

    // Sending response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Post created successfully!`,

    })
})

// 🅱️🔥✅ 04) ---- (EVENT) BUSINESS NEW PUBLIC POST ----
exports.eventZAR_Business_Account_Event_New_Public_Post = CatchAsync(async (req, res, next) => {

    // Error Detector
    let hasError = {
        isError: false,
        errorMsg: '',
        errorCode: HttpStatusCode.UNPROCESSABLE_ENTITY
    }

    // Destructuring the request body
    const { postCategory, postSubCategory, postTitle, postLocation, eventType, startDate, startTime, endDate, endTime, freePass } = req.body;

    // Checking if all fields provided
    if (!postCategory || !postSubCategory || !postTitle || !eventType || !startDate || !startTime || !endDate || !endTime || freePass && typeof freePass !== 'string') {
        return next(new ErrorHandler(`Please provide all required details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    // Checking for free pass
    if (freePass && typeof freePass === 'string' && !['yes', 'no'].includes(freePass.toLowerCase())) {
        return next(new ErrorHandler(`Please provide details about ticket`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (freePass && typeof freePass === 'string' && freePass === 'no') {
        if (typeof req.body.refundable !== 'boolean' && req.body.refundable !== true || typeof req.body.refundable !== 'boolean' && req.body.refundable !== false) {
            return next(new ErrorHandler(`Provide data for whether ticket is refundable or not!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        }
    }
    if (freePass.toLowerCase === 'no' && !req.body.tickets) {
        return next(new ErrorHandler(`Provide ticket details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking for location details
    if (typeof postLocation !== 'boolean' && typeof postLocation !== 'string') {
        return next(new ErrorHandler(`Please provide correct details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    } else if (typeof postLocation === 'string' && !['true', 'false'].includes(postLocation.toLowerCase())) {
        return next(new ErrorHandler(`Please provide current location!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
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

    // Creating new post
    let newPost = await ContainerPost.create({
        postOwner: req.user.id,
        ownerType: 'business',
        postType: 'event',
        postVisibility: req.body.groupID ? 'private' : 'public',
        postCategory: req.body.postCategory.toLowerCase(),
        postSubCategory: req.body.postSubCategory.toLowerCase(),
        address: req.body.address || undefined,
        city: req.body.city || undefined,
        country: req.body.country || 'world',
        taggedGroup: req.body.groupID ? groupExist._id : undefined,
        privateMembers: req.body.groupID ? groupExist.groupMembers : undefined,
        location: req.body.longitude && req.body.latitude ? { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] } : { type: 'Point', coordinates: [0, 0] },
        isPostActive: true
    }).catch((err) => {
        hasError.isError = true;
        hasError.message = 'Something went wrong while creating event, Please try once again!';
        hasError.errorCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
        console.log(err.toString())
    });

    // Catching error encounter 
    if (!newPost) return next(new ErrorHandler(`Either post type or visibility input not provided!`, HttpStatusCode.UNPROCESSABLE_ENTITY));

    // Formatting date to be used in the database
    let eventStartTime = convertStringToDateTime(req.body.startDate, req.body.startTime);
    let eventEndTime = convertStringToDateTime(req.body.endDate, req.body.endTime);
    const eventUniqueID = generateEventUniqueID('business');

    let isPost = await EventPosts.create({
        eventUniqueID: eventUniqueID,
        containerPost: newPost._id,
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
    }).catch((err) => {
        hasError.isError = true;
        hasError.message = 'Something went wrong while creating event, Please try once again!';
        hasError.errorCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
        console.log(err.toString())
    });

    if (!isPost) {
        await ContainerPost.findByIdAndDelete({ _id: newPost._id });
        return next(new ErrorHandler(`The specified user group does not exist.`, HttpStatusCode.NOT_FOUND));
    }

    // Saving reference
    newPost.eventPost = isPost._id;
    await newPost.save();

    // Checking for tickets
    const eventTicket = [];
    if (typeof req.body.freePass === 'string' && req.body.freePass.toLowerCase() === 'no') {
        for (let i = 0; i < req.body.tickets.length; i++) {
            if (!req.body.tickets[i].ticketType || !req.body.tickets[i].quantity || !req.body.tickets[i].price || !req.body.tickets[i].currency) {
                return next(new ErrorHandler(`Please provide all details in ticket`, HttpStatusCode.UNPROCESSABLE_ENTITY))
            }
            else {
                let tempData = {
                    event: newPost._id, // Reference to the event
                    eventID: eventUniqueID,
                    ticketType: req.body.tickets[i].ticketType, // Type of ticket (e.g., VIP, Regular, Student)
                    quantity: req.body.tickets[i].quantity, // Quantity of available tickets
                    price: req.body.tickets[i].price, // Price of the ticket
                    currency: req.body.tickets[i].currency.toUpperCase(), // Quantity of available tickets
                }
                eventTicket.push(tempData);
            }
        }
    }

    // Creating ticket
    let tickets = undefined;
    try {
        tickets = await EventTicket.insertMany(eventTicket);
    } catch (err) {
        hasError.isError = true;
        hasError.message = 'Something went wrong while creating event, Please try once again!';
        hasError.errorCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    }

    // Checking for error
    if (hasError.isError) {
        if (newPost) {
            await ContainerPost.findByIdAndDelete({ _id: newPost._id });
        }
        if (isPost) {
            await EventPosts.findByIdAndDelete({ _id: isPost._id });
        }
        if (tickets) {
            await EventTicket.findByIdAndDelete({ _id: tickets._id });
        }
        return next(new ErrorHandler(hasError.errorMsg, hasError.errorCode));
    }

    // Sending response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Event created Successfully!`
    })
})

// 🅱️🔥✅ 06) ---- (SURVEY) BUSINESS NEW PUBLIC POST ----
exports.eventZAR_Business_Account_Survey_New_Public_Post = CatchAsync(async (req, res, next) => {

    // Error Catcher
    let errorOccur = false;
    let createdPost = { containerPost: undefined, surveyPost: undefined, questionnaire: undefined }
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
        ownerType: 'business',
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
        createdPost.containerPost = await ContainerPost.create(containerObject);
    } catch (error) {
        // Handle the error here
        errorOccur = true;
    }

    // // Survey Object
    const surveyPost = {
        containerPost: createdPost.containerPost._id,
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
        if (createdPost.containerPost) {
            await ContainerPost.findByIdAndDelete({ _id: createdPost.containerPost._id })
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
        createdPost.containerPost.surveyPost = createdPost.surveyPost._id;
        await createdPost.containerPost.save();
    }

    // Sending Response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Survey Post created Successfully!`,
    })
})

// 🅱️🔥✅ 08) ---- (POLL) BUSINESS NEW PUBLIC POST ----
exports.eventZAR_Business_Account_Poll_New_Public_Post = CatchAsync(async (req, res, next) => {

    // Error Catcher
    let errorOccur = false;
    let createdPost = {
        containerPost: undefined,
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
        ownerType: 'business',
        postType: 'poll',
        postVisibility: req.body.groupID ? 'private' : 'public',
        postCategory: req.body.postCategory.toLowerCase(),
        postSubCategory: req.body.postSubCategory.toLowerCase(),
        address: req.body.address || undefined,
        city: req.body.city || undefined,
        country: req.body.country || 'world',
        likeAllowed: false,
        commentAllowed: false,
        likeCommentHide: true,
        location: req.body.longitude && req.body.latitude ? { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] } : { type: 'Point', coordinates: [0, 0] },
        isPostActive: true
    }

    try {
        createdPost.containerPost = await ContainerPost.create(containerObject);
    } catch (error) {
        // Handle the error here
        errorOccur = true;
    }

    // // Survey Object
    const surveyPost = {
        containerPost: createdPost.containerPost._id,
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
        if (createdPost.containerPost) {
            await ContainerPost.findByIdAndDelete({ _id: createdPost.containerPost._id })
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
        createdPost.containerPost.surveyPost = createdPost.surveyPost._id;
        await createdPost.containerPost.save();
    }

    // Sending Response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Poll Post created Successfully!`,
    })
})

// 🅱️🔥❌ 10) ---- (ADVERTISEMENT) BUSINESS NEW PUBLIC POST ----
exports.eventZAR_Business_Account_New_Advertisement_Post = CatchAsync(async (req, res, next) => {

    // Sending Response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Event Post created Successfully!`
    })
})

// 🅱️🔥❌ 11) ---- (NEWSLETTER) BUSINESS NEW PUBLIC POST ----
exports.eventZAR_Business_Account_New_Advertisement_Post = CatchAsync(async (req, res, next) => {

    // Sending Response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Event Post created Successfully!`
    })
})

// 🅱️⛈️✅ 12) ---- (GENERAL) BUSINESS PUBLIC POST's ----
exports.eventZAR_Business_Account_Get_Public_Feed_Posts = CatchAsync(async (req, res, next) => {

    // Fetching user current country
    let userCountry = req.user.country;
    if (req.query?.allLoc) {
        userCountry = req.query.allLoc.toString().toLowerCase() === 'world' ? 'world' : req.user.country;
    }

    // Post Query Definition
    let postsQuery = {
        $and: [
            { ownerType: 'business' }, // Public posts
            { postVisibility: 'public' },
            // { postType: 'normal' },
            { postType: { $ne: 'event' } },
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
    const getCounts = await ContainerPost.countDocuments(postsQuery);

    // Page Limit
    let pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

    // Fetching user post 
    const apiFeature = new APIFeatures(ContainerPost.find(postsQuery)
        .select('+address')
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
                    select: 'name profilePicture'
                }
            ])
        })
        .sort({ createdAt: -1 })
        , req.query)
        .feedPostSearch()
        .pagination(pageLimit)
    const isPost = await apiFeature.query;

    // Checking if post exist
    // Checking if post exist
    if (!isPost || isPost.length === 0) return next(new ErrorHandler(`No posts found!`, HttpStatusCode.SUCCESS));

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
        message: `Businesses All Public Posts!`,
        length: getCounts,
        feeds: result
    })
})

// 🅱️⛈️✅ 13) ---- (GENERAL) BUSINESS NEW PRIVATE POST ----
exports.eventZAR_Business_Account_Get_Private_Feed_Posts = CatchAsync(async (req, res, next) => {

    // Fetching user current country
    let userCountry = req.user.country;
    if (req.query?.allLoc) {
        userCountry = req.query.allLoc.toString().toLowerCase() === 'world' ? 'world' : req.user.country;
    }

    // Post Query Definition
    let postsQuery = {
        $or: [
            {
                $and: [
                    { ownerType: 'business' }, // Public posts
                    { postVisibility: 'private' },
                    // { postType: 'normal' },
                    { postType: { $ne: 'event' } },
                    { privateMembers: { $in: [req.user.id] } },
                    { postOwner: { $nin: req.user.blockedUsers } },
                ]
            },
            {
                $and: [
                    { ownerType: 'business' }, // Public posts
                    { postVisibility: 'private' },
                    // { postType: 'normal' },
                    { postType: { $ne: 'event' } },
                    { postOwner: req.user.id }
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
    const getCounts = await ContainerPost.countDocuments(postsQuery);

    // Page Limit
    let pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

    // Fetching user post 
    const apiFeature = new APIFeatures(ContainerPost.find(postsQuery)
        .select('+address')
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
                    select: 'name profilePicture'
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
        message: `Businesses All Private Posts!`,
        length: getCounts,
        feeds: result
    })
});

// 🅱️⛈️✅ 14) ---- (EVENT) BUSINESS NEW PUBLIC POST ----
exports.eventZAR_Business_Account_Event_Get_All_Public_Events = CatchAsync(async (req, res, next) => {

    // Fetching user current country
    let userCountry = req.user.country;
    if (req.query?.allLoc) {
        userCountry = req.query.allLoc.toString().toLowerCase() === 'world' ? 'world' : req.user.country;
    }

    // Post Query
    let postsQuery = {
        $and: [
            { ownerType: 'business' }, // Public posts
            { postVisibility: 'public' },
            { postType: 'event' },
            { postOwner: { $nin: req.user.blockedUsers } },
            { country: new RegExp(userCountry, 'i') }
        ]
    };

    // Post Filter
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
        const eventPosts = await EventPosts.find({ postTitle: new RegExp(req.query.event, 'i') })
            .select('containerPost')
            .limit(pageLimit) // Apply pagination as needed
            .exec();
        eventPostIds = eventPosts.map(post => post.containerPost.toString());
        postsQuery.$and.push({ _id: { $in: eventPostIds } })
    }

    // Fetching  all my posts counts
    const getCounts = await ContainerPost.countDocuments(postsQuery);

    // Fetching user post 
    const apiFeature = new APIFeatures(ContainerPost.find(postsQuery)
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
                    select: 'name profilePicture'
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
        message: `All Public Events`,
        length: getCounts,
        feeds: result
    })
});

// 🅱️⛈️✅ 15) ---- (EVENT) BUSINESS NEW PRIVATE POST ----
exports.eventZAR_Business_Account_Event_Get_All_Private_Events = CatchAsync(async (req, res, next) => {

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
                    { ownerType: 'business' },
                    { postVisibility: 'private' },
                    { postType: 'event' },
                    { privateMembers: { $in: [req.user.id] } },
                    { postOwner: { $nin: req.user.blockedUsers } },
                ]
            },
            {
                $and: [
                    { ownerType: 'business' },
                    { postVisibility: 'private' },
                    { postType: 'event' },
                    { postOwner: req.user.id }
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
        const eventPosts = await EventPosts.find({ postTitle: new RegExp(req.query.event, 'i') })
            .select('containerPost')
            .limit(pageLimit) // Apply pagination as needed
            .exec();
        eventPostIds = eventPosts.map(post => post.containerPost.toString());
        postsQuery.$or[0].$and.push({ _id: { $in: eventPostIds } })
        postsQuery.$or[1].$and.push({ _id: { $in: eventPostIds } })
    }

    // Fetching  all my posts counts
    const getCounts = await ContainerPost.countDocuments(postsQuery);

    // Fetching user post 
    const apiFeature = new APIFeatures(ContainerPost.find(postsQuery)
        .select("+taggedGroup +address +privateMembers")
        .populate({
            path: 'eventPost',
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
                    select: 'name profilePicture'
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
        console.error('No booked marked data!');
    } else {
        user.bookMarkedPost = bookMarkedPost.posts;
    }
    // Filter
    // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
    const result = await PostFilteringAndRestructuring(isPost, user);

    // Sending response
    responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Businesses All Public Events`,
        length: getCounts,
        feeds: result
    })
});

// 🅱️⛈️✅ 16) ---- (SURVEY) BUSINESS NEW PUBLIC POST ----
// exports.eventZAR_Business_Account_Survey_Get_All_Public_Surveys = CatchAsync(async (req, res, next) => {

//     // Fetching user
//     const isUser = await Users.findById({ _id: req.user.id })
//         .select('blockedUser')
//         .catch((err) => console.log(err))
//     if (!isUser) {
//         return res.status(HttpStatusCode.UNAUTHORIZED).json({
//             success: false,
//             message: `Please login again`
//         })
//     }

//     // ==========================
//     let postsQuery = {
//         $or: [
//             {
//                 $and: [
//                     { ownerType: 'business' }, // Public posts
//                     { postVisibility: 'public' }, // Public posts
//                     { postType: 'survey' },
//                     { postOwner: {$nin: req.user.blockedUsers}},
//                 ]
//             },
//         ]
//     };

//     // Fetching  all my posts counts
//     const getCounts = await ContainerPost.countDocuments(postsQuery)

//     // Fetching user post
//     const apiFeature = new APIFeatures(ContainerPost.find(postsQuery)
//         .select("+taggedGroup +address")
//         .populate({
//             path: 'surveyPost',
//             populate: ({
//                 path: 'questions'
//             })
//         })
//         .populate({
//             path: 'postOwner',
//             select: 'userAccount businessAccount +role +hasBusiness',
//             populate: ([
//                 {
//                     path: 'userAccount',
//                     select: 'firstname lastname profilePicture'
//                 },
//                 {
//                     path: 'businessAccount',
//                     select: 'name profilePicture'
//                 }
//             ])
//         })
//         .sort({ createdAt: -1 })
//         , req.query).pagination(20)

//     const isPost = await apiFeature.query;

//     // Checking if post exist
//     if (!isPost || isPost.length === 0) return next(new ErrorHandler(`No posts found!`, HttpStatusCode.SUCCESS));

//     const isLiked = await PostLikes.findOne({ user: req.user.id }).catch((err) => console.log(err));
//     let user = {
//         _id: req.user.id,
//         postArray: isLiked?.posts ? isLiked.posts : undefined
//     }

//     // Filter
//     // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
//     const result = await PostFilteringAndRestructuring(isPost, user);

//     // Sending response
//     responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
//         success: true,
//         message: `Businesses All Public Survey`,
//         length: getCounts,
//         feeds: result
//     })
// });

// 🅱️⛈️✅ 17) ---- (SURVEY) BUSINESS NEW PRIVATE POST ----
// exports.eventZAR_Business_Account_Survey_Get_All_Private_Surveys = CatchAsync(async (req, res, next) => {

//     // Fetching user
//     const isUser = await Users.findById({ _id: req.user.id })
//         .select('blockedUser')
//         .catch((err) => console.log(err))
//     if (!isUser) {
//         return res.status(HttpStatusCode.UNAUTHORIZED).json({
//             success: false,
//             message: `Please login again`
//         })
//     }

//     // MongoDB Query Filter
//     let postsQuery = {
//         $or: [
//             {
//                 $and: [
//                     { ownerType: 'business' }, // Public posts
//                     { postVisibility: 'private' }, // Public posts
//                     { postType: 'survey' },
//                     { privateMembers: { $in: [req.user.id] } },
//                     { postOwner: {$nin: req.user.blockedUsers}},
//                 ]
//             },
//             {
//                 $and: [
//                     { ownerType: 'business' }, // Public posts
//                     { postVisibility: 'private' }, // Public posts
//                     { postType: 'survey' },
//                     { postOwner: req.user.id }
//                 ]
//             }
//         ]
//     };

//     // Fetching  all my posts counts
//     const getCounts = await ContainerPost.countDocuments(postsQuery)

//     // Fetching user post
//     const apiFeature = new APIFeatures(ContainerPost.find(postsQuery)
//         .select("+taggedGroup +address")
//         .populate({
//             path: 'surveyPost',
//             // select: "+sharedWith",
//             populate: ({
//                 path: 'questions'
//             })
//         })
//         .populate({
//             path: 'postOwner',
//             select: 'userAccount businessAccount +role +hasBusiness',
//             populate: ([
//                 {
//                     path: 'userAccount',
//                     select: 'firstname lastname profilePicture'
//                 },
//                 {
//                     path: 'businessAccount',
//                     select: 'name profilePicture'
//                 }
//             ])
//         })
//         .sort({ createdAt: -1 })
//         , req.query).pagination(20)

//     const isPost = await apiFeature.query;

//     // Checking if post exist
//     if (!isPost || isPost.length === 0) return next(new ErrorHandler(`No posts found!`, HttpStatusCode.SUCCESS));

//     const isLiked = await PostLikes.findOne({ user: req.user.id }).catch((err) => console.log(err));
//     let user = {
//         _id: req.user.id,
//         postArray: isLiked?.posts ? isLiked.posts : undefined
//     }

//     // Filter
//     // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
//     const result = await PostFilteringAndRestructuring(isPost, user);

//     // Sending response
//     responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
//         success: true,
//         message: `Businesses All Public Survey`,
//         length: getCounts,
//         feeds: result
//     })
// });

// 🅱️⛈️✅ 18) ---- (POLL) BUSINESS NEW PUBLIC POST ----
// exports.eventZAR_Business_Account_Poll_Get_All_Public_Polls = CatchAsync(async (req, res, next) => {

//     // Fetching user
//     const isUser = await Users.findById({ _id: req.user.id })
//         .select('blockedUser')
//         .catch((err) => console.log(err))
//     if (!isUser) {
//         return res.status(HttpStatusCode.UNAUTHORIZED).json({
//             success: false,
//             message: `Please login again`
//         })
//     }

//     // ==========================
//     let postsQuery = {
//         $or: [
//             {
//                 $and: [
//                     { ownerType: 'business' }, // Public posts
//                     { postVisibility: 'public' }, // Public posts
//                     { postType: 'poll' },
//                     { postOwner: {$nin: req.user.blockedUsers}},
//                 ]
//             },
//         ]
//     };

//     // Fetching  all my posts counts
//     const getCounts = await ContainerPost.countDocuments(postsQuery)

//     // Fetching user post
//     const apiFeature = new APIFeatures(ContainerPost.find(postsQuery)
//         .select("+taggedGroup +address")
//         .populate({
//             path: 'surveyPost',
//             // select: "+sharedWith",
//             populate: ({
//                 path: 'questions'
//             })
//         })
//         .populate({
//             path: 'postOwner',
//             select: 'userAccount businessAccount +role +hasBusiness',
//             populate: ([
//                 {
//                     path: 'userAccount',
//                     select: 'firstname lastname profilePicture'
//                 },
//                 {
//                     path: 'businessAccount',
//                     select: 'name profilePicture'
//                 }
//             ])
//         })
//         .sort({ createdAt: -1 })
//         , req.query).pagination(20)

//     const isPost = await apiFeature.query;

//     // Checking if post exist
//     if (!isPost || isPost.length === 0) return next(new ErrorHandler(`No posts found!`, HttpStatusCode.SUCCESS));

//     const isLiked = await PostLikes.findOne({ user: req.user.id }).catch((err) => console.log(err));
//     let user = {
//         _id: req.user.id,
//         postArray: isLiked?.posts ? isLiked.posts : undefined
//     }

//     // Filter
//     // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
//     const result = await PostFilteringAndRestructuring(isPost, user);

//     // Sending response
//     responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
//         success: true,
//         message: `Businesses All Public Survey`,
//         length: getCounts,
//         feeds: result
//     })
// });

// 🅱️⛈️✅ 19) ---- (POLL) BUSINESS NEW PRIVATE POST ----
// exports.eventZAR_Business_Account_Poll_Get_All_Private_Polls = CatchAsync(async (req, res, next) => {

//     // Fetching user
//     const isUser = await Users.findById({ _id: req.user.id })
//         .select('blockedUser')
//         .catch((err) => console.log(err))
//     if (!isUser) {
//         return res.status(HttpStatusCode.UNAUTHORIZED).json({
//             success: false,
//             message: `Please login again`
//         })
//     }

//     // MongoDB Query Filter
//     let postsQuery = {
//         $or: [
//             {
//                 $and: [
//                     { ownerType: 'business' }, // Public posts
//                     { postVisibility: 'private' }, // Public posts
//                     { postType: 'poll' },
//                     { privateMembers: { $in: [req.user.id] } },
//                     { postOwner: {$nin: req.user.blockedUsers}},
//                 ]
//             },
//             {
//                 $and: [
//                     { ownerType: 'business' }, // Public posts
//                     { postVisibility: 'private' }, // Public posts
//                     { postType: 'poll' },
//                     { postOwner: req.user.id }
//                 ]
//             }
//         ]
//     };

//     // Fetching  all my posts counts
//     const getCounts = await ContainerPost.countDocuments(postsQuery)

//     // Fetching user post
//     const apiFeature = new APIFeatures(ContainerPost.find(postsQuery)
//         .select("+taggedGroup +address")
//         .populate({
//             path: 'surveyPost',
//             // select: "+sharedWith",
//             populate: ({
//                 path: 'questions'
//             })
//         })
//         .populate({
//             path: 'postOwner',
//             select: 'userAccount businessAccount +role +hasBusiness',
//             populate: ([
//                 {
//                     path: 'userAccount',
//                     select: 'firstname lastname profilePicture'
//                 },
//                 {
//                     path: 'businessAccount',
//                     select: 'name profilePicture'
//                 }
//             ])
//         })
//         .sort({ createdAt: -1 })
//         , req.query).pagination(20)

//     const isPost = await apiFeature.query;

//     // Checking if post exist
//     if (!isPost || isPost.length === 0) return next(new ErrorHandler(`No posts found!`, HttpStatusCode.SUCCESS));

//     const isLiked = await PostLikes.findOne({ user: req.user.id }).catch((err) => console.log(err));
//     let user = {
//         _id: req.user.id,
//         postArray: isLiked?.posts ? isLiked.posts : undefined
//     }

//     // Filter
//     // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
//     const result = await PostFilteringAndRestructuring(isPost, user);

//     // Sending response
//     responseMSG.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
//         success: true,
//         message: `Businesses All Public Survey`,
//         length: getCounts,
//         feeds: result
//     })
// });