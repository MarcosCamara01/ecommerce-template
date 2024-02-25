"use client"

import React, { useEffect, useState } from 'react';
import { IoIosArrowForward } from 'react-icons/io';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export const UpdateButton = ({ text, isMobile }) => {
    const { data: session, update, status } = useSession();
    const [toEdit, setToEdit] = useState({ field: 'none', value: 'none' });

    useEffect(() => {
        if (toEdit.field !== 'none' && isMobile) {
            document.body.style.overflow = 'hidden';
        } else if (toEdit.field !== 'none' && !isMobile) {
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
    }, [toEdit, isMobile]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            update({ [toEdit.field]: toEdit.value });

            const response = await axios.put('/api/auth/signup', {
                userId: session.user._id,
                [toEdit.field]: toEdit.value,
            });
            console.log(response, [toEdit.field], toEdit.value);

            setToEdit({ field: 'none', value: 'none' });
        } catch (error) {
            console.error(error);
        }
    };

    const cellButtonStyles = "flex justify-between items-center rounded p-2.5 transition duration-150 ease hover:bg-color-secondary";
    const cellLeftStyles = "flex justify-between flex-col items-start gap-1 text-sm";
    const spanLeftStyles = "text-color-tertiary text-13 mt-1";
    const svgStyles = "text-xl";

    return (
        <>
            <button
                className={cellButtonStyles}
                onClick={() => session.user.image ?
                    toast.error('You cannot update user information if you are logged in with Google.')
                    :
                    setToEdit({ field: text, value: session?.user[text] })}
            >
                <div className={cellLeftStyles}>
                    <h4 className={text === "api" ? "uppercase" : "capitalize"}>{text}</h4>
                    <span className={spanLeftStyles}>{status === "loading"
                        ? <div className={`h-3.5 rounded-sm shine ${(text === "name" || text === "phone") ? "w-24" : "w-52"}`}></div>
                        : session?.user[text]}</span>
                </div>
                <div>
                    <IoIosArrowForward className={svgStyles} />
                </div>
            </button>

            {toEdit.field !== "none" && (
                <div className='fixed top-0 right-0 z-10 flex items-center justify-center w-full h-screen bg-background-alert'>
                    <div className='overflow-hidden bg-black border border-solid rounded max-w-90 border-border-primary min-w-250'>
                        <h4 className='px-5 pt-5 pb-3 text-base font-semibold'>Update <span className={text === "api" ? "uppercase" : "capitalize"}>{text}</span></h4>
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
                            >
                                Update
                            </button>
                        </div>

                        <button
                            className='flex items-center justify-center w-full h-8 text-sm transition duration-150 bg-black border-t border-solid border-border-primary ease hover:bg-color-secondary'
                            onClick={() => {
                                setToEdit({ field: 'none', value: 'none' });
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
