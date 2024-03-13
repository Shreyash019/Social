import User from '../models/User.js';
import ErrorHandler from '../utils/errorHandler.js';
import CatchAsync from '../middlewares/catchAsync.js'
import authToken from '../utils/authToken.js';



// 1) --------------| User Registration |--------------
export const socio_User_Registration = CatchAsync(async(req, res, next)=>{
    // a) Destructuring of data
    const {firstName, lastName, email, password} = req.body;
    // b) Checking if all required fields have been provided or not
    if(!firstName || !lastName || !email || !password){
        return res.send('Please enter details.')
    }
    // c) Checking if user already exist
    const userExist = await User.findOne({email})
    if(userExist){
        return res.send('User already exist.');
    }
    // d) If user is new then saving details in Database
    const user = await User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        viewedProfile: 0,
        impressions:0,
    })
    // e) Sending response
    return res.status(200).json({
        success: true,
        message: 'User registed.',
        user,
    })
})


// 2) --------------| User Login |--------------
export const socio_User_Login = CatchAsync(async(req, res, next)=>{
    const {email, password} = req.body;
    if(!email || !password){
        return next(new ErrorHandler(`Please enter email and password`, 400))
    }
    const userCheck  = await User.findOne({email}).select('+password');

    // a) Checking if user exist or password provided is correct or not
    if(!userCheck || !await userCheck.correctPassword(password)){
        return next(new ErrorHandler('Invalid email and password', 401))
    }
    // b) Calling token function to set cookie
    authToken.sendToken(userCheck, 200, res)
})


// 3) --------------| User Logout |--------------
export const socio_User_Logout = CatchAsync(async(req, res, next)=>{
    const user = req.user.firstName+" "+req.user.lastName
    // a) first removing the cookie 
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    })
    // b) then sending response
    res.status(200).json({
        success: true,
        message: `${user}, You are now logged out.`
    })
})


// 4) --------------| User Profile |--------------
export const socio_User_Profile = CatchAsync(async(req, res) => {
    const user = await User.findById(req.user.id).sort({ createdAt: -1 })
    return res.status(200).json({
        success: true,
        user
    })
})


// 5) --------------| User Profile Update |--------------
export const socio_User_Profile_Update = CatchAsync(async(req, res, next)=>{
    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
        new: true,
        runValidators: true,
        userFindAndModify: true
    });
    res.status(200).json({
        sucess: true,
        user,
    })
})


// 6) --------------| User Account Delete |--------------
export const socio_User_Profile_Delete = CatchAsync(async(req, res, next)=>{
    const user = await User.findById(req.user.id);
    if(!user){
        return next(new ErrorHandler(`User does not exist.`))
    }
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    })
    const deletedUser = await User.findByIdAndDelete(req.user.id)
    req.user=undefined
    res.status(200).json({
        suncess: true,
        message: 'User Deleted',
        deletedUser
    })
})


// 7) --------------| User Password Update |--------------
export const socio_User_Password_Update = CatchAsync(async(req, res, next) => {
    console.log(req.body)
    const user = await User.findById(req.user.id).select('+password');
    const passwordMatch = await user.correctPassword(req.body.oldPassword, user.password);
    if(!passwordMatch){
        return next(new ErrorHandler('Old password is incorrect', 400))
    }
    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHandler('Password not matched.', 400))
    }
    user.password = req.body.newPassword;
    await user.save();
    authToken.sendToken(user, 200, res)
})


// 8) User forgot password
export const socio_User_Password_Forgot = CatchAsync(async(req, res, next)=>{
    return res.status(200).send(`User forgot password`)
})

// 9) User reset password function
export const socio_User_Password_Reset = CatchAsync(async(req, res, next)=>{
    return res.status(200).send(`User password reset`)
})

// Other related routes

// 11 Get All users
export const socio_Get_All_Users = CatchAsync(async(req, res, next)=>{
    const uid = req.user.id
    const usersList = await User.find()
    if(!usersList){
        return next(new ErrorHandler(`Some error encountered.`))
    }

    const user = await User.find()
    const users = user.filter(us => us._id.toString()!==uid.toString());
    const usera = await User.findById(uid)
    return res.status(200).json({
        success: true,
        length: users.length,
        users: users,
        usera: usera
    })
})


