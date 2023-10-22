"use client"

import React, { createContext, useContext, useState } from 'react';

const OrdersContext = createContext();

export function OrderProvider({ children }) {
    const [orders, setOrders] = useState(null);

    return (
        <OrdersContext.Provider value={{ orders, setOrders }}>
            {children}
        </OrdersContext.Provider>
    );
}

export const useOrders = () => {
    return useContext(OrdersContext);
}