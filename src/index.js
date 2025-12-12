import dotenv from "dotenv"
import connectDB from "./db/index.js";


dotenv.config({
  path: './env'
})


connectDB()

.then(()=>{
   app.listen(process.env.Port || 8000,()=>{
    console.log(`server is running at port: ${process.env.Port}`)
   })
})
.catch((err)=>{
  console.log("Mongodb connection failed !!!",err)
})




/*
import express from express
const app=express()
(async()=>{
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

    app.on("error",(error)=>{
      console.log("Error",error);
      throw error
    })

    app.listen(process.env.PORT,()=>{
      console.log(`APP is running on port ${process.env.PORT}`)
    })
  } catch (error) {
    console.error("Error:",error)
    throw err
  }
})()
  */
