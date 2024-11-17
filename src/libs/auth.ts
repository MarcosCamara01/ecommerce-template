// import { createClient } from "@supabase/supabase-js";
// import type { NextAuthOptions } from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import GoogleProvider from "next-auth/providers/google";



// export const authOptions: NextAuthOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID as string,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
//     }),
//     CredentialsProvider({
//       name: "Credentials", 
//       id: "credentials",
//       credentials: {
//         email: { label: "Email", type: "text", placeholder: "jsmith" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           throw new Error("Email y contraseña son requeridos");
//         }

//         const { data: { user }, error } = await supabase.auth.signInWithPassword({
//           email: credentials.email,
//           password: credentials.password,
//         });

//         if (error) {
//           throw new Error(error.message);
//         }

//         if (!user) {
//           throw new Error("Usuario no encontrado");
//         }

//         return {
//           id: user.id,
//           email: user.email,
//           name: user.user_metadata?.name || null,
//           phone: user.user_metadata?.phone || null
//         };
//       },
//     }),
//   ],
//   pages: {
//     signIn: "/login",
//   },
//   session: {
//     strategy: "jwt",
//   },
//   callbacks: {
//     async jwt({ token, user, session, trigger }) {
//       if (trigger === "update" && session?.name) {
//         token.name = session.name;
//       }

//       if (trigger === "update" && session?.email) {
//         token.email = session.email;
//       }

//       if (user) {
//         return {
//           ...token,
//           id: user.id,
//           phone: (user as any).phone,
//         };
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       return {
//         ...session,
//         user: {
//           ...session.user,
//           _id: token.id,
//           name: token.name,
//           phone: token.phone,
//         },
//       };
//     },
//   },
// };
