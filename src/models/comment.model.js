import mongoose, { Schema } from "mongoose";

const commnetSchema = new Schema({
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    commet:{ 
        type: String,
        required : true
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }
}, {timestamps: true})

export const Comment = mongoose.model("Comment", commnetSchema)