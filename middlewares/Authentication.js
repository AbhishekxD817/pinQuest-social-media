import Pin from "../models/pin-model.js";
import User from "../models/user-model.js";
import ExpressErrors from "../utils/ExpressErrors.js";
import Comment from "../models/comment-model.js";

const isUserLoggedIn = async (req,res,next) =>{
    try {
        let userLoggedIn = await req.isAuthenticated();
        if(!userLoggedIn){
            req.flash('error','Please Create an Account To Continue')
            return res.redirect('/signup');
        }
        return next();
    } catch (error) {
        next(error);
    }
}

const isAccountOwner = async (req,res,next) =>{
    try {
        let currentUser = req.user;
        let { username } = req.params;
        let user = await User.findOne({username});
    
        if(!user || !currentUser){
            return next(new ExpressErrors(200,'Bad Request'))
        }
    
        if(currentUser._id.equals(user._id) &&
           currentUser.email ===  user.email ){
            return next();
        }else{
            return next(new ExpressErrors(200,'You Dont Have Permissions'))
        }
    } catch (error) {
        return next(error)
    }

}

const isPinOwner = async(req,res,next) =>{
    let {pinid} = req.params;
    let currentUser = req.user;
    let pin = await Pin.findById(pinid).populate('owner')

    if(!pin || !currentUser){
        return next(new ExpressErrors(404,'Something went wrong'))
    }
    if(!pin.owner._id.equals(currentUser._id)){
        return next(new ExpressErrors(200,'You Are not the owner of this pin'))
    }
    next();
}

const isCommentAuthor = async (req,res,next) =>{
    try {
        let {commentId} = req.params;
        let comment = await Comment.findById(commentId)
        let currentUser = req.user;
    
        if(!comment){
            return next(new ExpressErrors(404,'No such comment exists'))
        }
        if(!comment.author.equals(currentUser._id)){
            return next(new ExpressErrors(200,'You dont have permissions'))
        }
        next();

    } catch (error) {
        return next(error)
    }
}

export {isUserLoggedIn , isAccountOwner , isPinOwner , isCommentAuthor};