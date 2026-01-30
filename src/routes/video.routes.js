import { Router } from "express";
import {
  uploadVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getChannelVideos,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/",
  verifyJWT,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadVideo
);

router.get("/:videoId", getVideoById);

router.patch("/:videoId", verifyJWT, updateVideo);
router.delete("/videoId", verifyJWT, deleteVideo);

router.patch("/toggle/:videoId", verifyJWT, togglePublishStatus);

router.get("/channel/:channelId", getChannelVideos);

export default router;
