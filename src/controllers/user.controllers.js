import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
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
    const coverLocalImagePath = req.files?.coverImage[0]?.path
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

export {registerUser}