// src/routes/orders.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../services/db");

// GET /api/orders
router.get("/", (req, res) => {
  const orders = db.read("orders");
  const suppliers = db.read("suppliers");

  // Attach supplier details to each order
  const enriched = orders.map((o) => ({
    ...o,
    supplier: suppliers.find((s) => s.id === o.supplier_id) || null,
  }));

  res.json({ success: true, orders: enriched });
});

// GET /api/orders/:id
router.get("/:id", (req, res) => {
  const orders = db.read("orders");
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, error: "Order not found" });

  const suppliers = db.read("suppliers");
  res.json({ success: true, order: { ...order, supplier: suppliers.find((s) => s.id === order.supplier_id) } });
});

// POST /api/orders
router.post("/", (req, res) => {
  try {
    const { supplier_id, expected_date, notes, line_items } = req.body;
    if (!supplier_id || !line_items || line_items.length === 0) {
      return res.status(400).json({ success: false, error: "supplier_id and line_items are required" });
    }

    const orders = db.read("orders");
    const total_amount = line_items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_cost, 0);
    const po_number = `PO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, "0")}`;

    const newOrder = {
      id: `po_${uuidv4().split("-")[0]}`,
      po_number,
      supplier_id,
      status: "draft",
      order_date: new Date().toISOString().split("T")[0],
      expected_date: expected_date || null,
      total_amount: parseFloat(total_amount.toFixed(2)),
      notes: notes || "",
      created_at: new Date().toISOString(),
      line_items: line_items.map((item, i) => ({
        id: `li_${i}_${Date.now()}`,
        shopify_product_id: item.shopify_product_id,
        product_title: item.product_title,
        sku: item.sku || "",
        quantity_ordered: item.quantity_ordered,
        unit_cost: item.unit_cost,
        line_total: parseFloat((item.quantity_ordered * item.unit_cost).toFixed(2)),
      })),
    };

    orders.push(newOrder);
    db.write("orders", orders);
    res.status(201).json({ success: true, order: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/orders/:id — Update status (draft → sent → received)
router.put("/:id", (req, res) => {
  try {
    const orders = db.read("orders");
    const idx = orders.findIndex((o) => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: "Order not found" });

    orders[idx] = { ...orders[idx], ...req.body, id: orders[idx].id };
    db.write("orders", orders);

    // If order received, resolve any related low-stock alerts
    if (req.body.status === "received") {
      const alerts = db.read("alerts");
      const productIds = orders[idx].line_items.map((i) => i.shopify_product_id);
      const updated = alerts.map((a) =>
        productIds.includes(a.shopify_product_id) && a.status === "open"
          ? { ...a, status: "resolved", resolved_at: new Date().toISOString() }
          : a
      );
      db.write("alerts", updated);
    }

    res.json({ success: true, order: orders[idx] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/orders/:id
router.delete("/:id", (req, res) => {
  try {
    const orders = db.read("orders");
    const filtered = orders.filter((o) => o.id !== req.params.id);
    db.write("orders", filtered);
    res.json({ success: true, message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
