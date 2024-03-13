import Post from '../models/Post.js';
import User from '../models/User.js';
import ErrorHandler from '../utils/errorHandler.js';
import CatchAsync from '../middlewares/catchAsync.js'


// 1) Getting all posts
export const socio_Get_All_Posts = CatchAsync(async (req, res, next)=>{
    const posts = await Post.find().populate('user')

    return res.status(200).json({
        success: true,
        length: posts.length,
        posts: posts.reverse()
    })
});


// 2) Getting single posts
export const socio_Get_Single_Post = CatchAsync(async (req, res, next)=>{
    const postId = req.params.id;
    const post = await Post.findById(postId).populate('user');
    if(!post){
        return next(new ErrorHandler('Post doesn;t exist'), 404)
    }
    return res.status(200).json({
        sucess: true,
        posts: post
    })
});

// 3) Getting all posts of logged in user
export const socio_Get_All_Post_Auth_User = CatchAsync(async (req, res, next)=>{
    const userId = req.user.id;

    const posts = await Post.find({user: userId}).populate('user');
    console.log(userId)
    if(!posts){
        return next(new ErrorHandler('Posts doesn;t exist'), 404)
    }
    return res.status(200).json({
        sucess: true,
        length: posts.length,
        posts: posts.reverse()
    })
});

// 4) Getting all post of any user
export const socio_Get_All_Posts_User = CatchAsync(async (req, res, next)=>{
    const postId = req.params.id;
    const posts = await Post.findById(postId).populate('user');
    if(!posts){
        return next(new ErrorHandler('Post doesn;t exist'), 404)
    }
    return res.status(200).json({
        sucess: true,
        posts: posts.reverse()
    })
});

// 5) Creating user post
export const socio_Creating_User_Post = CatchAsync(async (req, res, next)=>{
    const { description, picturePath } = req.body;
    // console.log(req.body)
    const userId = req.user.id;
    const userPost = await Post.create({
        user: userId,
        description,
        picturePath,
        likes: [],
        comments: [],
    });
    // User
    // const user = await User.findOne({_id: userId});
    // user.post.push(userPost)
    // await user.save();

    return res.status(201).json({
        success: true,
        posts: userPost
    })
});

// 6) Deleting user post
export const socio_Deleting_User_Post = CatchAsync(async (req, res, next)=>{
    let pid = req.params.id;
    let uid = req.user.id;

    const ckposts = await Post.findById({_id: pid, user: uid}).populate('user');
    if(!ckposts){
        return res.status(400).send(`User don't matched.`)
    }
    else if(ckposts.user._id.toString() !==req.user.id.toString()){
        return res.status(400).send(`You don't have permission to delete the blog.`)
    }
    await Post.findByIdAndDelete(pid)
    const posts = await Post.find().populate().populate('user');
    return res.status(201).json({
        success: true,
        length: posts.length,
        posts: posts.reverse()
    })
    // }
});

// 7) Post like and dislike
export const socio_Like_Dislike_User_Post = CatchAsync(async (req, res, next)=>{
    const postId = req.params.id;
    const userId = req.user.id;
    console.log(postId, '-@_@_@_',userId)
    const post = await Post.findById(postId);
    const isLiked = post.likes.includes(userId);

    if(isLiked){
        post.likes = post.likes.filter(like => like.toString()!==userId.toString());
        await post.save();
    } else {
        post.likes.push(userId);
        await post.save();
    }

    const posts = await Post.find().populate('user')
    
    return res.status(200).json({
        success: true,
        posts: posts.reverse()
    })
});

// 8) Comment creating and update
export const socio_Creating_Updating_Post_Comment = CatchAsync(async (req, res, next)=>{
    return res.status(200).send('Creaing and updating comment on post.')
});

// 9) Deleting comment on post
export const socio_Deleting_Comment_Post = CatchAsync(async (req, res, next)=>{
    return res.status(200).send('Deleting comment on post')
});


