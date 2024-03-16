// Built In
import  OTPgenerator from "otp-generator"

// Database
import  Consumer from "../../models/Consumer/Consumer"
import  FollowerFollowings from '../../models/FollowerFollowing/Followers&Followings'

// Created Middleware
import  CatchAsync from "../../middlewares/catchAsync"
import  ErrorHandler from "../../utils/errorHandler"
import  authToken from "../../utils/authToken"
import  sendEmail from "../../utils/sendMails"
import  { HttpStatusCode } from "../../enums/httpHeaders"
import  fileUploadService from "../../Services/FileUploadService"
import { socio_Single_File_Upload } from '../../Services/ImageUploader'
import  eventZar_Response from '../../utils/responses'

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
        10) Profile Information
        11) Profile Information Update
        12) Account Profile Image Update
        13) Address Update
        14) User Location Update
        15) User Profile Information By Other User 
*/

// ✅ 01) --- SIGN UP ---
export const socio_User_Account_Sign_Up = CatchAsync(async (req, res, next) => {
  // Destructuring request body for checking if any data missing
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return next(new ErrorHandler("Missing fields", HttpStatusCode.NOT_ACCEPTABLE));
  }

  // Password
  if (req.body.password.length < 8) {
    return next(new ErrorHandler("Password should be at least 8 characters long.", HttpStatusCode.UNPROCESSABLE_ENTITY));
  }

  // Checking if username or email already been used by other customers
  const isUsernameExist = await Consumer.findOne({ username: req.body.username });
  const isEmailExist = await Consumer.findOne({ email: req.body.email });

  if (isUsernameExist) {
    return next(new ErrorHandler(`User already exit with provided ${req.body.username}`, HttpStatusCode.UNPROCESSABLE_ENTITY));
  }
  if (isEmailExist) {
    return next(new ErrorHandler(`User already exit with provided ${req.body.email}`, HttpStatusCode.UNPROCESSABLE_ENTITY));
  }

  // Generating OTP for customer account
  const OTP = OTPgenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    digits: true,
    specialChars: false,
  });

  // Creating user account
  let user = await Consumer.create({
    email: req.body.email.toLowerCase(),
    username: req.body.username.toLowerCase(),
    role: "customer",
    password: req.body.password,
    userOTP: {
      otp: parseInt(OTP),
      timeToExpire: Date.now() + 960000,
      OTPVerified: false,
    },
  });
  let accountID = await UserAccount.create({ user: Consumer._id });
  user.userAccount = accountID._id;
  await user.save();

  // Sending OTP to vendor

  let message = `Dear ${username},\n\nGreetings of the day,\n\nYou account registration verification OTP is ${OTP}.\n\nThanks,\nEvents ZAR`;
  try {
    await sendEmail({
      email: req.body.email,
      subject: "Events ZAR Sign Up",
      message,
    });
  } catch (err) {
    await Consumer.findByIdAndDelete({ _id: user._id });
    await UserAccount.findByIdAndDelete({ _id: user.userAccount });
    return next(
      new ErrorHandler(err.message, HttpStatusCode.INTERNAL_SERVER_ERROR)
    );
  }

  // Sending response
  const sendToken = await authToken.ConsumerendToken(res, user);

  if (!sendToken.success) {
    return next(new ErrorHandler(`Something went wrong while login, Please try again`, HttpStatusCode.BAD_REQUEST))
  } else {
    eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
      success: true,
      message: 'OTP sent to you email address!',
      usertoken: sendToken.userToken,
      isVerified: false,
      isProfile: false,
      OTP
    })
  }


});

