import mongoose from 'mongoose';
import PostDataContainer from '../../models/Post/PostDataContainer.js';
import PostLikes from '../../models/Post/PostLikes.js';
import PostComments from '../../models/Post/PostComments.js';
import CommentReplies from "../../models/Post/CommentReplies.js";
import ErrorHandler from '../../utils/errorHandler.js';
import { HttpStatusCode } from '../../enums/httpHeaders.js';
import CatchAsync from '../../error/catchAsync.js';
import ApiFeatures from '../../utils/apiFeatures.js';


// Like dislike a post
export const social_Media_Like_A_Post_By_User = CatchAsync(async (req, res, next) => {

  // Destructuring the request body
  const { postID, isLike } = req.body;
  if (!postID || typeof (isLike) !== 'boolean') {
    return next(new ErrorHandler(`Please provide all details`, HttpStatusCode.BAD_REQUEST))
  }

  // Fetching post
  const isPost = await PostDataContainer.findById({ _id: postID })
    .catch((err) => { console.log(err) });
  if (!isPost) {
    return next(new ErrorHandler(responseData.message, responseData.statusCode));
  }

  // Checking If post like is allowed on post
  if (!isPost.likeAllowed) {
    return next(new ErrorHandler(`Like Feature on this post is disabled by owner!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
  }

  // // Checking type if for like or dislike
  let userLikedData = await PostLikes.findOne({ user: req.user.id });
  if (isLike) {
    if (!userLikedData) {
      await PostLikes.create({
        user: req.user.id,
        posts: [postID],
      });
      await PostDataContainer.findByIdAndUpdate(
        postID,
        {
          'userLikes.recentLikedBy': req.user.username,
          $inc: { 'userLikes.count': 1 }
        },
        { new: true }
      );
    } else if (!userLikedData.posts.includes(postID)) {
      userLikedData.posts.push(postID)
      await userLikedData.save();
      await PostDataContainer.findByIdAndUpdate(
        postID,
        {
          'userLikes.recentLikedBy': req.user.username,
          $inc: { 'userLikes.count': 1 }
        },
        { new: true }
      );
    }
  }
  else {
    if (userLikedData && userLikedData?.posts.length >=0 && userLikedData?.posts.includes(postID)) {
      let l1 = await PostLikes.findOneAndUpdate(
        {
          user: req.user.id,
          posts: postID,
        },
        {
          $pull: { posts: postID }
        },
        { new: true },
      ).catch((error)=>{
        console.log(error.toString())
        return next(new ErrorHandler(`Something went wrong please try again`, HttpStatusCode.UNPROCESSABLE_ENTITY))
      });
      await PostDataContainer.findByIdAndUpdate(
        postID,
        {
          $inc: { 'userLikes.count': isPost.userLikes.count > 0 ? -1 : 0 }
        },
        { new: true }
      );
    }
  }

  // Sending response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: isLike ? 'You liked the post' : 'You disliked the post'
  });
})

// New Comment
export const social_Media_New_Comment_On_A_Post = CatchAsync(async (req, res, next) => {

  // Destructuring a Request Object
  const { postID, commentText } = req.body;

  // Checking if all data provided
  if (!commentText || !postID) {
    return next(
      new ErrorHandler(`Please provide all details`, HttpStatusCode.SUCCESS)
    );
  }

  // Checking if post exist
  let isPost = await PostDataContainer.findOne({ _id: postID }).select("allowComment commentCount");
  if (!isPost) {
    return next(new ErrorHandler(`Post not found!`, HttpStatusCode.NOT_FOUND));
  }

  // Checking if comment allowed
  if (isPost && !isPost.allowComment) {
    return next(new ErrorHandler(`Comment feature is disabled for this post!`, HttpStatusCode.FORBIDDEN));
  }

  // Creating Comment For a post
  const comment = await PostComments.create({
    containerPost: isPost._id,
    content: commentText,
    user_id: req.user.id,
  });

  if (!comment) {
    return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Saving Comment Count
  try {
    await PostDataContainer.findByIdAndUpdate({ _id: postID }, { $inc: { commentCount: 1 } }, { new: true })
  } catch (error) {
    console.log(error);
    await PostComments.findByIdAndDelete({ _id: comment._id });
    return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending response
  social_MediaGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: "Comment added successfully!",
  });
});

// Comment New Reply
export const social_Media_Reply_On_A_Comment_Of_A_Post = CatchAsync(async (req, res, next) => {
  // Destructuring a Request Object
  const { replyText, commentID } = req.body;

  // Checking if all data provided
  if (!replyText || !commentID) {
    return next(new ErrorHandler(`Please provide all details`, HttpStatusCode.SUCCESS));
  }

  // Checking if post exist
  let isComment = await PostComments.findOne({ _id: commentID });
  if (!isComment) {
    return next(new ErrorHandler(`Comment not found!`, HttpStatusCode.NOT_FOUND));
  }

  // Creating Comment For a post
  const commentReply = await CommentReplies.create({
    comment: isComment._id,
    content: replyText,
    user_id: req.user.id,
  });

  if (!commentReply) {
    return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending response
  social_MediaGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: "Reply made successfully!",
  });
});

// Post All Comments
export const social_Media_Single_Post_Comment_Details = CatchAsync(async (req, res, next) => {
  // Variable Declaration
  const ifError = undefined;

  // Destructuring params data
  const { pid } = req.params;

  if (!pid) {
    return next(new ErrorHandler(`Post reference is not provided!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Finding the requested post in DB
  const singlePostData = await PostDataContainer.findById({ _id: pid })
    .select("allowComment")
    .catch((err) => {
      console.log(err);
      ifError = true;
    });

  // Checking if post exist and comment allowed
  if (!singlePostData) {
    return next(new ErrorHandler(`Post not found!`, HttpStatusCode.NOT_FOUND));
  } else if (!singlePostData.commentAllowed) {
    return next(new ErrorHandler(`Comment feature for this post is disabled!`, HttpStatusCode.NOT_FOUND));
  }

  // Fetching comment data
  const commentCount = await PostComments.countDocuments({
    containerPost: singlePostData._id,
  });
  let comments = undefined;
  if (singlePostData.commentAllowed) {
    const apiFeatures = new ApiFeatures(
      PostComments.find({ containerPost: singlePostData._id })
        .sort({ createdAt: -1 }),
      req.query
    ).pagination(5);
    comments = await apiFeatures.query;
  }

  let commentsWithReplies = [];
  if (singlePostData.commentAllowed && comments && comments.length > 0) {
    commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await CommentReplies.find({ comment: comment._id })
          .populate({
            path: "user_id",
          })
          .sort({ createdAt: -1 });
        return {
          ...comment.toObject(),
          replies: replies.map((reply) => reply.toObject()),
        };
      })
    );
  }

  // Checking for error
  if (ifError) {
    return next(
      new ErrorHandler(
        `Something went wrong while fetching post details`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );
  }

  // Sending response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `Fetched all comments!`,
    commentCount,
    comments: responseArray,
  });
});

