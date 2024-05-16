import Users from "../../models/User/Users";
import FollowerFollowings from "../../models/FollowerFollowing/Followers&Followings";
import LocationService from '../../Services/locationService';
import CatchAsync from "../../error/catchAsync";
import ErrorHandler from "../../utils/errorHandler";
import { HttpStatusCode } from "../../enums/httpHeaders";
import eventZar_Response from "../../utils/responses";
import FileProcessor from '../../Services/fileProcessing/fileProcessorService';

/* 
    Index: 
        01) Profile Information
        02) Profile Information Update
        03) Account Profile Image Update
        04) Address Update
        05) User Location Update
        06) User Profile Information By Other User 
*/

// ✅ 01) --- USER PROFILE INFORMATION ---
export const social_Media_User_Account_Information = CatchAsync(async (req, res, next) => {
  // Fetching user information
  const userData = await Users.findById({ _id: req.user.id })
    .select("+isAccountVerified +isProfileCompleted +role +hasBusiness")
    .catch((err) => {
      console.log(err);
    });

  // Checking if user data
  if (!userData) {
    return next(new ErrorHandler(`User not found`, HttpStatusCode.NOT_FOUND));
  }

  // Fetching follower count
  const followerCount = await FollowerFollowings.countDocuments({ followedToUser: req.user.id, });
  const followingCount = await FollowerFollowings.countDocuments({ followedByUser: req.user.id, });

  // Response Object
  let responseData = {
    _id: userData._id,
    username: userData.username,
    email: userData.email,
    followers: followerCount,
    followings: followingCount,
    profile: undefined,
  };

  if (userData.isProfileCompleted) {
    responseData.profile = {
      firstName: userData.firstName || undefined,
      lastName: userData.lastName || undefined,
      gender: userData.gender || undefined,
      dob: userData.dateOfBirth || undefined,
      bio: userData.profileSummary || undefined,
      plotNumber: userData.plotNumber || undefined,
      address: userData.address || undefined,
      city: userData.city || undefined,
      state: userData.state || undefined,
      country: userData.country || undefined,
      zipCode: userData.zipCode || undefined,
      location: userData.location || undefined,
      profilePicture: userData.profilePicture || undefined,
    };
  }

  // Sending Response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `User Profile Information`,
    user: responseData,
  })
});

