import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(async (request, response) => {
  //1.get the content from the request
  const { content } = request.body;

  //2.validate the content
  if (!content) {
    throw new ApiError(400, "Content field is required");
  }
  try {
    //3.create the tweet
    const tweet = await Tweet.create({
      owner: request.user?._id,
      content,
    });

    //4.validate the tweet if the tweet is created  or not
    if (!tweet) {
      throw new ApiError(500, "Can't create tweet");
    }

    //5.return the response
    return response
      .status(200)
      .json(new ApiResponse(200, tweet, "Tweet created successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't create tweet");
  }
});

const getUserTweets = asyncHandler(async (request, response) => {
  //1.get the userId, page and limit from the request
  const userId = request.params;
  const { page = 1, limit = 1 } = request.query;
  const option = {
    page,
    limit,
  };

  //2.validate the userId
  if (!isValidObjectId(userId.trim())) {
    throw new ApiError(400, "Invalid user id");
  }
  try {
    //3.get the tweets
    const getAllTweets = await Tweet.aggregate([
      {
        $match: new mongoose.Types.ObjectId(userId),
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                fullname: 1,
                username: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
        },
      },
    ]);
    const paginateTweets = await Tweet.aggregatePaginate(getAllTweets, option);
    console.log(paginateTweets);

    //4.return the response
    if (paginateTweets.totalDocs === 0) {
      return response
        .status(200)
        .json(new ApiResponse(200, {}, "User has't tweeted yet"));
    }
    return response
      .status(200)
      .json(new ApiResponse(200, paginateTweets, "Tweet fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Can't fetched user tweets");
  }
});

const updateTweet = asyncHandler(async (request, response) => {
  //1.get tweetId and content from the request
  const { tweetId } = request.params;
  const { content } = request.body;
  //2.validate the tweetId and content
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }
  if (!content) {
    throw new ApiError(400, "Content field is required");
  }
  try {
    //3.update the tweet
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
      $set: {
        content,
      },
    });

    //4.validate the tweet
    if (!updateTweet) {
      throw new ApiError(404, "Tweet not found");
    }

    //5.return the response
    return response
      .status(200)
      .json(new ApiResponse(200, updatedTweet, "Tweet Updated successfully"));
  } catch (error) {
    throw new ApiError(500, "Can't update tweet");
  }
});

const deleteTweet = asyncHandler(async (request, response) => {
  //1.get the tweetId from the request
  const { tweetId } = request.params;

  //2.validate the tweetId
  if (isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }
  try {
    //3. delete the tweet
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    //4. validate the tweet
    if (!deletedTweet) {
      throw new ApiError(404, "Tweet not found");
    }

    //5. return the response
    return response
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Can't delete tweet");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
