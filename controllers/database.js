import mongoose from "mongoose";
import 'dotenv/config'

const connectMongoDatabase = async () =>{
    try {
        const db = await mongoose.connect(process.env.MONGO_URL);
        console.log('==> MongoDB connected successfully')
    } catch (error) {
        console.log(error)
    }
}

export default connectMongoDatabase;