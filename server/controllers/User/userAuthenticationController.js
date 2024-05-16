import OTPGenerator from "otp-generator";
import Users from "../../models/User/Users.js";
import UserActivityTracker from '../../models/User/UserActivityTracker.js';
import CatchAsync from "../../error/catchAsync.js";
import ErrorHandler from "../../utils/errorHandler.js";
import authToken from "../../utils/authToken.js";
import sendEmail from "../../utils/sendMails.js";
import { HttpStatusCode } from "../../enums/httpHeaders.js";

/* 
    Index: 
        01) Sign Up
        02) Sign In
        03) Sign out
        04) OTP Verification
        05) Resend OTP
        06) Forgot Password
        07) Reset Account OTP Verification
        08) Reset Password
        09) Update Password
*/

// ✅ 01) --- SIGN UP ---
export const social_Media_New_User_Account_Sign_Up = CatchAsync(async (req, res, next) => {
  // Destructuring request body for checking if any data missing
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return next(new ErrorHandler("Missing fields", HttpStatusCode.NOT_ACCEPTABLE));
  }

  // Password
  if (req.body.password.length < 8) {
    return next(new ErrorHandler("Password should be at least 8 characters long.", HttpStatusCode.BAD_REQUEST));
  }

  // Username Length Check
  if (username.length > 50) {
    return next(new ErrorHandler("Username should not be more then 50 characters long.", HttpStatusCode.BAD_REQUEST));
  }

  // Checking if username already been used by other customers
  const isUsernameExist = await Users.findOne({ username: new RegExp(req.body.username, 'i') });
  if (isUsernameExist) {
    return next(new ErrorHandler(`User already exit with provided ${req.body.username}`, HttpStatusCode.CONFLICT));
  }

  // Checking if email already been used by other customers
  const isEmailExist = await Users.findOne({ email: new RegExp(req.body.email, 'i') });
  if (isEmailExist) {
    return next(new ErrorHandler(`User already exit with provided ${req.body.email}`, HttpStatusCode.CONFLICT));
  }

  // Generating OTP for customer account
  const OTP = OTPGenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    digits: true,
    specialChars: false,
  });

  // Creating user account
  let user = await Users.create({
    email: req.body.email.toLowerCase(),
    username: req.body.username.toLowerCase(),
    password: req.body.password,
    userOTP: {
      otp: parseInt(OTP),
      timeToExpire: Date.now() + 960000,
      OTPVerified: false,
    },
    location: { type: 'Point', coordinates: [0.1, 0.1] }
  }).catch((error) => {
    console.log("SIGN UP ERROR: ", error);
    return next(new ErrorHandler("Something went wrong while account creation, Please try again!", HttpStatusCode.FORBIDDEN));
  });

  // Sending OTP to vendor
  let message = `Dear ${username},\n\nGreetings of the day,\n\nYou account registration verification OTP is ${OTP}.\n\nThanks,\nSocial Media`;
  try {
    await sendEmail({
      email: req.body.email,
      subject: "Account Sign Up",
      message,
    });
  } catch (error) {
    await Users.findByIdAndDelete({ _id: user._id });
    console.log("Email Send Error: ", error);
    return next(new ErrorHandler(error.message, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending response
  const sendToken = await authToken.userSendToken(res, user);

  if (!sendToken.success) {
    return next(new ErrorHandler(`Something went wrong while login, Please try again`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  } else {
    await UserActivityTracker.create({ user: user._id, loginTime: Date.now() });
    return res.status(HttpStatusCode.SUCCESS).json({
      success: true,
      message: "OTP sent to you email address!",
    })
  }
});

// ✅ 02) --- SIGN IN ---
export const social_Media_Account_Sign_In = CatchAsync(async (req, res, next) => {
  // Destructuring request body
  const { password } = req.body;
  if (!password || typeof password !== "string" || (!req.body.username && !req.body.email)) {
    return next(new ErrorHandler(`Please provide credentials!`, HttpStatusCode.BAD_REQUEST));
  }
  if (!req.body.username && typeof req.body.email !== "string" || typeof req.body.username !== "string" && !req.body.email) {
    return next(new ErrorHandler(`Please provide appropriate credentials!`, HttpStatusCode.BAD_REQUEST));
  }

  let user;
  if (req.body.username) {
    // Checking if user exist
    user = await Users.findOne({ username: new RegExp(req.body.username, 'i') }).select(
      "+password +isAccountVerified +isProfileCompleted +role"
    );

    // Checking password are same or not
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(
        new ErrorHandler(
          "Invalid email or password",
          HttpStatusCode.UNAUTHORIZED
        )
      );
    }
  } else if (req.body.email) {
    // Checking if user exist
    user = await Users.findOne({ email: { username: new RegExp(req.body.email, 'i') } })
      .select("+password +isAccountVerified +isProfileCompleted +role");

    // Checking password are same or not
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new ErrorHandler("Invalid email or password", HttpStatusCode.UNAUTHORIZED));
    }
  }

  // Sending response
  const sendToken = await authToken.userSendToken(res, user);

  if (!sendToken.success) {
    return next(new ErrorHandler(`Something went wrong while login, Please try again`, HttpStatusCode.BAD_REQUEST));
  } else {
    let isUserActivity = await UserActivityTracker.findOneAndUpdate({ user: user._id }, { loginTime: Date.now() }, { new: true })
      .catch((err) => { console.log(err) });
    if (!isUserActivity) {
      await UserActivityTracker.create({
        user: user._id,
        loginTime: Date.now()
      })
    }

    return res.status(HttpStatusCode.SUCCESS).json({
      success: true,
      message: "Sign In Successful!",
    })
  }
});

