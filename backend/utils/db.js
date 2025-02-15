import mongoose from "mongoose"
import dotenv from "dotenv"
import process from "process"
dotenv.config();

const dbConnect = async() => {
    try{
        const conn = await mongoose.connect(process.env.CONNECTURI + process.env.DATABASENAME, {useNewURLParser: true})
        console.log("Database connected", conn.connections[0].name)
    }catch(error){
        console.log(error.message)
    }
}
export default dbConnect