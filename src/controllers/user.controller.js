

// const registerUser=asyncHandler(async(req,res)=>{
//   /*
//   get user details front frontend 
//   validation --not empty
//   check is user already exist
//   check for images and avatar 
//   upload them in cloudinary
//   create user object--create entry in db
//   remove password and referesh token from response
//   check for user creation
//   return response
//   */
//   const {fullName,email,username,password} =req.body
//   console.log("email:",email)

//   if(
//     [fullName,email,username,password].some((field=>
//       field?.trim()===""
//     ))
//   ){
//     throw new ApiError(400,"All fields are required")
//   }
//    const existedUser=await User.findOne(
//     {
//       $or:[{username},{email}]
//     }
//    )

//    if(existedUser){
//     throw new ApiError(409,"User already existed")
//    }
    
//    const avatarLocalPath=req.files?.avatar[0]?.path;
//   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;


//    if(!avatarLocalPath){
//     throw new ApiError(400,"Avatar file is required")
//    }

//    const avatar=await uploadOnCloudinary(avatarLocalPath)
//    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    
//    if(!avatar){
//     throw new ApiError(400,"avatar file is required") }
   

//     const user=await User.create({
//       fullName,
//       avatar:avatar.url,
//       coverImage:coverImage?.url || "",
//       email,password,
//       username:username.toLowerCase()
//     })

//     const createdUser= await User.findOne(user._id).select(
//     "-password -refreshToken"
//     )

//     if(!createdUser){
//       throw new ApiError(500,"something went wrong while creating the user")
//     }

//     return res.status(201).json(
//       new ApiResponse(200,createdUser,"user created succcessfullly")
//     )
//  console.log("FILES RECEIVED:", req.files);

// })
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken= async(userId)=>
{
  try {
    const user=await User.findById(userId)
    const accessToken= user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()

    user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})
    return {refreshToken,accessToken}

  } catch (error) {
  console.error("TOKEN GENERATION ERROR:", error);
  throw new ApiError(500, error.message);
}
}




const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  console.log("EMAIL:", email);
  console.log("FILES RECEIVED:", req.files);

  // Validate fields
  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Check existing user
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // Multer file paths
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Upload files to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar?.url) {
    throw new ApiError(400, "Avatar upload failed");
  }

  // Create user
  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // Remove sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const loginUser=asyncHandler(async(req,res)=>{
  // req.body=>data
  //  username and email
  //  password Check
  //  access and refreshtoken
  //  send cookie
  const{email,username,password}=req.body
  
  if(!username && !email){
    throw new ApiError(400,"username or password  is required")
  }

  const user =await User.findOne({
    $or:[{username},{email}]
  })

  if(!user){
    throw new ApiError(404,"user not found")
  }

  const isPasswordValid=await user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(404,"password is not correct")
  }

const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

const loginInUser=await User.findById(user._id).
select("-password -refreshToken")

const options={
  httpOnly:true,
  secure:true
}

return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
  new ApiResponse(
    200,
    {
      user:loginInUser,accessToken,refreshToken
    },
    "User logged in successfully"
  )
)
})

const logoutUser=asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(

    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true
    }
  )

  const options={
  httpOnly:true,
  secure:true
}
return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"user Logged Out"))

})

const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401,"Unathourised request")
  }

  try {
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
    const user=await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401,"Invalid Refresh Token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh TOken is expired  or used")
    }
  
    const options={
    httpOnly:true,
    secure:true
  }
  
  const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {accessToken,refreshToken},
      "Access Token refreshed"
    )
  )
  
  } catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh Token")
  }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body
  const user=await User.findById(req.user?._id)
  const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect){
    throw new ApiError(400,"Invalid old Password")
  }
  user.password=newPassword
  await user.save({validateBeforeSave:false})
  return res.status(200)
  .json(new ApiResponse(200,{},"Password changed Successfully"))


})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});


const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body
   if(!fullName || !email){
    throw new ApiError(400,"")
   }

   const user=await User.findByIdAndUpdate(
    req.user?._id,{
      $set:{
        fullName,
        email:email
      }
    },
      {new:true}
    ).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
   
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
const avatarLocalPath=req.file?.path
if(!avatarLocalPath){
  throw new ApiError(200,"avatar file is missing")
}
const avatar=await uploadOnCloudinary(avatarLocalPath)
if(!avatar.url){
  throw new ApiError(400,"Error while Uploading on avatar")
}

const user=await User.findByIdAndUpdate(
req.user?._id,{
  $set:{
avatar:avatar.url
  }
},{new:true}

).select("-password")

return res.status(200)
    .json(new ApiResponse(200,user,"avatar Image  updated successfully"))

})


const updateUserCoverImage=asyncHandler(async(req,res)=>{
const coverImageLocalPath=req.file?.path
if(!coverImageLocalPath){
  throw new ApiError(200,"cover Imagefile is missing")
}
const coverImage=await uploadOnCloudinary(coverImageLocalPath)
if(!coverImage.url){
  throw new ApiError(400,"Error while Uploading on cover image")
}

const user=await User.findByIdAndUpdate(
req.user?._id,{
  $set:{
coverImage:coverImage.url
  }
},{new:true}

).select("-password")

 return res.status(200)
    .json(new ApiResponse(200,user,"cover Image  updated successfully"))

})

const getUserChannelProfile =asyncHandler(async(req,res)=>{
const {username} = req.params
if(!username?.trim()){
  throw new ApiError(400,"Username is missing")
}

const channel =await User.aggregate([
  {
    $match:{
      username:username?.toLowerCase()
    }
  },
  {
    $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"channel",
      as:"subscribers"
    }
  },
  {
   $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribedTo"
    }
  },
  {
   $addFields: {
      subscribersCount: {
      $size: "$subscribers"
      },
      channelsSubscribedToCount: {
       $size: "$subscribedTo"
       },
       isSubscribed: {
        $cond: {
           if: {$in: [req.user?._id, "$subscribers.subscriber"]},
        then: true,
        else: false
      }
    }
  }
 }, 
  {
    $project: {
    fullName: 1,
    username: 1,
    subscribersCount: 1,
    channelsSubscribedToCount: 1,
    isSubscribed: 1,
    avatar: 1,
    coverImage: 1,
    email: 1

 }
}
])
 if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
  })

    const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
  {
    $match: {
   _id: new mongoose.Types.ObjectId(req.user._id)
   }
  },
  {
   $lookup: {
    from: "videos",
     localField: "watchHistory",
      foreignField: "_id",
       as: "watchHistory",
    pipeline: [
     {
     $lookup: {
     from: "users",
     localField: "owner",
    foreignField: "_id",
   as: "owner",
         pipeline: [
      {
      $project: {
     fullName: 1,
       username: 1,
         avatar: 1
      }
     }
  ]
 }
    },
    {
     $addFields:{
                            owner:{
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
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})




export { registerUser,loginUser,logoutUser, refreshAccessToken,
getCurrentUser,changeCurrentPassword,updateAccountDetails,updateUserAvatar,
updateUserCoverImage,getUserChannelProfile,getWatchHistory
};




