import { Router } from "express";
import {registerUser} from "../controllers/user.controllers.js"
import { upload } from "../middleware/multer.middelware.js";
const router = Router()

router.route("/register").get(
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

export default router