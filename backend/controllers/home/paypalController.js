import { Client, Environment, LogLevel, OrdersController } from "@paypal/paypal-server-sdk";
import responseReturn from "../../utils/response.js";
import customerOrder from '../../models/orderModel.js';
import productModel from '../../models/productModel.js';
import couponModel from '../../models/couponModel.js';
import moment from 'moment';
import couponController from '../dashbaord/couponController.js';

const client = new Client({
    clientCredentials: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET
    },
    environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
    logLevel: LogLevel.Info
});

const ordersController = new OrdersController(client);

class paypalController {
    _processAuthorization = async (orderId, paypalOrderId, couponId, payerEmail, amountValue) => {
        try {
            const order = await customerOrder.findById(orderId);
            if (!order) {
                throw new Error("Order not found");
            }
            if (order.payment_status !== 'Pending') {
                return { success: true, message: "Order already processed" };
            }

            const { result } = await ordersController.authorizeOrder({
                id: paypalOrderId
            });

            const authId = result.purchaseUnits[0].payments.authorizations[0].id;
            const payerName = result.payer.name.givenName + ' ' + result.payer.name.surname;

            const updatePayload = {
                payment_status: 'Uncaptured',
                transactionId: authId,
                paymentMethod: 'PayPal'
            };

            if (payerEmail) updatePayload.customerEmail = payerEmail;
            if (payerName) updatePayload.customerName = payerName;

            await customerOrder.findByIdAndUpdate(orderId, updatePayload);

            if (couponId && couponId !== 'undefined' && couponId !== 'null') {
                try {
                    await couponController.use_coupon(couponId);
                } catch (err) {
                    console.error('Coupon update error', err.message);
                }
            }

            await sendMail({
                from: process.env.RESEND_FROM,
                to: payerEmail,
                subject: `Order Received: #${orderId} - We are checking stock! 📦`,
                reply_to: 'figureaday.store@gmail.com',
                html: `
                    <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                        <p>Hi there,</p>
                        <p>Thanks for shopping with <strong>A Figure A Day</strong>! We have received your order request.</p>
                        
                        <h3 style="color: #444;">What happens next?</h3>
                        <p>We have placed a <strong>temporary authorization hold</strong> on your card for <strong>CAD $${(amountValue / 100).toFixed(2)}</strong>.</p>
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
                text: `Hi there,\n\nThanks for shopping with A Figure A Day! We have received your order request.\n\nWhat happens next?\nWe have placed a temporary authorization hold on your card for CAD $${(amountValue / 100).toFixed(2)}. We will not capture the payment until we verify that your items are in stock and ready for preparation.\n\nOrder reference: ${orderId}\n\nNeed help? Please email us at figureaday.store@gmail.com. (Please do not reply to this automated email).`
            });
            return { success: true };
        } catch (error) {
            console.error("Process Authorization Error:", error);
            throw error;
        }
    }

    create_paypal_payment = async (req, res) => {
        try {
            console.log(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
            const { cartItems, shipping, is_login, couponId } = req.body;

            if (!cartItems || !shipping) {
                return responseReturn(res, 400, { error: "Missing cart or shipping information." });
            }

            const productIds = cartItems.map(item => item.id);
            const products = await productModel.find({ _id: { $in: productIds } });

            let globalDiscount = 0;
            if (couponId) {
                const coupon = await couponModel.findById(couponId);
                if (coupon && coupon.used < coupon.maxUses) {
                    globalDiscount = coupon.discount;
                }
            }

            let finalPrice = 0;
            const trustedCartItems = [];

            for (const item of cartItems) {
                const product = products.find(p => p._id.toString() === item.id);
                if (!product) continue;

                let price = product.price;
                let productImage = product.images && product.images.length > 0 ? product.images[0] : '';

                if (item.color) {
                    const colorIndex = product.colors.findIndex(c => c === item.color);
                    if (colorIndex !== -1) {
                        if (product.colorPrices && product.colorPrices[colorIndex]) {
                            price = product.colorPrices[colorIndex];
                        }
                        if (product.colorImages && product.colorImages[colorIndex]) {
                            productImage = product.colorImages[colorIndex];
                        }
                    }
                }

                if (product.discount > 0) {
                    price = price - (price * product.discount) / 100;
                }

                if (globalDiscount > 0) {
                    price = price - (price * globalDiscount) / 100;
                }

                price = Math.round(price * 100) / 100;

                finalPrice += price * item.qty;

                trustedCartItems.push({
                    ...item,
                    price: product.price, // Store original price
                    discount: product.discount,
                    name: product.name,
                    img: productImage
                });
            }

            if (finalPrice <= 0) {
                return responseReturn(res, 400, { error: "Invalid final price after discount." });
            }

            const customerId = is_login?.id || null;
            const customerEmail = is_login?.email || shipping?.email || null;
            const customerName = is_login?.name || shipping?.name || 'Guest';

            const orderPayload = {
                customerEmail,
                customerName,
                shippingInfo: shipping,
                products: trustedCartItems,
                price: finalPrice,
                payment_status: 'Pending',
                delivery_status: 'Pending',
                order_status: 'Pending',
                date: moment(Date.now()).format('LLL')
            };

            if (customerId) {
                orderPayload.customerId = customerId;
            }

            const order = await customerOrder.create(orderPayload);

            // Encode orderId and couponId in custom_id for webhook reference
            const customId = `${order._id.toString()}|${couponId || ''}`;

            const { result } = await ordersController.createOrder({
                body: {
                    intent: 'AUTHORIZE',
                    purchaseUnits: [{
                        amount: {
                            currencyCode: 'CAD',
                            value: finalPrice.toFixed(2)
                        },
                        description: `Order #${order._id}`,
                        customId: customId
                    }],
                    applicationContext: {
                        brandName: "A Figure A Day",
                        landingPage: "BILLING",
                        userAction: "PAY_NOW",
                        returnUrl: `${process.env.GIT_WEB_URL}/checkout-success?status=success`,
                        cancelUrl: `${process.env.GIT_WEB_URL}/cart-page`
                    }
                }
            });

            const approveLink = result.links.find(link => link.rel === 'approve').href;

            return responseReturn(res, 200, { url: approveLink });

        } catch (error) {
            console.error("PayPal Create Error:", error);
            return responseReturn(res, 500, { error: "Internal Server Error" });
        }
    }

    handle_webhook = async (req, res) => {

        try {
            const event = req.body;

            if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
                const resource = event.resource;
                const paypalOrderId = resource.id;

                const customIdRaw = resource.purchase_units?.[0]?.custom_id;
                const amountValue = resource.purchase_units?.[0]?.amount?.value;
                const payerEmail = resource.payer?.email_address;

                if (customIdRaw && paypalOrderId) {
                    const [orderId, couponId] = customIdRaw.split('|');

                    if (orderId) {
                        await this._processAuthorization(orderId, paypalOrderId, couponId, payerEmail, amountValue);
                    }
                }

            }

            res.status(200).send();
        } catch (error) {
            console.error("Webhook Error:", error);
            res.status(500).send();
        }
    }
}

export default new paypalController();
