// src/routes/products.js
const express = require("express");
const router = express.Router();
const shopify = require("../services/shopifyClient");
const db = require("../services/db");

// GET /api/products — Fetch all products merged with our custom DB data
router.get("/", async (req, res) => {
  try {
    const products = await shopify.getProducts();
    const extensions = db.read("extensions");

    // Merge Shopify products with our custom extension data (supplier, zone, reorder)
    const merged = products.map((product) => {
      const ext = extensions.find((e) => e.shopify_id === product.id) || {};
      const totalStock = product.inventory.reduce((sum, loc) => sum + loc.available, 0);
      return {
        ...product,
        supplier_id: ext.supplier_id || null,
        reorder_point: ext.reorder_point || 0,
        warehouse_zone: ext.warehouse_zone || null,
        aisle_number: ext.aisle_number || null,
        notes: ext.notes || "",
        total_stock: totalStock,
        is_low_stock: totalStock <= (ext.reorder_point || 0) && totalStock > 0,
        is_out_of_stock: totalStock === 0,
      };
    });

    res.json({ success: true, demo_mode: shopify.IS_DEMO_MODE, products: merged });
  } catch (err) {
    console.error("[GET /products]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/barcode/:code — Find product by barcode
router.get("/barcode/:code", async (req, res) => {
  try {
    const product = await shopify.getProductByBarcode(req.params.code);
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    const extensions = db.read("extensions");
    const ext = extensions.find((e) => e.shopify_id === product.id) || {};
    res.json({ success: true, product: { ...product, ...ext } });
  } catch (err) {
    console.error("[GET /products/barcode]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/products/:id/extension — Update our custom extension data (supplier link, zone, reorder)
router.put("/:id/extension", (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_id, reorder_point, warehouse_zone, aisle_number, notes } = req.body;
    const extensions = db.read("extensions");

    const idx = extensions.findIndex((e) => e.shopify_id === id);
    const updated = { id: `ext_${Date.now()}`, shopify_id: id, supplier_id, reorder_point, warehouse_zone, aisle_number, notes };

    if (idx >= 0) extensions[idx] = { ...extensions[idx], ...updated };
    else extensions.push(updated);

    db.write("extensions", extensions);
    res.json({ success: true, extension: updated });
  } catch (err) {
    console.error("[PUT /products/:id/extension]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
