const mongoose = require('mongoose');
const ContainerPosts = require('../../../models/Post/ContainerPost');
const NormalPosts = require('../../../models/Post/NormalPost');
const EventPosts = require('../../../models/Post/EventPost');
const SurveyPost = require('../../../models/Post/SurveyPost');
const PostReports = require('../../../models/Post/QueriesAndReports/PostReports');
const PostLikes = require('../../../models/Post/PostLikes');
const BookMarkedPosts = require('../../../models/Post/QueriesAndReports/BookMarkedPosts');
const Questions = require('../../../models/Post/Questions');
const CatchAsync = require('../../../error/catchAsync');
const { HttpStatusCode } = require('../../../enums/httpHeaders');
const APIFeatures = require('../../../utils/apiFeatures');
const { UtilsKeywords } = require('../../../enums/utilsEnum');
const ErrorHandler = require('../../../utils/errorHandler');
const postFilter = require('../../../utils/postFilter');
const LocationService = require('../../../Services/locationService');
const { eventsZarGeneralResponse } = require("../../../utils/responses");
const { PostFilteringAndRestructuring } = require('../../../Services/PostResponses/postResponses');

/*
    Index:
        01) Function Of Incrementor
        01) Increase Post View Counter
        02) Increase a Post Click Controller
        03) Report A Post
        04) Get All Reports Of A Post
        05) Bookmarking a post
*/

