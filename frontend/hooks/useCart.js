import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "cart"

// Product in cart have structure like this:         
        // const product = {
        //     id: _id, cartId: `${_id}`,
        //     img: images,
        //     name: name,
        //     price: price,
        //     discount: discount
        // }

export default function useCart() {
    const [cart, setCart] = useState(() => {
        try{
            const raw = localStorage.getItem(STORAGE_KEY)
            const parsed = raw ? JSON.parse(raw) : [];
            return parsed.map(item => ({
                ...item,
                cartId: item.cartId || `${item.id}-${item.color || ''}-${item.size || ''}-${item.type || ''}`
            }))
        }catch{
            return [];
        }
    });

    useEffect(() => {
        try{
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        }
        catch{
            /////
        }
    }, [cart]);

    const add = useCallback((product, qty = 1) => {
        setCart(c => {
            const updatedCart = c.map(i =>
                i.cartId === product.cartId ? { ...i, qty: i.qty + qty } : i
            ).filter(i => i.qty > 0)

            const exists = c.some(i => i.cartId === product.cartId);

            if (!exists && qty > 0){
                updatedCart.push({...product, qty})
            }

            return updatedCart
        }
        );
    }, [])

    const remove = useCallback(cartId => {
        setCart(c => c.filter(i => i.cartId !== cartId));
    }, []);

    const clear = useCallback(() => setCart([]), []);

    const handleQuantityChange = (item, value) => {
        const qty = parseInt(value, 10);

        if(isNaN(qty) || qty <= 0) return;

        if (qty > 0){
            add(item, qty - item.qty)
        }
    }

    return {cart, add, remove, clear, handleQuantityChange};
}