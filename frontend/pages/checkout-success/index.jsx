import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import api from '../../src/api/api';
import { pushToDataLayer } from '../../src/utils/gtm';

export default function CheckoutSuccess() {
    const router = useRouter();
    const eventFired = useRef(false);

    useEffect(() => {
        const { status, orderId } = router.query;

        if (status === 'success') {
            if (!eventFired.current) {
                toast.success("🎉 Payment successful!");
                eventFired.current = true;

                if (orderId) {
                    const fetchOrderAndTrack = async () => {
                        try {
                            const { data } = await api.post('/guest/orders/lookup', { orderRef: orderId });
                            const order = data.order;
                            if (order) {
                                const isCad = order.products.some(p => p.shippingDestination === 'canada_only');
                                const currency = isCad ? 'CAD' : 'USD';

                                pushToDataLayer({
                                    event: 'purchase',
                                    ecommerce: {
                                        transaction_id: order._id,
                                        value: order.price,
                                        currency: currency,
                                        tax: 0,
                                        shipping: 0,
                                        items: order.products.map(p => ({
                                            item_id: p.id,
                                            item_name: p.name,
                                            price: p.price,
                                            quantity: p.qty,
                                            item_variant: p.color
                                        }))
                                    }
                                });
                            }
                        } catch (err) {
                            console.error("Failed to track purchase:", err);
                        }
                    };
                    fetchOrderAndTrack();
                }
            }
        }

        const timer = setTimeout(() => {
            router.push("/");
        }, 8000);

        return () => clearTimeout(timer);
    }, [router.query]);

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <SEO
                title="Order Confirmed | A Figure A Day"
                description="Your order was successful. Thanks for shopping at A Figure A Day."
                canonical="https://www.afigureaday.com/checkout-success"
                noindex
            />
            <h2>Thank you for your purchase!</h2>
            <p>Your order is being processed.</p>
        </div>
    )
}
