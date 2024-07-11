import { Router } from "express";

import {signupUser,loginUser,searchProfile,logoutUser,
     updateUserProfile,
    resetPasswordRequestPage , showProfile ,
    resetUserPassword , forgotUserPassword , 
    showEditProfile , follow, unfollow, acceptFollowRequest,
    undoFollowRequest , showFollowersList, rejectFollowRequest,
     showFollowingList , showPendingRequests} from '../controllers/user-controllers.js'

import passport from "passport";
import wrapAsync from "../utils/wrapAsync.js";
import { isUserLoggedIn , isAccountOwner } from "../middlewares/Authentication.js";
import { validateUserSchema } from "../middlewares/validateSchema-joi.js";
const usersRouter = Router();


usersRouter.route('/signup')
.get((req,res,next)=>{
    return res.render('Signup')
})
.post(validateUserSchema,signupUser)

usersRouter.route('/login')
.get((req,res)=>{
    return res.render('Login')
})
.post(
    await passport.authenticate('local',{
        failureFlash:true,
        failureRedirect:'/login'
    }),
    loginUser
)


usersRouter.route('/forgot-password')
.get((req,res,next)=>{
    return res.render('ForgotPassword')
})
.post(forgotUserPassword)


usersRouter.route('/reset/:token')
.get(resetPasswordRequestPage)
.patch(resetUserPassword)




usersRouter.route('/logout')
.get(isUserLoggedIn,logoutUser);







usersRouter.use(isUserLoggedIn);

usersRouter.route('/search')
.get(wrapAsync(searchProfile))

usersRouter.route('/:username')
.get(wrapAsync(showProfile))
.patch(isAccountOwner,wrapAsync(updateUserProfile))


usersRouter.route('/:username/edit')
.get(isAccountOwner,wrapAsync(showEditProfile))

usersRouter.route('/:username/follow')
.get(wrapAsync(follow))

usersRouter.route('/:username/unfollow')
.get(wrapAsync(unfollow));

usersRouter.route('/:username/undo')
.get(wrapAsync(undoFollowRequest))

usersRouter.route('/:username/followers')
.get(isAccountOwner,wrapAsync(showFollowersList))

usersRouter.route('/:username/following')
.get(isAccountOwner,wrapAsync(showFollowingList))


usersRouter.route('/:username/pending')
.get(isAccountOwner,wrapAsync(showPendingRequests))

usersRouter.route('/:username/accept')
.get(wrapAsync(acceptFollowRequest))

usersRouter.route('/:username/reject')
.get(wrapAsync(rejectFollowRequest))


export default usersRouter;