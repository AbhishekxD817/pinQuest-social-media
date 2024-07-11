import mongoose from "mongoose";
import { Schema } from "mongoose";
const commentSchema = new Schema({
    comment:{
        type:String,
        required:true
    },
    pin:{
        type:Schema.Types.ObjectId,
        ref:'Pin',
        required:true
    },
    author:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now()
    }
})

const Comment = mongoose.model('Comment',commentSchema);

export default Comment;