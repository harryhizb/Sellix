# WhatsApp AI Sales Assistant (SaaS)

A comprehensive SaaS platform that enables small businesses to automate sales, customer support, and order management on WhatsApp using AI.

## 🚀 Features

-   **AI Sales Agent**: Professional multi-turn conversations to qualify leads and take orders.
-   **Product Catalog**: Manage products, prices, and stock status.
-   **Order Management**: Track orders from "Pending" to "Completed" with a real-time dashboard.
-   **Owner Alerts**: Receive WhatsApp notifications immediately when a customer places an order.
-   **Manual Payment Workflow**: Mark orders as "Paid" to automatically confirm them to the customer via WhatsApp.
-   **Multi-tenant**: Built to support multiple businesses (ready for SaaS scaling).

## 🛠 Tech Stack

-   **Frontend**: Next.js 14, Tailwind CSS, Shadcn/UI, Lucide Icons.
-   **Backend**: Next.js API Routes (Serverless functions).
-   **Database**: MongoDB (Mongoose).
-   **WhatsApp Engine**: Node.js Service using `@whiskeysockets/baileys` + `Socket.io`.

## 📂 Project Structure

-   `/src` - Main Next.js Application (Dashboard, Authenticaion, API).
    -   `/app` - App Router pages.
    -   `/models` - Shared Mongoose models.
-   `/wa-service` - Dedicated Node.js Worker for WhatsApp connectivity.
    -   `/src/lib/ai.ts` - The Brain (State Machine & Logic).
    -   `/src/lib/whatsapp.ts` - Baileys integration.

## ⚡ Quick Start (Development)

You need to run **two** terminals.

**Terminal 1: Main Application**
```bash
npm install
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2: WhatsApp Service**
```bash
cd wa-service
npm install
npm run dev
# Runs on http://localhost:3001
```

## 📝 Configuration

1.  **Register**: Sign up at `http://localhost:3000/signup`.
2.  **Connect**: Go to `Dashboard > WhatsApp Status` and scan the QR code.
3.  **Setup**: Go to `Settings` and add your Products and personal WhatsApp number for alerts.

## 📖 Deployment

See [deploy.md](./deploy.md) for detailed VPS hosting instructions.