// 12) Sending and cancelling friend request 
export const socio_Send_Cancel_Friend_Request = CatchAsync(async(req, res, next)=>{
    const uid = req.params.id;
    const uAction = req.params.ops

    const user = await User.findById(req.user.id)
    const frndUser = await User.findById(uid)

    if(!frndUser || user.id.toString()===frndUser.id.toString()){
        return next(new ErrorHandler(`User does not exist.`))
    }
    // LOGGED IN USER
    const authUserSent = user.sentFriend.includes(uid);
    const authUserPend = user.pendingFriends.includes(uid);
    const authUserFrnd = user.friends.includes(uid);
    console.log(authUserSent, authUserPend, authUserFrnd)

    // REQUESTED USER
    const reqUserSent = frndUser.sentFriend.includes(req.user.id)
    const reqUserPend = frndUser.pendingFriends.includes(req.user.id);
    const reqUserFrnd = frndUser.friends.includes(req.user.id);
    
    if(uAction.toString()==='add'){
        if(!authUserSent && !authUserPend && !authUserFrnd && !reqUserSent && !reqUserPend && !reqUserFrnd){
            user.sentFriend.push(uid);
            await user.save();
            frndUser.pendingFriends.push(req.user.id);
            await frndUser.save();
        } 
    } 
    else if(uAction.toString()==='undo') {
        if(authUserSent && reqUserPend && !authUserPend && !authUserFrnd && !reqUserSent && !reqUserFrnd){
            user.sentFriend.remove(uid);
            await user.save();
            frndUser.pendingFriends.remove(req.user.id);
            await frndUser.save();
        } 
    }
    else if(uAction.toString()==='cancel') {
        console.log(authUserPend)
        if(authUserPend && reqUserSent && !authUserFrnd && !authUserSent &&  !reqUserPend && !reqUserFrnd){
            console.log('cancel')
            user.pendingFriends.remove(uid);
            await user.save();
            frndUser.sentFriend.remove(req.user.id);
            await frndUser.save();
        } 
    }
    await user.save();
    await frndUser.save();
    const ruser = await User.find()
    const users = ruser.filter(us => us._id.toString()!==req.user.id.toString());
    const usera = await User.findById(req.user.id)
    return res.status(200).json({
        success: true,
        users: users,
        usera: usera
    })
})

// 13) Accepting Friend request
export const socio_Accepting_Frined_Request = CatchAsync(async(req, res, next)=>{
    const uid = req.params.id;
    const user = await User.findById(req.user.id)
    const frndUser = await User.findById({_id:uid})

    if(!frndUser || user.id.toString()===frndUser.id.toString()){
        return next(new ErrorHandler(`User does not exist.`))
    }

    // LOGGED IN USER
    const authUserSent = user.sentFriend.includes(uid);
    const authUserPend = user.pendingFriends.includes(uid);
    const authUserFrnd = user.friends.includes(uid);

    // REQUESTED USER
    const reqUserSent = frndUser.sentFriend.includes(req.user.id)
    const reqUserPend = frndUser.pendingFriends.includes(req.user.id);
    const reqUserFrnd = frndUser.friends.includes(req.user.id);
    
    if(authUserPend && reqUserSent && !authUserSent && !authUserFrnd && !reqUserPend && !reqUserFrnd){
        user.pendingFriends.remove(uid)
        user.friends.push(uid)
        await user.save();
        frndUser.sentFriend.remove(req.user.id);
        frndUser.friends.push(req.user.id);
        await frndUser.save();
    }

    const ruser = await User.find()
    const users = ruser.filter(us => us._id.toString()!==req.user.id.toString());
    const usera = await User.findById(req.user.id)
    return res.status(200).json({
        success: true,
        users: users,
        usera: usera
    })
})

// 14) Removing friend from list
export const socio_Remove_User_Friend = CatchAsync(async(req, res, next)=>{
    const uid = req.params.id;
    const user = await User.findById(req.user.id)
    const frndUser = await User.findById(uid)

    if(!frndUser || user.id.toString()===frndUser.id.toString()){
        return next(new ErrorHandler(`User does not exist.`))
    }

    // LOGGED IN USER
    const authUserSent = user.sentFriend.includes(uid);
    const authUserPend = user.pendingFriends.includes(uid);
    const authUserFrnd = user.friends.includes(uid);

    // REQUESTED USER
    const reqUserSent = frndUser.sentFriend.includes(req.user.id)
    const reqUserPend = frndUser.pendingFriends.includes(req.user.id);
    const reqUserFrnd = frndUser.friends.includes(req.user.id);

    console.log(authUserSent, authUserPend, authUserFrnd, reqUserSent, reqUserPend, reqUserFrnd);
    if(!authUserSent && !authUserPend && authUserFrnd && !reqUserSent && !reqUserPend && reqUserFrnd){
        user.friends.remove(uid)
        await user.save();
        frndUser.friends.remove(req.user.id);
        await frndUser.save();
    }
    const ruser = await User.find()
    const users = ruser.filter(us => us._id.toString()!==req.user.id.toString());
    const usera = await User.findById(req.user.id)
    return res.status(200).json({
        success: true,
        users: users,
        usera: usera
    })
})

// 15) User's friend route
export const socio_User_Friends_List = CatchAsync(async(req, res, next)=>{
    const user = await User.findById(req.user.id);
    user.pendingFriends.pop("6447449e452c67ac74be3255")
    await user.save()
    return res.status(200).json({
        success: true,
        list_length: user.friends.length,
        friends: user.friends
    })
})