// ✅ 02) --- SIGN IN ---
export const socio_User_Account_Sign_In = CatchAsync(async (req, res, next) => {
  // Destructuring request body
  const { password } = req.body;
  if (!password || typeof password !== "string" || (!req.body.username && !req.body.email)) {
    return next(new ErrorHandler(`Please provide credentials!`, HttpStatusCode.NOT_ACCEPTABLE));
  }
  if ((!req.body.username && typeof req.body.email !== "string") || (typeof req.body.username !== "string" && !req.body.email)) {
    return next(new ErrorHandler(`Please provide appropriate credentials!`, HttpStatusCode.NOT_ACCEPTABLE));
  }

  let user;
  if (req.body.username) {
    // Checking if user exist
    user = await Consumer.findOne({ username: req.body.username }).select(
      "+password +isAccountVerified +isProfileCompleted"
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
    user = await Consumer.findOne({ email: req.body.email }).select(
      "+password +isAccountVerified +isProfileCompleted"
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
  }

  user.forgotOTP.otp = undefined;
  user.forgotOTP.timeToExpire = undefined;
  user.forgotOTP.OTPVerified = undefined;
  await user.save();

  // Sending response
  const sendToken = await authToken.ConsumerendToken(res, user);

  if (!sendToken.success) {
    return next(new ErrorHandler(`Something went wrong while login, Please try again`, HttpStatusCode.BAD_REQUEST))
  } else {
    eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
      success: true,
      message: 'Sign In Successful!',
      usertoken: sendToken.userToken,
      isVerified: user.isAccountVerified,
      isProfile: user.isProfileCompleted
    })
  }
});

// ✅ 03) --- SIGN OUT ---
export const socio_User_Account_Sign_Out = CatchAsync(async (req, res, next) => {
  //  Setting null value for header authorization and cookie
  res.removeHeader("Authorization");
  res.cookie("usertoken", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  // Sending response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: "You are logged out.",
  });
});

// ✅ 04) --- OTP VERIFICATION ---
export const socio_User_Account_OTP_Verification = CatchAsync(
  async (req, res, next) => {
    // Destructuring header data and checking if OTP provided.
    const userID = req.user.id;
    if (!req.body.otp)
      return next(
        new ErrorHandler(`Please provide OTP`, HttpStatusCode.NOT_ACCEPTABLE)
      );

    // Checking user existence
    const user = await Consumer.findById({ _id: userID })
      .select("userOTP")
      .catch((err) => {
        return next(
          new ErrorHandler(`Something went wrong!`, HttpStatusCode.FORBIDDEN)
        );
      });
    if (!user)
      return next(
        new ErrorHandler(`Something went wrong!`, HttpStatusCode.NOT_FOUND)
      );

    // Verifying otp
    if (user.userOTP.OTPVerified) {
      return eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: false,
        message: "Account OTP already verified!",
      });
    } else if (user.userOTP.timeToExpire <= Date.now()) {
      user.userOTP.otp = undefined;
      user.userOTP.timeToExpire = undefined;
      user.userOTP.OTPVerified = false;
      await user.save();
      return eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
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
        return eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
          success: true,
          message: "OTP Verified",
        });
      } else {
        return eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
          success: false,
          message: "Wrong OTP provided",
        });
      }
    }
  }
);

// ✅ 05) --- RESEND OTP ---
export const socio_User_Account_Resend_OTP = CatchAsync(async (req, res, next) => {
  // Destructuring required data from request header
  const userID = req.user.id;
  const user = await Consumer.findById({ _id: userID })
    .select("email username userOTP")
    .catch((err) => {
      return next(
        new ErrorHandler("Server error!", HttpStatusCode.INTERNAL_SERVER_ERROR)
      );
    });

  // Generating OTP for customer account
  const OTP = OTPgenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    digits: true,
    specialChars: false,
  });

  // Saving otp
  user.userOTP.otp = OTP;
  user.userOTP.timeToExpire = Date.now() + 960000;
  user.userOTP.OTPVerifed = false;
  await user.save();

  // d) Sending OTP
  let message = `Dear ${user.username},\n\nGreeting of the day,\n\nPlease use this OTP ${OTP} for verification.\n\nThanks,\nEvents ZAR`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Verification OTP",
      message,
    });
    user.userOTP.otp = OTP;
    user.userOTP.timeToExpire = Date.now() + +960000;
    user.userOTP.OTPVerifed = false;
    await user.save();
  } catch (err) {
    return next(
      new ErrorHandler(err.message, HttpStatusCode.INTERNAL_SERVER_ERROR)
    );
  }

  // Sending response
  eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: "OTP Sent Successfully!",
    OTP
  })
});

