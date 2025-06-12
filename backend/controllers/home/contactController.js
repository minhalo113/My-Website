import responseReturn from './../../utils/response.js';

class contactController {
    send_contact = async(req, res) => {
        const {name, email, number, subject, message} = req.body;
        try{
            const resp = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify({
                    from: process.env.RESEND_FROM,
                    to: process.env.RESEND_TO,
                    subject: subject || 'New Contact Message',
                    text: `Name: ${name}\nEmail: ${email}\nPhone: ${number}\n\n${message}`
                })
            });

            if (!resp.ok){
                const text = await resp.text();
                throw new Error(text);
            }

            return responseReturn(res, 200, {message: 'Message sent'});
        }catch(error){
            console.log(error.message)
            return responseReturn(res, 500, {message: "Failed to send message" ,error: "Failed to send message"})
        }     
    }
}

export default new contactController();