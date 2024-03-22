import Consumer from '../../../models/Consumer/Consumer';
import ContainerPost from '../../../models/Post/ContainerPost';
import PostLikes from '../../../models/Post/PostLikes';
import PostComments from '../../../models/Post/PostComments';
import CommentReplies from '../../../models/Post/CommentReplies';
import APIFeatures from '../../../utils/apiFeatures';
import ErrorHandler from '../../../utils/errorHandler';
import { HttpStatusCode } from '../../../enums/httpHeaders';
import CatchAsync from '../../../error/catchAsync';
import PostFilter from '../../../utils/postFilter';
import {socioGeneralResponse} from '../../../utils/responses';

/*
    Index:
        01) Like/DisLike a post
        02) New Comment on a post
        03) Reply on a comment
        04) Likes Detail Of A Post
        05) Comments Details Of A Post

*/

// 01) Like/Dislike a post.
export const socio_Like_Dislike_A_Post = CatchAsync(async (req, res, next) => {

    // Response Object
    let errorOccur = false;
    const responseData = { statusCode: HttpStatusCode.SUCCESS, message: '', isLiked: undefined }

    // Checking if post id is provided
    let { postID } = req.body;
    if (!postID) { return next(new ErrorHandler(`Please provide correct details!`, HttpStatusCode.UNPROCESSABLE_ENTITY)); }

    // Fetching user
    const isConsumer = await Consumer.findById({ _id: req.user.id })
        .select('firstName +isProfileCompleted')
        .catch((err) => {
            errorOccur = true;
            responseData.statusCode = HttpStatusCode.SERVER_ERROR;
            responseData.success = false;
            responseData.message = `User not found!`;
        });

    //  Checking if the user exists or not.
    if (errorOccur || !isConsumer || !isConsumer.isProfileCompleted) return next(new ErrorHandler(responseData.message, responseData.statusCode));

    // Fetching user name as per user role
    let userName = isConsumer.firstName.charAt(0).toUpperCase() + isConsumer.lastName.slice(1);
    // Checking For username
    if (!userName) {
        return next(new ErrorHandler('Something went wrong', HttpStatusCode.INTERNAL_SERVER_ERROR))
    }

    // Fetching post
    const isPost = await ContainerPost.findById({ _id: postID })
        .catch((err) => {
            errorOccur = true;
            responseData.statusCode = HttpStatusCode.SERVER_ERROR;
            responseData.success = false;
            responseData.message = `Post not found!`;
        });
    // If error or post not exist
    if (errorOccur || !isPost) return next(new ErrorHandler(responseData.message, responseData.statusCode));

    // Checking If post impression is allowed on post
    if (!isPost.likeAllowed) return next(new ErrorHandler(`Like Feature on this post is disabled by owner!`, responseData.UNPROCESSABLE_ENTITY));

    // Fetching the user post like data
    const userLikedData = await PostLikes.findOne({ user: isUser._id });

    // Saving liked post details
    if (!userLikedData) {
        await PostLikes.create({ user: req.user.id, posts: [postID] });

        // Changes in Post
        if (isPost.userLikes.recentLikedBy.length >= 2) {
            let recentLikedByUser = isPost.userLikes.recentLikedBy[0]
            isPost.userLikes.recentLikedBy.pop(recentLikedByUser);
            isPost.userLikes.recentLikedBy.push(userName)
        } else {
            isPost.userLikes.recentLikedBy.push(userName);
        }
        isPost.userLikes.count += 1;

        // Response data
        responseData.statusCode = HttpStatusCode.SUCCESS;
        responseData.success = true;
        responseData.message = `You have Liked this post.`;
        await isPost.save();
    } else {
        if (userLikedData.posts.includes(postID)) {
            userLikedData.posts.pop(postID);

            // Changes in Post
            if (isPost.userLikes.recentLikedBy.includes(userName)) {
                isPost.userLikes.recentLikedBy.pop(userName);
            }
            isPost.userLikes.count -= 1;

            // Response data
            responseData.statusCode = HttpStatusCode.SUCCESS;
            responseData.success = true;
            responseData.message = `You have Disliked this post.`;
        } else {

            userLikedData.posts.push(postID);

            // Changes in Post
            if (isPost.userLikes.recentLikedBy.length >= 2) {
                let recentLikedByUser = isPost.userLikes.recentLikedBy[0]
                isPost.userLikes.recentLikedBy.pop(recentLikedByUser);
                isPost.userLikes.recentLikedBy.push(userName)
            } else {
                isPost.userLikes.recentLikedBy.push(userName);
            }
            isPost.userLikes.count += 1;

            // Response data
            responseData.statusCode = HttpStatusCode.SUCCESS;
            responseData.success = true;
            responseData.message = `You have Liked this post.`;
        }
        await userLikedData.save();
        await isPost.save();
    }

    // Sending A Response
    socioGeneralResponse.eventsZarGeneralResponse(res, res, responseData.statusCode, {
        success: responseData.success,
        message: responseData.message,
    });
})