// ✅ 06) --- FORGOT PASSWORD ---
export const socio_User_Account_Forgot_Password = CatchAsync(
  async (req, res, next) => {
    // CHecking if any of the data aren't provided

    if (!req.body.email && !req.body.username)
      return next(
        new ErrorHandler(
          `Please provide either email or username`,
          HttpStatusCode.NOT_ACCEPTABLE
        )
      );

    // Fetching User data
    const user = req.body.username
      ? await Consumer.findOne({
        username: req.body.username.toLowerCase(),
      }).select("username email forgotOTP")
      : await Consumer.findOne({ email: req.body.email.toLowerCase() }).select(
        "username email forgotOTP"
      );

    // Checking if user exists
    if (!user)
      return next(
        new ErrorHandler(
          `There is no user exist with given ${req.body.email
            ? `email address ` + req.body.email
            : "username " + req.body.username
          }!`,
          HttpStatusCode.NOT_FOUND
        )
      );

    // Generating OTP for user account
    const OTP = OTPgenerator.generate(4, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      digits: true,
      specialChars: false,
    });

    // Saving otp
    user.userOTP.otp = OTP;
    user.userOTP.timeToExpire = Date.now() + +960000;
    user.userOTP.OTPVerifed = false;
    await user.save();

    // d) Sending OTP
    let message = `Dear ${user.username},\n\nGreeting of the day,\n\nPlease use this OTP ${OTP} for verification.\n\nThanks,\nEvents ZAR`;
    try {
      await sendEmail({
        email: user.email,
        subject: "OTP for Account Recovery!",
        message,
      });
      user.forgotOTP.otp = OTP;
      user.forgotOTP.timeToExpire = Date.now() + 960000;
      user.forgotOTP.OTPVerifed = false;
      await user.save();
    } catch (err) {
      return next(
        new ErrorHandler(err.message, HttpStatusCode.INTERNAL_SERVER_ERROR)
      );
    }

    // Sending response
    eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
      success: true,
      message: "OTP Sent Successfully!",
    })
  }
);

// ✅ 07) --- RESET ACCOUNT OTP VERIFICATION ---
export const socio_User_Account_Forgot_Password_OTP_Verify = CatchAsync(
  async (req, res, next) => {
    // Destructuring header data and checking if OTP provided.

    if (!req.body.otp)
      return next(
        new ErrorHandler(`Please provide OTP`, HttpStatusCode.NOT_ACCEPTABLE)
      );

    // Fetching User data
    const user = req.body.username
      ? await Consumer.findOne({
        username: req.body.username.toLowerCase(),
      }).select("username email forgotOTP")
      : await Consumer.findOne({ email: req.body.email }).select(
        "username email forgotOTP"
      );

    // Checking if user exists
    if (!user)
      return next(
        new ErrorHandler(
          `There is no user exist with given ${email ? `email address` + email : "username " + username
          }!`,
          HttpStatusCode.NOT_FOUND
        )
      );

    // Verifying otp
    if (user.forgotOTP.OTPVerified) {
      eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: false,
        message: "Account OTP already verified!",
      })
    } else if (user.forgotOTP.timeToExpire <= Date.now()) {
      user.forgotOTP.otp = undefined;
      user.forgotOTP.timeToExpire = undefined;
      user.forgotOTP.OTPVerified = false;
      await user.save();
      eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
        success: false,
        message: "OTP has been Expired, Try with new one!",
      })
    } else if (user.forgotOTP.timeToExpire > Date.now()) {
      if (user.forgotOTP.otp === parseInt(req.body.otp)) {
        user.forgotOTP.otp = undefined;
        user.forgotOTP.timeToExpire = undefined;
        user.forgotOTP.OTPVerifed = true;
        await user.save();
        eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
          success: true,
          message: "OTP Verified",
        })
      } else {
        eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
          success: false,
          message: "Wrong OTP provided",
        })
      }
    }
  }
);

