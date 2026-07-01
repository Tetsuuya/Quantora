// src/routes/chat.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const groqClient = require("../services/groqClient");
const shopify = require("../services/shopifyClient");
const db = require("../services/db");

// POST /api/chat — Send a customer message and get AI response
router.post("/", async (req, res) => {
  try {
    const { message, session_id } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    // Load or create chat session
    const chats = db.read("chats");
    let session = chats.find((c) => c.id === session_id);
    if (!session) {
      session = {
        id: session_id || uuidv4(),
        started_at: new Date().toISOString(),
        messages: [],
      };
      chats.push(session);
    }

    // Append user message to history
    session.messages.push({ role: "user", content: message, timestamp: new Date().toISOString() });

    // Fetch live product inventory as RAG context
    const products = await shopify.getProducts();

    // Call Groq with full context
    const reply = await groqClient.chat(
      message,
      products,
      session.messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
    );

    // Append AI reply to history
    session.messages.push({ role: "assistant", content: reply, timestamp: new Date().toISOString() });

    // Persist chat session
    const sessionIdx = chats.findIndex((c) => c.id === session.id);
    if (sessionIdx >= 0) chats[sessionIdx] = session;
    db.write("chats", chats);

    res.json({ success: true, session_id: session.id, reply });
  } catch (err) {
    console.error("[POST /chat]", err.message);
    res.status(500).json({ success: false, error: "AI service error: " + err.message });
  }
});

// GET /api/chat/:session_id — Get chat history for a session
router.get("/:session_id", (req, res) => {
  const chats = db.read("chats");
  const session = chats.find((c) => c.id === req.params.session_id);
  if (!session) return res.json({ success: true, messages: [] });
  res.json({ success: true, messages: session.messages });
});

module.exports = router;
