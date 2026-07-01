# Quantora IMS (Inventory Management System) & AI Chatbot

Quantora is a full-stack, enterprise-grade Inventory Management System (IMS) integrated directly with a live Shopify developer store and powered by a Groq LLM AI agent.

This project demonstrates how a custom admin dashboard can securely connect to a Shopify store via GraphQL, extend standard Shopify product data with custom warehouse properties (suppliers, locations, and thresholds), and provide an AI chatbot widget on the customer storefront.

---

## 🔗 Live Project Portals

*   **🛠️ Admin Dashboard:** `https://quantora-dashboard.vercel.app` (or your Vercel frontend URL)
    *   *Dashboard Passcode:* `admin123`
*   **🛍️ Customer Storefront:** `https://quantora-dev.myshopify.com`
    *   *Storefront Password:* `quantora123`

---

## 🛠️ Technology Stack

*   **Frontend:** React (v19), TypeScript, Vite, Vanilla CSS (designed following Shopify Polaris aesthetics), Lucide Icons, html5-qrcode (barcode reader), jsPDF (PDF PO generator).
*   **Backend:** Node.js, Express, Shopify GraphQL Admin API, Groq AI SDK (Llama 3/Mixtral Models), flat-file local JSON database service (designed for simple transition to databases like Supabase).
*   **Hosting:** Vercel Serverless Functions.

---

## 🚀 Core Features

1.  **Live Shopify Integration:** Fetches product and inventory levels dynamically from the Shopify GraphQL Admin API. Updates to inventory levels inside the dashboard sync back to Shopify in real-time.
2.  **Extended Warehouse Meta:** Adds custom properties (Supplier details, warehouse zones, aisle numbers, and reorder points) that are not natively supported in standard Shopify databases.
3.  **B2B Purchase Orders (POs):** Manage custom vendor contacts. Generate, track, and download professional PO PDFs with auto-calculated totals to send directly to suppliers.
4.  **Low-Stock Alerts:** Automatically monitors quantities against custom reorder thresholds and notifies warehouse staff immediately when items go low or out of stock.
5.  **Storefront AI Chatbot:** A custom-embedded floating chat widget on the customer storefront. Customers can query product availability, and it uses RAG (Retrieval-Augmented Generation) context from our API to give real-time answers.
6.  **Barcode Scanner:** Uses device cameras to scan physical barcodes, allowing warehouse workers to query and adjust stock instantly on mobile devices.

---

## 📂 Project Architecture

```
Quantora/
├── backend/
│   ├── src/
│   │   ├── routes/          # Express API endpoints
│   │   ├── services/        # Shopify Client, Groq SDK, Flat-DB
│   │   └── data/            # Local JSON database files
│   ├── server.js            # Express server configuration
│   └── vercel.json          # Serverless routing setup
└── frontend/
    ├── public/              # Visual assets
    └── src/
        ├── api/             # Typed backend API client
        ├── components/      # Modular view panels (Dashboard, Inventory, POs)
        ├── hooks/           # Custom React hooks (Toasts)
        └── App.tsx          # Router and authentication wrapper
```

---

## 💻 Local Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Tetsuuya/Quantora.git
    cd Quantora
    ```

2.  **Configure Backend:**
    Navigate to the `backend/` directory, create a `.env` file, and populate:
    ```env
    PORT=3001
    GROQ_API_KEY=your_groq_key
    SHOPIFY_STORE_DOMAIN=quantora-dev.myshopify.com
    SHOPIFY_ADMIN_ACCESS_TOKEN=your_shopify_admin_token
    ```
    Install dependencies and start development server:
    ```bash
    npm install
    npm run dev
    ```

3.  **Configure Frontend:**
    Navigate to the `frontend/` directory, install dependencies, and start server:
    ```bash
    npm install
    npm run dev
    ```

4.  Open `http://localhost:5173` and use the passcode `admin123` to log in.
