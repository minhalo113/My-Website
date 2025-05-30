import jwt, { decode } from 'jsonwebtoken';
import adminModel from "../models/adminModel.js"
import customerModel from '../models/customerModel.js';
import bcrypt from 'bcrypt';

const authMiddleware = async(req, res, next) => {
    try{
        const {accessToken, customerToken} = req.cookies;

        if(!accessToken && !customerToken){
            return res.status(401).json({error: "Please Login First"})
        }
        let decodeToken = null;

        if(accessToken){
            decodeToken = jwt.verify(accessToken, process.env.SECRET);
        }else if (customerToken){
            decodeToken = jwt.verify(customerToken, process.env.SECRET);
        }
        const userEmail = decodeToken.email;

        const user = await adminModel.findOne({email: userEmail}).select("+password") || await customerModel.findOne({email: userEmail}).select("+password")
        if (!user){
            return res.status(401).json({error: "User not found"});
        }
        
        if(decodeToken.password !== user.password){
            return res.status(401).json({error: "Password incorrect"})
        } 

        req.role = decodeToken.role;
        req.id = decodeToken.id;
        req.user = {
            id: user._id,
            email: user.email,
            name: user.name
        }
        next()
    }catch(error){
        console.log(error)
        return res.status(401).json({error: "Invalid or Expired Token. Please Login Again"})
    }
}

export default authMiddleware;