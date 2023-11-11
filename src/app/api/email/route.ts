import { NextResponse, NextRequest } from 'next/server'
const nodemailer = require('nodemailer');

export async function POST(request: NextRequest) {
    const { name, email, message, subject } = await request.json();

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        tls: {
            ciphers: "SSLv3",
            rejectUnauthorized: false,
        },

        auth: {

            user: process.env.NEXT_PUBLIC_EMAIL_USERNAME,
            pass: process.env.NEXT_PUBLIC_EMAIL_PASSWORD
        }
    });

    try {   
        await transporter.sendMail({
            from: process.env.NEXT_PUBLIC_EMAIL_USERNAME,
            to: email,
            replyTo: process.env.NEXT_PUBLIC_PERSONAL_EMAIL,
            subject: subject,
            html: ` 
            <p>Hello ${name}!</p>
            <p>${message}</p>
            `,
        });

        return NextResponse.json({ message: "Success: email was sent" }, { status: 200 })

    } catch (error) {
        console.log(error)
        NextResponse.json({ message: "COULD NOT SEND MESSAGE" }, { status: 500 })
    }
}