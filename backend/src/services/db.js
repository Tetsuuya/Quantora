// src/services/db.js
// Local JSON file-based database for Suppliers, Purchase Orders, Alerts, Extensions
// Swap this out with Supabase later by replacing read/write functions only.

const fs = require("fs");
const path = require("path");
const os = require("os");

// On Vercel, the filesystem is read-only except for /tmp
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "quantora-data")
  : path.join(__dirname, "../data");

// Ensure data directory and files exist
const FILES = {
  suppliers: path.join(DATA_DIR, "suppliers.json"),
  orders: path.join(DATA_DIR, "orders.json"),
  alerts: path.join(DATA_DIR, "alerts.json"),
  extensions: path.join(DATA_DIR, "extensions.json"),
  chats: path.join(DATA_DIR, "chats.json"),
};

const DEFAULTS = {
  suppliers: [
    {
      id: "sup_001",
      name: "Manila Textile Corp",
      contact_name: "Ana Reyes",
      email: "ana@manilacorp.com",
      phone: "+63-912-000-0001",
      address: "123 EDSA, Quezon City, Philippines",
      payment_terms: "Net 30",
      lead_time_days: 7,
      is_active: true,
    },
    {
      id: "sup_002",
      name: "Global Footwear Inc.",
      contact_name: "Marco Santos",
      email: "marco@globalfootwear.com",
      phone: "+63-917-000-0002",
      address: "45 Makati Ave, Makati City, Philippines",
      payment_terms: "Net 15",
      lead_time_days: 14,
      is_active: true,
    },
  ],
  orders: [],
  alerts: [],
  extensions: [
    {
      id: "ext_001",
      shopify_id: "mock_prod_001",
      supplier_id: "sup_001",
      reorder_point: 10,
      warehouse_zone: "Zone A",
      aisle_number: "A-01",
      notes: "Fast-moving item",
    },
    {
      id: "ext_002",
      shopify_id: "mock_prod_002",
      supplier_id: "sup_002",
      reorder_point: 5,
      warehouse_zone: "Zone B",
      aisle_number: "B-03",
      notes: "Handle with care",
    },
  ],
  chats: [],
};

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const [key, filePath] of Object.entries(FILES)) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(DEFAULTS[key], null, 2));
    }
  }
}

function read(key) {
  ensureFiles();
  return JSON.parse(fs.readFileSync(FILES[key], "utf-8"));
}

function write(key, data) {
  ensureFiles();
  fs.writeFileSync(FILES[key], JSON.stringify(data, null, 2));
}

module.exports = { read, write };
