import { NextResponse, NextRequest } from 'next/server'
const nodemailer = require('nodemailer');

export async function POST(request: NextRequest) {
    const { name, email, message, subject } = await request.json();

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {

            user: process.env.NEXT_PUBLIC_EMAIL_USERNAME,
            pass: process.env.NEXT_PUBLIC_EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.NEXT_PUBLIC_EMAIL_USERNAME,
        to: email,
        replyTo: process.env.NEXT_PUBLIC_PERSONAL_EMAIL,
        subject: subject,
        html: ` 
            <p>Hello ${name}!</p>
            <p>${message}</p>
            `,
    }

    try {
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (err: any, response: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });

        return NextResponse.json({ message: "Success: email was sent" }, { status: 200 })

    } catch (error) {
        console.log(error)
        NextResponse.json({ message: "COULD NOT SEND MESSAGE" }, { status: 500 })
    }
}