// ✅ 08) --- RESET PASSWORD ---
export const socio_User_Account_Reset_Password = CatchAsync(
  async (req, res, next) => {
    // Destructuring request body and checking for all fields required
    const { newPassword, confirmPassword } = req.body;
    if (
      (!req.body.username && !req.body.email) ||
      !newPassword ||
      !confirmPassword
    )
      return next(
        new ErrorHandler(
          `Plese provide all details!`,
          HttpStatusCode.NOT_ACCEPTABLE
        )
      );

    // Fetching vendor details and checking if they exist
    const user = req.body.username
      ? await Consumer.findOne({
        username: req.body.username.toLowerCase(),
      }).select("username email forgotOTP")
      : await Consumer.findOne({ email: req.body.email }).select(
        "username email forgotOTP"
      );
    if (!user)
      return next(
        new ErrorHandler(
          `No vender exist with given detail!`,
          HttpStatusCode.NOT_FOUND
        )
      );

    // c) Checking if OTP is verified and if new and confirm password are same
    if (!user.forgotOTP.OTPVerifed)
      return next(
        new ErrorHandler(
          `Account reset OTP yet not verified!`,
          HttpStatusCode.FORBIDDEN
        )
      );

    if (req.body.newPassword !== req.body.confirmPassword)
      return next(
        new ErrorHandler(
          `Password doesn't matched!`,
          HttpStatusCode.NOT_ACCEPTABLE
        )
      );

    // d) Saving password and other details
    user.password = req.body.newPassword;
    user.forgotOTP.otp = undefined;
    user.forgotOTP.timeToExpire = undefined;
    user.forgotOTP.OTPVerifed = undefined;
    (user.resetPasswordToken = undefined),
      (user.resetPasswordExpire = undefined);
    await user.save();

    // e) Sending response
    eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
      success: true,
      message: `Account recovery is successful!`,
    })
  }
);

// ✅ 09) --- UPDATE PASSWORD ---
export const socio_User_Account_Password_Update = CatchAsync(
  async (req, res, next) => {
    // Destructuring User Id from header
    const userID = req.user.id;

    // Fetching user details
    const is_user = await Consumer.findById({ _id: userID })
      .select("+password")
      .catch((err) => {
        return next(
          new ErrorHandler(
            `Something went wrong`,
            HttpStatusCode.INTERNAL_SERVER_ERROR
          )
        );
      });

    // Checking if user fetched successfully
    if (!is_user)
      return next(
        new ErrorHandler(`Something went wrong`, HttpStatusCode.NOT_FOUND)
      );

    // Checking saved and provided password are save or not
    const isPasswordMatch = await is_user.correctPassword(
      req.body.oldPassword,
      is_user.password
    );
    if (!isPasswordMatch) {
      return next(
        new ErrorHandler(
          "Old password is incorrect",
          HttpStatusCode.UNPROCESSABLE_ENTITY
        )
      );
    }

    // Saving password after all validation check
    is_user.password = req.body.newPassword;
    await is_user.save();

    // Sending Response
    eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
      success: true,
      message: "Password updated Successfully",
    })
  }
);

// ✅ 10) --- USER PROFILE INFORMATION ---
export const socio_User_Account_Information = CatchAsync(
  async (req, res, next) => {
    // Fetching user information
    const userData = await Consumer.findById({ _id: req.user.id })
      .select("+isAccountVerified +isProfileCompleted +role +hasBusiness")
      .populate("userAccount")
      .populate("businessAccount")
      .catch((err) => {
        console.log(err);
      });

    // Checking if user data
    if (!userData) {
      return next(new ErrorHandler(`User not found`, HttpStatusCode.NOT_FOUND))
    }

    // Checking for role type
    if (userData.hasBusiness && userData.role === 'business') {
      return next(new ErrorHandler(`Please switch to user profile`, HttpStatusCode.FORBIDDEN))
    }

    // Fetching follower count
    const followerCount = await FollowerFollowings.countDocuments({ followedToUser: req.user.id })
    const followingCount = await FollowerFollowings.countDocuments({ followedByUser: req.user.id })

    // Response Object
    let responseData = {
      _id: userData._id,
      username: userData.username,
      email: userData.email,
      tempAccount: userData.role,
      followers: followerCount,
      followings: followingCount,
      profile: undefined,
    };

    if (userData.isProfileCompleted) {
      responseData.profile = {
        firstname: userData.userAccount.firstname || undefined,
        lastname: userData.userAccount.lastname || undefined,
        gender: userData.userAccount.gender || undefined,
        dob: userData.userAccount.dateOfBirth || undefined,
        bio: userData.userAccount.profileSummary || undefined,
        plotnumber: userData.userAccount.plotnumber || undefined,
        address: userData.userAccount.address || undefined,
        city: userData.userAccount.city || undefined,
        state: userData.userAccount.state || undefined,
        country: userData.userAccount.country || undefined,
        zipCode: userData.userAccount.zipCode || undefined,
        location: userData.userAccount.location || undefined,
        profilePicture: userData.userAccount.profilePicture || undefined,
        gallery: null,
      };
    }

    // Sending Response
    eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
      success: true,
      message: `User Profile Information`,
      user: responseData,
      isVerified: userData.isAccountVerified,
      isProfile: userData.isProfileCompleted,
      hasBusiness: userData.hasBusiness ? true : false,
    })
  }
);

