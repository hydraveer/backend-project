// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    app.on("err",(err)=>{
        console.log(err);
        throw err
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("MongoDb connection fail",err);
    
})

// ;( async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log(error);
//             throw error
//         })
//         app.listen(process.env.PORT, ()=>{
//             console.log("listing on port 3000");
//         })
//     } catch (error) {
//         console.log(error);
//         throw error
//     }
// }) ()