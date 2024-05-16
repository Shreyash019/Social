const mongoose = require('mongoose');
const Users = require("../../../models/User/Users");
const ContainerPost = require("../../../models/Post/ContainerPost");
const PostLikes = require("../../../models/Post/PostLikes");
const PostComments = require("../../../models/Post/PostComments");
const FollowerFollowings = require('../../../models/FollowerFollowing/Followers&Followings');
const CommentReplies = require("../../../models/Post/CommentReplies");
const APIFeatures = require("../../../utils/apiFeatures");
const ErrorHandler = require("../../../utils/errorHandler");
const { HttpStatusCode } = require("../../../enums/httpHeaders");
const { UtilsKeywords } = require('../../../enums/utilsEnum');
const CatchAsync = require("../../../error/catchAsync");
const PostFilter = require("../../../utils/postFilter");
const { eventsZarGeneralResponse } = require("../../../utils/responses");
const { PostFilteringAndRestructuring, singlePostFilterAndRestructure } = require('../../../Services/PostResponses/postResponses');

/*
    Index:
        01) Single Post Details
        02) Like/DisLike a post
        03) New Comment on a post
        04) Reply on a comment
        05) All Comments on a post
        06) All Likes Details of a Post
        07) Particular Comment Deletion of a Post
        08) Deletion of Reply of a Comment
        09) User Account My All Post
        10) Business Account My All Post
        11) Normal Post Deletion
        12) Event Post Deletion
*/

