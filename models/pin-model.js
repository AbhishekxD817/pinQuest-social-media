import mongoose from "mongoose";
import { Schema } from "mongoose";
const pinSchema = new Schema({
    owner:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    image:{
        url:String,
        name:String
    },
    title:{
        type:String
    },
    description:{
        type:String
    },
    tags:[
        {
            type:String
        }
    ],
    likes:[
        {
            type:Schema.Types.ObjectId,
            ref:'User'
        }
    ],
    comments:[
        {
            type:Schema.Types.ObjectId,
            ref:'Comment'
        }
    ]
})

const Pin = mongoose.model('Pin',pinSchema);

export default Pin;