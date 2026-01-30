import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";

const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  //  Total videos
  const totalVideos = await Video.countDocuments({
    owner: userId,
  });

  //  Total views on all videos
  const viewsResult = await Video.aggregate([
    { $match: { owner: userId } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  const totalViews = viewsResult[0]?.totalViews || 0;

  //  Total likes on all videos
  const likesResult = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    { $unwind: "$video" },
    { $match: { "video.owner": userId } },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: 1 },
      },
    },
  ]);

  const totalLikes = likesResult[0]?.totalLikes || 0;

  //  Total subscribers
  const totalSubscribers = await Subscription.countDocuments({
    channel: userId,
  });

  //  Latest videos
  const latestVideos = await Video.find({ owner: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title thumbnail views createdAt");

  return res.status(200).json(
    new ApiResponse(200, {
      totalVideos,
      totalViews,
      totalLikes,
      totalSubscribers,
      latestVideos,
    }, "Dashboard data fetched successfully")
  );
});

export { getDashboardStats };
