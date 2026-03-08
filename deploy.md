# Deployment Guide for WhatsApp AI SaaS

This application consists of two distinct services that must run simultaneously:
1.  **Web App (`webapp`)**: Next.js application (Frontend + API).
2.  **WhatsApp Service (`wa-service`)**: Node.js worker for WhatsApp connectivity.

## Recommended Hosting: VPS (Virtual Private Server)
Due to the nature of the `Baileys` WhatsApp library (which maintains a persistent WebSocket connection), **Serverless platforms like Vercel or Netlify are NOT suitable for the `wa-service`**.

We recommend using a VPS from providers like **DigitalOcean, Hetzner, AWS EC2, or Railway (using their persistent service)**.

---

## Method 1: Manual Deployment with PM2 (Recommended for Ubuntu/Debian)

### 1. Prerequisites
-   Node.js v18+ installed.
-   MongoDB Atlas URI (Cloud Database).
-   Git.

### 2. Setup
Clone the repository and install dependencies for BOTH folders.

```bash
# Main App
cd "WhatSapp App"
npm install
npm run build

# WhatsApp Service
cd wa-service
npm install
npm run build
```

### 3. Environment Variables
Create `.env` files in both directories.

**Main App (`.env.local` or `.env`):**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=complex_secret_here
NEXT_PUBLIC_APP_URL=http://your-domain.com
```

**WhatsApp Service (`wa-service/.env`):**
```env
PORT=3001
MONGODB_URI=mongodb+srv://... (Same as main app)
JWT_SECRET=complex_secret_here (Same as main app)
```

### 4. Run with PM2
Use PM2 to keep both services alive forever.

```bash
npm install -g pm2

# Start WhatsApp Service
cd wa-service
pm2 start dist/index.js --name "wa-worker"

# Start Next.js App
cd ..
pm2 start "npm start" --name "webapp" 
```

### 5. Reverse Proxy (Nginx)
Configure Nginx to route traffic:
-   `your-domain.com` -> `localhost:3000` (Next.js)
-   `your-domain.com/socket.io` -> `localhost:3001` (WebSocket) (Optional if using direct port)

---

## Method 2: Docker Compose (Optional)

If you prefer Docker, you can create a `docker-compose.yml`.

```yaml
version: '3'
services:
  webapp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=...
  
  worker:
    build: ./wa-service
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=...
```

## Important Notes on WhatsApp Connectivity
-   **Session Data**: The `wa-service` stores WhatsApp authentication credentials in `wa-service/sessions`. 
-   **Persistence**: If you use Docker, **you MUST mount a volume** for `/sessions` to avoid logging out on every restart.
-   **Network**: Ensure your server allows outbound traffic to WhatsApp servers.
