"use server"

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/auth";
import { Session } from "next-auth";

export const serverSession = async () => {
    try {
        const session: Session | null = await getServerSession(authOptions);
        return session;
    } catch (error) {
        console.error('Error fetching server session:', error);
        return null;
    }
}
