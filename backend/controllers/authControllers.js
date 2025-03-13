import adminModel from "../models/adminModel.js";
import responseReturn from '../utils/response.js';
import bcrypt from "bcrypt"
import createToken from '../utils/tokenCreate.js';

class authControllers{
    // check validation
    check_validation = async(req, res) => {
        
    }

    // admin login backend execution
    admin_login = async(req, res) => {
        const {email, password} =req.body
        try{
            const admin = await adminModel.findOne({email}).select("+password")
            if(admin){
                const match = await bcrypt.compare(password, admin.password)
                if(match){
                    const token = await createToken({
                        id: admin.id,
                        role: admin.role,
                        name: admin.name,
                        email: admin.email,
                        password: admin.password,
                        images: admin.images
                    })
                    res.cookie('accessToken', token,{expires: new Date(Date.now() + 7 * 24 * 60 * 60*1000)} )
                    responseReturn(res, 200, {token, message: "Login Success", userInfo: admin});
                }else{
                    responseReturn(res, 401, {error: "Password Wrong"});
                }
            }else{
                responseReturn(res, 500, {error: "Email not Found"})
            }
        }catch(error){
            responseReturn(res, 500, {error: "Unknown error"})
        }
    }
}
export default new authControllers();