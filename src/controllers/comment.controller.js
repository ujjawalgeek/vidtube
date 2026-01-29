import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const getVideoComments =asyncHandler(async(req ,res)=>{
  const videoId=req.params;

  const comments=await Comment.find({video :videoId})
  .populate("owner","username avatar")
  .sort({createdAt:-1});

  return res.status(200).json(
    new ApiResponse(200, comments, "Comments fetched successfully")
  );
})

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const comment = await Comment.findOne({
    _id: commentId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(403, "You are not allowed to update this comment");
  }

  comment.content = content;
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});


const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const deleted = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user._id,
  });

  if (!deleted) {
    throw new ApiError(403, "You are not allowed to delete this comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});


export{
  addComment,
  getVideoComments,
  updateComment,
  deleteComment,
}