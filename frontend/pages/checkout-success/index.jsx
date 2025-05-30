import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import toast from 'react-hot-toast';

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
            <h2>Thank you for your purchase!</h2>
            <p>Your order is being processed.</p>
        </div>
    )
}