async function postsCounterIncrement(posts, counterField) {
    // Filter out valid IDs that exist in the database
    const validIds = posts.filter(id => mongoose.Types.ObjectId.isValid(id));
    try {
        const documents = await ContainerPosts.find({ _id: { $in: validIds } }).exec();
        for (const document of documents) {
            let updateObject = {};
            updateObject[counterField] = 1; // Dynamically set the counter field to increment by 1
            await ContainerPosts.updateOne({ _id: document._id }, { $inc: updateObject });
            console.log(`Document with ID ${document._id} updated`);
        }
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

// 01) Increase Post View Counter
exports.eventsZar_Increase_A_Post_View_Counter = CatchAsync(async (req, res, next) => {

    // Getting Post ID
    const { posts } = req.body;
    if (!Array.isArray(posts)) {
        return next(new ErrorHandler(`Please provide posts data in correct format!`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    }
    if (posts.length === 0) {
        return next(new ErrorHandler(`No post ID's provided!`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    }

    // Updating the View Counter
    const isUpdated = await postsCounterIncrement(posts, 'viewCounter');
    if (!isUpdated) {
        return next(new ErrorHandler(`Something went wrong while updating the view counts`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Sending Response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: 'View count has been increased'
    })
})

// 02) Increase a Post Click Controller
exports.eventsZar_Increase_A_Post_Click_Counter = CatchAsync(async (req, res, next) => {

    // Getting Post ID
    const { posts } = req.body;
    if (!Array.isArray(posts)) {
        return next(new ErrorHandler(`Please provide posts data in correct format!`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    }
    if (posts.length === 0) {
        return next(new ErrorHandler(`No post ID's provided!`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    }

    // Updating the View Counter
    const isUpdated = await postsCounterIncrement(posts, 'clickCounter');
    if (!isUpdated) {
        return next(new ErrorHandler(`Something went wrong while updating the view counts`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Sending Response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: 'Click count has been increased'
    })
})

// 03) Report A Post
exports.eventsZar_Report_A_Post_By_User = CatchAsync(async (req, res, next) => {

    // Fetching Post Data from DB 
    const { postID, reportReason } = req.body;
    if (!postID || !reportReason) {
        return next(new ErrorHandler(`Provide post to which you wanna report!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking if Post Already exist or not
    const isPost = await ContainerPosts.findOne({ _id: postID }).select('+reportCount reportCount');
    if (!isPost) {
        return next(new ErrorHandler(`Post not exist, Please check again`, HttpStatusCode.NOT_FOUND));
    }

    // Checking if User already reported this post
    const isAlreadyReported = await PostReports.findOne({ user: req.user.id, post: postID })

    // If already been reported then updating it with new data else creating a new report document
    if (isAlreadyReported) {
        await PostReports.findByIdAndUpdate({ _id: isAlreadyReported._id }, { reportReason: reportReason }, { new: true })
    } else {
        const isReported = await PostReports.create({
            user: req.user.id,
            post: postID,
            reportReason: reportReason
        })
        if (isReported) {
            isPost.reportCount += 1;
            await isPost.save()
        }
    }

    // Sending Response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: 'Post reported successfully!'
    })
})

// 04) Get All Reports Of A Post
exports.eventsZar_Get_All_Reports_Of_A_Post_By_Users = CatchAsync(async (req, res, next) => {

    // Checking the PostID
    const { pid } = req.params;

    const validIds = mongoose.Types.ObjectId.isValid(pid);
    if (!validIds) {
        return next(new ErrorHandler(`Provide correct Id of a post for which you wanna fetch details`, HttpStatusCode.BAD_REQUEST));
    }

    // Fetching User Reports on a post
    const pageLimit = UtilsKeywords.PAGE_LIMIT || req.query.pageLimit;
    const apiFeature = new APIFeatures(PostReports.find({ post: pid })
        .populate({
            path: 'user',
            select: 'username UserAccount',
            populate: ({
                path: 'userAccount',
                select: 'firstname lastname profilePicture'
            })
        })
        .sort({ createdAt: -1 }),
        req.query).pagination(pageLimit)

    const tempData = await apiFeature.query;

    // Formatting the data before sending response
    const reports = postFilter.filterUserReportedPostData(tempData)

    // Sending Response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: 'All user reports on a Posts',
        userReports: reports.length === 0 ? 'Not yet reported by any user' : reports,
    })
})

// 05) Bookmarking a post
exports.eventsZar_User_Bookmarking_A_New_Post = CatchAsync(async (req, res, next) => {

    // Getting a post id from body
    const { postID } = req.body;
    if (!postID) {
        return next(new ErrorHandler(`Please provide a post to bookmark`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Fetching and checking if the post is already bookmarked
    const isPostExist = await ContainerPosts.findOne({ _id: postID })
        .catch((err) => { console.log(err) });
    if (!isPostExist) {
        return next(new ErrorHandler(`Can't be bookmarked either post not exist or incorrect details are provided`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking if user has bookmarked data's
    const isBookmarkedExist = await BookMarkedPosts.findOne({ user: req.user.id })
        .catch((err) => console.log(err));

    // Catching Error
    let isError = false;
    let isBMarked = ''
    if (!isBookmarkedExist) {
        await BookMarkedPosts.create({
            user: req.user.id,
            posts: [isPostExist._id]
        })
            .catch((err) => {
                console.log(err);
                isError = true
            });
        isBMarked = 'added to your bookmarks';
    } else {
        if (!isBookmarkedExist.posts.includes(postID)) {
            await BookMarkedPosts.findByIdAndUpdate({ _id: isBookmarkedExist._id }, { $push: { posts: isPostExist._id } }, { new: true })
                .catch((err) => {
                    console.log(err);
                    isError = true
                });
            isBMarked = 'added to your bookmarks';
        } else {
            const isEr = await BookMarkedPosts.findByIdAndUpdate({ _id: isBookmarkedExist._id }, { $pull: { posts: isPostExist._id } }, { new: true })
                .catch((err) => {
                    console.log(err);
                    isError = true
                });
            isBMarked = 'removed from your bookmarks';
        }
    }

    // Checking for error
    if (isError) {
        return next(new ErrorHandler('Internal error', HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Sending response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `The post was successfully ${isBMarked}.`
    })
})

// 06) Fetching All Bookmarked post
exports.eventsZar_Fetching_User_All_BookMarked_Posts = CatchAsync(async (req, res, next) => {

    // Fetching All Bookmarked Posts
    const pageLimit = 20;
    const apiFeature = new APIFeatures(BookMarkedPosts.findOne({ user: req.user.id }), req.query).pagination(pageLimit);
    const isBookedMarked = await apiFeature.query;

    if (!isBookedMarked) {
        return next(new ErrorHandler("There are no bookmarked posts.", HttpStatusCode.NOT_FOUND));
    }

    // Fetching Posts
    const isPost = await ContainerPosts.find({ _id: { $in: isBookedMarked.posts } })
        .select('+address')
        .populate('normalPost')
        .populate('eventPost')
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

    // Sending Response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `All bookmarked posts`,
        feeds: result
    })
})

// 07) Normal Post Edit Option
exports.eventsZar_Normal_Post_Content_Edit = CatchAsync(async (req, res, next) => {

    // Destructuring the request body for desired fields
    const { postId } = req.body;

    // Fetching the post details and checking if it is active
    const isPostExist = await ContainerPosts.findOne({ _id: postId, postType: { $ne: 'event' } })
        .select('postOwner postType postCategory postSubCategory +normalPost +surveyPost isPostActive +isPostEdited likeCommentHide commentAllowed')
        .catch((err) => console.log(err));

    if (!isPostExist) {
        return next(new ErrorHandler(`You are trying to access post with wrong information or post doesn't exist!`, HttpStatusCode.NOT_FOUND));
    }
    if (!isPostExist.isPostActive) {
        return next(new ErrorHandler(`Requested post is not active!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking for allowed to edit
    if (req.user.id.toString().toLowerCase() != isPostExist.postOwner.toString().toLowerCase()) {
        return next(new ErrorHandler(`You are not allowed to edit this post`, HttpStatusCode.UNAUTHORIZED));
    }

    // Final Update to the post
    isPostExist.postCategory = req.body.postCategory ? req.body.postCategory : isPostExist.postCategory;
    isPostExist.postSubCategory = req.body.postSubCategory ? req.body.postSubCategory : isPostExist.postSubCategory;
    isPostExist.commentAllowed = req.body.commentAllowed ?? isPostExist.commentAllowed;
    isPostExist.likeCommentHide = req.body.likeCommentHide ?? isPostExist.likeCommentHide;
    isPostExist.isPostEdited = true;
    await isPostExist.save();

    // Updating respective post
    // CHecking for Normal Post
    if (isPostExist.normalPost && isPostExist.postType === 'normal') {
        let isNormalPost = await NormalPosts.findOne({ _id: isPostExist.normalPost, containerPost: isPostExist._id });
        if (!isNormalPost) {
            return next(new ErrorHandler(`Requested post either been deleted or currently not active!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        }
        isNormalPost.postTitle = req.body.postTitle ? req.body.postTitle : isNormalPost.postTitle;
        isNormalPost.postSummary = req.body.postSummary ? req.body.postSummary : isNormalPost.postSummary;
        await isNormalPost.save();
    } else if (isPostExist.surveyPost && isPostExist.postType === 'poll') {
        let isPollPost = await SurveyPost.findOne({ _id: isPostExist.surveyPost, containerPost: isPostExist._id });
        if (!isPollPost) {
            return next(new ErrorHandler(`Requested post either been deleted or currently not active!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        }
        isPollPost.postTitle = req.body.postTitle ? req.body.postTitle : isPollPost.postTitle;
        isPollPost.postSummary = req.body.postSummary ? req.body.postSummary : isPollPost.postSummary;
        await isPollPost.save();
    } else if (isPostExist.surveyPost && isPostExist.postType === 'survey') {
        let isSurveyPost = await SurveyPost.findOne({ _id: isPostExist.surveyPost, containerPost: isPostExist._id });
        if (!isSurveyPost) {
            return next(new ErrorHandler(`Requested post either been deleted or currently not active!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        }
        isSurveyPost.postTitle = req.body.postTitle ? req.body.postTitle : isSurveyPost.postTitle;
        isSurveyPost.postSummary = req.body.postSummary ? req.body.postSummary : isSurveyPost.postSummary;
        await isSurveyPost.save();
    }

    // Sending Response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `The post has been updated!`,
    })
})

// 08) Event Post Edit Option
exports.eventsZar_Event_Post_Content_Edit = CatchAsync(async (req, res, next) => {

    // Destructuring the request body for desired fields
    const { postId } = req.body;

    // Fetching the post details and checking if it is active
    const isPostExist = await ContainerPosts.findOne({ _id: postId, postType: 'event' })
        .select('postOwner postType postCategory postSubCategory isPostActive +eventPost +isPostEdited')
        .catch((err) => console.log(err));

    if (!isPostExist) {
        return next(new ErrorHandler(`You are trying to access post with wrong information or post doesn't exist!`, HttpStatusCode.NOT_FOUND));
    }

    if (!isPostExist.isPostActive) {
        return next(new ErrorHandler(`Requested post is not active!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Checking for allowed to edit
    if (req.user.id.toString().toLowerCase() != isPostExist.postOwner.toString().toLowerCase()) {
        return next(new ErrorHandler(`You are not allowed to edit this post`, HttpStatusCode.UNAUTHORIZED));
    }
    const isEventPost = await EventPosts.findOne({ _id: isPostExist.eventPost, containerPost: isPostExist._id })
        .catch((err) => console.log(err));

    if (!isEventPost) {
        return next(new ErrorHandler(`Requested post either been deleted or currently not active`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }

    // Final Update to the post
    isPostExist.postCategory = req.body.postCategory ? req.body.postCategory : isPostExist.postCategory;
    isPostExist.postSubCategory = req.body.postSubCategory ? req.body.postSubCategory : isPostExist.postSubCategory;
    isPostExist.isPostEdited = true;
    isEventPost.postTitle = req.body.postTitle ? req.body.postTitle : isEventPost.postTitle;
    isEventPost.postSummary = req.body.postSummary ? req.body.postSummary : isEventPost.postSummary;
    isEventPost.commentAllowed = req.body.commentAllowed ?? isEventPost.commentAllowed;
    isEventPost.likeCommentHide = req.body.likeCommentHide ?? isEventPost.likeCommentHide;
    await isPostExist.save();
    await isEventPost.save();

    // Sending Response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `The event has been updated!`
    })
})

// 09) Responding to Poll and Survey Questions(New Submission & Resubmission)
exports.eventsZar_Poll_Survey_Question_Response = CatchAsync(async (req, res, next) => {

    // Check variable for resubmission
    let isResponseModification = false;

    // Verifying Request Body
    const { postId, responses } = req.body

    // Checking if all data provided
    if (!postId) {
        return next(new ErrorHandler(`Please provide all details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (responses && responses.length == 0) {
        return next(new ErrorHandler(`Please provide responses`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    for (let i = 0; i < responses.length; i++) {
        if (!responses[i].questionId && !responses[i].answerIndex) {
            return next(new ErrorHandler(`Please provide question and it's answer`, HttpStatusCode.UNPROCESSABLE_ENTITY))
        }
    }

    // Fetching post data 
    const isPost = await ContainerPosts.findById({ _id: postId }).select("+surveyPost")
        .catch((err) => console.log(err));
    // Checking if post is poll or survey
    if (!isPost) {

    }

    if (isPost.postType == 'survey') { }
    else if (isPost.postType == 'poll') { }
    else { return next(new ErrorHandler(`Post type is not poll or survey`, HttpStatusCode.FORBIDDEN)); }

    // Fetching post data for saving data
    const isPollSurvey = await SurveyPost.findOne({ _id: isPost.surveyPost, containerPost: postId })
        .catch((err) => { console.log(err) });
    if (!isPollSurvey) {
        return next(new ErrorHandler(`Post data not found!`, HttpStatusCode.FORBIDDEN));
    }

    // Checking if survey or poll has start date and response condition met or not
    if (isPollSurvey.startDate && isPollSurvey.startDate > new Date()) {
        return next(new ErrorHandler(`This ${isPost.postType} is not open yet for responses!`, HttpStatusCode.FORBIDDEN));
    }

    // Checking if survey or poll has end date and checking if open for taking responses
    if (isPollSurvey.endDate && isPollSurvey.endDate < new Date()) {
        return next(new ErrorHandler(`This ${isPost.postType} is closed for responses!`, HttpStatusCode.FORBIDDEN));
    }

    // Checking if submitted
    try {
        const surveyPost = await SurveyPost.findOne({
            _id: isPost.surveyPost,
            responses: { $elemMatch: { userId: req.user.id } }
        });

        // Response Resubmission
        if (surveyPost) {
            // Storing responses for temporary modification
            let tempDoneResponse = surveyPost.responses.pop(0);

            // Modifying existing response of user
            if (tempDoneResponse.userId.toString() === req.user.id.toString()) {
                tempDoneResponse.questionResponses = responses;
                surveyPost.responses.push(tempDoneResponse);
                await surveyPost.save();

                const isQuestions = await Questions.findOne({ _id: isPollSurvey.questions });
                let tempQuestions = isQuestions

                // Reconstructing Data
                tempQuestions.questions.forEach((question) => {
                    responses.forEach((response) => {
                        if (question._id.toString() === response.questionId.toString()) {
                            question.questionOptions.forEach((option) => {
                                let isIn = option.users.includes(req.user.id.toString().toLowerCase());
                                if (option[response.answerIndex]) {
                                    if (!isIn) {
                                        option.users.push(req.user.id.toString().toLowerCase());
                                    }
                                } else {
                                    if (isIn) {
                                        option.users.pop(req.user.id.toString().toLowerCase());
                                    }
                                }
                            })
                        }
                    })
                });
                await Questions.findByIdAndUpdate({ _id: isQuestions._id }, { questions: tempQuestions.questions }, { new: true });
            }

            isResponseModification = true;
        }
        // New Response
        else {
            const isQuestions = await Questions.findOne({ _id: isPollSurvey.questions });
            let tempQuestions = isQuestions

            // Reconstructing Data
            tempQuestions.questions.forEach((question, index) => {
                responses.forEach((response) => {
                    if (question._id.toString() === response.questionId.toString()) {
                        question.questionOptions.forEach((option) => {
                            if (option[response.answerIndex]) {
                                let isIn = option.users.includes(req.user.id.toString().toLowerCase());
                                if (!isIn) {
                                    option.users.push(req.user.id.toString().toLowerCase());

                                }
                            }
                        })
                    }
                })
            });

            await Questions.findByIdAndUpdate({ _id: isQuestions._id }, { questions: tempQuestions.questions }, { new: true });

            // Saving response
            let tempResponse = {
                userId: req.user.id,
                questionResponses: responses
            }
            isPollSurvey.responses.push(tempResponse)
            await isPollSurvey.save()
        }

    } catch (error) {
        console.error(error);
        throw error; // Re-throw the error for handling at the calling point
    }

    // Sending Response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: isResponseModification ? `Response modified successfully!` : `Response has been submitted!`
    })
});

// 10) Resubmission of Response to Poll and Survey
exports.eventsZar_Poll_Survey_Question_Response_ReSubmission = CatchAsync(async (req, res, next) => {

    // Verifying the Response Body
    const { postId, responses } = req.body;

    // Checking if all data provided
    if (!postId) {
        return next(new ErrorHandler(`Please provide all details`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    if (responses && responses.length == 0) {
        return next(new ErrorHandler(`Please provide responses`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    for (let i = 0; i < responses.length; i++) {
        if (!responses[i].questionId && !responses[i].answerIndex) {
            return next(new ErrorHandler(`Please provide question and it's answer`, HttpStatusCode.UNPROCESSABLE_ENTITY))
        }
    }

    // Sending Response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Response has been resubmitted successfully!`
    })
})

// 11) Share Count Increment
exports.eventsZar_Increase_A_Share_Click_Counter = CatchAsync(async (req, res, next) => {

    // Getting Post ID
    const { posts } = req.body;
    if (!Array.isArray(posts)) {
        return next(new ErrorHandler(`Please provide posts data in correct format!`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    }
    if (posts.length === 0) {
        return next(new ErrorHandler(`No post ID's provided!`, HttpStatusCode.UNPROCESSABLE_ENTITY))
    }

    // Updating the View Counter
    const isUpdated = await postsCounterIncrement(posts, 'shareCounter');
    if (!isUpdated) {
        return next(new ErrorHandler(`Something went wrong while updating the view counts`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Sending Response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: 'Share count has been increased'
    })
})

// 12) Searching Near by cities
exports.eventsZar_Search_Cities_For_User = CatchAsync(async (req, res, next) => {

    const query = req.query.city?.toLowerCase();
    const userId = req.user?.id; // Adjust based on your authentication mechanism

    try {
        // // Retrieve user's country (replace with your logic)
        // let userCountry;
        // if (userId) {
        //     userCountry = await Users.findById(userId).select('country');
        // } else {
        //     // Handle case where user is not authenticated (optional)
        //     res.status(401).json({ message: 'Unauthorized' });
        //     return;
        // }

        // if (!userCountry) {
        //     res.status(400).json({ message: 'User country not found' });
        //     return;
        // }

        const cities = await LocationService.searchCities(query, 'india');
        
        res.status(HttpStatusCode.SUCCESS).json({
            success: true,
            message: 'Available cities',
            cities
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error searching cities' });
    }
})