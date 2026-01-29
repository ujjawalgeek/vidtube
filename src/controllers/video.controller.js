import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  const videoLocalPath = req.files?.video?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail are required");
  }

  const videoUpload = await uploadOnCloudinary(videoLocalPath);
  const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoUpload?.url || !thumbnailUpload?.url) {
    throw new ApiError(400, "File upload failed");
  }

  const video = await Video.create({
    videoFile: videoUpload.url,
    thumbnail: thumbnailUpload.url,
    title,
    description,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  ).populate("owner", "username avatar");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});


const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  const video = await Video.findOne({
    _id: videoId,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  video.title = title || video.title;
  video.description = description || video.description;

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findOneAndDelete({
    _id: videoId,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(403, "You are not allowed to delete this video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findOne({
    _id: videoId,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(403, "Not allowed");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { isPublished: video.isPublished },
      "Publish status updated"
    )
  );
});


const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const videos = await Video.find({
    owner: channelId,
    isPublished: true,
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched"));
});

export{
  uploadVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getChannelVideos,
}