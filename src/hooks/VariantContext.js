"use client"

import React, { createContext, useContext, useState } from 'react';

const VariantContext = createContext();

export function VariantProvider({ children }) {
    const [selectedVariant, setSelectedVariant] = useState([]);

    return (
        <VariantContext.Provider value={{ selectedVariant, setSelectedVariant }}>
            {children}
        </VariantContext.Provider>
    );
}

export const useVariant = () => {
    return useContext(VariantContext);
}