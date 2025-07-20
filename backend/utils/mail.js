import {Resend} from 'resend';
import dotenv from "dotenv"
import process from "process"
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async (opts) => {
    try{
        const result = await resend.emails.send(opts);
        console.log("Email send result:", result);

        if (result.error){
            console.error("Email send errorL ", result.error)
        }
        return result
    }catch(e){
        console.log("Not good: ", e);

    }
}