// src/routes/suppliers.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../services/db");

// GET /api/suppliers
router.get("/", (req, res) => {
  const suppliers = db.read("suppliers");
  res.json({ success: true, suppliers });
});

// POST /api/suppliers
router.post("/", (req, res) => {
  try {
    const { name, contact_name, email, phone, address, payment_terms, lead_time_days } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, error: "Name and email are required" });

    const suppliers = db.read("suppliers");
    const newSupplier = {
      id: `sup_${uuidv4().split("-")[0]}`,
      name,
      contact_name: contact_name || "",
      email,
      phone: phone || "",
      address: address || "",
      payment_terms: payment_terms || "Net 30",
      lead_time_days: lead_time_days || 7,
      is_active: true,
    };
    suppliers.push(newSupplier);
    db.write("suppliers", suppliers);
    res.status(201).json({ success: true, supplier: newSupplier });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/suppliers/:id
router.put("/:id", (req, res) => {
  try {
    const suppliers = db.read("suppliers");
    const idx = suppliers.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: "Supplier not found" });

    suppliers[idx] = { ...suppliers[idx], ...req.body };
    db.write("suppliers", suppliers);
    res.json({ success: true, supplier: suppliers[idx] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/suppliers/:id
router.delete("/:id", (req, res) => {
  try {
    const suppliers = db.read("suppliers");
    const filtered = suppliers.filter((s) => s.id !== req.params.id);
    if (filtered.length === suppliers.length)
      return res.status(404).json({ success: false, error: "Supplier not found" });

    db.write("suppliers", filtered);
    res.json({ success: true, message: "Supplier deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
