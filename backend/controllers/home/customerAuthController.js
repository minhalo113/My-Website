import responseReturn from './../../utils/response.js';
import createToken from './../../utils/tokenCreate.js';
import customerModel from '../../models/customerModel.js';
import sellerCustomerModel from "../../models/chat/sellerCustomerModel.js"
import bcrypt from 'bcrypt'

class customerAuthController {
    customer_register = async (req, res) => {
        const { name, email, password } = req.body;

        try{
            const customer = await customerModel.findOne({ email });
            if (customer) {
                responseReturn(res, 404, {error: "Email Already Exists"} )
            }else{
                const createCustomer = await customerModel.create({
                    name: name.trim(),
                    email: email.trim(),
                    password: await bcrypt.hash(password, 10),
                    method: 'manually'
                })
                await sellerCustomerModel.create({
                    myId: createCustomer.id
                })
                const token = await createToken({
                    id: createCustomer.id,
                    name: createCustomer.name,
                    email: createCustomer.email,
                    method: createCustomer.method
                })
                res.cookie('customerToken', token, {
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                })

                responseReturn(res, 201, {message: "User Register Success", token})
            }
        }catch(error){
            responseReturn(res, 404, { error: error.message})
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
                        method: customer.method
                    })
                    res.cookie('customerToken', token, {
                        expires: new Date(Date.now() + 7 * 24 *60 * 60 *1000)
                    })
                    responseReturn(res, 201, {message: "User Login Success", token})
                }else{
                    responseReturn(res, 404, {error: "Password Wrong"})
                }
            } else{
                responseReturn(res, 404, {error: "Email Not Found"})
            }         
        }catch(error){
            console.log(error.message)
        }
    }

    customer_logout = async(req, res) => {
        res.cookie("customerToken", "", {
            expires: new Date(Date.now())
        })
        responseReturn(res, 200, {message: "Logout Success"})
    }

    customer_get_info = async(req, res) => {
        responseReturn(res, 200, {user: req.user})
    }
}

export default new customerAuthController();
