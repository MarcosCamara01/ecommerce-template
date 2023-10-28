import React, { useEffect } from 'react';
import '../styles/alert.css';
import axios from 'axios';
import { useSession } from 'next-auth/react';

export const FixedComponent = ({ message, setOpen, task, toEdit, setToEdit, isMobile }) => {
    const { data: session, update } = useSession();
    const isWarning = task === "warning";

    useEffect(() => {
        if (message !== 'none' && isMobile) {
            document.body.style.overflow = 'hidden';
        } else if (message !== 'none' && !isMobile) {
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
    }, [message, isMobile]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!isWarning && (toEdit.field === "name" || toEdit.field === "email")) {
            try {
                update({ [toEdit.field]: toEdit.value });

                const response = await axios.put('/api/auth/signup', {
                    userId: session.user._id,
                    [toEdit.field]: toEdit.value,
                });
                console.log(response);

                setToEdit({ field: 'none', value: 'none' });
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <div className='alert-fixed'>
            <div className='box-alert'>
                <h4>{isWarning ? "WARNING" : "UPDATE"}</h4>
                {isWarning ? (
                    <p>{message}</p>
                ) : (
                    <div className='input-box'>
                        <input
                            type="text"
                            value={toEdit.value}
                            onChange={(e) => setToEdit({ ...toEdit, value: e.target.value })}
                        />
                        <button onClick={handleUpdate}>Update</button>
                    </div>
                )}

                <button
                    className='box-button'
                    onClick={() => {
                        if (!isWarning || isWarning && toEdit?.field == "warning") {
                            setToEdit({ field: 'none', value: 'none' });
                        } else {
                            setOpen("none");
                        }
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
}
