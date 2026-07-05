require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/products",  require("./src/routes/products"));
app.use("/api/inventory", require("./src/routes/inventory"));
app.use("/api/suppliers", require("./src/routes/suppliers"));
app.use("/api/orders",    require("./src/routes/orders"));
app.use("/api/sales",     require("./src/routes/sales"));
app.use("/api/transactions", require("./src/routes/transactions"));
app.use("/api/alerts",    require("./src/routes/alerts"));
app.use("/api/chat",      require("./src/routes/chat"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "✅ Quantora Backend Running",
    version: "1.0.0",
    demo_mode: !process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.startsWith("shpat_") ||
               process.env.SHOPIFY_ADMIN_ACCESS_TOKEN === "shpat_xxxxxxxxxxxxxxxxxxxx",
    routes: [
      "GET    /api/products",
      "GET    /api/products/barcode/:code",
      "PUT    /api/products/:id/extension",
      "PATCH  /api/inventory/adjust",
      "GET    /api/suppliers",
      "POST   /api/suppliers",
      "PUT    /api/suppliers/:id",
      "DELETE /api/suppliers/:id",
      "GET    /api/orders",
      "POST   /api/orders",
      "PUT    /api/orders/:id",
      "DELETE /api/orders/:id",
      "GET    /api/alerts",
      "PATCH  /api/alerts/:id/resolve",
      "POST   /api/chat",
      "GET    /api/chat/:session_id",
    ],
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Quantora Backend running on http://localhost:${PORT}`);
  console.log(`📦 Mode: ${process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.startsWith("shpat_x") ? "🧪 DEMO (Mock Data)" : "🔗 LIVE (Shopify Connected)"}`);
  console.log(`🤖 Groq AI: ${process.env.GROQ_API_KEY ? "✅ Configured" : "❌ Missing GROQ_API_KEY"}\n`);
});

module.exports = app;