// ✅ 02) --- USER PROFILE UPDATE ---
export const social_Media_User_Profile_Information_Update = CatchAsync(async (req, res, next) => {

  // Checking image size if it is provided
  if (req.files && req.files.profilePicture) {
    if (Array.isArray(req.files.profilePicture)) {
      if (req.files.profilePicture.length > 1) {
        return next(new ErrorHandler("Please upload single image only!", HttpStatusCode.BAD_REQUEST));
      }
    }
  }

  // Checking for image and video
  let postAssets = [];
  if (req.files && req.files.profilePicture) {
    if (Array.isArray(req.files.profilePicture) && req.files.profilePicture.length > 1) {
      return next(new Error(`Please upload a single image only!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    const processedFileResponse = await FileProcessor(req.files.profilePicture, `eventsZar/customer/${req.user.id}/profile`, req.user.id.toString());
    if (!processedFileResponse.success) {
      return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
    } else {
      postAssets = processedFileResponse.results;
    }
  }

  // Checking if required fields exists
  if (!userAccount.firstName && !req.body.firstName || !userAccount.lastName && !req.body.lastName ||
    !userAccount.profileSummary && !req.body.bio || !userAccount.dateOfBirth && !req.body.dateOfBirth ||
    !userAccount.gender && !req.body.gender
  ) {
    return next(new ErrorHandler(`Some fields are missing!`, HttpStatusCode.NOT_FOUND));
  }

  // First name Length Check
  if (req.body.firstName && req.body.firstName.length > 50) {
    return next(new ErrorHandler("First name should not be more then 50 characters long.", HttpStatusCode.UNPROCESSABLE_ENTITY));
  }

  // Last name Length Check
  if (req.body.lastName && req.body.lastName.length > 50) {
    return next(new ErrorHandler("Last name should not be more then 50 characters long.", HttpStatusCode.UNPROCESSABLE_ENTITY));
  }

  // Last name Length Check
  if (req.body.bio && req.body.bio.length > 800) {
    return next(new ErrorHandler("Profile summary should not be more then 800 characters long.", HttpStatusCode.UNPROCESSABLE_ENTITY));
  }

  // Updating user information
  let userDataToUpdate = {}
  // updating data
  let userAddressToUpdate = {}
  if (req.body.firstName) {
    userAddressToUpdate.firstName = req.body.firstName;
  }
  if (req.body.lastName) {
    userAddressToUpdate.lastName = req.body.lastName;
  }
  if (req.body.profileSummary) {
    userAddressToUpdate.profileSummary = req.body.profileSummary;
  }
  if (req.body.dateOfBirth) {
    userAddressToUpdate.dateOfBirth = req.body.dateOfBirth;
  }
  if (req.body.gender) {
    userAddressToUpdate.gender = req.body.gender;
  }
  if (req.body.profilePicture) {
    userAddressToUpdate.profilePicture = postAssets[0];
  }

  // Updating user isProfile
  if (req.body.firstName && req.body.lastName && req.body.bio && req.body.dateOfBirth && req.body.gender) {
    userDataToUpdate.isProfileCompleted = true
  }

  try {
    // Saving user Data
    await Users.findByIdAndUpdate({ _id: req.user.id }, userDataToUpdate, { new: true })
  }
  catch (error) {
    console.log(error)
    return next(new ErrorHandler(`Something went wrong, Please try again or login again!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending Response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `User Information Updated Successfully!`,
  });
});

// ✅ 03) --- ACCOUNT PROFILE IMAGE UPDATE ---
export const social_Media_User_Account_Profile_Image_Update = CatchAsync(async (req, res, next) => {
  // Checking image size if it is provided
  if (!req.files || !req.files.profilePicture) {
    return next(new ErrorHandler(`Please provide an image!`, HttpStatusCode.NOT_ACCEPTABLE));
  }

  // Checking for image and video
  let postAssets = [];
  if (req.files && req.files.profilePicture) {
    if (Array.isArray(req.files.profilePicture) && req.files.profilePicture.length > 1) {
      return next(new Error(`Please upload a single image only!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    const processedFileResponse = await FileProcessor(req.files.profilePicture, `eventsZar/customer/${req.user.id}/profile`, req.user.id.toString());
    if (!processedFileResponse.success) {
      return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
    } else {
      postAssets = processedFileResponse.results[0];
    }
  }
  try {
    // Saving user Data
    await Users.findByIdAndUpdate({ _id: req.user.id }, { profilePicture: postAssets }, { new: true })
  }
  catch (error) {
    console.log(error)
    return next(new ErrorHandler(`Something went wrong, Please try again or login again!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending Response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `User Profile Updated Successfully!`,
  });
});

// ✅ 04) --- ADDRESS UPDATE ---
export const social_Media_User_Account_Address_Update = CatchAsync(async (req, res, next) => {

  // Formatting User Address Data To Update
  let userAddressToUpdate = {}
  if (req.body.plotNumber) {
    userAddressToUpdate.plotNumber = req.body.plotNumber;
  }
  if (req.body.address) {
    userAddressToUpdate.plotNumber = req.body.address;
  }
  if (req.body.city) {
    userAddressToUpdate.city = req.body.city;
  }
  if (req.body.state) {
    userAddressToUpdate.state = req.body.state;
  }
  if (req.body.country) {
    userAddressToUpdate.country = req.body.country;
  }
  if (req.body.zipCode) {
    userAddressToUpdate.zipCode = req.body.zipCode;
  }

  // Saving User Address
  try {
    await Users.findByIdAndUpdate({ _id: req.user.id }, userDataToUpdate, { new: true })
  }
  catch (error) {
    console.log(error)
    return next(new ErrorHandler(`Something went wrong, Please try again or login again!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `Address has been updated successfully!`,
  });
});

// ✅ 05) --- USER LOCATION UPDATE ---
export const social_Media_User_Account_Location_Update = CatchAsync(async (req, res, next) => {
  //  Checking if the latitude and longitude is provided or not
  if (!req.body.latitude || !req.body.longitude) {
    return next(new ErrorHandler("Please provides both Latitude and Longitude", HttpStatusCode.NOT_ACCEPTABLE));
  }

  // Updating user address
  const isLoc = await LocationService.get_Coordinates_Details(req.body.latitude, req.body.longitude)
  if (!isLoc.country) return next(new ErrorHandler(`Something went wrong in location coordinates!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
  if (isLoc.address) req.body.address = isLoc.address;
  if (isLoc.city) req.body.city = isLoc.city;
  req.body.country = isLoc.country;

  // Saving details
  // Formatting User Address Data To Update
  let userAddressToUpdate = {
    location: { type: 'Point', coordinates: [req.body.longitude, req.body.latitude] }
  }
  if (req.body.address) {
    userAddressToUpdate.address = req.body.address;
  }
  if (req.body.city) {
    userAddressToUpdate.city = req.body.city;
  }
  if (req.body.country) {
    userAddressToUpdate.country = req.body.country;
  }

  // Saving User Address
  try {
    await Users.findByIdAndUpdate({ _id: req.user.id }, userDataToUpdate, { new: true })
  }
  catch (error) {
    console.log(error)
    return next(new ErrorHandler(`Something went wrong, Please try again or login again!`, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // Sending response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `Address has been updated successfully!`,
  });
});

// ✅ 06) --- USER PROFILE INFORMATION BY OTHER USER ---
export const social_Media_User_Account_Information_By_Other_User = CatchAsync(async (req, res, next) => {

  // Fetching User ID
  const uid = req.params.id;

  const userData = await Users.findById({ _id: uid })
    .select("+isAccountVerified +isProfileCompleted")
    .catch((err) => {
      console.log(err);
    });

  if (!userData) {
    return next(
      new ErrorHandler("No User Data Found!", HttpStatusCode.NOT_FOUND)
    );
  }

  // Check if user is followed by logged in and vice versa
  // Fetching follower count
  const followerCount = await FollowerFollowings.countDocuments({ followedToUser: uid, });
  const followingCount = await FollowerFollowings.countDocuments({ followedByUser: uid, });
  const isFollowers = await FollowerFollowings.findOne({ followedByUser: userData._id, followedToUser: req.user.id });
  const isFollowing = await FollowerFollowings.findOne({ followedByUser: req.user.id, followedToUser: userData._id });

  let responseData = {
    _id: userData._id,
    followers: followerCount,
    followings: followingCount,
    profile: undefined,
    haveYouFollowed: isFollowing ? true : false,
    followsYou: isFollowers ? true : false,
  };

  if (userData.isProfileCompleted) {
    responseData.profile = {
      firstName: userData.firstName || undefined,
      lastName: userData.lastName || undefined,
      gender: userData.gender || undefined,
      dob: userData.dateOfBirth || undefined,
      bio: userData.profileSummary || undefined,
      plotNumber: userData.plotNumber || undefined,
      address: userData.address || undefined,
      city: userData.city || undefined,
      state: userData.state || undefined,
      country: userData.country || undefined,
      zipCode: userData.zipCode || undefined,
      location: userData.location || undefined,
      profilePicture: userData.profilePicture || undefined,
    };
  }
  // Sending Response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `User Profile Information`,
    user: responseData,
  });
});

// ✅ 07) --- USER ACCOUNT DELETE ---
export const social_Media_User_Account_Delete = CatchAsync(async (req, res, next) => {

  // Sending Response
  res.status(HttpStatusCode.SUCCESS).json({
    success: false,
    message: `User account has been deleted!`,
  });
});

// ✅ 08) --- USER ACCOUNT ENABLE/DISABLE ---
export const social_Media_User_Account_Enable_Disable = CatchAsync(async (req, res, next) => {

  // Sending Response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `User account ${tempIs ? "disabled" : "enabled"} successfully!`,
  });
});