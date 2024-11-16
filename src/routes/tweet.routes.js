import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {createTweet,updateTweet,deleteTweet, allTweet, getUserTweet} from "../controllers/tweet.controller.js"

const router = Router()
console.log("hi")
router.route("/tweet").post(verifyJWT, createTweet)
router.route("/update-tweet").patch(verifyJWT,updateTweet)
router.route("/delete-tweet").delete(verifyJWT,deleteTweet)
router.route("/get-tweet").get(allTweet)
router.route("/get-user-tweet").get(verifyJWT,getUserTweet)
export default router