import { Router } from "express";
import { 
  changeCurrentPassword, 
  getCurrentUser, 
  getUserWatchHistory, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  registerUser, 
  updateAvatar, 
  updateCoverImage, 
  updateProfleDetails 
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/fileUpload.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
//secure routes
router.route("/logout").post(verifyToken,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-current-password").post(verifyToken,changeCurrentPassword);
router.route("/get-current-user").get(verifyToken,getCurrentUser);
router.route("/update-profile").post(verifyToken,updateProfleDetails);
router.route("/avatar").post(verifyToken,upload.single("avatar"),updateAvatar);
router.route("/cover-image").post(verifyToken,upload.single("coverImage"),updateCoverImage);
router.route("/get-profile-details/:username").get(verifyToken,updateProfleDetails);
router.route("/get-user-history").get(verifyToken,getUserWatchHistory);

export default router;