// ✅ 03) --- SIGN OUT ---
export const social_Media_Account_Sign_Out = CatchAsync(async (req, res, next) => {

  //  Setting null value for header authorization and cookies
  res.removeHeader("Authorization");
  res.cookie("userToken", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  // Saving user Activity
  await UserActivityTracker.findOneAndUpdate({ user: req.user.id }, { logoutTime: Date.now() }, { new: true }).catch((err) => { console.log(err) });

  // Sending response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: "You are logged out.",
  });
});

// ✅ 04) --- OTP VERIFICATION ---
export const social_Media_Account_OTP_Verification = CatchAsync(async (req, res, next) => {
  // Destructuring header data and checking if OTP provided.
  const userID = req.user.id;
  if (!req.body.otp)
    return next(new ErrorHandler(`Please provide OTP`, HttpStatusCode.NOT_ACCEPTABLE));

  // Checking user existence
  const user = await Users.findById({ _id: userID })
    .select("userOTP")
    .catch((err) => {
      return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.FORBIDDEN));
    });
  if (!user) {
    return next(new ErrorHandler(`Something went wrong!`, HttpStatusCode.NOT_FOUND));
  }

  // Verifying otp
  if (user.userOTP.OTPVerified) {
    return res.status(HttpStatusCode.SUCCESS).json({
      success: false,
      message: "Account OTP already verified!",
    });
  } else if (user.userOTP.timeToExpire <= Date.now()) {
    user.userOTP.otp = undefined;
    user.userOTP.timeToExpire = undefined;
    user.userOTP.OTPVerified = false;
    await user.save();
    return res.status(HttpStatusCode.SUCCESS).json({
      success: false,
      message: "OTP has been Expired, Try with new one!",
    });
  } else if (user.userOTP.timeToExpire > Date.now()) {
    if (user.userOTP.otp === parseInt(req.body.otp)) {
      user.userOTP.otp = undefined;
      user.userOTP.timeToExpire = undefined;
      user.userOTP.OTPVerified = true;
      user.isAccountVerified = true;
      user.isAccountActive = true;
      await user.save();
      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "OTP Verified",
      });
    } else {
      return res.status(HttpStatusCode.SUCCESS).json({
        success: false,
        message: "Wrong OTP provided",
      });
    }
  }
});

