import mongoose, { Schema } from "mongoose";

const playListSchema = new Schema({
    videos: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    }
}, {timestamps: true})


export const PlayList = mongoose.model("PlayList", playListSchema)