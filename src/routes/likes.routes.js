import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggletweetLikes,
} from "../controllers/likes.controller.js";
const router = Router();
router.use(verifyToken);
router.route("/toggle-video-likes").post(toggleVideoLike);
router.route("/toggle-comment-likes").post(toggleCommentLike);
router.route("/toggle-tweet-likes").post(toggletweetLikes);
router.route("/get-all-videolikes").post(getLikedVideos);

export default router;
