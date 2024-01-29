import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/likes.model.js";

const toggleVideoLike = asyncHandler(async (request, response) => {
  //1.get video id from the request
  const { videoId } = request.params;

  //2.validate the video id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  try {
    //3.toggle video like
    let videoToggleStatus;
    const getVideoLikes = await Like.findOne({
      video: videoId,
      likedBy: request.user?._id,
    });
    if (!getVideoLikes) {
      await Like.create({
        video: videoId,
        likedBy: request.user?._id,
      });
      videoToggleStatus = true;
    } else {
      await Like.deleteOne({
        video: getVideoLikes.video,
        likedBy: getVideoLikes.likedBy,
      });
      videoToggleStatus = false;
    }

    //4.return response
    return response
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          videoToggleStatus
            ? "like added successfully"
            : "like deleted successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't toggle video like");
  }
});

const toggleCommentLike = asyncHandler(async (request, response) => {
  //1.get the comment id from the request
  const { commentId } = request.params;

  //2.validate the comment id
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }
  try {
    //3.toggle the comment like
    const getCommentLikes = await Like.findOne({
      comment: commentId,
      likedBy: request.user?._id,
    });
    let commentToggleStatus;
    if (!getCommentLikes) {
      await Like.create({
        comment: commentId,
        likedBy: request.user?._id,
      });
      commentToggleStatus = true;
    } else {
      await Like.deleteOne({
        comment: getCommentLikes.comment,
        likedBy: getCommentLikes.likedBy,
      });
      commentToggleStatus = false;
    }
    //4.return the response
    return response
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          commentToggleStatus
            ? "like added successfully"
            : "like deleted successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't toggle comment like");
  }
});

const toggletweetLikes = asyncHandler(async (request, response) => {
  //1.get tweetId from the request
  const { tweetId } = request.params;

  //2.validate tweetId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  try {
    //3.toggle the tweet like
    const getTweetLikes = await Like.findOne({
      tweet: tweetId,
      likedBy: request.user?._id,
    });
    let tweetToggleStatus;
    if (!getTweetLikes) {
      await Like.create({
        tweet: tweetId,
        likedBy: request.user?._id,
      });
      tweetToggleStatus = true;
    } else {
      await Like.deleteOne({
        tweet: getTweetLikes.tweet,
        likedBy: getTweetLikes.likedBy,
      });
      tweetToggleStatus = false;
    }

    //4.return response
    return response
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          tweetToggleStatus
            ? "like added successfully"
            : "like deleted successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't toggle tweet like");
  }
});

const getLikedVideos = asyncHandler(async (request, response) => {
  try {
    //1.get liked videos of perticular user
    const getAllLikedVideos = await Like.aggregate([
      {
        $match: new mongoose.Types.ObjectId(request.user?._id),
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "video",
          pipeline: [
            {
              $project: {
                title: 1,
                videoFile: 1,
                thumbnail: 1,
                views: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          video: {
            $first: "$video",
          },
        },
      },
    ]);

    //2.return response
    if (getAllLikedVideos.length === 0) {
      return response
        .status(200)
        .json(new ApiResponse(200, {}, "You have't liked any videos"));
    }
    return response
      .status(200)
      .json(
        new ApiResponse(
          200,
          getAllLikedVideos,
          "Liked videos fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Can't fected liked videos");
  }
});

export { toggleVideoLike, toggleCommentLike, toggletweetLikes,getLikedVideos };
