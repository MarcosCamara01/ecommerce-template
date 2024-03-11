const withBundleAnalyzer = require('@next/bundle-analyzer')({
	enabled: process.env.ANALYZE === 'true',
	images: {
		domains: [
			"res.cloudinary.com"
		],
	},
})
module.exports = withBundleAnalyzer({})
