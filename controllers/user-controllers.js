import User from '../models/user-model.js'
import ExpressErrors from '../utils/ExpressErrors.js'
import sendForgotPasswordMail from '../controllers/nodemailer.js'
import Pin from '../models/pin-model.js';

const signupUser = async (req, res, next)=>{
    try {
        let {email,password,username,name} = req.body;
        let user = await User.findOne({ $or:[ {email},{username}  ]});
        if(user){
            req.flash('error','User Already Exists');
            return res.redirect('/signup')
        }

        let newUser = await User({
            email,username,name,
            account:'public'
        })
        let newRegisteredUser = await User.register(newUser,password);
        req.login(newRegisteredUser,(err)=>{
            if(err) { return next(new ExpressErrors(500,err)) }
            req.flash('success','Welcome to PinQuest');
            return res.redirect('/');
        })

    } catch (error) {
        console.log(error)
        return next(new ExpressErrors(500,error));
    }
}

const loginUser = async ( req, res, next)=>{
    req.flash("success",'Welcome Back,',req.user.name)
    return res.redirect('/')
}

const logoutUser = async (req, res, next)=>{
    if(await req.isAuthenticated()){
        await req.logout((error)=>{
            if(error) { return next(new ExpressErrors(500,error))}
            req.flash('success','Logout Successfull');
            return res.redirect('/')
        });
    }else{
        req.flash('error','Please Login First')
        return res.redirect('/login');
    }
}

const forgotUserPassword = async ( req, res, next)=>{
    try {
        let {email} = req.body;
        let user = await User.findOne({email});
        if(!user){
            req.flash('error','No account found')
            return res.redirect('/forgot-password')
        }
        let resetToken = await user.generateResetToken();
        return sendForgotPasswordMail(req,res,next,user.email,resetToken);

    } catch (error) {
        console.log(error)
        return next(error)
    }
}

const resetPasswordRequestPage = async (req,res,next)=>{
    try {
        let {token} = req.params;
        let user = await User.findOne({'resetToken.token':token})
        if(!user){
            return next(new ExpressErrors(200,'Invalid Url'))
        }
        if(user.resetToken.expiry < Date.now()){
            return next(new ExpressErrors(200,'Invalid Url or Token Expired'))
        }
        return res.render('ResetPassword',{token:token})
    } catch (error) {
        return next(new ExpressErrors(500,'Error occured while reseting password'))
    }
}

const resetUserPassword = async (req, res, next) =>{
    try {
        let {token} = req.params;
        let {email,password:newPassword} = req.body;
        let user = await User.findOne({email,'resetToken.token':token});
        if(!user){
            return next(new ExpressErrors(200,'Bad Request'))
        }
        if(user.resetToken.expiry < Date.now()){
            return next(new ExpressErrors(200,'Invalid Url or Token Expired'))
        }
        
        await user.setPassword(newPassword,async(err,result)=>{
            if(err){
                console.log(err);
                req.flash('error',err);
                return next(new ExpressErrors(500,'Error while setting new password'))
            }
            if(!err && res){
                user.resetToken.token = undefined;
                user.resetToken.expiry = undefined;
                await user.save();
                req.flash('success','Password reset successfull,please login with new password')
                return res.redirect('/login')
            }
        })
    } catch (error) {
        return next(new ExpressErrors(500,'Error while resetting password'))
    }
}


const searchProfile = async(req,res,next)=>{
    let {username} = req.query;
    let user = await User.findOne({username:username});
    if(!user){
        req.flash('error','Sorry No user with this username exists')
        return res.redirect('/pins')
    }
    return res.redirect(`/${user.username}`);
}

const showProfile = async (req,res,next) =>{
    try {
        let {username} = req.params;
        let user = await User.findOne({username}).populate('pins');
        if(user){
            let uid = user._id;
            return res.render('Profile',{user,pins:user.pins,protocol:req.protocol,host:req.headers.host});
        }else{
            return next(new ExpressErrors(404,'No User Found'))
        }
    } catch (error) {
        return next(error);
    }
}


