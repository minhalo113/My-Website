import Stripe from 'stripe';
import responseReturn from "../../utils/response.js";
import { sendMail } from '../../utils/mail.js';
import customerOrder from '../../models/orderModel.js';
import moment from 'moment'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class paymentController {
    create_payment_session = async (req, res) => {
        try{
            const {cartItems, shipping, is_login} = req.body;

            if (!cartItems) {
                return responseReturn(res, 400, {error: "Missing cart or shipping information."})
            }

            const line_items = cartItems.map(item => ({
                price_data: {
                    currency: "cad",
                    product_data: {
                        name: item.name,
                        images: Array.isArray(item.img) ? [item.img[0]] : [item.img],
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.qty,
            }));

            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                line_items,
                payment_intent_data: {capture_method: 'manual',
                    metadata: {
                        customerId: req.id,
                        shipping: JSON.stringify(shipping),
                        cart: JSON.stringify(cartItems.id)
                    }
                },
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout-success?status=success`,
            })

            if (is_login){
                try{
                    const order = await customerOrder.create({
                        customerId: is_login.id,
                        customerEmail: is_login.email,
                        customerName: is_login.name,
                        shippingInfo: shipping,
                        products: cartItems,
                        price: cartItems.reduce((t,i) => t + i.price * i.qty, 0),
                        payment_status: 'Uncaptured',
                        delivery_status: 'Pending',
                        order_status: 'Pending',
                        date: moment(Date.now()).format('LLL')
                    })
                }catch(error){
                    ////
                }
            }

            return responseReturn(res, 200, { url: session.url });
        }catch (error){
            console.log(error);
            return responseReturn(res, 500, {error: "Internal Server Error"})
        }

        
    }

    handle_webhook = async(req, res) => {
        const sig = req.headers['stripe-signature'];
        let event;
        console.log("hi")

        try{
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET,
            )
            console.log("notgoodff")
        }catch(e){
            console.error("Webhook signature failed:", e.message);
            return res.sendStatus(400);
        }

        console.log("notgood")
        if (event.type === 'checkout.session.completed'){
            const sess = event.data.object;

            const email = sess.customer_details?.email || sess.customer_email;
            // const customerId = sess.c

            console.log("not good 1")

            await sendMail({
                from: `"My Store" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Your order is received!',
                text: 
                    `Hi there,\n\n` +
                    `We have authorised your card for CAD $${(sess.amount_total / 100).toFixed(
                    2,
                    )}. ` +
                    `We will capture the payment and sent another email to you once your items are ready to ship.\n\n` +
                    `Order reference: ${sess.id}\n\n` +
                    `Thanks for shopping with us!`,
            });

            console.log("not good 2")

            await sendMail({
                from: `"My Store" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_USER,
                subject: `HISTORY FACT STORE: New authorised order ${sess.id}`,
                text: `Customer: ${email}\nSession: ${sess.id}`,
            })


        }

        res.json({received: true})
    };
}

export default new paymentController();