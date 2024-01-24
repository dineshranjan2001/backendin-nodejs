import { ApiError } from "../utils/ApiError.js";
import { isValidated } from "../utils/Validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { fileUploadOnCloud } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (request, response) => {
  //1.get the user details from the request
  const { username, email, fullname, password } = request.body;

  //2.validate the user each fields
  const [check, message] = isValidated(request.body);
  if (check) {
    throw new ApiError(400, message);
  }

  //3.check the user is already exits or notcoverImage
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exits");
  }

  //4.check for avatar, images
  const avatarLocalPath = request.files?.avatar[0]?.path;
  const coverImageLocalPath = request.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
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
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //7.remove password and refresh token field from  the response

  //saveUser.password=undefined;
  //saveUser.refreshToken=undefined;

  const createdUser = User.findById(saveUser._id).select(
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

export { registerUser };
