import Joi from "joi";

const UserSchema = Joi.object({
    name : Joi.string().required(),
    username : Joi.string().required(),
    email : Joi.string().email({minDomainSegments:2,tlds : { allow:['com','net','in'] }}).required(),
    password: Joi.string().required()
})

const PinSchema = Joi.object({
    title: Joi.string().max(50),
    description :Joi.string(),
    tags : Joi.array(),
}).required()

const CommentSchema = Joi.object({
    comment : Joi.string().length(50).required()
}).required()

export {UserSchema,PinSchema,CommentSchema};