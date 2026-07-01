// src/routes/alerts.js
const express = require("express");
const router = express.Router();
const db = require("../services/db");
const shopify = require("../services/shopifyClient");

// GET /api/alerts — List all alerts, auto-generate from low-stock products
router.get("/", async (req, res) => {
  try {
    const alerts = db.read("alerts");
    const extensions = db.read("extensions");

    // Auto-scan mock/shopify products to detect new low-stock items
    const products = await shopify.getProducts();
    const existingProductIds = alerts.map((a) => a.shopify_product_id);

    for (const product of products) {
      const ext = extensions.find((e) => e.shopify_id === product.id);
      if (!ext) continue;
      const totalStock = product.inventory.reduce((sum, loc) => sum + loc.available, 0);
      if (totalStock <= ext.reorder_point && !existingProductIds.includes(product.id)) {
        alerts.push({
          id: `alert_${Date.now()}_${product.id}`,
          shopify_product_id: product.id,
          product_title: product.title,
          current_qty: totalStock,
          reorder_point: ext.reorder_point,
          status: totalStock === 0 ? "critical" : "open",
          triggered_at: new Date().toISOString(),
          resolved_at: null,
        });
      }
    }

    db.write("alerts", alerts);
    const open = alerts.filter((a) => a.status !== "resolved");
    res.json({ success: true, alerts: open, total: open.length });
  } catch (err) {
    console.error("[GET /alerts]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/alerts/:id/resolve
router.patch("/:id/resolve", (req, res) => {
  try {
    const alerts = db.read("alerts");
    const idx = alerts.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: "Alert not found" });

    alerts[idx].status = "resolved";
    alerts[idx].resolved_at = new Date().toISOString();
    db.write("alerts", alerts);
    res.json({ success: true, alert: alerts[idx] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