// ✅ 11) --- USER PROFILE UPDATE ---
export const socio_User_Account_Information_Update = CatchAsync(async (req, res, next) => {

  // fetching user details
  let userAccount = await UserAccount.findOne({ user: req.user.id }).catch((err) => console.log(err));

  if (!userAccount) {
    userAccount = await UserAccount.create({ user: req.user.id, });
  }

  // Is account fetched
  if (!userAccount) {
    return next(new ErrorHandler(`Something went wrong, Please try again or login again!`, HttpStatusCode.NOT_FOUND));
  }

  // Checking image size if it is provided
  if (req.files?.profilePicture && req.files.profilePicture.length > 1) {
    return next(new ErrorHandler("Please upload single image only!", HttpStatusCode.NOT_FOUND));
  }

  let profileImg = {};
  if (req.files?.profilePicture) {
    const profileImageToUpload = await fileUploadService.single_Profile_Image_File_Compress(req.files.profilePicture);
    if (profileImageToUpload.size / 1024 >= 1024) {
      return next(new ErrorHandler(`Image size  should be less than 1MB.`, HttpStatusCode.NOT_FOUND));
    } else {
      const uploadImageResult = await socio_Single_File_Upload(profileImageToUpload, `eventsZar/customer/${req.user.id}/profile`)
      profileImg = { name: profileImageToUpload.name.toString(), public_id: uploadImageResult.publicId, url: uploadImageResult.imageUrl };
    }
  }

  // Checking if required fields exists
  if ((!userAccount.firstname && !req.body.firstname) || (!userAccount.lastname && !req.body.lastname) || (!userAccount.profileSummary && !req.body.bio) || (!userAccount.dateOfBirth && !req.body.dateOfBirth) || (!userAccount.gender && !req.body.gender)) {
    return next(new ErrorHandler(`Some fields are missing!`, HttpStatusCode.NOT_FOUND));
  }

  // Updating user information
  userAccount.firstname = req.body.firstname ? req.body.firstname.toLowerCase() : userAccount.firstname;
  userAccount.lastname = req.body.lastname ? req.body.lastname.toLowerCase() : userAccount.lastname;
  userAccount.profileSummary = req.body.bio ? req.body.bio.toLowerCase() : userAccount.profileSummary;
  userAccount.dateOfBirth = req.body.dateOfBirth ? req.body.dateOfBirth : userAccount.dateOfBirth;
  userAccount.gender = req.body.gender ? req.body.gender.toLowerCase() : userAccount.gender;
  userAccount.profilePicture = req.files?.profilePicture ? profileImg : userAccount.profilePicture ? userAccount.profilePicture : undefined;
  await userAccount.save();

  // Updating user isProfile
  if (req.body.firstname && req.body.lastname && req.body.bio && req.body.dateOfBirth && req.body.gender) {
    await Consumer.findByIdAndUpdate({ _id: userAccount.user }, { isProfileCompleted: true, userAccount: userAccount._id }, { new: true });
  }

  const userData = await Consumer.findById({ _id: req.user.id })
    .select("+isAccountVerified +isProfileCompleted")
    .populate("userAccount")
    .catch((err) => {
      console.log(err);
    });

  if (!userData) {
    return next(new ErrorHandler(`User data not found`, HttpStatusCode.NOT_FOUND));
  }

  let responseData = {
    _id: userData._id,
    username: userData.username,
    email: userData.email,
    followers: userData.followers.length,
    followings: userData.followings.length,
    profile: undefined,
  };

  if (userData.isProfileCompleted) {
    responseData.profile = {
      firstname: userData.userAccount.firstname || undefined,
      lastname: userData.userAccount.lastname || undefined,
      gender: userData.userAccount.gender || undefined,
      dob: userData.userAccount.dateOfBirth || undefined,
      bio: userData.userAccount.profileSummary || undefined,
      profilePicture: undefined,
      gallery: undefined,
      plotnumber: userData.userAccount.plotnumber || undefined,
      address: userData.userAccount.address || undefined,
      city: userData.userAccount.city || undefined,
      state: userData.userAccount.state || undefined,
      country: userData.userAccount.country || undefined,
      zipCode: userData.userAccount.zipCode || undefined,
      location: userData.userAccount.location || undefined,
      profilePicture: userData.userAccount.profilePicture || undefined,
      gallery: null,
    };
  }

  // Sending Response
  eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
    success: true,
    message: `User Information Updated Successfully!`,
    user: responseData,
    isVerified: userData.isAccountVerified,
    isProfile: userData.isProfileCompleted,
    hasBusiness: userData.businessAccount ? true : false,
  })
}
);

