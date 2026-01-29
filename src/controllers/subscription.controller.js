import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";

/**
 * Subscribe to a channel
 * POST /api/v1/subscriptions/:channelId
 */
const subscribeChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  // 1️⃣ Validate channelId
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // 2️⃣ Prevent self-subscription
  if (channelId.toString() === subscriberId.toString()) {
    throw new ApiError(400, "You cannot subscribe to yourself");
  }

  // 3️⃣ Check if already subscribed
  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (existingSubscription) {
    throw new ApiError(409, "Already subscribed to this channel");
  }

  // 4️⃣ Create subscription
  const subscription = await Subscription.create({
    subscriber: subscriberId,
    channel: channelId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, subscription, "Subscribed successfully"));
});

/**
 * Unsubscribe from a channel
 * DELETE /api/v1/subscriptions/:channelId
 */
const unsubscribeChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  // 1️⃣ Remove subscription
  const result = await Subscription.findOneAndDelete({
    subscriber: subscriberId,
    channel: channelId,
  });
  
  if (!result) {
    throw new ApiError(404, "Subscription not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
});

/**
 * Get my subscribed channels
 * GET /api/v1/subscriptions
 */
const getMySubscriptions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const subscriptions = await Subscription.find({
    subscriber: userId,
  }).populate("channel", "fullName username avatar");

  return res.status(200).json(
    new ApiResponse(
      200,
      subscriptions,
      "Subscribed channels fetched successfully"
    )
  );
});

export {
  subscribeChannel,
  unsubscribeChannel,
  getMySubscriptions,
};
