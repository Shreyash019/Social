import Users from "../../models/User/Users.js";
import FollowerFollowings from "../../models/FollowerFollowing/Followers&Followings.js";
import { get_Coordinates_Details } from '../../config/locationService.js';
import CatchAsync from "../../error/catchAsync.js";
import ErrorHandler from "../../utils/errorHandler.js";
import { HttpStatusCode } from "../../enums/httpHeaders.js";
import FileProcessor from '../../Services/fileProcessing/fileProcessorService.js';
import FileDeletion from '../../Services/fileProcessing/ImageVideoDelete.js';
import { get, set, del, getWithTimeout, setWithTimeout, deleteWithTimeout} from "../../caching/redisConfiguration.js";

/* 
    Index: 
        01) Profile Information
        02) Profile Information Update
        03) Account Profile Image Update
        04) Address Update
        05) User Location Update
        06) User Profile Information By Other User 
*/

// 01) --- USER PROFILE INFORMATION ---
export const social_Media_User_Account_Information = CatchAsync(async (req, res, next) => {
  try {
    const cacheKey = `user-profile-${req.user.id}`;
    const cachedData = await get(cacheKey).catch((error) => console.log(error.toString()));
    // const cachedData = await getWithTimeout(cacheKey, 500).catch((error) => console.log(error.toString()));
    if (cachedData) {
      // Validate and sanitize cached data
      const userData = JSON.parse(cachedData);
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid cached data');
      }
      // Sending Response
      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `User Profile Information`,
        user: userData,
      });
    } else {
      // Fetch user with required fields (projection)
      const userData = await Users.findById({ _id: req.user.id }, {
        username: 1,
        email: 1,
        isAccountVerified: 1,
        isProfileCompleted: 1,
        role: 1,
        hasBusiness: 1,
        firstName: 1,
        lastName: 1,
        gender: 1,
        dob: 1,
        bio: 1,
        address: 1,
        city: 1,
        state: 1,
        country: 1,
        zipCode: 1,
        profilePicture: 1,
        followerCount: 1,
        followingCount: 1,
      }).catch(next); // Pass error to middleware

      if (!userData) {
        return next(new ErrorHandler(`User not found`, HttpStatusCode.NOT_FOUND));
      }

      // Response Object
      const responseData = {
        _id: userData._id,
        username: userData.username,
        email: userData.email,
        followers: userData.followerCount || 0,
        followings: userData.followingCount || 0,
        profile: {},
      };

      if (userData.isProfileCompleted) {
        responseData.profile = {
          firstName: userData.firstName || undefined,
          lastName: userData.lastName || undefined,
          gender: userData.gender || undefined,
          dob: userData.dateOfBirth || undefined,
          bio: userData.profileSummary || undefined,
          address: userData.address || undefined,
          city: userData.city || undefined,
          state: userData.state || undefined,
          country: userData.country || undefined,
          zipCode: userData.zipCode || undefined,
          profilePicture: userData.profilePicture || undefined,
        };
      }

      // Cache the data for future requests using the imported set function
      await setWithTimeout(cacheKey, responseData, 3600, 500).catch((error) => console.log(error.toString()));
      // Sending Response
      res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `User Profile Information`,
        user: responseData,
      });
    }
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler('Internal Server Error', HttpStatusCode.INTERNAL_SERVER_ERROR));
  }
});

