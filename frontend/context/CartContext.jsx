import React, { createContext, useContext } from "react";
import useCartHook from "../hooks/useCart.js";   
import PropTypes from "prop-types";

const CartCtx = createContext(null);       
export const useCart = () => useContext(CartCtx); 

export function CartProvider({ children }) {
  const value = useCartHook();        
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

CartProvider.propTypes = {
    children: PropTypes.node,
}