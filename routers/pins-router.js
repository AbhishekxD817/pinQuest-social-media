import { Router } from "express";
import {allPins, showPin, createNewPin , deletePin , updatePin ,
    likePin,dislikePin
} from '../controllers/pin-controllers.js'
import wrapAsync from '../utils/wrapAsync.js'
import { isUserLoggedIn , isPinOwner } from "../middlewares/Authentication.js";
import { validatePinSchema } from "../middlewares/validateSchema-joi.js";
import multer from "multer";
import { storage } from "../utils/cloudConfig.js";
import Pin from "../models/pin-model.js";
import ExpressErrors from "../utils/ExpressErrors.js";

const upload = multer({storage})

const pinsRouter = Router();




pinsRouter.route('/')
.get(isUserLoggedIn,wrapAsync(allPins))
.post(isUserLoggedIn,
    upload.single('image'),
    validatePinSchema,
    wrapAsync(createNewPin))

pinsRouter.route('/create')
.get(isUserLoggedIn,(req,res,next)=> res.render('CreatePin'))



pinsRouter.route('/:pinid')
.get(isUserLoggedIn,wrapAsync(showPin))
.patch(isUserLoggedIn,
    isPinOwner,
    upload.single('image'),
    validatePinSchema,
    wrapAsync(updatePin)
)
.delete(isUserLoggedIn,
    isPinOwner,
    wrapAsync(deletePin)
)


pinsRouter.route('/:pinid/edit')
.get(isUserLoggedIn,
    isPinOwner,
    wrapAsync(async(req,res,next)=>{
    let {pinid} = req.params;
    let pin = await Pin.findById(pinid)
    if(pin){
        return res.render('EditPin',{pin})
    }
    return next(new ExpressErrors(404,'No Pin Found'))
}))


pinsRouter.route('/:pinid/like')
.post(wrapAsync(likePin))
.delete(wrapAsync(dislikePin))




export default pinsRouter;