const showEditProfile = async (req,res,next) =>{
    let {username} = req.params;
    let user = await User.findOne({username});
    if(user){
        return res.render('EditProfile',{user})
    }else{
        return next(new ExpressErrors(404,'No user found'))
    }
}


const updateUserProfile = async(req,res,next) =>{
    let {username} = req.params;
    let user = await User.findOne({username});

    if(!user){
        return next(new ExpressErrors(400,'No user found'))
    }
    let {name,username:newUsername,account} = req.body;
    if(account !== 'private' && account !== 'public'){
        return next(new ExpressErrors(200,'Account Should Be Private Or Public'))
    }
    let oldAccountType = user.account;
    let newAccountType = account;

    if(user.username !== newUsername){
        let newUsernameExists = await User.findOne({username:newUsername})
        if(newUsernameExists){
            return next(new ExpressErrors(200,'User already Exists'))
        }else{
            user.name = name;
            user.username = newUsername;
            user.account = account;
        }
    }else{
        user.name = name;
        user.account = account;
    }

    if(oldAccountType === 'private' && newAccountType === 'public'){
        user.followRequestRecieved.forEach(async(id)=>{
            let u = await User.findById(id);
            let userIdIndex = u.followRequestSent.indexOf(user._id);
            u.followRequestSent.splice(userIdIndex,1);
            u.following.push(user._id);
            await u.save();
        })
        user.followers = user.followers.concat(user.followRequestRecieved)
        user.followRequestRecieved = []
        
        await user.save();
    }else{
        await user.save();
    }
    

    req.flash('success','Profile updated')
    return res.redirect(`/${newUsername}`)
}



const follow = async (req,res,next) =>{
    let currentUser = req.user;
    let {username} = req.params;

    let user = await User.findOne({username});

    if(!user){
        return next(new ExpressErrors(200,'Bad Request/No user found'))
    }
    if(currentUser.email === user.email){
        return next(new ExpressErrors(200,'Invalid Req'))
    }

    if(user.account === 'public'){
        user.followers.push(currentUser._id);
        currentUser.following.push(user._id);

        await user.save();
        await currentUser.save();
        req.flash('success',`You started Following ${username}`)

    } else if( user.account === 'private'){

        if(currentUser.followRequestSent.indexOf(user._id) > -1){
            req.flash('success','follow request already sent')
            return res.redirect(`/${username}`)
        }


        user.followRequestRecieved.push(currentUser._id)
        currentUser.followRequestSent.push(user._id)

        await user.save();
        await currentUser.save();
        req.flash('success',`Follow Request Sent to ${username}`)

    }
    return res.redirect(`/${username}`)
    


}

const unfollow = async (req,res,next) =>{
    let currentUser = req.user;
    let {username} = req.params;
    
    let user = await User.findOne({username})
    if(!user){
        return next(new ExpressErrors(404,'No User Found'))
    }
    if(currentUser.email === user.email){
        return next(new ExpressErrors(200,'Invalid Req, Bad req'))
    }

    let uidIndex = currentUser.following.indexOf(user._id)
    let curUidIndex = user.followers.indexOf(currentUser._id)

    if(uidIndex > -1 && curUidIndex > -1){
        currentUser.following.splice(uidIndex,1);
        user.followers.splice(curUidIndex,1);

        await currentUser.save();
        await user.save();
    }

    req.flash('success',`You unfollowed ${username}`)
    return res.redirect(`/${username}`);

}

const undoFollowRequest = async (req,res,next) =>{
    let currentUser = req.user;
    let {username} = req.params;
    let user = await User.findOne({username});
    if(!user){
        return next(new ExpressErrors(404,'No User Found'))
    }
    if(currentUser.email === user.email){
        return next(new ExpressErrors(200,'Bad Req, Invalid'))
    }

    let uidIndex = currentUser.followRequestSent.indexOf(user._id)
    let currUidIndex = user.followRequestRecieved.indexOf(currentUser._id)

    if(uidIndex > -1 && currUidIndex > -1){
        currentUser.followRequestSent.splice(uidIndex,1);
        user.followRequestRecieved.splice(currUidIndex,1)

        await currentUser.save();
        await user.save();
    }

    return res.redirect(`/${username}`);

}


