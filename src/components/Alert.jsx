import React, { useEffect } from 'react';
import '../styles/alert.css';

export const Alert = ({ error, setError }) => {
    useEffect(() => {
        if (error !== 'none') {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '17px';
        } else {
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0';
        }

        return () => {
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0';
        };
    }, [error]);

    return (
        <div className='alert-fixed'>
            <div className='box-alert'>
                <h4>AVISO</h4>
                <p>{error}</p>
                <button
                    className='box-button'
                    onClick={() => {
                        setError('none');
                    }}>CERRAR</button>
            </div>
        </div>
    )
}
