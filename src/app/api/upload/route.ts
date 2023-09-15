import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(req: NextRequest) {
    try {
        const data = await req.formData()
        const image: any = data.get("image");

        if (!image) {
            return NextResponse.json("No se ha subido ninguna imagen", { status: 400 });
        }

        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const response: any = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({}, (err, result) => {
                if (err) {
                    reject(err)
                }
                resolve(result)
            }).end(buffer);
        })

        return NextResponse.json({
            message: "imagen subida",
            url: response.secure_url
        });

    } catch (error) {
        console.error('Failed to save product.', error);
        return NextResponse.json({ error: 'Failed to save product.' }, { status: 500 });
    }
}
