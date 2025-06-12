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
                        customerId: is_login ? is_login.id : 'guest',
                        customerEmail: is_login ? is_login.email: '',
                        customerName: is_login ? is_login.name: '',
                        shipping: JSON.stringify(shipping),
                        cart: JSON.stringify(cartItems)
                    }
                },
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout-success?status=success`,
            })

            return responseReturn(res, 200, { url: session.url });
        }catch (error){
            console.log(error);
            return responseReturn(res, 500, {error: "Internal Server Error"})
        }

        
    }

    handle_webhook = async(req, res) => {
        console.log('hello')
        const sig = req.headers['stripe-signature'];
        let event;

        try{
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET,
            )
        }catch(e){
            console.error("Webhook signature failed:", e.message);
            return responseReturn(res, 400, {message: "Webhook signature failed"});
        }

        if (event.type === 'checkout.session.completed'){
            const sess = event.data.object;

            const email = sess.customer_details?.email || sess.customer_email;

            const meta = sess.metadata || {};
            let shipping = {};
            let cartItems = [];
            try{shipping = JSON.parse(meta.shipping || '{}');} catch(e) {}
            try{cartItems = JSON.parse(meta.cart || '[]');} catch(e) {}

            try {
                await customerOrder.create({
                    customerId: meta.customerId === 'guest' ? undefined : meta.customerId,
                    customerEmail: email,
                    customerName: meta.customerName || '',
                    shippingInfo: shipping,
                    products: cartItems,
                    price: sess.amount_total / 100,
                    payment_status: 'Uncaptured',
                    delivery_status: 'Pending',
                    order_status: 'Pending',
                    date: moment(Date.now()).format('LLL')
                });
            } catch (err) {
                console.error('Order creation failed', err.message);
            }

            await sendMail({
                from: process.env.RESEND_FROM,
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

        }

        res.json({received: true})
    };
}

export default new paymentController();