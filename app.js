import express from 'express'
import * as path from "path"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import 'dotenv/config'
import  connectMongoDatabase from './controllers/database.js'
import flash from 'connect-flash'
import methodOverride from 'method-override'

import session from 'express-session'
import MongoStore from 'connect-mongo'
import passport from 'passport'
import LocalStratergy from 'passport-local'

import {TopPins} from './controllers/pin-controllers.js'
//models
import User from './models/user-model.js'
import usersRouter from './routers/users-router.js';
import pinsRouter from './routers/pins-router.js';
import commentsRouter from './routers/comments-router.js';
import ExpressErrors from './utils/ExpressErrors.js';
import { isUserLoggedIn } from './middlewares/Authentication.js';



const app = express();
const sessionOptions = {
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    store : MongoStore.create({
        mongoUrl : process.env.MONGO_URL,
        collectionName : 'sessions'
    }),
    cookie: {
        maxAge : 1000 * 60 * 60 * 24 
    }
}

const PORT = process.env.PORT || 9091;
app.listen(PORT,async()=>{
    console.log('Server started ==> http://localhost:'+process.env.PORT);
    await connectMongoDatabase();
})


app.set('view engine','ejs');
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(methodOverride('_method'));
app.use(flash())
app.use(session(sessionOptions))
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStratergy({
    usernameField: 'email',
    passwordField: 'password'
}, 
    async function(email, password, done) {
        try {
          const user = await User.findOne({ email: email });

          if (!user) {
            return done(null, false, { message: 'Incorrect email.' });
          }

          const isMatch = await user.verifyPassword(password);
          if (!isMatch.user) {
            return done(null, false, { message: isMatch.error.message });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
    }
))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req,res,next)=>{
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.user;
  next();
})






app.get('/',async(req,res,next)=>{
  let topPins = await TopPins();
  return res.render('Home',{pins:topPins});
})


app.use('/pins',pinsRouter);
app.use('/pins/:pinid/comments',commentsRouter)
app.use('/',usersRouter);





app.all("*",(req,res,next)=>{
  return next(new ExpressErrors(404,'Not Found'))
})

app.use((err,req,res,next)=>{
  let {status = 500, message = 'something went wrong'} = err;
  return res.status(status).render('Error.ejs',{error:message});
})