// ✅ 05) --- RESEND OTP ---
export const social_Media_Account_Resend_OTP = CatchAsync(async (req, res, next) => {
  // Destructuring required data from request header
  const userID = req.user.id;
  const user = await Users.findById({ _id: userID })
    .select("email username userOTP")
    .catch((err) => {
      return next(new ErrorHandler("Server error!", HttpStatusCode.INTERNAL_SERVER_ERROR));
    });

  // Generating OTP for customer account
  const OTP = OTPGenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    digits: true,
    specialChars: false,
  });

  // Saving otp
  user.userOTP.otp = OTP;
  user.userOTP.timeToExpire = Date.now() + 960000;
  user.userOTP.OTPVerified = false;
  await user.save();

  // d) Sending OTP
  let message = `Dear ${user.username},\n\nGreeting of the day,\n\nPlease use this OTP ${OTP} for verification.\n\nThanks,\nSocial Media`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Verification OTP",
      message,
    });
    user.userOTP.otp = OTP;
    user.userOTP.timeToExpire = Date.now() + +960000;
    user.userOTP.OTPVerified = false;
    await user.save();
  } catch (err) {
    return next(new ErrorHandler(err.message, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: "OTP Sent Successfully!",
  });
});

// ✅ 06) --- FORGOT PASSWORD ---
export const social_Media_Account_Forgot_Password = CatchAsync(async (req, res, next) => {
  // Checking if any of the data aren't provided
  if (!req.body.email && !req.body.username) {
    return next(new ErrorHandler(`Please provide either email or username`, HttpStatusCode.NOT_ACCEPTABLE));
  }

  // Fetching User data
  const user = req.body.username
    ? await Users.findOne({
      username: new RegExp(req.body.username, 'i'),
    }).select("username email forgotOTP")
    : await Users.findOne({ email: new RegExp(req.body.email, 'i') }).select(
      "username email forgotOTP"
    );

  // Checking if user exists
  if (!user) {
    return next(new ErrorHandler(`There is no user exist with given ${req.body.email ? `email address ` + req.body.email : "username " + req.body.username}!`, HttpStatusCode.NOT_FOUND));
  }

  // Generating OTP for user account
  const OTP = OTPGenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    digits: true,
    specialChars: false,
  });

  // Saving otp
  user.userOTP.otp = OTP;
  user.userOTP.timeToExpire = Date.now() + +960000;
  user.userOTP.OTPVerified = false;
  await user.save();

  // d) Sending OTP
  let message = `Dear ${user.username},\n\nGreeting of the day,\n\nPlease use this OTP ${OTP} for verification.\n\nThanks,\nSocial Media`;
  try {
    await sendEmail({
      email: user.email,
      subject: "OTP for Account Recovery!",
      message,
    });
    user.forgotOTP.otp = OTP;
    user.forgotOTP.timeToExpire = Date.now() + 960000;
    user.forgotOTP.OTPVerified = false;
    await user.save();
  } catch (err) {
    return next(new ErrorHandler(err.message, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: "OTP Sent Successfully!",
  });
});

