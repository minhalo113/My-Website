import responseReturn from './../../utils/response.js';
import createToken from './../../utils/tokenCreate.js';
import customerModel from '../../models/customerModel.js';
import bcrypt from 'bcrypt'
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import {sendMail} from '../../utils/mail.js'

const BASE_COOKIE_PROPS = {
    httpOny: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'none',
    domain: '.ahistoryfactaday.org',
    path: '/',
}

class customerAuthController {
    customer_register = async (req, res) => {
        const { name, email, password } = req.body;
        try{
            const customer = await customerModel.findOne({ email });
            if (customer) {
                return responseReturn(res, 404, {error: "Email Already Exists"} )
            }else{
                const createCustomer = await customerModel.create({
                    name: name.trim(),
                    email: email.trim(),
                    password: await bcrypt.hash(password, 10),
                    method: 'manually',
                    role: 'customer',
                    wishlist: []
                })
                // await sellerCustomerModel.create({
                //     myId: createCustomer.id
                // })
                const token = await createToken({
                    id: createCustomer.id,
                    name: createCustomer.name,
                    email: createCustomer.email,
                    method: createCustomer.method,
                    role: createCustomer.role,
                    password: createCustomer.password,
                })

                const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
                res.cookie('customerToken', token, {
                        ...BASE_COOKIE_PROPS,
                        maxAge: ONE_WEEK,
                    })

                return responseReturn(res, 201, {message: "User Register Success", token})
            }
        }catch(error){
            return responseReturn(res, 404, { error: error.message})
        }
    }

    customer_login = async(req, res) => {
        const {email, password} = req.body;

        try{
            const customer = await customerModel.findOne({email}).select('+password')
    
            if(customer){
                const match = await bcrypt.compare(password, customer.password)

                if(match){
                    const token = await createToken({
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                        method: customer.method,
                        role: customer.role,
                        password: customer.password
                    })

                    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
                    res.cookie('customerToken', token,{
                        ...BASE_COOKIE_PROPS,
                        maxAge: ONE_WEEK,
                    })

                    responseReturn(res, 201, {message: "User Login Success", token})
                }else{
                    responseReturn(res, 404, {error: "Password Wrong"})
                }
            }else{
                responseReturn(res, 404, {error: "Email Not Found"})
            }         
        }catch(error){
            console.log(error.message)
        }
    }

    customer_logout = (req, res) => {
        res.cookie('customerToken', '', {
            ...BASE_COOKIE_PROPS,
            expires: new Date(0),       
        });
        res.cookie('accessToken', '', {
            ...BASE_COOKIE_PROPS,
            expires: new Date(0),
        });

        responseReturn(res, 200, { message: 'Logout Success' });
    };

    customer_get_info = async(req, res) => {
        return responseReturn(res, 200, {user: req.user})
    }

    customer_change_avater = async(req, res) => {
        try{
            const myUser = req.user;
            const form = formidable({})
    
            form.parse(req, async(err, fields, files) => {
                let images = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
                cloudinary.config({
                    cloud_name: process.env.cloud_name,
                    api_key: process.env.api_key,
                    api_secret: process.env.api_secret,
                    secure: true
                })

                try{
                    const user = await customerModel.findById(myUser.id);
                    if(!images){
                        return responseReturn(res, 400, {error: "No image uploaded"});
                    }
                    const uploaded = await cloudinary.uploader.upload(images.filepath, {
                        public_id: `avatars/${user._id}`,
                        overwrite: true,
                        invalidate: true
                    })

                    user.profileImages = {
                        url: uploaded.secure_url,
                        public_id: uploaded.public_id
                    }

                    await user.save()
    
                    return responseReturn(res, 201, {message: "Avatar Added Successfully", profileImage: user.profileImages});
                }catch(error){
                    console.log(error)
                    return responseReturn(res, 500, {message: error.message});
                }
            })
        }catch(err){
            console.log(err)
            return responseReturn(res, 500, {message: err.message});
        }
    }

    customer_update_password = async(req, res) => {
        try{
            const {currentPassword, newPassword} = req.body;
            const user = await customerModel.findById(req.user.id).select(`+password`);

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if(!isMatch) return res.status(400).json({message: "Incorrect current password"});

            if(newPassword) {
                user.password = await bcrypt.hash(newPassword, 10);
                await user.save();
            }

            return responseReturn(res, 200, {message: "Profile updated successfully"});

        }catch(err){
            console.log(err)
            return responseReturn(res, 500, {message: err.message});
        }
    }

    generatePassword(length = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      }

    customer_forgot_password = async(req, res) => {
        try{
            const {email} = req.body;
            const user = await customerModel.findOne({email}).select('+password');

            if (!user) {
                return responseReturn(res, 404, { message: 'Email Not Found',error: 'Email Not Found'})
            }

            const randomPassword = this.generatePassword();
            user.password = await bcrypt.hash(randomPassword, 10);
            await user.save();

            const {data, error} = await sendMail({
                from: process.env.RESEND_FROM,
                to: email,
                subject: 'Password Reset',
                text: `Your new password is: ${randomPassword}`,
            })

            if (error) {
                throw new Error(error.message)
              }

            return responseReturn(res, 200, {message: 'A new password has been sent to your email'});
        }catch(err){
            console.log(err);
            return responseReturn(res, 500, {message: err.message});
        }
    }
}

export default new customerAuthController();
