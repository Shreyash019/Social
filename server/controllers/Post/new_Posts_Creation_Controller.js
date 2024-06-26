import PostDataContainer from '../../models/Post/PostDataContainer.js';
import Questions from '../../models/Post/Questions.js';
import ErrorHandler from '../../utils/errorHandler.js';
import { HttpStatusCode } from '../../enums/httpHeaders.js';
import CatchAsync from '../../error/catchAsync.js';
import FileProcessor from '../../Services/fileProcessing/fileProcessorService.js';

/*
    Index:
        02) 🔥 New Post Creation
        03) 🔥 New Event Creation
*/

// Poll and Survey Question formatting
async function questionFormatting(questions) {
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
    let returnObject = {
        error: false,
        questionID: undefined,
        message: ""
    }
    try {
        const question = await Questions.create({ questions: formattedQuestions });
        returnObject.questionID = question.id;
        returnObject.message = "Question created successfully";
    } catch (error) {
        console.log(error.message);
        returnObject.error = true,
            returnObject.message = error.message;
    }
    return returnObject;
}

// 01) New Post Creation
export const social_Media_User_New_Post = CatchAsync(async (req, res, next) => {

    // Destructuring required data from request body
    const { postType } = req.body;

    if (postType.toLowerCase() === 'general' && !req.files?.postAssets && !req.body.postSummary) {
        return next(new ErrorHandler(`Not allowed to create a post`, HttpStatusCode.BAD_REQUEST))
    }

    // Saving the image and video
    let postAssets = [];
    if (req.files && req.files.postAssets) {
        const processedFileResponse = await FileProcessor(req.files.postAssets, `socialMedia/customer/${req.user.id}/posts`, req.user.id.toString());
        if (!processedFileResponse.success) {
            return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
        } else {
            postAssets = processedFileResponse.results;
        }
    }
    const privacy = req.body.sharedWith?.length > 0 ? req.body.sharedWith : req.user.accountPrivacy;
    let captions;
    if(req.body.postCaptions){
        captions = req.body.postCaptions.split(",").map((data=>data.trim()))
        captions.forEach((caption)=>{
            if(caption[0]!=="#"){
                return next(new ErrorHandler(`Captions is not in correct structure`, HttpStatusCode.BAD_REQUEST))
            }
        })
    }

    // Creating Post Body Data
    let postBody = {
        author: req.user.id,
        postType: req.body.postType.toLowerCase(),
        postAssets: postAssets ?? undefined,
        postCaptions: captions ?? undefined,
        postSummary: req.body.postCaptions ?? undefined,
        isEventPost: req.body.eventID ? true : false,
        eventID: req.body.eventID ?? undefined,
        country: req.user.country ?? undefined,
        allowComment: req.body.allowComment ?? true,
        likeCountVisible: req.body.likeCountVisible ?? true,
        likeCommentVisible: req.body.likeCommentVisible ?? true,
        questions: undefined,
        responses: undefined,
        moreInformation: undefined,
        isPostActive: true,
        isPostPublic: privacy,
        sharedWith: req.body.sharedWith?.length > 0 ? req.body.sharedWith : [],
    }

    if (req.body.postType.toString() === 'poll') {
        destructuredPostType = 'poll';
        if (!req.body.questions || !Array.isArray(req.body.questions)) {
            return next(new ErrorHandler(`Please provide all details in correct format!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        }
        const questions = await questionFormatting(req.body.questions);
        if (questions.error) {
            return next(new ErrorHandler(questions.message, HttpStatusCode.INTERNAL_SERVER_ERROR));
        }
        postBody.questions = questions.questionID;
        postBody.responses = [];
    } else if (req.body.postType.toString() === 'survey') {
        destructuredPostType = 'survey';
        if (!req.body.questions || !Array.isArray(req.body.questions)) {
            return next(new ErrorHandler(`Please provide all details in correct format!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
        }
        const questions = await questionFormatting(req.body.questions);
        if (questions.error) {
            return next(new ErrorHandler(questions.message, HttpStatusCode.INTERNAL_SERVER_ERROR));
        }
        postBody.questions = questions.questionID;
        postBody.responses = [];
    } else if(postType !== 'general') {
        return next(new ErrorHandler(`Invalid post type!`, HttpStatusCode.BAD_REQUEST));
    }

    // Let created data
    let isMetaDataAboutPost = {
        isPostCreated: undefined,
        isQuestionCreated: postBody.questions
    }
    try {
        isMetaDataAboutPost.isPostCreated = await PostDataContainer.create(postBody);
        if(postType === 'survey' || postType === 'survey'){
            await Questions.findByIdAndUpdate({ _id: isMetaDataAboutPost.isQuestionCreated }, { postDataContainer: isMetaDataAboutPost.isPostCreated._id }, { new: true })
        }
    }
    catch (error) {
        if (isMetaDataAboutPost.isPostCreated) {
            await PostDataContainer.findByIdAndDelete({ _id: isMetaDataAboutPost.isPostCreated });
        }
        if (isMetaDataAboutPost.isQuestionCreated) {
            await Questions.findByIdAndDelete({ _id: isMetaDataAboutPost.isQuestionCreated });
        }
        return next(new ErrorHandler(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Sending response
    return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `Post created successfully!`
    });
})