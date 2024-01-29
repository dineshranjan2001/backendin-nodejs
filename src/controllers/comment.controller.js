import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comments.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async (request, response) => {
  //1.get video id, page and limit from request
  const { videoId } = request.params;
  const { page = 1, limit = 1 } = request.query;
  const option = {
    page,
    limit,
  };

  //2.validate videoId;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  try {
    //3.get comments
    const getAllcomments = await Comment.aggregate([
      {
        $match: new mongoose.Types.ObjectId(videoId),
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
                avatar: 1,
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
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);
    const getPaginatedComment = await Comment.aggregatePaginate(
      getAllcomments,
      option
    );

    //4.return response
    if (getPaginatedComment.totalDocs === 0) {
      return response
        .status(200)
        .json(new ApiResponse(200, {}, "There is no comments on this video"));
    }
    return response
      .status(200)
      .json(
        new ApiResponse(
          200,
          getPaginatedComment,
          "Comments fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't fetched comments");
  }
});

const addComment = asyncHandler(async (request, response) => {
  //1.get video id and comment from the request
  const { videoId } = request.params;
  const { content } = request.body;

  //2.validate the video id and comment field
  if (!content) {
    throw new ApiError(400, "Comment field is required");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video is not exits");
    }

    //3.create comments
    const comment = await Comment.create({
      content,
      video: videoId,
      owner: request.user?._id,
    });
    //4.return the response
    return response
      .status(200)
      .json(new ApiResponse(200, comment, "Comment added successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't add comment");
  }
});

const updateComment = asyncHandler(async (request, response) => {
  //1.get the commentId and content from the request
  const { commentId } = request.params;
  const { content } = request.body;

  //2.validate the commentId and content
  if (!content) {
    throw new ApiError(400, "Comment field is required");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid video id");
  }
  try {
    //3.update the comment content
    const updateComment = await Comment.findByIdAndUpdate(commentId, {
      $set: {
        content,
      },
    });
    //4.return the response
    return response
      .status(200)
      .json(new ApiResponse(200, updateComment, "Update comment successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't update comment");
  }
});

const deleteComment = asyncHandler(async (request, response) => {
  //1.get commentId from request
  const { commentId } = request.params;

  //2.validate commentId
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }
  try {
    //3.delete comment
    await Comment.findByIdAndDelete(commentId);
    //4.return response
    return response
      .status(200)
      .json(new ApiResponse(200, {}, "Comment deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Can't delete comment");
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
