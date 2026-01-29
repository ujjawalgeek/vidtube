import { Router } from "express";
import {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPlaylistById,
  getUserPlaylists,
  deletePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", verifyJWT, createPlaylist);
router.delete("/:playlistId", verifyJWT, deletePlaylist);

router.patch(
  "/:playlistId/video/:videoId",
  verifyJWT,
  addVideoToPlaylist
);

router.delete(
  "/:playlistId/video/:videoId",
  verifyJWT,
  removeVideoFromPlaylist
);

router.get("/:playlistId", getPlaylistById);
router.get("/user/:userId", getUserPlaylists);

export default router;
