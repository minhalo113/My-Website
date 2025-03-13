import jwt from 'jsonwebtoken';
import adminModel from "../models/adminModel.js"
import customerModel from '../models/customerModel.js';
import bcrypt from 'bcrypt';

const authMiddleware = async(req, res, next) => {
    try{
        const {accessToken} = req.cookies;

        if(!accessToken){
            return res.status(401).json({error: "Please Login First"})
        }

        const decodeToken = jwt.verify(accessToken, process.env.SECRET)
        const userEmail = decodeToken.email

        const user = await adminModel.findOne({email: userEmail}).select("+password") || await customerModel.findOne({email: userEmail}).select("+password")
        if (!user){
            return res.status(401).json({error: "User not found"});
        }
        
        if(decodeToken.password !== user.password){
            return res.status(401).json({error: "Password incorrect"})
        } 

        req.role = decodeToken.role;
        req.id = decodeToken.id;
        next()
    }catch(error){
        console.log(error)
        return res.status(401).json({error: "Invalid or Expired Token. Please Login Again"})
    }
}

export default authMiddleware;