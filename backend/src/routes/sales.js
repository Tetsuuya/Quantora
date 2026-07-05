// src/routes/sales.js
const express = require("express");
const router = express.Router();
const shopify = require("../services/shopifyClient");

// GET /api/sales — Fetch recent sales orders from Shopify
router.get("/", async (req, res) => {
  try {
    const orders = await shopify.getSalesOrders();
    res.json({ success: true, demo_mode: shopify.IS_DEMO_MODE, orders });
  } catch (err) {
    console.error("[GET /sales]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
