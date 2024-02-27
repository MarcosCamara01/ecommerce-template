"use client"

import React from 'react';
import { LineWave } from 'react-loader-spinner';

export const Loader = () => {
    return (
        <div className='spinner-center'>
            <LineWave
                height="100"
                width="100"
                color="#fff"
                ariaLabel="line-wave"
                wrapperStyle={{}}
                visible={true}
            />
        </div>
    )
}
