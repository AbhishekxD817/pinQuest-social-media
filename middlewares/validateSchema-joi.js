import ExpressErrors from '../utils/ExpressErrors.js';
import {UserSchema,PinSchema,CommentSchema} from '../utils/schema-joi.js'

const validateUserSchema = async ( req , res , next) =>{
    try {
        let {error} = await UserSchema.validate(req.body);
        if(error){
            const errorMessage = error.details[0].message;
            return next(new ExpressErrors(200,errorMessage))
        }else{
            return next();
        }
    } catch (error) {
        return next(error);
    }
}

const validatePinSchema = async ( req , res , next) =>{
    try {
        let tags = req.body.tags;
        req.body.tags = await tags.split(',').map(tag=> tag.trim());
    
        let {error} = await PinSchema.validate(req.body);
        if(error){
            console.log(error)
            const errorMessage = error.details[0].message;
            return next(new ExpressErrors(200,errorMessage))
        }else{
            return next();
        }
    } catch (error) {
        return next(error)
    }
}

const validateCommentSchema = async ( req , res , next) =>{
    try {
        let {error} = await CommentSchema.validate(req.body);
        if(error){
            const errorMessage = error.details[0].message;
            return next(new ExpressErrors(200,errorMessage))

        }else{
            return next();
        }
    } catch (error) {
        return next(error)
    }
}

export { validateCommentSchema  ,
         validatePinSchema     ,
         validateUserSchema     }