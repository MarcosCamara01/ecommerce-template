# Next.js E-commerce Template

A modern, fully-featured e-commerce template built with Next.js, featuring Google Authentication, MongoDB for data storage, and Cloudinary for product images management.

## 🚀 Features
- Responsive Modern Design
- User Authentication with Google
- Product Catalog with Categories
- Shopping Cart Functionality
- Product Search and Filtering
- User Profile Management
- Image Management with Cloudinary
- Secure Payment Processing
- Order History
- Admin Dashboard
- Responsive Product Gallery
- SEO Optimized

## 🛠 Installation & Set Up

1. Install dependencies
```bash
npm install
```

2. Run the development server
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ⚙️ Environment Variables

Rename `.env.example` to `.env.local` in the root directory and configure the following variables:

### Required Environment Variables:
```env
# Database Configuration
MONGODB_URI=your_mongodb_uri

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Image Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Setting Up Services:

#### MongoDB Database
- Create a free MongoDB database [following this guide](https://www.mongodb.com/resources/products/fundamentals/create-database)
- Perfect for storing:
  - Product catalog
  - User information
  - Orders
  - Shopping cart data

#### Google Authentication
- Set up Google OAuth for secure user authentication [following this guide](https://developers.google.com/identity/protocols/oauth2)
- Enables:
  - User registration
  - Secure login
  - Profile management

#### NextAuth Secret
Generate a random secret key by running:
```bash
npx auth secret
```

#### Cloudinary Configuration
- Set up Cloudinary for product image management [following this guide](https://cloudinary.com/documentation/cloudinary_credentials_tutorial)
- Used for:
  - Product images storage
  - Image optimization
  - Responsive images

## 📁 Project Structure
```
src/
├── app/              
│   ├── api/           # API endpoints
│   ├── products/      # Product pages
│   ├── cart/          # Cart pages
│   ├── checkout/      # Checkout process
│   ├── admin/         # Admin dashboard
│   ├── auth/          # Authentication pages
│   └── layout.tsx     # Root layout
├── components/    
│   ├── layout/        # Layout components
│   ├── products/      # Product-related components
│   ├── cart/          # Shopping cart components
│   ├── auth/          # Authentication components
│   └── ui/            # Reusable UI components
├── styles/            # CSS and styling
├── lib/              
│   ├── mongodb.ts     # Database configuration
│   ├── auth.ts        # Authentication utilities
│   └── cart.ts        # Cart management
├── models/            # MongoDB models
└── utils/            # Helper functions
```

## 🛍️ E-commerce Features

### For Customers
- Browse product catalog
- Search and filter products
- Add items to cart
- Secure checkout process
- Order tracking
- User profile management
- Order history

### For Administrators
- Product management
- Order management
- User management
- Analytics dashboard
- Inventory tracking
- Image upload and management

## 🔒 Security Features
- Secure authentication
- Protected API routes
- Secure payment processing
- Data encryption
- Input validation
- XSS protection

## 🚀 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Deployment Checklist:
1. Configure environment variables
2. Set up production database
3. Configure payment processing for production
4. Update authentication callbacks
5. Set up proper image optimization

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add: AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
