import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import JWT from "jsonwebtoken";
import mongoose, { mongo } from "mongoose";

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while creating the access token and the refresh token")
    }
}

const registerUser = asyncHandler (async (req,res) =>{
    //get user detail from frontend
    //validation - not empty
    //check if user is alreadye exits : useraname, email
    //check for file, check for avtar
    // upload them to cloudinary
    //create user object - create entry in db
    //remove password and refresh token from response 
    // check for user creation
    // respone return 
    const {fullname, email, password,username} = req.body

    if(
        [fullname,email,password,username].some((field)=>
            field?.trim()===""
        )
    ){
        throw new ApiError(400, "fullname is required")
    }
    const exitsUser = await User.findOne({
        $or:[{ username },{ email }]
    })
    if(exitsUser){
        throw new ApiError(409, "User with email and username already exist")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path
    //  console.log(req.files)
    // const coverLocalImagePath = req.files?.coverImage[0]?.path

    let coverLocalImagePath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverLocalImagePath = req.files?.coverImage[0]?.path
    }

    if(!avatarLocalPath){
        throw new ApiError(400," Avatar file is required")
    }
    const avatarUpload = await uploadOnCloudinary(avatarLocalPath)
    const coverImageUpload = await uploadOnCloudinary(coverLocalImagePath)

    if(!avatarUpload){
        throw new ApiError(400," Pls try to upload avatar file again")
    }
    const user = await User.create({
        fullname,
        avatar: avatarUpload.url,
        coverImage: coverImageUpload?.url || "",
        email,
        username: username.toLowerCase(),
        password
    })
    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!userCreated){
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, userCreated, "User register successfully")
    )
    
    console.log(fullname, email, password, username)
    res.status(200).json("Hell world")
})

const loginUser = asyncHandler( async (req,res)=>{
    // get information fromm user : username/email and password
    // find user exit in db or not
    // validate user 
    //  generate the access token and refresh token
    // return the refresh token and access token in cookies

    const {email, username, password} = req.body
    console.log(email);
    if([username, password, email].some((field)=>
        field?.trim()===""
    )){
        throw new ApiError(400, "Please fill all the details")
    }
    if(!(username || email)){
        throw new ApiError(400, "provide username or email")
    }
    const user = await User.findOne({
        $or: [{username},{email}]
    })
    if(!user){
        throw new ApiError(404, "User is not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Incorrect Password")
    }
    
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, refreshToken, accessToken
        },
        "User logged In Successfully"
        )
    )
})

const logOutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged Out successfully")
    )
})

const refreshAccessToken = asyncHandler( async(req,res)=>{
    try {
        const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingrefreshToken) {
            throw new ApiError(401, "Unauthorized request")
        }
        const decodedToken = JWT.verify(
            incomingrefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        if(incomingrefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is used or expired")
        }
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user?._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
        return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(200,{accessToken, refreshToken},"Refresh token generated successfully")
        )
    } catch (error) {
        throw new ApiError(401, error?.message ||  "User unauthorized for refresh token")
    }
})
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    try {
        const {oldPassword, newPassword} = req.body
    
        const user = await User.findById(req.user?._id)
        const ispasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
        if(!ispasswordCorrect){
            throw new ApiError("401", "Wrong password!")
        }
        user.password = newPassword
        await user.save({validateBeforeSave:false})
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password change successfully")
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong")
    }
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    const user = req.user
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Current User fetch successfully")
    )
})
const updateAccountDetails = asyncHandler(async(req,res)=>{
    try {
        const {username, fullname, email} = req.body 
        if(!(fullname || username || email)){
            throw new ApiError(400, "All fields are required")
        }
        const userId = req.user?._id
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    fullname,
                    email,
                    username
                }
            },
            {new: true}
        ).select("-password")
        return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User details updated successfully")
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong")
    }
})
const updateAvatar = asyncHandler(async(req,res)=>{
    try {
        const avatarLocalPath = req.file?.path
    
        if(!avatarLocalPath){
            throw new ApiError(404,"please upload avatar!")
        }
        const avatar = await uploadOnCloudinary(avatarLocalPath)
    
        if(!avatar.url){
            throw new ApiError(500,"Error while upload the avatar on cloudinary")
        }
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar: avatar?.url
                }
            },
            {new: true}
        ).select("-password -refreshToken")
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar updated successfully!")
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong")
    }
})
const updateCoverImage = asyncHandler(async(req,res)=>{
    try {
        const coverImageLocalPath = req.file?.path
    
        if(!coverImageLocalPath){
            throw new ApiError(404,"please upload coverImage!")
        }
        const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    
        if(!coverImage.url){
            throw new ApiError(500,"Error while upload the coverImage on cloudinary")
        }
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage: coverImage?.url
                }
            },
            {new: true}
        ).select("-password")
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, user, "coverImage updated successfully!")
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "something went wrong")
    }
})
const getUserCurrentChannel = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                subscriberedChannel:{
                    $size: "$subscribedTo"
                },
                isSubscriber:{
                    $cond:{
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                subscribersCount: 1,
                subscriberChannel: 1,
                isSubscriber: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    console.log(channel)
    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})
const getUserWatchHistory = asyncHandler(async(req,res)=>{
    const user = User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully")
    )
})
export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserCurrentChannel,
    getUserWatchHistory
}