import Stripe from 'stripe';
import responseReturn from "../../utils/response.js";
import { sendMail } from '../../utils/mail.js';
import customerOrder from '../../models/orderModel.js';
import moment from 'moment'
import couponController from '../dashbaord/couponController.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class paymentController {
    create_payment_session = async (req, res) => {
        try {
            const { cartItems, shipping, is_login, couponId, discount } = req.body;

            if (!cartItems || !shipping) {
                return responseReturn(res, 400, { error: "Missing cart or shipping information." })
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

            const customerId = is_login?.id || null;
            const customerEmail = is_login?.email || shipping?.email || null;
            const customerName = is_login?.name || shipping?.name || 'Guest';

            const orderPayload = {
                customerEmail,
                customerName,
                shippingInfo: shipping,
                products: cartItems,
                price: finalPrice,
                payment_status: 'Pending',
                delivery_status: 'Pending',
                order_status: 'Pending',
                date: moment(Date.now()).format('LLL')
            }

            if (customerId) {
                orderPayload.customerId = customerId;
            }

            const order = await customerOrder.create(orderPayload)

            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                line_items,
                metadata: {
                    orderId: order._id.toString(),
                    couponId: couponId || ''
                },
                payment_intent_data: {
                    capture_method: 'manual',
                    metadata: {
                        orderId: order._id.toString(),
                        couponId: couponId || ''
                    }
                },
                success_url: `${process.env.GIT_WEB_URL}/checkout-success?status=success`,
            })

            return responseReturn(res, 200, { url: session.url });
        } catch (error) {
            console.log(error);
            return responseReturn(res, 500, { error: "Internal Server Error" })
        }


    }

    handle_webhook = async (req, res) => {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET,
            )
        } catch (e) {
            console.error("Webhook signature failed:", e.message);
            return responseReturn(res, 400, { message: "Webhook signature failed" });
        }

        if (event.type === 'checkout.session.completed') {
            const sess = event.data.object;

            const email = sess.customer_details?.email || sess.customer_email;
            const name = sess.customer_details?.name

            const orderId = sess.metadata?.orderId;
            const couponId = sess.metadata?.couponId;

            if (orderId) {
                try {
                    const updatePayload = { payment_status: 'Uncaptured' };
                    if (email) {
                        updatePayload.customerEmail = email;
                    }
                    if (name) {
                        updatePayload.customerName = name;
                    }
                    await customerOrder.findByIdAndUpdate(orderId, updatePayload);
                } catch (err) {
                    console.error('Order updated failed', err.message);
                }
            }

            if (couponId) {
                try {
                    await couponController.use_coupon(couponId);
                } catch (err) {
                    console.error('Coupon update error', err.message)
                }
            }
            console.log(orderId)
            console.log(couponId)

            await sendMail({
                from: process.env.RESEND_FROM,
                to: email,
                subject: `Order Received: #${orderId} - We are checking stock! 📦`,

                reply_to: 'figureaday.store@gmail.com',

                html: `
                    <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                        <p>Hi there,</p>
                        <p>Thanks for shopping with <strong>A Figure A Day</strong>! We have received your order request.</p>
                        
                        <h3 style="color: #444;">What happens next?</h3>
                        <p>We have placed a <strong>temporary authorization hold</strong> on your card for <strong>CAD $${(sess.amount_total / 100).toFixed(2)}</strong>.</p>
                        <p>We will <strong>not</strong> capture the payment until we verify that your items are in stock and ready for preparation.</p>
                        
                        <p>You will receive an <strong>Official Receipt</strong> via email as soon as your order is confirmed (usually within 24 hours).</p>
                        
                        <p><strong>Order reference:</strong> ${orderId}</p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p><strong>Need to change or cancel?</strong></p>
                        <p>Please email us directly at: <a href="mailto:figureaday.store@gmail.com" style="color: #007bff; font-weight: bold;">figureaday.store@gmail.com</a></p>
                        
                        <p style="font-size: 12px; color: #999; margin-top: 20px; font-style: italic;">
                            *Note: This email was sent from a notification-only address that cannot accept incoming email. Please do not reply to this message directly.
                        </p>
                    </div>
                `,
                text: `Hi there,\n\nThanks for shopping with A Figure A Day! We have received your order request.\n\nWhat happens next?\nWe have placed a temporary authorization hold on your card for CAD $${(sess.amount_total / 100).toFixed(2)}. We will not capture the payment until we verify that your items are in stock and ready for preparation.\n\nOrder reference: ${orderId}\n\nNeed help? Please email us at figureaday.store@gmail.com. (Please do not reply to this automated email).`
            });


        }

        res.json({ received: true })
    };
}

export default new paymentController();