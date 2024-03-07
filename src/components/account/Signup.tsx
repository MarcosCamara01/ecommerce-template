"use client";

import { FormEvent, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { BiLogoGoogle } from 'react-icons/bi';
import { BiSolidShow } from 'react-icons/bi';
import { BiSolidHide } from 'react-icons/bi';

const Signup = () => {
    const labelStyles = "w-full text-sm";
    const [error, setError] = useState();
    const [showPassword, setShowPassword] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user) {
            window.location.reload();
        }
    }, [session]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const formData = new FormData(event.currentTarget);
            const signupResponse = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/signup`, {
                email: formData.get("email"),
                password: formData.get("password"),
                name: formData.get("name"),
                phone: formData.get("phone"),
            });

            const res = await signIn("credentials", {
                email: signupResponse.data.email,
                password: formData.get("password"),
                redirect: false,
            });
        } catch (error) {
            console.log(error);
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data.message;
                setError(errorMessage);
            }
        }
    };

    return (
        <section className="flex items-center justify-center w-full pt-12 xs:h-80vh">
            <form onSubmit={handleSubmit} className="p-6 xs:p-10 w-full max-w-350 flex flex-col justify-between items-center gap-2.5	
        border border-solid border-border-primary bg-background-secondary rounded">
                {error && <div className="">{error}</div>}
                <h1 className="w-full mb-5 text-2xl font-bold">Signup</h1>

                <label className={labelStyles}>Fullname:</label>
                <input
                    type="text"
                    placeholder="Fullname"
                    className="w-full h-8 border border-solid border-border-primary py-1 px-2.5 rounded bg-black text-13"
                    name="name"
                />

                <label className={labelStyles}>Email:</label>
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full h-8 border border-solid border-border-primary py-1 px-2.5 rounded bg-black text-13"
                    name="email"
                />

                <label className={labelStyles}>Password:</label>
                <div className="flex w-full">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="w-full h-8 border border-solid border-border-primary py-1 px-2.5 rounded-l bg-black text-13"
                        name="password"
                    />
                    <button
                        className="flex items-center justify-center w-2/12 transition duration-150 bg-black border-r border-solid rounded-r border-y border-border-primary ease hover:bg-color-secondary"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowPassword(!showPassword)
                        }}
                    >
                        {showPassword ? <BiSolidHide /> : <BiSolidShow />}
                    </button>
                </div>

                <label className={labelStyles}>Phone:</label>
                <input
                    type="text"
                    placeholder="Phone (not required)"
                    className="w-full h-8 border border-solid border-border-primary py-1 px-2.5 rounded bg-black text-13"
                    name="phone"
                />

                <button className="w-full bg-black border border-solid border-border-primary py-1.5 mt-2.5 rounded
        transition duration-150 ease hover:bg-color-secondary text-13">
                    Signup
                </button>

                <div className="relative flex items-center justify-center w-full h-10">
                    <div className="absolute w-full h-px top-2/4 bg-border-primary"></div>
                    <p className="z-10 flex items-center justify-center w-8 h-6 bg-background-secondary">or</p>
                </div>

                <button
                    className="flex items-center gap-3 px-4 py-2 text-sm align-middle transition duration-150 bg-black border border-solid rounded text-999 border-border-primary ease hover:bg-color-secondary"
                    onClick={() => signIn("google")}>
                    <BiLogoGoogle className="text-2xl" /> Sign in with Google
                </button>
                <Link href="/login" className="text-sm transition duration-150 text-color-tertiary ease hover:text-white">Already have an account?</Link>
            </form>
        </section>
    );
}

export default Signup;