// 02) --- USER PROFILE UPDATE ---
export const social_Media_User_Profile_Information_Update = CatchAsync(async (req, res, next) => {

  // Checking image size if it is provided
  if (req.files && req.files.profilePicture) {
    if (Array.isArray(req.files.profilePicture)) {
      if (req.files.profilePicture.length > 1) {
        return next(new ErrorHandler("Please upload single image only!", HttpStatusCode.BAD_REQUEST));
      }
    }
  }

  const userAccount = await Users.findById({ _id: req.user.id }).catch(err => console.log(err));

  if (!userAccount) {
    return next(new ErrorHandler(`Internal Server error`, HttpStatusCode.INTERNAL_SERVER_ERROR))
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
  if (req.body.firstName) {
    userDataToUpdate.firstName = req.body.firstName;
  }
  if (req.body.lastName) {
    userDataToUpdate.lastName = req.body.lastName;
  }
  if (req.body.profileSummary) {
    userDataToUpdate.profileSummary = req.body.profileSummary;
  }
  if (req.body.dateOfBirth) {
    userDataToUpdate.dateOfBirth = req.body.dateOfBirth;
  }
  if (req.body.gender) {
    userDataToUpdate.gender = req.body.gender;
  }

  // Checking for image and video
  if (req.files && req.files.profilePicture) {
    if (userAccount.profilePicture && userAccount.profilePicture?.public_id != "221EFRVEF") {
      let arrayImage = [userAccount.profilePicture]
      const fileDelete = await FileDeletion(arrayImage);
      if (!arrayImage.success) {
        return next(new ErrorHandler(`Internal Server Error`, HttpStatusCode.INTERNAL_SERVER_ERROR));
      }
    }
    if (Array.isArray(req.files.profilePicture) && req.files.profilePicture.length > 1) {
      return next(new Error(`Please upload a single image only!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
    }
    const processedFileResponse = await FileProcessor(req.files.profilePicture, `social_media/user/${req.user.id}/profile`, req.user.id.toString());
    if (!processedFileResponse.success) {
      return next(new ErrorHandler(processedFileResponse.message, HttpStatusCode.BAD_REQUEST));
    } else {
      userDataToUpdate.profilePicture = processedFileResponse.results[0];
    }
  }

  // Updating user isProfile
  if (req.body.firstName && req.body.lastName && req.body.bio && req.body.dateOfBirth && req.body.gender) {
    userDataToUpdate.isProfileCompleted = true
  }

  try {
    // Saving user Data
    await Users.findByIdAndUpdate({ _id: req.user.id }, userDataToUpdate, { new: true });
    // Destroying caches
    const cacheKey = `user-profile-${req.user.id}`
    await del(cacheKey);
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


// 03) --- ACCOUNT PROFILE IMAGE UPDATE ---
// Helper Function for Document Update (DRY Principle)
async function updateDocument(userId, profilePicture) {
  try {
    const updatedUser = await Users.findByIdAndUpdate({ _id: userId }, { profilePicture }, { new: true });
    if (!updatedUser) {
      return { success: false, message: 'User not found or update failed!' };
    }
    return { success: true, message: 'Updated' };
  } catch (error) {
    throw error; // Rethrow for centralized error handling
  }
}
export const social_Media_User_Account_Profile_Image_Update = CatchAsync(async (req, res, next) => {
  // 1. Image Validation (Early Exit)
  if (!req.files || !req.files.profilePicture) {
    return next(new ErrorHandler(`Please provide an image!`, HttpStatusCode.NOT_ACCEPTABLE));
  }

  if (Array.isArray(req.files.profilePicture) && req.files.profilePicture.length > 1) {
    return next(new ErrorHandler("Please upload single image only!", HttpStatusCode.BAD_REQUEST));
  }

  // 2. File Processing with Asynchronous Execution
  const [userAccount, processedFileResponse] = await Promise.all([
    Users.findById({ _id: req.user.id }),
    FileProcessor(req.files.profilePicture, `social_media/user/${req.user.id}/profile`, req.user.id.toString()),
  ]);

  // 3. Conditional File Deletion (Optimized)
  const fileDeletePromise = userAccount?.profilePicture && userAccount.profilePicture.public_id !== "221EFRVEF"
    ? FileDeletion([userAccount.profilePicture])
    : Promise.resolve({ success: true }); // No deletion needed, return success

  // 4. Error Handling (Combined from Both Responses)
  const [fileDeleteResult, updateError] = await Promise.all([fileDeletePromise, updateDocument(req.user.id, processedFileResponse.results[0])]);

  if (!fileDeleteResult.success || !updateError.success) {
    const errorMessage = !updateError.success ? updateError.message : 'Internal Server Error';
    return next(new ErrorHandler(errorMessage, HttpStatusCode.INTERNAL_SERVER_ERROR));
  }

  // 5. Cache Invalidation (Clear and Focused)
  await del(`user-profile-${req.user.id}`); // Clear specific cache

  // 6. Success Response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `User Profile Updated Successfully!`,
  });
});

// 04) --- USER LOCATION UPDATE ---
export const social_Media_User_Account_Location_Update = CatchAsync(async (req, res, next) => {
  //  Checking if the latitude and longitude is provided or not
  if (!req.body.latitude || !req.body.longitude) {
    return next(new ErrorHandler("Please provides both Latitude and Longitude", HttpStatusCode.NOT_ACCEPTABLE));
  }

  // Updating user address
  const isLoc = await get_Coordinates_Details(req.body.latitude, req.body.longitude);
  if (!isLoc.country) return next(new ErrorHandler(`Something went wrong in location coordinates!`, HttpStatusCode.UNPROCESSABLE_ENTITY));
  if (isLoc.city) req.body.city = isLoc.city;
  req.body.country = isLoc.country;

  // Saving details
  // Formatting User Address Data To Update
  let userAddressToUpdate = {
    location: { type: 'Point', coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)] }
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
    await Users.findByIdAndUpdate({ _id: req.user.id }, userAddressToUpdate, { new: true })
    // Deleting Caching
    const cacheKey = `user-profile-${req.user.id}`
    await del(cacheKey);
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

// 06) --- USER PROFILE INFORMATION BY OTHER USER ---
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

// 07) --- USER ACCOUNT DELETE ---
export const social_Media_User_Account_Delete = CatchAsync(async (req, res, next) => {

  // Sending Response
  res.status(HttpStatusCode.SUCCESS).json({
    success: false,
    message: `User account has been deleted!`,
  });
});

// 08) --- USER ACCOUNT ENABLE/DISABLE ---
export const social_Media_User_Account_Enable_Disable = CatchAsync(async (req, res, next) => {

  // Sending Response
  res.status(HttpStatusCode.SUCCESS).json({
    success: true,
    message: `User account ${tempIs ? "disabled" : "enabled"} successfully!`,
  });
});