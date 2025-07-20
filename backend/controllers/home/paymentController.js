import Stripe from 'stripe';
import responseReturn from "../../utils/response.js";
import { sendMail } from '../../utils/mail.js';
import customerOrder from '../../models/orderModel.js';
import moment from 'moment'
import couponController from '../dashbaord/couponController.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class paymentController {
    create_payment_session = async (req, res) => {
        try{
            const {cartItems, shipping, is_login, couponId, discount} = req.body;

            if (!cartItems) {
                return responseReturn(res, 400, {error: "Missing cart or shipping information."})
            }

            const line_items = cartItems.map(item => {
                let price = item.price - (item.price * (item.discount || 0)) / 100;
                if (discount) {
                    price = price - (price * discount) / 100;
                }
                return {
                    price_data: {
                        currency: 'cad',
                        product_data: {
                            name: item.name,
                            images: Array.isArray(item.img) ? [item.img[0]] : [item.img],
                        },
                        unit_amount: Math.round(price * 100),
                        },
                        quantity: item.qty,
                    };
                });

            const finalPrice = cartItems.reduce((t, item) => {
                let price = item.price - (item.price * (item.discount || 0)) / 100;
                if (discount) {
                    price = price - (price * discount) / 100;
                }
                return t + price * item.qty;
            }, 0);

            if (finalPrice <= 0) {
                return responseReturn(res, 400, { error: "Invalid final price after discount.", message: "Invalid final price after discount." });
            }

            const order = await customerOrder.create({
                customerId: is_login ? is_login.id : 'guest',
                customerEmail: is_login ? is_login.email : '',
                customerName: is_login ? is_login.name : '',
                shippingInfo: shipping,
                products: cartItems,
                price: finalPrice,
                payment_status: 'Pending',
                delivery_status: 'Pending',
                order_status: 'Pending',
                date: moment(Date.now()).format('LLL')
            })

            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                line_items,
                metadata: {
                    orderId: order._id.toString(),
                    couponId: couponId || ''
                },
                payment_intent_data: {capture_method: 'manual'
                },
                success_url: `${process.env.GIT_WEB_URL}/checkout-success?status=success`,
            })
            
            return responseReturn(res, 200, { url: session.url });
        }catch (error){
            console.log(error);
            return responseReturn(res, 500, {error: "Internal Server Error"})
        }

        
    }

    handle_webhook = async(req, res) => {
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

            const orderId = sess.metadata?.orderId;
            const couponId = sess.metadata?.couponId;

            if(orderId) {
                try{
                    await customerOrder.findByIdAndUpdate(orderId, {payment_status: 'Uncaptured'})
                }catch(err){
                    console.error('Order updated failed', err.message);
                }
            }

            if(couponId){
                try{
                    await couponController.use_coupon(couponId);
                }catch(err){
                    console.error('Coupon update error', err.message)
                }
            }
            console.log(orderId)
            console.log(couponId)

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
                    `Order reference: ${orderId}\n\n` +
                    `Thanks for shopping with us!`,
            });


        }

        res.json({received: true})
    };
}

export default new paymentController();