// Post All Likes
export const social_Media_Single_Post_Likes_Details = CatchAsync(async (req, res, next) => {
  // Variable Declaration
  const ifError = undefined;

  // Destructuring params data
  const { pid } = req.params;

  if (!pid) {
    return next(new ErrorHandler(`Post reference is not provided!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  const followingList = await FollowerFollowings.find({ followedByUser: req.user.id }).select('followedToUser')
  // Finding the requested post in DB
  const singlePostData = await ContainerPost.findById({ _id: pid })
    .select("likeAllowed")
    .catch((err) => {
      console.log(err);
      ifError = true;
    });

  // Checking if post exist and comment allowed
  if (!singlePostData) {
    return next(
      new ErrorHandler(`Post not found!`, HttpStatusCode.NOT_FOUND)
    );
  } else if (!singlePostData.likeAllowed) {
    return next(
      new ErrorHandler(
        `Comment feature for this post is disabled!`,
        HttpStatusCode.NOT_FOUND
      )
    );
  }

  // Fetching comment data
  const likeCount = await PostLikes.countDocuments({
    posts: singlePostData._id, 'postData.post': singlePostData._id,
  });
  let likes = undefined;
  if (singlePostData.likeAllowed) {
    const apiFeatures = new APIFeatures(
      PostLikes.find({ posts: singlePostData._id, 'postData.post': singlePostData._id })
        .select("user createdAt postData")
        .populate({
          path: "user",
          select: "username +role userAccount businessAccount",
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
        .sort({ createdAt: -1 }),
      req.query
    ).pagination(20);

    likes = await apiFeatures.query;
  }

  // Checking for error
  if (ifError) {
    return next(
      new ErrorHandler(
        `Something went wrong while fetching post details`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );
  }

  // Response destructure and send response
  const responseArray = PostFilter.likesFilterAndRestructure(likes, followingList);

  // Sending response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: responseArray.length === 0 ? `No likes!` : `Fetched all likes!`,
    likeCount,
    likes: responseArray.length === 0 ? [] : responseArray,
  });
});

// Comment Delete
export const social_Media_User_Post_Comment_Delete = CatchAsync(async (req, res, next) => {

  // Checking for post id and comment id
  const { pid, cid } = req.params;

  // If there is no post Id or comment Id then return
  if (!pid || !cid || !mongoose.Types.ObjectId.isValid(pid) || !mongoose.Types.ObjectId.isValid(cid)) {
    return next(new ErrorHandler(`Please provide all details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
  }

  // Fetching comment details
  const isComment = await PostComments.findById({ _id: cid, containerPost: pid })
    .catch((err) => console.log(err));
  if (!isComment) {
    return next(new ErrorHandler('Either comment already been deleted or something went wrong', HttpStatusCode.FORBIDDEN));
  }
  // Fetching comment details
  const isPost = await ContainerPost.findById({ _id: pid })
    .catch((err) => console.log(err));
  if (!isComment) {
    return next(new ErrorHandler('Either comment already been deleted or something went wrong', HttpStatusCode.FORBIDDEN));
  }

  // Checking for allowed deletion
  if (isComment.user_id.toString().toLowerCase() !== req.user.id.toString().toLowerCase() && isPost.postOwner._id.toString().toLowerCase() !== req.user.id.toString().toLowerCase()) {
    return next(new ErrorHandler(`You don't have permission to delete a comment`, HttpStatusCode.FORBIDDEN));
  }

  // First Fetching and deleting All the replies of comment
  try {
    await CommentReplies.deleteMany({ comment: cid })
  } catch (err) {
    console.log(err)
    return next(new ErrorHandler(`Something went wrong`, HttpStatusCode.FORBIDDEN));
  }

  // Fetching and Deleting the comment from database
  try {
    await PostComments.findOneAndDelete({ _id: cid, containerPost: pid })
  } catch (err) {
    console.log(err)
    return next(new ErrorHandler(`Something went wrong`, HttpStatusCode.FORBIDDEN));
  }

  // Decreasing comment count Comment Count
  try {
    await PostDataContainer.findByIdAndUpdate({ _id: pid }, { $inc: { commentCount: -1 } }, { new: true });
  } catch (error) {
    console.log(error);
    await PostComments.findByIdAndDelete({ _id: cid });
    return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending Response
  social_MediaGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: `Comment deleted successfully!`
  })
})

// Reply Delete
export const social_Media_Deleting_User_Comment_Reply = CatchAsync(async (req, res, next) => {

  // Checking for post id and comment id
  const { cid, rid } = req.body;

  // If there is no post Id or comment Id then return
  if (!cid || !rid || !mongoose.Types.ObjectId.isValid(cid) || !mongoose.Types.ObjectId.isValid(rid)) {
    return next(new ErrorHandler(`Please provide all details!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
  }

  // Fetching comment details
  const isReply = await CommentReplies.findById({ _id: rid })
    .catch((err) => console.log(err));

  if (!isReply) {
    return next(new ErrorHandler('Either reply already been deleted or something went wrong', HttpStatusCode.FORBIDDEN));
  }
  // Fetching comment details
  const isComment = await PostComments.findById({ _id: cid })
    .catch((err) => console.log(err));
  if (!isComment) {
    return next(new ErrorHandler('Either comment already been deleted or something went wrong', HttpStatusCode.FORBIDDEN));
  }

  // Checking for allowed deletion
  if (isReply.user_id.toString().toLowerCase() !== req.user.id.toString().toLowerCase() && isComment._id.toString().toLowerCase() !== req.user.id.toString().toLowerCase()) {
    return next(new ErrorHandler(`You don't have permission to delete a comment`, HttpStatusCode.FORBIDDEN));
  }

  // Fetching and Deleting the comment reply from database
  try {
    await CommentReplies.findOneAndDelete({ _id: rid, comment: cid })
  } catch (err) {
    console.log(err)
    return next(new ErrorHandler(`Something went wrong`, HttpStatusCode.FORBIDDEN));
  }

  // Sending Response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `Comment reply deleted successfully!`
  });
})