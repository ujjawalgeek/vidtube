import { Router } from "express";
import {
  likeVideo,
  unlikeVideo,
  likeComment,
  unlikeComment,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/video/:videoId", verifyJWT, likeVideo);
router.delete("/video/:videoId", verifyJWT, unlikeVideo);

router.post("/comment/:commentId", verifyJWT, likeComment);
router.delete("/comment/:commentId", verifyJWT, unlikeComment);

export default router;
