import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Playlist name is required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});


const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid ID");
  }

  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new ApiError(403, "You are not allowed");
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(409, "Video already in playlist");
  }

  playlist.videos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist"));
});


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new ApiError(403, "You are not allowed");
  }

  playlist.videos = playlist.videos.filter(
    (v) => v.toString() !== videoId
  );

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist"));
});


const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.findById(playlistId)
    .populate("videos")
    .populate("owner", "username avatar");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched"));
});


const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const playlists = await Playlist.find({
    owner: userId,
    isPublic: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched"));
});


const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new ApiError(403, "You are not allowed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted"));
});
 

export{
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPlaylistById,
  getUserPlaylists,
  deletePlaylist,
}