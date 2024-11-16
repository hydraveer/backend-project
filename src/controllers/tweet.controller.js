import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
const createTweet = asyncHandler(async(req,res)=>{
    const {tweet} = req.body
    const exist= await Tweet.findOne({tweet})
    if(exist){
        throw new ApiError(400,"Tweet is already there")
    }
    const owner = req?.user._id
    
    if(!owner){
        throw new ApiError(404, "Please login for tweet")
    }
    const tweetCreated = await Tweet.create({
        tweet,
        owner
    })
    if(!tweetCreated){
        throw new ApiError(404,"There is something with server")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, tweetCreated, "Tweet done")
    )
})
const updateTweet = asyncHandler(async(req,res)=>{
    const {oldTweet, updatedTweet} = req.body
    console.log(oldTweet,updatedTweet);
    
    if(!(oldTweet && updatedTweet)){
        throw new ApiError(404, "Please provide both updated and old Todo")
    }

    const oldTweetId = await Tweet.findOne({tweet: oldTweet})
    if(!oldTweetId){
        throw new ApiError(500, "Tweet not found")
    }
    
    const updatedTweetInDB = await Tweet.findByIdAndUpdate(oldTweetId,{
        $set:{
            tweet: `${updatedTweet}`
        }
    },{new: true})
    if(!updatedTweetInDB){
        throw new ApiError(500, "Not able to update todo. Please try again")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTweetInDB, "Tweet Successfully updated")
    )
})
const deleteTweet = asyncHandler(async(req,res)=>{
    const {tweet} = req.body
    if(!tweet){
        throw new ApiError(404,"Please provide the tweet")
    }
    const tweetId = await Tweet.findOne({tweet})
    if(!tweetId){
        throw new ApiError(404, "Please provide correct Tweet")
    }
    const deleteTweet = await Tweet.findByIdAndDelete(tweetId._id)
    if(!deleteTweet){
        throw new ApiError(500,"Tweet is not deleted. Try again!")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet delete Successfully")
    )
})
const allTweet = asyncHandler(async(req,res)=>{
    const tweet = await Tweet.find({})
    
    if(!tweet){
        throw new ApiError(404,"There no Tweet")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Here is all tweet")
    )
})
const getUserTweet = asyncHandler(async(req,res)=>{
    const owner = req?.user._id
    if(!owner){
        throw new ApiError(404, "please login")
    }
    const tweet = await Tweet.find({owner})
    if(!tweet){
        throw new ApiError(404, "There is tweet from this user")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Here is all tweet from user")
    )
})
export{
    createTweet,
    updateTweet,
    deleteTweet,
    allTweet,
    getUserTweet
}