// ✅ 07) --- RESET ACCOUNT OTP VERIFICATION ---
export const social_Media_Account_Forgot_Password_OTP_Verify = CatchAsync(async (req, res, next) => {
  // Destructuring header data and checking if OTP provided.

  if (!req.body.otp) {
    return next(new ErrorHandler(`Please provide OTP`, HttpStatusCode.BAD_REQUEST));
  }

  // Fetching User data
  const user = req.body.username
    ? await Users.findOne({ username: new RegExp(req.body.username, 'i') })
      .select("username email forgotOTP")
    : await Users.findOne({ email: new RegExp(req.body.email, 'i') })
      .select("username email forgotOTP");

  // Checking if user exists
  if (!user) {
    return next(new ErrorHandler(`There is no user exist with given ${email ? `email address` + email : "username " + username}!`, HttpStatusCode.NOT_FOUND));
  }

  // Verifying otp
  if (user.forgotOTP.OTPVerified) {
    return res.status(HttpStatusCode.SUCCESS).json({
      success: false,
      message: "Account OTP already verified!",
    });
  } else if (user.forgotOTP.timeToExpire <= Date.now()) {
    user.forgotOTP.otp = undefined;
    user.forgotOTP.timeToExpire = undefined;
    user.forgotOTP.OTPVerified = false;
    await user.save();
    return res.status(HttpStatusCode.SUCCESS).json({
      success: false,
      message: "OTP has been Expired, Try with new one!",
    });
  } else if (user.forgotOTP.timeToExpire > Date.now()) {
    if (user.forgotOTP.otp === parseInt(req.body.otp)) {
      user.forgotOTP.otp = undefined;
      user.forgotOTP.timeToExpire = undefined;
      user.forgotOTP.OTPVerified = true;
      await user.save();
      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "OTP Verified",
      });

    } else {
      return res.status(HttpStatusCode.SUCCESS).json({
        success: false,
        message: "Wrong OTP provided",
      });
    }
  }
});

// ✅ 08) --- RESET PASSWORD ---
export const social_Media_Account_Reset_Password = CatchAsync(async (req, res, next) => {
  // Destructuring request body and checking for all fields required
  const { newPassword, confirmPassword } = req.body;
  if (!req.body.username && !req.body.email || !newPassword || !confirmPassword) {
    return next(new ErrorHandler(`Please provide all details!`, HttpStatusCode.NOT_ACCEPTABLE));
  }

  // Fetching vendor details and checking if they exist
  const user = req.body.username
    ? await Users.findOne({ username: new RegExp(req.body.username, 'i') })
      .select("username email forgotOTP")
    : await Users.findOne({ email: new RegExp(req.body.email, 'i') })
      .select("username email forgotOTP");

  if (!user) {
    return next(new ErrorHandler(`No vender exist with given detail!`, HttpStatusCode.NOT_FOUND));
  }

  // c) Checking if OTP is verified and if new and confirm password are same
  if (!user.forgotOTP.OTPVerified) {
    return next(new ErrorHandler(`Account reset OTP yet not verified!`, HttpStatusCode.FORBIDDEN));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler(`Password doesn't matched!`, HttpStatusCode.NOT_ACCEPTABLE));
  }

  // d) Saving password and other details
  user.password = req.body.newPassword;
  user.forgotOTP.otp = undefined;
  user.forgotOTP.timeToExpire = undefined;
  user.forgotOTP.OTPVerified = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // e) Sending response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `Account recovery is successful!`,
  })
});

// ✅ 09) --- UPDATE PASSWORD ---
export const social_Media_Account_Password_Update = CatchAsync(async (req, res, next) => {
  // Destructuring User Id from header
  const userID = req.user.id;

  // Fetching user details
  const is_user = await Users.findById({ _id: userID })
    .select("+password")
    .catch((err) => {
      return next(new ErrorHandler(`Something went wrong`, HttpStatusCode.INTERNAL_SERVER_ERROR));
    });

  // Checking if user fetched successfully
  if (!is_user) {
    return next(new ErrorHandler(`Something went wrong`, HttpStatusCode.NOT_FOUND));
  }

  // Checking saved and provided password are save or not
  const isPasswordMatch = await is_user.correctPassword(req.body.oldPassword, is_user.password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Old password is incorrect", HttpStatusCode.FORBIDDEN));
  }

  // Saving password after all validation check
  is_user.password = req.body.newPassword;
  await is_user.save();

  // Sending Response
  res.status(HttpStatusCode.SUCCESS).json({
      success: true,
      message: "Password updated Successfully",
    });
});