const showFollowersList = async (req,res,next) =>{
    let currentUser = req.user;
    let {username} = req.params;
    let user = await User.findOne({username}).populate('followers');
    if(!user){
        return next(new ExpressErrors(404,'No User Found'))
    }
    if(currentUser.email !== user.email){
        return next(new ExpressErrors(200,'Bad Req, Invalid'))
    }
    if(user.followers.length > 0){
        let followers = user.followers;
        return res.render('FollowList',{users:followers,title:'Followers'})
    }
    req.flash('error','You Have 0 followers')
    return res.redirect(`/${username}`)

}

const showFollowingList = async (req,res,next)=>{
    let currentUser = req.user;
    let {username} = req.params;
    let user = await User.findOne({username}).populate('following');
    if(!user){
        return next(new ExpressErrors(404,'No User Found'))
    }
    if(currentUser.email !== user.email){
        return next(new ExpressErrors(200,'Bad Req, Invalid'))
    }

    if(user.following.length > 0){
        let following = user.following;
        return res.render('FollowList',{users:following,title:'Following'})
    }
    req.flash('error','You Are Not Following Anyone')
    return res.redirect(`/${username}`)
}


const showPendingRequests = async (req,res,next)=>{
    let currentUser = req.user;
    let {username} = req.params;

    let user = await User.findOne({username}).populate('followRequestRecieved');
    if(!user){
        return next(new ExpressErrors(404,'No User Found'))
    }
    if(currentUser.email !== user.email){
        return next(new ExpressErrors(200,'Bad Req, Invalid'))
    }

    if(user.followRequestRecieved.length > 0){
        return res.render('FollowReqestsList',{users:user.followRequestRecieved})
    }
    req.flash('error','No New Follow Request Recieved')
    return res.redirect(`/${username}`);
}



const acceptFollowRequest = async(req,res,next) =>{
    let currentUser = req.user;
    let {username} = req.params;

    let user = await User.findOne({username}).populate('followRequestRecieved');
    if(!user){
        return next(new ExpressErrors(404,'No User Found'))
    }
    if(currentUser.email === user.email){
        return next(new ExpressErrors(200,'Bad Req, Invalid'))
    }
    
    let uidIndex = currentUser.followRequestRecieved.indexOf(user._id)
    let currUidIndex = user.followRequestSent.indexOf(currentUser._id)

    if(uidIndex > -1 && currUidIndex > -1){
        currentUser.followRequestRecieved.splice(uidIndex);
        user.followRequestSent.splice(currUidIndex);

        currentUser.followers.push(user._id);
        user.following.push(currentUser._id);

        await currentUser.save();
        await user.save();
    }

    res.redirect(`/${currentUser.username}/pending`)

}

const rejectFollowRequest = async (req,res,next)=>{
    let currentUser = req.user;
    let {username} = req.params;

    let user = await User.findOne({username}).populate('followRequestRecieved');
    if(!user){
        return next(new ExpressErrors(404,'No User Found'))
    }
    if(currentUser.email === user.email){
        return next(new ExpressErrors(200,'Bad Req, Invalid'))
    }
    
    let uidIndex = currentUser.followRequestRecieved.indexOf(user._id)
    let currUidIndex = user.followRequestSent.indexOf(currentUser._id)

    if(uidIndex > -1 && currUidIndex > -1){
        currentUser.followRequestRecieved.splice(uidIndex);
        user.followRequestSent.splice(currUidIndex);

        await currentUser.save();
        await user.save();
    }

    res.redirect(`/${currentUser.username}/pending`)
}






export { signupUser, loginUser , logoutUser ,
     forgotUserPassword ,resetPasswordRequestPage,
      resetUserPassword , showProfile , showEditProfile ,
      showFollowersList,showFollowingList, acceptFollowRequest,
      rejectFollowRequest,searchProfile,
      updateUserProfile , follow , unfollow , undoFollowRequest,
      showPendingRequests};