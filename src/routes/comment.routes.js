import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
const router = Router();
router.use(verifyToken);
router.route("/get-all-comments/:videoId").get(getVideoComments);
router.route("/add-comment/:videoId").post(addComment);
router.route("/update-comment/:commentId").patch(updateComment);
router.route("/delete-comment/:commentId").delete(deleteComment);
export default router;
