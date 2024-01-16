import { Session } from "next-auth";
import { UserDocument } from "@/models/User"

declare module "next-auth" {
    interface Session {
        user: UserDocument;
    }
}