// ✅ 12) --- ACCOUNT PROFILE IMAGE UPDATE ---
export const socio_User_Account_Profile_Image_Update = CatchAsync(
  async (req, res, next) => {
    // Checking image size if it is provided
    if (!req.files || !req.files.profilePicture) {
      return next(new ErrorHandler(`Please provide an image!`, HttpStatusCode.NOT_ACCEPTABLE));
    }
    if (req.files.profilePicture) {
      if (typeof req.files.profilePicture === "array") {
        return next(new ErrorHandler(`Please upload single image only!`, HttpStatusCode.NOT_ACCEPTABLE));
      }
      const isUser = await UserAccount.findOne({ user: req.user.id });
      if (!isUser) {
        return next(new ErrorHandler(`Please update profile first!`, HttpStatusCode.NOT_ACCEPTABLE));
      }

      let profileImg = {};
      if (req.files?.profilePicture) {
        const profileImageToUpload = await fileUploadService.single_Profile_Image_File_Compress(req.files.profilePicture);
        if (profileImageToUpload.size / 1024 >= 1024) {
          return next(new ErrorHandler(`Image size  should be less than 1MB.`, HttpStatusCode.NOT_ACCEPTABLE));
        } else {
          const uploadImageResult = await socio_Single_File_Upload(profileImageToUpload, `eventsZar/customer/${req.user.id}/profile`)
          profileImg = { name: profileImageToUpload.name.toString(), public_id: uploadImageResult.publicId, url: uploadImageResult.imageUrl };
        }
      }
    }
    isUser.profilePicture = req.files?.profilePicture ? profileImg : isUser.profilePicture ? isUser.profilePicture : undefined;
    await isUser.save();

    // Sending Response
    eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
      success: true,
      message: "Image uploaded successfully!",
    });
  }
);

// ✅ 13) --- ADDRESS UPDATE ---
export const socio_User_Account_Address_Update = CatchAsync(
  async (req, res, next) => {
    // fetching user details
    const userAccount = await UserAccount.findOne({ user: req.user.id }).catch(
      (err) => console.log(err)
    );

    // Is account fetched
    if (!userAccount) {
      return next(new ErrorHandler(`Please update profile first`, HttpStatusCode.BAD_REQUEST));
    }

    // checking for fields
    if (
      (!userAccount.plotnumber && !req.body.plotnumber) ||
      (!userAccount.address && !req.body.address) ||
      (!userAccount.city && !req.body.city) ||
      (!userAccount.state && !req.body.state) ||
      (!userAccount.country && !req.body.country) ||
      (!userAccount.zipCode && !req.body.zipCode)
    ) {
      return next(new ErrorHandler(`Please provide all details`, HttpStatusCode.NOT_ACCEPTABLE));
    }

    // updating data
    userAccount.plotnumber = req.body.plotnumber
      ? req.body.plotnumber.toLowerCase()
      : userAccount.plotnumber;
    userAccount.address = req.body.address
      ? req.body.address.toLowerCase()
      : userAccount.address;
    userAccount.city = req.body.city
      ? req.body.city.toLowerCase()
      : userAccount.city;
    userAccount.state = req.body.state
      ? req.body.state.toLowerCase()
      : userAccount.state;
    userAccount.country = req.body.country
      ? req.body.country.toLowerCase()
      : userAccount.country;
    userAccount.zipCode = req.body.zipCode
      ? parseInt(req.body.zipCode)
      : userAccount.zipCode;
    await userAccount.save();

    // Sending response
    eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.CREATED, {
      success: true,
      message: `Address has been updated successfully!`,
    });
  }
);

