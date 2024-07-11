import mongoose, { mongo } from "mongoose";
import { Schema } from "mongoose";
import passportLocalMongoose from 'passport-local-mongoose'
import crypto from 'crypto'

const userSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    account:{
        type:String,
        enum:['private','public'],
        required:true // during singup by default public
    },
    followers:[
        {
            type:Schema.Types.ObjectId,
            ref:'User'
        }
    ],
    following:[
        {
            type:Schema.Types.ObjectId,
            ref:'User'
        }
    ],
    followRequestSent:[
        {
            type:Schema.Types.ObjectId,
            ref:'User'
        }
    ],
    followRequestRecieved:[
        {
            type:Schema.Types.ObjectId,
            ref:'User'
        }
    ],
    pins:[
        {
            type:Schema.Types.ObjectId,
            ref:'Pin'
        }
    ],
    role:{
        type:String,
        enum:['user','admin'],
        default:'user'
    },
    resetToken:{
        token:{
            type:String
        },
        expiry:{
            type:Date
        }
    }
})

userSchema.plugin(passportLocalMongoose,{
    usernameField: 'email'
  })
userSchema.methods.verifyPassword = async function(password) {
    try {
      return await this.authenticate(password);
    } catch (err) {
      throw err;
    }
  };

userSchema.methods.generateResetToken = async function(){
    const token = await crypto.randomBytes(28).toString('hex');
    const expiry = Date.now() + 1000 * 60 * 60;
    this.resetToken = {
        token,
        expiry
    }
    await this.save();
    return token;
}



userSchema.pre('save',function(next){
    this.name = this.name.toLowerCase();
    this.username = this.username.toLowerCase();
    this.email = this.email.toLowerCase();
    this.account = this.account.toLowerCase();
    next();
})


const User = mongoose.model('User',userSchema);









export default User;
