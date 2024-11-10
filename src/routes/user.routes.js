import { Router } from "express";
import {registerUser, loginUser, logOutUser} from "../controllers/user.controllers.js"
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

//secure route 

router.route("/logout").post(verifyJWT, logOutUser)

export default router