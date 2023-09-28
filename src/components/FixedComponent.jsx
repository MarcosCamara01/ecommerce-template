import React, { useEffect, useState } from 'react';
import '../styles/alert.css';

export const FixedComponent = ({ message, setOpen, task, onUpdate, value, setToEdit }) => {
    const [toUpdate, setToUpdate] = useState(value);
    const isWarning = task === "Warning";

    useEffect(() => {
        if (message !== 'none') {
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
    }, [message]);

    const handleUpdate = () => {
        if (!isWarning && toUpdate.trim() !== "") {
            onUpdate(toUpdate);
        }
    };

    return (
        <div className='alert-fixed'>
            <div className='box-alert'>
                <h4>{isWarning ? "Warning" : "Update"}</h4>
                {isWarning ? (
                    <p>{message}</p>
                ) : (
                    <div>
                        <input
                            type="text"
                            value={toUpdate}
                            onChange={(e) => setToUpdate(e.target.value)}
                        />
                        <button onClick={handleUpdate}>Update</button>
                    </div>
                )}

                <button
                    className='box-button'
                    onClick={() => {
                        if (!isWarning) {
                            setToEdit({ field: 'none', value: '' });
                        } else {
                            setOpen("none");
                        }
                    }}
                >
                    CLOSE
                </button>
            </div>
        </div>
    );
}
