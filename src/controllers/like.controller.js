import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Like } from "../models/like.model.js";
import mongoose from "mongoose";

const likeVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const alreadyLiked = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });

  if (alreadyLiked) {
    throw new ApiError(409, "Video already liked");
  }

  const like = await Like.create({
    video: videoId,
    likedBy: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, like, "Video liked"));
});

const unlikeVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  const deletedLike = await Like.findOneAndDelete({
    video: videoId,
    likedBy: userId,
  });

  if (!deletedLike) {
    throw new ApiError(404, "Like not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video unliked"));
});

const likeComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const existing = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (existing) {
    throw new ApiError(409, "Comment already liked");
  }

  await Like.create({
    comment: commentId,
    likedBy: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Comment liked"));
});

const unlikeComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const deleted = await Like.findOneAndDelete({
    comment: commentId,
    likedBy: userId,
  });

  if (!deleted) {
    throw new ApiError(404, "Like not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment unliked"));
});

export{
  unlikeComment,likeComment,likeVideo,unlikeVideo
}