import { Router } from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { addComment,deleteComment } from "../controllers/comment-controller.js";
import { isUserLoggedIn,isCommentAuthor } from "../middlewares/Authentication.js";
const commentsRouter = Router({mergeParams:true});


commentsRouter.route('/')
.post(isUserLoggedIn,
    wrapAsync(addComment))

commentsRouter.route('/:commentId')
.delete(isUserLoggedIn,
    isCommentAuthor,
    wrapAsync(deleteComment))









export default commentsRouter;