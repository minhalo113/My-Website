# Admin Dashboard - A Figure A Day

The admin dashboard for "A Figure A Day", allowing administrators to control products, orders, and content.

## Overview

This allows authorized admins to:
*   **Manage Products**: Edit details, import new products via ID (AliExpress/eBay), and toggle visibility.
*   **Review Blogs**: Edit and approve AI-generated blog posts before they go live.
*   **Process Orders**: View customer orders and payment statuses.

## Tech Stack

*   **React 19**: Built with Create React App.
*   **Bootstrap**: Core layout and components.
*   **Tailwind CSS**: Utility classes for custom styling.
*   **ApexCharts**: Visualizing sales data.

## Getting Started

### 1. Installation

```bash
cd dashboard
npm install
```

### 2. Environment Variables

Create a `.env` file in the `dashboard` directory:

```env
# Socket Connection (for real-time updates)
REACT_APP_SOCKET_URL='..'

# API Base URL
API_CALL='..' (replace the url in src/api/api.js to this .env url )
```

### 3. Development

```bash
npm start
```

Open [http://localhost:3001](http://localhost:3001) to view the dashboard.

## Key Features

*   **Product Importer**: A dedicated interface to import products directly by ID from supported suppliers.
*   **Blog Editor**: A rich-text editor environment to refine the raw output from the AI generator.
*   **Live Updates**: Uses Socket.io to receive real-time notifications about new orders.
