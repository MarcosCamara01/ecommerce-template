/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        loader: 'cloudinary',
        path: 'https://res.cloudinary.com/dckjqf2cq/image/upload/',
    },
}

module.exports = nextConfig
