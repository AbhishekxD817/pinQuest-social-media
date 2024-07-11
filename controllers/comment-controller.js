import Pin from "../models/pin-model.js";
import Comment from '../models/comment-model.js'
import ExpressErrors from "../utils/ExpressErrors.js";

const addComment = async(req,res,next)=>{
    let {comment} = req.body;
    let {pinid} = req.params;
    let pin = await Pin.findById(pinid)
    if(!pin){
        return next(new ExpressErrors(404,'No Such pin found'))
    }
    let newComment = await Comment({
        comment,
        pin:pin._id,
        author:req.user._id
    })

    pin.comments.push(newComment._id);

    await newComment.save();
    await pin.save();

    req.flash('success','New comment added')
    return res.redirect(`/pins/${pinid}`)
}

const deleteComment = async(req,res,next)=>{
    let {pinid,commentId} = req.params;
    let pin = await Pin.findById(pinid)
    let comment = await Comment.findById(commentId)


    if(!comment || !pin || !comment.pin.equals(pin._id)){
        return next(new ExpressErrors(404,'Invalid Req'))
    }

    let commentIdx = pin.comments.indexOf(commentId);
    pin.comments.splice(commentIdx,1);
    await pin.save();
    await Comment.findByIdAndDelete(commentId);

    return res.redirect(`/pins/${pinid}`);
}


export {addComment,deleteComment}