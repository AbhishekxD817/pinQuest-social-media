import Pin from '../models/pin-model.js'
import ExpressErrors from '../utils/ExpressErrors.js';


const TopPins = async (req,res,next) =>{
    let topPins = await Pin.find({owner:'668f78edfcfb824a5b9d229d'}).populate('owner').limit(10)
    return topPins;
}

const allPins = async (req,res,next) =>{
    let allPins = await Pin.find().populate('owner');
    let publicPinsArray = allPins.filter((pin)=> pin.owner.account === 'public')
    return res.render('Pins',{pins:publicPinsArray});
    
}

const showPin = async (req,res,next) =>{
    let {pinid} = req.params;
    let pin = await Pin.findById(pinid).populate('owner').populate({
        path:'comments',
        populate:{
            path:'author'
        }
    });
    if(pin){
        return res.render('ShowPin',{pin,host:req.headers.host,protocol:req.protocol})
    }else{
        return next(new ExpressErrors(404,'Page Not Found'))
    }
}


const createNewPin = async (req,res,next)=>{
    let {title,description , tags} = req.body;
    let currentUser = req.user;

    let newPin = await Pin({
        title,description,tags,
        image:{
            url:req.file.path,
            name:req.file.originalname
        },
        owner:currentUser._id
    })

    currentUser.pins.push(newPin._id);
    await currentUser.save();
    await newPin.save();

    req.flash('success','New Pin Created And Posted');
    return res.redirect(`/${req.user.username}`);
}


const deletePin = async (req,res,next) =>{
    let {pinid} = req.params;
    let pin = await Pin.findById(pinid);
    if(!pin){
        return next(200,'Bad Req');
    }

    let currentUser = req.user;
    let pinIndex = currentUser.pins.indexOf(pin._id);
    currentUser.pins.splice(pinIndex,1);
    currentUser.save();

    let deletedPin = await Pin.findByIdAndDelete(pinid);

    return res.redirect(`/${req.user.username}`);
}

const updatePin = async (req,res,next)=>{
    let {pinid} = req.params;
    let {title,description,tags} = req.body;

    
    let pin = await Pin.findById(pinid);
    if(!pin){
        return next(new ExpressErrors(404,'No Pin FOund'))
    }
    pin.title = title;
    pin.description = description;
    pin.tags = tags;

    if(req.file && req.file.path && req.file.originalname){
            pin.image = {
            url: req.file.path,
            name: req.file.originalname
        }
    }

    await pin.save();

    return res.redirect(`/${req.user.username}`)
}

const likePin = async (req,res,next) =>{
    let currentUser = req.user;
    let {pinid} = req.params;
    let pin = await Pin.findById(pinid);
    if(!pin){
        return next(new ExpressErrors(404,'No such pin exists'))
    }
    let currUidIndex = pin.likes.indexOf(currentUser._id)
    if(currUidIndex && currUidIndex > -1){
        return next(new ExpressErrors(200,'Bad Req'))
    }
    pin.likes.push(currentUser._id)
    await pin.save();
    return res.redirect(`/pins/${pinid}`)
}

const dislikePin = async (req,res,next) =>{
    let currentUser = req.user;
    let {pinid} = req.params;
    let pin = await Pin.findById(pinid);
    if(!pin){
        return next(new ExpressErrors(404,'No such pin exists'))
    }
    let currUidIndex = pin.likes.indexOf(currentUser._id)
    if(currUidIndex == -1){
        return next(new ExpressErrors(200,'Bad req'))
    }
    if( currUidIndex > -1){
        pin.likes.splice(currUidIndex,1);
    }
    await pin.save();
    return res.redirect(`/pins/${pinid}`)
}













export {TopPins , allPins, showPin,
     createNewPin,deletePin , updatePin,
    likePin,dislikePin};