// ✅ 01) --- SINGLE POST DETAILS ---
exports.eventsZar_Account_Single_Post_Details = CatchAsync(async (req, res, next) => {
  // Variable Declaration
  const ifError = undefined;

  // Destructuring params data
  const { postID } = req.params;

  if (!postID) { return next(new ErrorHandler(`Post reference is not provided!`, HttpStatusCode.INTERNAL_SERVER_ERROR)); }

  // Finding the requested post in DB
  const singlePostData = await ContainerPost.findById({ _id: postID })
    .populate("normalPost")
    .populate("eventPost")
    .populate({
      path: "surveyPost",
      populate: ({
        path: 'questions'
      })
    })
    .populate({
      path: "postOwner",
      select: "userAccount businessAccount +role +hasBusiness",
      populate: [
        {
          path: "userAccount",
          select: "firstname lastname profilePicture",
        },
        {
          path: "businessAccount",
          select: "name profilePicture",
        },
      ],
    })
    .catch((err) => {
      console.log(err);
      ifError = true;
    });

  // Checking for error
  if (ifError || !singlePostData) {
    return next(new ErrorHandler(`Something went wrong while fetching post details`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Like Data fetch
  const isLiked = await PostLikes.findOne({ user: req.user.id }).catch((err) => console.log(err));
  let user = {
    _id: req.user.id,
    postArray: isLiked?.posts ? isLiked.posts : undefined
  }

  // Service for destructuring and organization or response
  const responseObject = await singlePostFilterAndRestructure(singlePostData, user);

  // Sending response
  eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: `Fetched Single Post Details Successfully!`,
    responseObject,
  });
});

// ✅ 02) --- LIKE/DISLIKE A POST ---
exports.eventsZar_Like_A_Post_By_User = CatchAsync(async (req, res, next) => {

  // Destructuring the request body
  const { postID, isLike } = req.body;
  if (!postID || typeof (isLike) !== 'boolean') {
    return next(new ErrorHandler(`Please provide all details`, HttpStatusCode.BAD_REQUEST))
  }

  // Fetching post
  const isPost = await ContainerPost.findById({ _id: postID })
    .catch((err) => { console.log(err) });
  if (!isPost) {
    return next(new ErrorHandler(responseData.message, responseData.statusCode));
  }

  // Checking If post like is allowed on post
  if (!isPost.likeAllowed) {
    return next(new ErrorHandler(`Like Feature on this post is disabled by owner!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
  }

  // Checking type if for like or dislike
  let userLikedData = await PostLikes.findOne({ user: req.user.id });
  if (isLike) {
    if (!userLikedData) {
      await PostLikes.create({ user: req.user.id, posts: [postID] });
      isPost.userLikes.recentLikedBy.pop();
      isPost.userLikes.recentLikedBy.push(req.user.username);
      if (isPost.userLikes.count <= 0) {
        isPost.userLikes.count = 1;
      } else {
        isPost.userLikes.count += 1;
      }
      await isPost.save();
    } else if (!userLikedData.posts.includes(postID)) {
      userLikedData.posts.push(postID)
      await userLikedData.save();
      isPost.userLikes.recentLikedBy.pop();
      isPost.userLikes.recentLikedBy.push(req.user.username);
      if (isPost.userLikes.count <= 0) {
        isPost.userLikes.count = 1;
      } else {
        isPost.userLikes.count += 1;
      }
      await isPost.save();
    }
  } else {
    if (userLikedData.posts.includes(postID)) {
      userLikedData.posts.pop(postID);
      if (isPost.userLikes.count > 0) {
        isPost.userLikes.count -= 1;
      } else {
        isPost.userLikes.count = 0;
      }
      await isPost.save();
      await userLikedData.save();
    }
  }

  // Sending response
  eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: isLike ? 'You liked the post' : 'You disliked the post'
  });
})

// ✅ 03) --- NEW COMMENT ON A POST ---
exports.eventsZar_New_Comment_On_A_Post = CatchAsync(async (req, res, next) => {
  // Checking for logged in user
  if (!req.user.id) {
    return next(
      new ErrorHandler(`Please login again`, HttpStatusCode.UNAUTHORIZED)
    );
  }

  // Destructuring a Request Object
  const { postID, commentText } = req.body;

  // Checking if all data provided
  if (!commentText || !postID) {
    return next(
      new ErrorHandler(`Please provide all details`, HttpStatusCode.SUCCESS)
    );
  }

  // Checking if post exist
  let isPost = await ContainerPost.findOne({ _id: postID }).select("commentAllowed commentCount");
  if (!isPost) {
    return next(new ErrorHandler(`Post not found!`, HttpStatusCode.NOT_FOUND));
  }

  // Checking if comment allowed
  if (isPost && !isPost.commentAllowed) {
    return next(new ErrorHandler(`Comment feature is disabled for this post!`,HttpStatusCode.FORBIDDEN));
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
  try{
    await ContainerPost.findByIdAndUpdate({ _id: postID }, {$inc: {commentCount: 1}}, {new: true})
  } catch(error){
    console.log(error);
    await PostComments.findByIdAndDelete({_id: comment._id});
    return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending response
  eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: "Comment added successfully!",
  });
});

// ✅ 04) --- REPLY ON A COMMENT ---
exports.eventsZar_Reply_On_A_Comment_Of_A_Post = CatchAsync(async (req, res, next) => {
  // Checking for logged in user
  if (!req.user.id) {
    return next(new ErrorHandler(`Please login again`, HttpStatusCode.UNAUTHORIZED));
  }

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
  const commentReply = await CommentReplies.create({ comment: isComment._id, content: replyText, user_id: req.user.id });

  if (!commentReply) {
    return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending response
  eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: "Reply made successfully!",
  }
  );
});

// ✅ 05) --- ALL COMMENTS ON A POST ---
exports.eventsZar_Account_Single_Post_Comment_Details = CatchAsync(async (req, res, next) => {
  // Variable Declaration
  const ifError = undefined;

  // Destructuring params data
  const { pid } = req.params;

  if (!pid) {
    return next(
      new ErrorHandler(
        `Post reference is not provided!`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );
  }

  // Finding the requested post in DB
  const singlePostData = await ContainerPost.findById({ _id: pid })
    .select("commentAllowed")
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
    const apiFeatures = new APIFeatures(
      PostComments.find({ containerPost: singlePostData._id })
        .populate({
          path: "user_id",
          select: "role userAccount businessAccount",
          populate: {
            path: "userAccount",
            select: "firstname lastname profilePicture",
          },
          // populate: ({
          //     path: 'businessAccount',
          //     select: 'profilePicture name'
          // })
        })
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
            select: "role userAccount businessAccount",
            populate: {
              path: "userAccount",
              select: "firstname lastname profilePicture",
            },
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

  // Response destructure and send response
  const responseArray =
    PostFilter.commentsFilterAndRestructure(commentsWithReplies);

  // Sending response
  eventsZarGeneralResponse(
    req,
    res,
    HttpStatusCode.SUCCESS,
    {
      success: true,
      message: `Fetched all comments!`,
      commentCount,
      comments: responseArray,
    }
  );
}
);

// ✅ 06) --- ALL LIKES DETAILS OF A POST ---
exports.eventsZar_Account_Single_Post_Likes_Details = CatchAsync(async (req, res, next) => {
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
    posts: singlePostData._id,
  });
  let likes = undefined;
  if (singlePostData.likeAllowed) {
    const apiFeatures = new APIFeatures(
      PostLikes.find({ posts: singlePostData._id })
        .select("user createdAt")
        .populate({
          path: "user",
          select: "username +role userAccount businessAccount",
          populate: {
            path: "userAccount",
            select: "profilePicture firstname lastname",
          },
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
  const responseArray = PostFilter.likesFilterAndRestructure(
    likes,
    followingList
  );

  if (responseArray.length === 0) {
    // Sending response
    eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
      success: true,
      message: `No likes!`,
      likeCount,
      likes: [],
    });
  }

  // Sending response
  eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: `Fetched all likes!`,
    likeCount,
    likes: responseArray,
  });
}
);

// ✅ 07) --- PARTICULAR COMMENT DELETION OF A POST --- 
exports.eventsZar_User_Post_Comment_Delete = CatchAsync(async (req, res, next) => {

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
    try{
      await ContainerPost.findByIdAndUpdate({ _id: pid }, {$inc: {commentCount: -1}}, {new: true});
    } catch(error){
      console.log(error);
      await PostComments.findByIdAndDelete({_id: cid});
      return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }

  // Sending Response
  eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: `Comment deleted successfully!`
  })
})

// ✅ 08) --- DELETION OF A REPLY OF A POST ---
exports.eventsZar_Deleting_User_Comment_Reply = CatchAsync(async (req, res, next) => {

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
  eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: `Comment reply deleted successfully!`
  })
})

// ✅ 09) --- USER ACCOUNT MY ALL POSTS ---
exports.eventsZar_User_Account_All_Owned_Posts = CatchAsync(async (req, res, next) => {

  // Generating a query to get user's posts
  const isPostType = req.query?.postType?.toLowerCase() || 'normal';
  const postPrivacy = req.query?.postPrivacy?.toLowerCase() || 'public';
  let postsQuery = {
    $or: [{
      $and: [
        { ownerType: 'customer' },
        { postType: isPostType },
        { postVisibility: postPrivacy },
        { postOwner: req.user.id },
        { isEventPost: false }
      ]
    }]
  };

  // Fetching  all my posts counts
  const getCounts = await ContainerPost.countDocuments(postsQuery);
  const pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

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
    , req.query).pagination(pageLimit);
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

  // Filter
  // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
  const result = await PostFilteringAndRestructuring(isPost, user);

  // Sending response
  eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: `All feeds`,
    feedCount: getCounts,
    feeds: result
  })
});

// ✅ 10) --- BUSINESS ACCOUNT MY ALL POSTS ---
exports.eventsZar_Business_Account_All_Owned_Posts = CatchAsync(async (req, res, next) => {

  // Generating a query to get user's posts
  const isPostType = req.query?.postType?.toLowerCase() || 'normal';
  let postsQuery = {
    $or: [{
      $and: [
        { ownerType: 'business' },
        { postType: isPostType },
        { postOwner: req.user.id },
        { isEventPost: false }
      ]
    }]
  };

  // Fetching  all my posts counts
  const getCounts = await ContainerPost.countDocuments(postsQuery);
  const pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

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
    , req.query).pagination(pageLimit);
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

  // Filter
  // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
  const result = await PostFilteringAndRestructuring(isPost, user);

  // Sending response
  eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: `All feeds`,
    feedCount: getCounts,
    feeds: result
  })
});

// ✅ 11) --- NORMAL POST DELETION ---
exports.eventsZar_Deleting_A_Post = CatchAsync(async (req, res, next) => {

  // Fetching Post Details
  const { pid } = req.params;

  if (!pid) {
    return next(new ErrorHandler(`Information of post not provided which need to be deleted`, HttpStatusCode.NOT_FOUND));
  } else if (!mongoose.Types.ObjectId.isValid(pid)) {
    return next(new ErrorHandler(`Post information is incorrect!`, HttpStatusCode.BAD_REQUEST));
  }

  // 1. Fetching Post Details
  const isPost = await ContainerPost.findByIdAndDelete({ _id: pid })
    .catch((err) => { console.log(err) });

  // Checking for post details
  if (!isPost) {
    return next(new ErrorHandler(`Post already been deleted!`, HttpStatusCode.BAD_GATEWAY));
  }

  // 2. Find comments associated with the post ID
  const comments = await PostComments.find({ containerPost: pid });

  // 3. Delete comments (optional: filter by specific criteria if needed)
  await PostComments.deleteMany({ _id: { $in: comments.map(comment => comment._id) } });

  // 4. Delete replies associated with deleted comments (separate query)
  const commentIds = comments.map(comment => comment._id);
  await CommentReplies.deleteMany({ comment: { $in: commentIds } });

  // 5. Delete the related post data


  // Sending response
  eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: 'Post deleted successfully!',
  })
})

// ❌ 12) --- USER EVENT POST DELETION ---
exports.eventsZar_Deleting_A_User_Event = CatchAsync(async (req, res, next) => {

  // Fetching User Event Details
})

// ✅ 13) --- OTHER USER ALL PUBLIC POST ---
exports.eventsZar_Other_User_Account_All_Posts = CatchAsync(async (req, res, next) => {

  // Generating a query to get user's posts
  const isPostType = req.query?.postType?.toLowerCase() || 'normal';

  // Checking If User ID provided or not
  if (!req.params.uid) {
    return next(new ErrorHandler(`User data is not provided`, HttpStatusCode.UNPROCESSABLE_ENTITY))
  }
  const userID = req.params.uid;

  // Verifying provided ID is correct or not
  if (!mongoose.Types.ObjectId.isValid(userID)) {
    return next(new ErrorHandler(`You are trying to fetch information using wrong information`, HttpStatusCode.FORBIDDEN));
  }

  if(!req.user){
    return next(new ErrorHandler('You are not logged in!', HttpStatusCode.UNAUTHORIZED))
  } else{
    if(!req.user.isViewEventAllowed && isPostType==='event'){
      return next(new ErrorHandler(`User events view is private!`, HttpStatusCode.UNAUTHORIZED))
    } 
    if(req.user.isViewPostAllowed && isPostType==='normal'){
      return next(new ErrorHandler(`User post view is private!`, HttpStatusCode.UNAUTHORIZED))
    }
  }

  let postsQuery = {
    $or: [{
      $and: [
        // { ownerType: 'customer' },
        { postType: isPostType },
        { postVisibility: 'public' },
        { postOwner: userID },
        { isEventPost: false }
      ]
    }]
  };

  // Fetching  all my posts counts
  const getCounts = await ContainerPost.countDocuments(postsQuery);
  const pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;

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
    , req.query).pagination(pageLimit);
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

  // Filter
  // const result = PostFilter.allPostFilterAndRestructure(isPost, user);
  const result = await PostFilteringAndRestructuring(isPost, user);

  // Sending response
  eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: `All feeds`,
    feedCount: getCounts,
    feeds: result
  })
});