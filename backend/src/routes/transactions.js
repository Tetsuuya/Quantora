// src/routes/transactions.js
const express = require("express");
const router = express.Router();
const db = require("../services/db");

// GET /api/transactions — Fetch inventory activity logs
router.get("/", (req, res) => {
  try {
    const transactions = db.read("transactions") || [];
    // Sort transactions with newest first
    const sorted = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ success: true, transactions: sorted });
  } catch (err) {
    console.error("[GET /transactions]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
