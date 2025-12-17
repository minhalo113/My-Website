# Frontend - A Figure A Day

The frontend for customer facing website built with **Next.js**, designed for performance, SEO, and a seamless shopping experience.

## Tech Stack

*   **Next.js 15+**: App Router / Pages Router hybrid (utilizing `getServerSideProps` for SSR).
*   **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
*   **Stripe & PayPal**: Integrated payment gateways.
*   **Google Tag Manager**: Event tracking for analytics.

## Key Directories

*   `pages/`: Next.js routes.
    *   `shop/[...slug]`: Dynamic product detail pages with SEO optimization.
    *   `cart-page/`: Shopping cart and checkout flow.
    *   `blog/`: Automated anime blog posts.
*   `components/`: Reusable UI components (Navbar, Footer).

## Getting Started

### 1. Installation

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root of the `frontend` directory:

```env
# API Connection
NEXT_PUBLIC_API_BASE=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Analytics
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXX
```

### 3. Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 4. Build

To build the application for production:

```bash
npm run build
npm start
```

## Features to Note

*   **Hybrid Cart**: Handles both "Direct" products (added to cart) and "Affiliate" products (external link).
*   **Dynamic Slugs**: Product URLs are constructed as `/shop/ID-Slug` to ensure canonical uniqueness while remaining user-friendly.
*   **Image Optimization**: Uses `next/image` with a custom loader for secure external image rendering.
