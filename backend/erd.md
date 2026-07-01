# System Architecture & ERD
## Shopify Inventory Management System + AI Customer Chatbot

---

## 1. Full System Architecture

```mermaid
graph TD
    subgraph CUSTOMER["🛍️ Customer Side"]
        CB[Customer Browser]
        SF["Shopify Storefront\n(myshopify.com)"]
        CW["🤖 Chatbot Widget\n(Injected via theme.liquid)"]
    end

    subgraph MERCHANT["🏪 Merchant Side"]
        MB[Merchant Browser]
        SA["Shopify Admin Panel\n(admin.shopify.com)"]
        RD["Our React Dashboard\n(Embedded via iframe / Vercel)"]
    end

    subgraph BACKEND["⚙️ Our Backend (Node.js + Express on Vercel/Render)"]
        EX[Express Server]
        R1["/api/chat"]
        R2["/api/products"]
        R3["/api/inventory"]
        R4["/api/suppliers"]
        R5["/api/orders"]
        R6["/api/alerts"]
    end

    subgraph EXTERNAL["🌐 External Services"]
        GROQ["Groq AI API\nllama-3.1-8b-instant"]
        SHOPIFY["Shopify GraphQL\nAdmin API"]
        DB["Our Custom DB\nLocal JSON / Supabase"]
    end

    CB --> SF
    SF --> CW
    CW -->|"POST /api/chat"| EX

    MB --> SA
    SA --> RD
    RD -->|"API Calls"| EX

    EX --> R1
    EX --> R2
    EX --> R3
    EX --> R4
    EX --> R5
    EX --> R6

    R1 --> GROQ
    R2 --> SHOPIFY
    R3 --> SHOPIFY
    R4 --> DB
    R5 --> DB
    R6 --> DB
    R2 --> DB
```

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    %% ── SHOPIFY-OWNED ENTITIES ──────────────────────────────────────────
    PRODUCT {
        string  shopify_id          PK
        string  title
        string  description
        string  vendor
        string  product_type
        string  handle
        string  status
        string  image_url
        float   price
        float   compare_price
        string  barcode
        string  sku
        float   weight
    }

    LOCATION {
        string  shopify_location_id PK
        string  name
        string  address
        boolean is_active
    }

    INVENTORY_LEVEL {
        string  id                  PK
        string  shopify_product_id  FK
        string  shopify_location_id FK
        int     available_qty
        string  updated_at
    }

    SHOPIFY_ORDER {
        string  shopify_order_id    PK
        string  customer_email
        float   total_price
        string  status
        string  created_at
    }

    %% ── OUR CUSTOM ENTITIES ─────────────────────────────────────────────
    SUPPLIER {
        string  id              PK
        string  name
        string  contact_name
        string  email
        string  phone
        string  address
        string  payment_terms
        int     lead_time_days
        boolean is_active
    }

    PRODUCT_EXTENSION {
        string  id              PK
        string  shopify_id      FK
        string  supplier_id     FK
        int     reorder_point
        string  warehouse_zone
        string  aisle_number
        string  notes
    }

    PURCHASE_ORDER {
        string  id              PK
        string  supplier_id     FK
        string  po_number
        string  status
        string  order_date
        string  expected_date
        float   total_amount
        string  notes
        string  created_by
    }

    PO_LINE_ITEM {
        string  id                  PK
        string  purchase_order_id   FK
        string  shopify_product_id  FK
        int     quantity_ordered
        float   unit_cost
        float   line_total
    }

    LOW_STOCK_ALERT {
        string  id                  PK
        string  shopify_product_id  FK
        string  product_title
        int     current_qty
        int     reorder_point
        string  status
        string  triggered_at
        string  resolved_at
    }

    CHAT_SESSION {
        string  id              PK
        string  session_token
        string  customer_name
        string  started_at
    }

    CHAT_MESSAGE {
        string  id          PK
        string  session_id  FK
        string  role
        string  content
        string  timestamp
    }

    %% ── RELATIONSHIPS ────────────────────────────────────────────────────
    PRODUCT             ||--o{    INVENTORY_LEVEL     : "has stock in"
    LOCATION            ||--o{    INVENTORY_LEVEL     : "stores"
    PRODUCT             ||--o|    PRODUCT_EXTENSION   : "extended by"
    SUPPLIER            ||--o{    PRODUCT_EXTENSION   : "supplies"
    SUPPLIER            ||--o{    PURCHASE_ORDER      : "receives"
    PURCHASE_ORDER      ||--o{    PO_LINE_ITEM        : "contains"
    PRODUCT             ||--o{    PO_LINE_ITEM        : "ordered via"
    PRODUCT             ||--o{    LOW_STOCK_ALERT     : "triggers"
    CHAT_SESSION        ||--o{    CHAT_MESSAGE        : "has"
    SHOPIFY_ORDER       ||--o{    INVENTORY_LEVEL     : "decrements"
```

---

## 3. Data Flow Diagrams

### Flow A: Merchant Views Inventory Dashboard

```mermaid
sequenceDiagram
    actor Merchant
    participant Dashboard as React Dashboard
    participant Express as Express Server
    participant Shopify as Shopify GraphQL API
    participant OurDB as Our Custom DB

    Merchant->>Dashboard: Opens Inventory Tab
    Dashboard->>Express: GET /api/products
    Express->>Shopify: GraphQL → products + inventory levels
    Shopify-->>Express: Products + Stock per Location
    Express->>OurDB: Fetch supplier links + reorder points
    OurDB-->>Express: PRODUCT_EXTENSION records
    Express-->>Dashboard: Merged product + warehouse + supplier data
    Dashboard-->>Merchant: Renders product table with stock levels
```

### Flow B: Barcode Scan → Find Product

```mermaid
sequenceDiagram
    actor Merchant
    participant Scanner as Barcode Scanner (html5-qrcode)
    participant Dashboard as React Dashboard
    participant Express as Express Server
    participant Shopify as Shopify API

    Merchant->>Scanner: Points camera at barcode
    Scanner-->>Dashboard: Decoded barcode string (e.g. 012345678)
    Dashboard->>Express: GET /api/products/barcode/012345678
    Express->>Shopify: GraphQL query (barcode filter)
    Shopify-->>Express: Matched product + stock levels
    Express-->>Dashboard: Product data
    Dashboard-->>Merchant: Highlights product + shows stock controls
```

### Flow C: Merchant Adjusts Stock Level

```mermaid
sequenceDiagram
    actor Merchant
    participant Dashboard as React Dashboard
    participant Express as Express Server
    participant Shopify as Shopify Inventory API

    Merchant->>Dashboard: Types new qty for "Leather Shoes" in Warehouse A
    Dashboard->>Express: PATCH /api/inventory/adjust\n{ product_id, location_id, qty }
    Express->>Shopify: inventorySetQuantities mutation
    Shopify-->>Express: Success + updated level
    Express-->>Dashboard: Confirmation
    Dashboard-->>Merchant: Success toast + updated count
```

### Flow D: Generate Purchase Order PDF

```mermaid
sequenceDiagram
    actor Merchant
    participant Dashboard as React Dashboard
    participant Express as Express Server
    participant OurDB as Our Custom DB
    participant PDF as jspdf (Browser)

    Merchant->>Dashboard: Selects supplier + adds products to PO
    Dashboard->>Express: POST /api/orders\n{ supplier_id, line_items }
    Express->>OurDB: Save PURCHASE_ORDER + PO_LINE_ITEMS
    OurDB-->>Express: PO record with ID + PO number
    Express-->>Dashboard: PO data (supplier info, items, totals)
    Dashboard->>PDF: Render PDF layout
    PDF-->>Merchant: PDF downloads to computer
```

### Flow E: Customer Chats with AI Bot

```mermaid
sequenceDiagram
    actor Customer
    participant Widget as Chatbot Widget (Shopify Storefront)
    participant Express as Express Server
    participant Shopify as Shopify API
    participant Groq as Groq API (llama-3.1)

    Customer->>Widget: "Do you have blue shirts in size M?"
    Widget->>Express: POST /api/chat\n{ message, session_id }
    Express->>Shopify: Fetch current product + inventory context
    Shopify-->>Express: Live product list with stock levels
    Express->>Groq: Prompt = system context + inventory + chat history + question
    Groq-->>Express: AI-generated answer
    Express->>OurDB: Save CHAT_MESSAGE (user + ai)
    Express-->>Widget: AI reply
    Widget-->>Customer: "Yes! Blue Shirt M is in stock — $30, 15 available."
    OurDB->>OurDB: Save chat session
```

### Flow F: Low-Stock Alert Triggered

```mermaid
sequenceDiagram
    participant Shopify as Shopify Webhook / Polling
    participant Express as Express Server
    participant OurDB as Our Custom DB
    participant Dashboard as React Dashboard
    actor Merchant

    Shopify->>Express: Inventory level updated (qty = 2)
    Express->>OurDB: Fetch reorder_point for this product (= 5)
    OurDB-->>Express: reorder_point = 5
    Express->>Express: 2 < 5 → Low stock!
    Express->>OurDB: Create LOW_STOCK_ALERT record
    Dashboard->>Express: GET /api/alerts (next refresh)
    Express-->>Dashboard: Alert list with "Leather Shoes (2 left)"
    Dashboard-->>Merchant: Red badge on Alerts tab
    Merchant->>Dashboard: Clicks alert → pre-filled PO form
```

---

## 4. API Route Map

```mermaid
graph LR
    subgraph Products
        P1["GET /api/products"]
        P2["GET /api/products/barcode/:code"]
    end
    subgraph Inventory
        I1["PATCH /api/inventory/adjust"]
    end
    subgraph Suppliers
        S1["GET /api/suppliers"]
        S2["POST /api/suppliers"]
        S3["PUT /api/suppliers/:id"]
        S4["DELETE /api/suppliers/:id"]
    end
    subgraph Orders
        O1["GET /api/orders"]
        O2["POST /api/orders"]
        O3["PUT /api/orders/:id"]
    end
    subgraph Alerts
        A1["GET /api/alerts"]
    end
    subgraph Chat
        C1["POST /api/chat"]
    end
```

---

## 5. Folder & File Structure

```mermaid
graph TD
    ROOT["My-First-Shopify/"]

    ROOT --> BE["backend/"]
    ROOT --> FE["frontend/"]

    BE --> SRV["server.js"]
    BE --> ENV[".env"]
    BE --> ENVE[".env.example"]
    BE --> ERD["erd.md"]
    BE --> BPKG["package.json"]
    BE --> SRC["src/"]

    SRC --> ROUTES["routes/"]
    ROUTES --> R1["products.js"]
    ROUTES --> R2["inventory.js"]
    ROUTES --> R3["suppliers.js"]
    ROUTES --> R4["orders.js"]
    ROUTES --> R5["alerts.js"]
    ROUTES --> R6["chat.js"]

    SRC --> SERVICES["services/"]
    SERVICES --> SV1["shopifyClient.js"]
    SERVICES --> SV2["groqClient.js"]
    SERVICES --> SV3["db.js"]

    SRC --> DATA["data/"]
    DATA --> D1["suppliers.json"]
    DATA --> D2["orders.json"]
    DATA --> D3["alerts.json"]
    DATA --> D4["extensions.json"]

    FE --> IH["index.html"]
    FE --> VC["vite.config.ts"]
    FE --> FSRC["src/"]

    FSRC --> APP["App.jsx"]
    FSRC --> CSS["index.css"]
    FSRC --> API["api/client.js"]
    FSRC --> COMP["components/"]

    COMP --> LAY["Layout/\nSidebar.jsx\nTopBar.jsx"]
    COMP --> OV["Overview/\nOverviewCards.jsx"]
    COMP --> INV["Inventory/\nProductTable.jsx\nProductForm.jsx\nBarcodeScanner.jsx"]
    COMP --> SUP["Suppliers/\nSupplierList.jsx\nSupplierForm.jsx"]
    COMP --> ORD["Orders/\nOrderList.jsx\nOrderForm.jsx\nPDFGenerator.js"]
    COMP --> ALT["Alerts/\nAlertPanel.jsx"]
    COMP --> CHAT["Chatbot/\nChatWidget.jsx"]
    COMP --> SET["Settings/\nSettings.jsx"]
```

---

## 6. Shopify GraphQL Queries

### Fetch All Products with Inventory
```graphql
query GetProductsWithInventory {
  products(first: 50) {
    edges {
      node {
        id
        title
        handle
        status
        vendor
        images(first: 1) { edges { node { url } } }
        variants(first: 1) {
          edges {
            node {
              id
              sku
              barcode
              price
              inventoryItem {
                id
                inventoryLevels(first: 5) {
                  edges {
                    node {
                      quantities(names: ["available"]) { quantity }
                      location { id name }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Adjust Inventory Quantity
```graphql
mutation AdjustInventory($input: InventorySetQuantitiesInput!) {
  inventorySetQuantities(input: $input) {
    inventoryAdjustmentGroup {
      reason
      changes { name delta }
    }
    userErrors { field message }
  }
}
```

---

## 7. Groq RAG Prompt Template

```
You are a friendly store assistant for [Store Name].
Help customers find products, compare items, and check availability.

--- CURRENT INVENTORY (Real-Time) ---
{PRODUCT_CONTEXT}

Example:
- Blue Shirt (SKU: SHIRT-BLU): $30 | Sizes: S/M/L | Stock: 15
- Leather Shoes (SKU: SHOE-BRN): $80 | Sizes: 40-44 | Stock: 2 ⚠️ LOW
- White Sneakers (SKU: SNKR-WHT): $60 | Sizes: 38-45 | SOLD OUT

--- FAQs ---
- Shipping: Standard 3-5 days. Express 1-2 days.
- Returns: 30-day policy. Free returns on items over $50.
- Payment: Visa, Mastercard, GCash, PayMaya.

--- CONVERSATION HISTORY ---
{CHAT_HISTORY}

--- CUSTOMER QUESTION ---
{USER_MESSAGE}

Keep responses under 3 sentences. Suggest alternatives for sold-out items.
```
