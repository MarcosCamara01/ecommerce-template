import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

cloudinary.config({
    cloud_name: '',
    api_key: '',
    api_secret: ''
});

export async function POST(req) {
    try {
        const data = await req.formData()
        const image = data.get("image");

        if (!image) {
            return NextResponse.json("No se ha subido ninguna imagen", { status: 400 });
        }

        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const response = await new Promise((resolve, reject) => {
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
