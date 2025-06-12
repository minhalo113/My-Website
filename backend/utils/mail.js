import {Resend} from 'resend';
import dotenv from "dotenv"
import process from "process"
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = (opts) => resend.emails.send(opts)