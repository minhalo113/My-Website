# Backend - A Figure A Day

Backend for the website, built with **Node.js** and **Express**.

## Key Functions

### 1. Ingestion Engine (`/services/ingestion`)
Automated engine run on a schedule to fetch and sync product data.
*   **Providers**: Modular architecture supporting `AliExpress`, `eBay`.
*   **Scheduler**: Runs daily at 00:00 (`scheduler.js`) using `node-cron`.
*   **Logic**: Updates prices/stock for existing items and creates new products automatically.

### 2. AI Blog Generator (`/services/blog`)
A fully autonomous content pipeline.
*   **Trigger**: Runs twice daily (09:00 & 21:00).
*   **Process**:
    *   Fetches "Now Streaming" anime from **Jikan API**.
    *   Selects a random character.
    *   Generates a blog post using **GPT-5-nano**.
    *   Saves as a 'pending' draft for admin review.

### 3. Payment Processing
*   **Stripe**: Custom payment intent creation (`paymentController.js`) handling coupons and inventory validation.
*   **PayPal**: Server-side SDK integration for secure order capture and authorization.

## Tech Stack

*   **Node.js & Express**: Core server framework.
*   **MongoDB & Mongoose**: Data modeling (Products, Orders, Users).
*   **Authentication**: JWT-based auth for users and admins.
*   **Cloudinary**: Image management.

## Getting Started

### 1. Installation

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory.

```env
# Server Config
PORT=5000
NODE_ENV=development

# Database
connectURI=mongodb+srv://... (Your MongoDB URI)
DATABASENAME=...

# Security
SECRET=your_jwt_secret
REFRESH_TOKEN=your_refresh_secret

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
WEBHOOK_ENDPOINT=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# META
META_GRAPH_VERSION = "..."
META_FACEBOOK_PAGE_ID = "..."
META_INSTAGRAM_BUSINESS_ID = "..."
META_ACCESS_TOKEN = "..."

# AI & Content
OPENAI_API_KEY=...
PERSPECTIVE_API_KEY=...

# Affiliate Providers (Required for Ingestion)
ALIEXPRESS_APP_KEY=... (Affiliate Provider)
ALIEXPRESS_APP_SECRET=... (Affiliate Provider)
EBAY_APP_ID=... (Affiliate Provider)
EBAY_CERT_ID=... (Affiliate Provider)
APP_KEY=... 
APP_SECRET=... 
REFRESH_TOKEN=... 

# Email
RESEND_API_KEY=...
RESEND_FROM=...
RESEND_TO=...

# Cloudinary
cloud_name=...
api_key=...
api_secret=...

# URL
REAL_WEB_URL_1=... (Frontend URL)
DASHBOARD_URL=... (Dashboard URL)
```

### 3. Running the Server

```bash
npm start
```

### 4. Running Scripts

You can run standalone scripts (like manual ingestion) via:

```bash
node scripts/manual_ingest.js
```

## 🧪 Testing

The backend uses **Jest** for unit and integration tests.

```bash
npm test
```