// ✅ 14) --- USER LOCATION UPDATE ---
export const socio_User_Account_Address_Location_Update = CatchAsync(
  async (req, res, next) => {
    // fetching user details
    const userAccount = await UserAccount.findOne({ user: req.user.id }).catch(
      (err) => console.log(err)
    );

    // Is account fetched
    if (!userAccount) {
      return next(new ErrorHandler(`Please update profile first!`, HttpStatusCode.NOT_FOUND));
    }
    //  Checking if the latitude and longitude is provided or not
    if (!req.body.coordinate[0] || !req.body.coordinate[1]) {
      return next(new ErrorHandler("Please provides  both Latitude and Longitude", HttpStatusCode.NOT_ACCEPTABLE));
    }

    // Saving details
    userAccount.location = {
      coordinates: req.body.coordinate,
    };
    await userAccount.save();

    // Sending response
    eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.CREATED, {
      success: true,
      message: `Location has been created!`,
    });
  }
);

// ✅ 15) --- USER PROFILE INFORMATION BY OTHER USER ---
export const socio_User_Account_Information_By_Other_User = CatchAsync(
  async (req, res, next) => {
    // Fetching user information
    const isUser = await Consumer.findById({ _id: req.user.id })
      .select('followers')
      .catch((err) => {
        console.log(err);
      });

    if (!isUser) {
      return next(new ErrorHandler("Please login again!", HttpStatusCode.UNAUTHORIZED));
    }

    const userData = await Consumer.findById({ _id: req.params.id })
      .select("+isAccountVerified +isProfileCompleted")
      .populate("userAccount")
      .catch((err) => {
        console.log(err);
      });

    if (!userData) {
      return next(new ErrorHandler("No User Data Found!", HttpStatusCode.NOT_FOUND));
    }

    // Check if user is followed by logged in and vice versa
    let haveYouFollowed = userData.followers.includes(req.user.id);
    let doYouFollowedByHim = isUser.followers.includes(userData._id)

    let responseData = {
      _id: userData._id,
      username: userData.username,
      email: userData.email,
      followers: userData.followers.length,
      followings: userData.followings.length,
      friends: userData.friendsList.length,
      profile: undefined,
      haveYouFollowed: haveYouFollowed,
      followsYou: doYouFollowedByHim
    };

    if (userData.isProfileCompleted) {
      responseData.profile = {
        firstname: userData.userAccount.firstname || undefined,
        lastname: userData.userAccount.lastname || undefined,
        gender: userData.userAccount.gender || undefined,
        dob: userData.userAccount.dateOfBirth || undefined,
        bio: userData.userAccount.profileSummary || undefined,
        profilePicture: userData.userAccount.profilePicture,
        gallery: undefined,
        plotnumber: userData.userAccount.plotnumber || undefined,
        address: userData.userAccount.address || undefined,
        city: userData.userAccount.city || undefined,
        state: userData.userAccount.state || undefined,
        country: userData.userAccount.country || undefined,
        zipCode: userData.userAccount.zipCode || undefined,
        location: userData.userAccount.location || undefined,
      };
    }

    // Send Response
    eventZar_Response.eventsZarGeneralResponse(req, res, HttpStatusCode.SUCCESS, {
      success: true,
      message: `User Profile Information`,
      user: responseData,
      isVerified: userData.isAccountVerified,
      isProfile: userData.isProfileCompleted,
      hasBusiness: userData.businessAccount ? true : false,
    });
  }
);