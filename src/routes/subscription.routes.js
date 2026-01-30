import { Router } from "express";
import {
  subscribeChannel,
  unsubscribeChannel,
  getMySubscriptions,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:channelId")
  .post(verifyJWT, subscribeChannel)
  .delete(verifyJWT, unsubscribeChannel);

router.route("/")
  .get(verifyJWT, getMySubscriptions);

export default router;
