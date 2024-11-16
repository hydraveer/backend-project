import { Router } from "express";
import { getUserWatchHistory,
        getUserCurrentChannel, 
        updateAvatar, 
        getCurrentUser, 
        updateCoverImage, 
        registerUser, 
        loginUser, 
        logOutUser, 
        refreshAccessToken, 
        changeCurrentPassword, 
        updateAccountDetails
        } from "../controllers/user.controller.js"
import { upload } from "../middleware/multer.middelware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secured route 

router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/get-user").get(verifyJWT, getCurrentUser)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar") , updateAvatar)
router.route("/update-coverimage").patch(verifyJWT, upload.single("coverImage") , updateCoverImage)
router.route("/c/:username").get(verifyJWT, getUserCurrentChannel)
router.route("/watchhistory").get(verifyJWT, getUserWatchHistory)

export default router