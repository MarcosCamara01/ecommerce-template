import { Session } from "next-auth";
import { UserDocument } from "./types";

declare module "next-auth" {
  interface Session {
    user: UserDocument;
  }
}