// 02) Comment On A Post
export const socio_New_Comment_On_A_Post = CatchAsync(async (req, res, next) => {

    // Checking for logged in user
    if (!req.user.id) {
        return next(new ErrorHandler(`Please login again`, HttpStatusCode.UNAUTHORIZED))
    }

    // Destructuring a Request Object
    const { postID, commentText } = req.body;

    // Checking if all data provided
    if (!commentText || !postID) {
        return next(new ErrorHandler(`Please provide all details`, HttpStatusCode.SUCCESS));
    }

    // Checking if post exist
    let isPost = await ContainerPost.findOne({ _id: postID }).select('commentAllowed commentCount');
    if (!isPost) {
        return next(new ErrorHandler(`Post not found!`, HttpStatusCode.NOT_FOUND))
    }

    // Checking if comment allowed
    if (isPost && !isPost.commentAllowed) {
        return next(new ErrorHandler(`Comment feature is disabled for this post!`, HttpStatusCode.FORBIDDEN))
    }

    // Creating Comment For a post
    const comment = await PostComments.create({
        containerPost: isPost._id,
        content: commentText,
        user_id: req.user.id
    });

    if (!comment) {
        return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR))
    }

    // Saving Comment Count
    if (!isPost.commentCount) {
        isPost.commentCount = 1;
    } else {
        isPost.commentCount += 1;
    }
    await isPost.save();

    // Sending response
    socioGeneralResponse.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: 'Comment added successfully!',
    })
});

// 03) Reply On A Comment Post
export const socio_Reply_On_A_Comment_Of_A_Post = CatchAsync(async (req, res, next) => {

    // Destructuring a Request Object
    const { replyText, commentID } = req.body;

    // Checking if all data provided
    if (!replyText || !commentID) {
        return next(new ErrorHandler(`Please provide all details`, HttpStatusCode.SUCCESS));
    }

    // Checking if post exist
    let isComment = await PostComments.findOne({ _id: commentID });
    if (!isComment) {
        return next(new ErrorHandler(`Comment not found!`, HttpStatusCode.NOT_FOUND))
    }

    // Creating Comment For a post
    const commentReply = await CommentReplies.create({
        comment: isComment._id,
        content: replyText,
        user_id: req.user.id
    });

    if (!commentReply) {
        return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR))
    }

    // Sending response
    socioGeneralResponse.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: 'Reply made successfully!',
    })
})

// 04) Likes Detail Of A Post
export const socio_Likes_Details_Of_A_Post = CatchAsync(async (req, res, next) => {
})

// 05) Comments Details Of A Post
export const socio_Comment_Details_Of_A_Post = CatchAsync(async (req, res, next) => {

    // Variable Declaration
    const ifError = undefined;

    // Destructuring params data
    const { pid } = req.params;

    if (!pid) {
        return next(new ErrorHandler(`Post reference is not provided!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Finding the requested post in DB
    const singlePostData = await ContainerPost.findById({ _id: pid })
        .select('commentAllowed')
        .catch((err) => {
            console.log(err);
            ifError = true
        })

    // Checking if post exist and comment allowed
    if (!singlePostData) {
        return next(new ErrorHandler(`Post not found!`, HttpStatusCode.NOT_FOUND));
    } else if (!singlePostData.commentAllowed) {
        return next(new ErrorHandler(`Comment feature for this post is disabled!`, HttpStatusCode.NOT_FOUND));
    }

    // Fetching comment data
    const commentCount = await PostComments.countDocuments({ containerPost: singlePostData._id })
    let comments = undefined;
    if (singlePostData.commentAllowed) {
        const apiFeatures = new APIFeatures(PostComments.find({ containerPost: singlePostData._id })
            .populate({
                path: 'user_id',
                select: 'firstName lastName profilePicture',
            })
            .sort({ createdAt: -1 }),
            req.query).pagination(5)
        comments = await apiFeatures.query;
    }

    let commentsWithReplies = [];
    if (singlePostData.commentAllowed && comments && comments.length > 0) {
        commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await CommentReplies.find({ comment: comment._id })
                    .populate({
                        path: 'user_id',
                        select: 'firstName lastName profilePicture',
                    })
                    .sort({ createdAt: -1 });
                return { ...comment.toObject(), replies: replies.map((reply) => reply.toObject()) };
            })
        );
    }

    // Checking for error
    if (ifError) {
        return next(new ErrorHandler(`Something went wrong while fetching post details`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

    // Response destructure and send response
    const responseArray = PostFilter.commentsFilterAndRestructure(commentsWithReplies)

    // Sending response
    socioGeneralResponse.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: true,
        message: `Fetched Single Post Details Successfully!`,
        commentCount,
        comments: responseArray,
    })
})