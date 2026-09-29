import mongoose from "mongoose";

const connectToDb = async()=>{
    try{
        const {connection} = await mongoose.connect(
            `mongodb+srv://userdb:${process.env.DATABASE_PASSWORD}@cluster0.hkbuoog.mongodb.net/`
        )

        if (connection){
            console.log(`connected to database successfully ${connection.host}`)
        }
    }catch(e){
        console.log(`failed to connect: ${e.message}`)
    }
}

export default connectToDb