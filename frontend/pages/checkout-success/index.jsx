import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';

export default function CheckoutSuccess() {
    const router = useRouter();

    useEffect(() => {
            if(router.query.status === 'success'){
                toast.success("🎉 Payment successful!");
            }

            const timer = setTimeout(() => {
                router.push("/");
            }, 5000);

            return () => clearTimeout(timer);
        }, [router.query]
    );

    return (
        <div style = {{padding: '2rem', textAlign: 'center'}}>
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
