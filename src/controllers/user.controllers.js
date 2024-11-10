import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { response } from "express";

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

    const {username, password, email}  = req.body
    if([username, password, email].some((field)=>
        field?.trim()===""
    )){
        throw new ApiError(400, "Please fill all the details")
    }
    // if(!username || !email){
    //     throw new ApiError(400, "provide username or email")
    // }
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

export {
    registerUser,
    loginUser,
    logOutUser
}