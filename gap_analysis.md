# Quantora IMS — Full-App Gap Analysis

## What's Already Working ✅

| Area | Status |
|---|---|
| React + Vite frontend (TypeScript) | ✅ Done |
| Express.js REST backend | ✅ Done |
| Shopify GraphQL integration (live + demo mode) | ✅ Done |
| Inventory viewing + inline qty editing | ✅ Done |
| Barcode scanner (html5-qrcode) | ✅ Done |
| Supplier CRUD | ✅ Done |
| Purchase Orders CRUD + PDF download | ✅ Done |
| Low-stock alert system (auto-detection + resolve) | ✅ Done |
| Groq AI chat assistant (RAG with live inventory) | ✅ Done |
| Passcode-based auth (localStorage) | ✅ Done |
| JSON file database (Vercel-compatible /tmp) | ✅ Done |
| Vercel deployment config | ✅ Done |

---

## 🔴 Critical Gaps (Must-Fix for "Full App")

### 1. Authentication is a demo placeholder
- **Problem:** The passcode is hardcoded as `admin123` in `App.tsx` line 48 and shown in plain text on the login screen. Anyone who can see the screen can log in. No real user accounts, no token-based sessions.
- **Fix:** Replace with a proper JWT-based login (email + password) stored in the backend, or integrate Shopify's OAuth flow for merchant identity.

### 2. Database is JSON files on disk (not production-ready)
- **Problem:** `db.js` writes to local `.json` files. On Vercel, it uses `/tmp` which is **ephemeral** — data is lost every time the serverless function cold-starts. All suppliers, orders, and alerts will randomly disappear in production.
- **Fix:** Migrate to a real database. Easiest option is **Supabase** (free tier, Postgres) — the `db.js` file is already designed to be swapped out (`read`/`write` abstraction is clean).

### 3. Shopify API version is outdated
- **Problem:** `shopifyClient.js` uses `2024-01` API version (line 96). Shopify drops old API versions on a rolling basis.
- **Fix:** Update to `2025-07` (current stable).

### 4. No real-time stock sync / Shopify webhooks
- **Problem:** Inventory is only fetched on page load or manual refresh. If a Shopify order is placed, stock won't auto-update in the dashboard or trigger alerts automatically.
- **Fix:** Register Shopify webhooks (`inventory_levels/update`, `orders/create`) that POST to your backend and trigger alert checks instantly.

### 5. CORS is wide open
- **Problem:** `server.js` line 9: `app.use(cors())` — this allows **any domain** to call your backend API with your Shopify admin token in the response chain.
- **Fix:** Restrict to your frontend domain: `cors({ origin: 'https://your-frontend.vercel.app' })`.

### 6. API keys in `.env` are committed to the repo
- **Problem:** `.gitignore` in backend only ignores `node_modules`. Your `.env` file contains a live Shopify Admin token and a Groq API key. These will be exposed if you push to GitHub.
- **Fix:** Add `.env` to `backend/.gitignore` immediately. Rotate your Shopify token and Groq key if already pushed.

---

## 🟡 Important Missing Features

### 7. No Settings page
- Your ERD (`erd.md` line 398) planned a `Settings/Settings.jsx` — it was never built.
- **Missing:** Ability to change store name, reorder point thresholds globally, notification preferences, or API key configuration from the UI.

### 8. Alerts can't trigger a Purchase Order automatically
- Users click "Resolve" on an alert but there's no "Create PO from this alert" button.
- **Fix:** Add a one-click "Restock via PO" button on the Alerts page that pre-fills the Purchase Order form with the alerted product and its linked supplier.

### 9. "Receive PO" doesn't sync inventory back to Shopify
- When a PO is marked as `received` in `PurchaseOrders.tsx` line 161, it only updates the order status in the JSON file. It does **not** call `inventorySetQuantities` to add the received qty back into Shopify.
- **Fix:** When `PUT /api/orders/:id` with `{ status: 'received' }`, iterate `line_items`, call `setInventoryLevel` for each item, and resolve the associated alerts.

### 10. Product extensions are only saved for 2 demo products
- The reorder points in `extensions.json` are hardcoded for `mock_prod_001` and `mock_prod_002`. Real Shopify products get no reorder point, so they never trigger alerts.
- **Fix:** The "Inventory" page already has `api.updateProductExtension()` wired up in `client.ts`, but the UI never calls it. Add a way for users to set reorder points per product directly in the Inventory table.

### 11. AI ChatWidget is merchant-facing only, not customer-facing
- The ERD planned an AI chatbot to be **embedded in the Shopify storefront** via `theme.liquid` (Flow E). Right now it only exists in the admin dashboard.
- **Fix:** Create a standalone embeddable `chatbot.html` widget that merchants can inject into their Shopify theme as a Script Tag app.

### 12. No pagination on products
- The Shopify query fetches `first: 50` products (shopifyClient.js line 121). Stores with 50+ products silently show incomplete data.
- **Fix:** Add cursor-based pagination using Shopify's `pageInfo.endCursor` / `hasNextPage`.

### 13. No mobile responsive layout
- The sidebar and table layout has no `@media` breakpoints. On mobile, the dashboard is unusable.
- **Fix:** Add responsive CSS — collapse sidebar to hamburger on mobile, make tables horizontally scrollable.

---

## 🟢 Nice-to-Have (Polish)

| Gap | Description |
|---|---|
| **Dashboard charts** | Overview page has KPI cards but no charts (sales trends, stock level over time). Add Chart.js or Recharts. |
| **CSV Export** | Export inventory or PO list as CSV for external use. |
| **Email notifications** | When a low-stock alert fires, send an email via SendGrid/Resend. |
| **Role-based access** | Admin vs. read-only viewer roles. |
| **Audit log** | Track who changed what qty, when. Important for warehouse operations. |
| **Multi-variant support** | Currently only fetches `variants(first: 1)`. Products with sizes/colors show incomplete data. |
| **Search in Chat** | Chat history is in-memory only (no way to search past conversations). |
| **Dark/Light mode toggle** | CSS variables are set up for it, but no toggle exists in the UI. |

---

## Priority Order to Make It a Full App

```
1. 🔴 Fix .env in .gitignore + rotate keys (security — do this NOW)
2. 🔴 Migrate JSON DB → Supabase (data persistence)
3. 🔴 Fix CORS to specific origin
4. 🔴 Real authentication (JWT or Shopify OAuth)
5. 🟡 Reorder point editing in Inventory UI
6. 🟡 "Receive PO" → sync stock back to Shopify
7. 🟡 "Create PO from Alert" button
8. 🟡 Shopify webhooks for real-time sync
9. 🟡 Settings page
10. 🟡 Mobile responsive layout
11. 🟢 Dashboard charts
12. 🟢 Multi-variant product support
13. 🟢 Customer-facing chatbot widget
```
