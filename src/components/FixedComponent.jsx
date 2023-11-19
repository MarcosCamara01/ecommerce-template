import React, { useEffect } from 'react';
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
        <div className='w-full h-screen	fixed top-0	right-0	flex items-center justify-center bg-background-alert z-10'>
            <div className='max-w-90 bg-black border border-solid border-border-primary rounded overflow-hidden min-w-250'>
                <h4 className='px-5	pt-5 pb-3 text-base font-semibold'>{isWarning ? "Warning" : "Update"}</h4>
                {isWarning ? (
                    <p className='px-5 pb-5 text-sm'>{message}</p>
                ) : (
                    <div className='mx-5 mb-3'>
                        <input
                            type="text"
                            className='w-4/6 p-1.5 bg-background-secondary border-t border-b border-l border-solid border-border-primary rounded-l-sm text-13	'
                            value={toEdit.value}
                            onChange={(e) => setToEdit({ ...toEdit, value: e.target.value })}
                        />
                        <button
                         onClick={handleUpdate}
                         className='w-2/6 py-1.5 px-3.5 bg-background-secondary border border-solid border-border-primary rounded-r-sm text-13 transition duration-150 ease hover:bg-color-secondary'
                         >Update</button>
                    </div>
                )}

                <button
                    className='text-sm w-full h-8 flex items-center justify-center bg-black border-t border-solid border-border-primary transition duration-150 ease hover:bg-color-secondary'
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
