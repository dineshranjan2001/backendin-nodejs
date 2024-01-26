import { ApiError } from "../utils/ApiError.js";
import { isValidated } from "../utils/Validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fileDeleteOnCloud, fileUploadOnCloud } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessTokendAndRefreshToken } from "../utils/GenerateTokens.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (request, response) => {
  //1.get the user details from the request
  const { username, email, fullname, password } = request.body;

  //2.validate the user each fields
  const [check, message] = isValidated(request.body);
  if (check) {
    throw new ApiError(400, message);
  }

  //3.check the user is already exits or not
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exits");
  }

  //4.check for avatar, images
  const avatarLocalPath = request.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  if (
    request.files &&
    Array.isArray(request.files.coverImage) &&
    request.files.coverImage.length > 0
  ) {
    coverImageLocalPath = request.files.coverImage[0].path;
  }
  //5.upload them to cloudinary,avatar
  const uploadAvatar = await fileUploadOnCloud(avatarLocalPath);
  const uploadCoverImage = await fileUploadOnCloud(coverImageLocalPath);
  if (!uploadAvatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //6.create user object to save the details in the db
  const saveUser = await User.create({
    fullname,
    avatar: uploadAvatar.url,
    coverImage: uploadCoverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //7.remove password and refresh token field from  the response

  //saveUser.password=undefined;
  //saveUser.refreshToken=undefined;

  const createdUser = await User.findById(saveUser._id).select(
    "-password -refreshToken"
  );

  //8.check for the user creation (user is saved or not into  the database)
  if (!createdUser) {
    throw new ApiError(500);
  }

  //9.return the response to the user
  response
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (request, response) => {
  //1.get the data from the user through request
  const { username, email, password } = request.body;
  console.log(email, password);
  //2.validate the data
  const [status, message] = isValidated(request.body);
  if (status) {
    throw new ApiError(400, message);
  }

  //3.find the user using username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exit");
  }

  //4.password check
  const getPasswordStatus = await user.isPasswordCorrect(password);
  if (!getPasswordStatus) {
    throw new ApiError(401, "Invalid user credentials");
  }
  //5.access and refresh token
  const { accessToken, refreshToken } =
    await generateAccessTokendAndRefreshToken(user._id);
  //6.send access and refresh token or send it through cookies
  return response.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
      "User logged In Successfully"
    )
  );
});

const logoutUser = asyncHandler(async (request, response) => {
  await User.findByIdAndUpdate(
    request.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    {
      new: true,
    }
  );

  return response.status(200).json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (request, response) => {
  const getRefreshToken = request.body.refreshToken;
  if (!getRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      getRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedRefreshToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (getRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }
    const { accessToken, refreshToken } =
      await generateAccessTokendAndRefreshToken(user._id);
    return response.status(200).json(
      new ApiResponse(200, {
        accessToken: accessToken,
        refreshToken: refreshToken,
      })
    );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (request, response) => {
  //1.get the old password and new password from the request
  const { oldPassword, newPassword } = request.body;

  try {
    //2.get the user to get the old password
    const user = await User.findById(request.user?._id);

    //3.verify the password
    const getPasswordStatus = await user.isPasswordCorrect(oldPassword);
    if (!getPasswordStatus) {
      throw new ApiError(400, "Incorrect password");
    }

    //4.assign the new password to the user and save it
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    //5.return the response after change the password
    return response
      .status(200)
      .json(new ApiResponse(200, {}, "Password change successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't change password");
  }
});

const getCurrentUser = asyncHandler(async (request, response) => {
  return response
    .status(200)
    .json(
      new ApiResponse(200),
      request.user,
      "Current user fetched successfully"
    );
});

const updateProfleDetails = asyncHandler(async (request, response) => {
  //1.get the user update filed details from the request
  const { fullname, email } = request.body;
  //2.validate the fields
  const [status, message] = isValidated(request.body);
  if (status) {
    throw new ApiError(400, message);
  }
  try {
    //3.get the user and set the update details into the user.
    const user = User.findByIdAndUpdate(
      request.user?._id,
      {
        $set: {
          fullname,
          email,
        },
      },
      { new: true }
    ).select("-password");

    //4.return the response
    return response
      .status(200)
      .json(new ApiResponse(200, user, "Profile Update successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't Update Profile");
  }
});

const updateAvatar = asyncHandler(async (request, response) => {
  //1. get avatar from the request
  const avatarLocalPath = request.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar field required");
  }
  //2. get avatarimageURL from the user
  const oldAvatar = await User.findById(request.user?._id).select("avatar");

  //3. delete the image from the cloudinary
  const cloudFileStatus = await fileDeleteOnCloud(oldAvatar);
  if (!cloudFileStatus) {
    throw new ApiError(500, "Not delete avatar from the cloudinary");
  }
  try {
    //4. upload the new avatarImage in cloudinary
    const newuploadAvatar = await fileUploadOnCloud(avatarLocalPath);
    if (!newuploadAvatar.url) {
      throw new ApiError(500, "Error while upload file on the cloudinary");
    }
    //5. update the new upload avatarImage in the user avatar field
    const user = await User.findByIdAndUpdate(
      request.user?._id,
      {
        $set: {
          avatar: newuploadAvatar.url
        },
      },
      { new: true }
    ).select("-password");
    //6. return the response
    return response
      .status(200)
      .json(new ApiResponse(200, user, "Avatar successfully uploaded"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't update avatar");
  }
});

const updateCoverImage=asyncHandler(async(request,response)=>{
  //1. get coverImage from the request
  const coverImageLocalPath = request.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image field required");
  }
  //2. get coverImageURL from the user
  const oldCoverImage = await User.findById(request.user?._id).select("coverImage");

  //3. delete the image from the cloudinary
  const cloudFileStatus = await fileDeleteOnCloud(oldCoverImage);
  if (!cloudFileStatus) {
    throw new ApiError(500, "Not delete cover image from the cloudinary");
  }
  try {
    //4. upload the new coverImage in cloudinary
    const newuploadCoverImage = await fileUploadOnCloud(coverImageLocalPath);
    if (!newuploadCoverImage.url) {
      throw new ApiError(500, "Error while upload file on the cloudinary");
    }
    //5. update the new upload coverImage in the user coverImage field
    const user = await User.findByIdAndUpdate(
      request.user?._id,
      {
        $set: {
          coverImage: newuploadCoverImage.url
        },
      },
      { new: true }
    ).select("-password");
    //6. return the response
    return response
      .status(200)
      .json(new ApiResponse(200, user, "Cover image successfully uploaded"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't update cover image");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateProfleDetails,
  updateAvatar,
  updateCoverImage
};
