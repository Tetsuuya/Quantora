// src/routes/inventory.js
const express = require("express");
const router = express.Router();
const shopify = require("../services/shopifyClient");
const db = require("../services/db");

// PATCH /api/inventory/adjust — Update stock quantity at a specific warehouse
router.patch("/adjust", async (req, res) => {
  try {
    const {
      inventory_item_id,
      location_id,
      quantity,
      product_id,
      location_name,
      product_title,
      sku,
      previous_quantity
    } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ success: false, error: "Valid quantity required" });
    }

    // Update live stock in Shopify
    const result = await shopify.setInventoryLevel(inventory_item_id, location_id, quantity);

    // Create Audit Log Transaction
    const prevQty = previous_quantity !== undefined ? parseInt(previous_quantity) : 0;
    const newQty = parseInt(quantity);
    const qtyChange = newQty - prevQty;

    if (qtyChange !== 0) {
      const transactions = db.read("transactions") || [];
      transactions.push({
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        product_title: product_title || "Unknown Product",
        sku: sku || "",
        location_name: location_name || "Unknown Location",
        qty_change: qtyChange,
        qty_before: prevQty,
        qty_after: newQty,
        reason: "Manual Adjustment",
        timestamp: new Date().toISOString()
      });
      db.write("transactions", transactions);
    }

    // Check if we need to auto-create a low-stock alert
    const extensions = db.read("extensions");
    const ext = extensions.find((e) => e.shopify_id === product_id);
    if (ext && quantity <= ext.reorder_point && quantity > 0) {
      const alerts = db.read("alerts");
      const existingAlert = alerts.find(
        (a) => a.shopify_product_id === product_id && a.status === "open"
      );
      if (!existingAlert) {
        alerts.push({
          id: `alert_${Date.now()}`,
          shopify_product_id: product_id,
          product_title: req.body.product_title || "Unknown Product",
          location_name: location_name || "Unknown Location",
          current_qty: quantity,
          reorder_point: ext.reorder_point,
          status: "open",
          triggered_at: new Date().toISOString(),
          resolved_at: null,
        });
        db.write("alerts", alerts);
      }
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[PATCH /inventory/adjust]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
