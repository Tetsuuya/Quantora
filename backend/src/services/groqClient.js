// src/services/groqClient.js
// Wraps the Groq SDK. Builds the context-aware RAG prompt using live inventory
// and sends it to the llama-3.1-8b-instant model.

const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Build a product context string from the product list (used in the prompt).
 */
function buildInventoryContext(products) {
  if (!products || products.length === 0) {
    return "No products currently available.";
  }

  return products
    .map((p) => {
      const totalStock = p.inventory.reduce((sum, loc) => sum + loc.available, 0);
      const stockStatus =
        totalStock === 0
          ? "SOLD OUT"
          : totalStock <= 5
          ? `${totalStock} left (LOW STOCK)`
          : `${totalStock} in stock`;

      const locations = p.inventory
        .filter((loc) => loc.available > 0)
        .map((loc) => `${loc.location_name}: ${loc.available}`)
        .join(", ");

      return `- ${p.title} | SKU: ${p.sku} | Price: $${p.price} | ${stockStatus}${
        locations ? ` | Locations: ${locations}` : ""
      }`;
    })
    .join("\n");
}

/**
 * Send a chat message to Groq and return the AI response.
 * @param {string} userMessage - The customer's question
 * @param {Array} products - Current product inventory array
 * @param {Array} history - Previous messages [{role, content}]
 */
async function chat(userMessage, products = [], history = []) {
  const inventoryContext = buildInventoryContext(products);

  const systemPrompt = `You are Quantora Assistant, a friendly and knowledgeable customer service AI for Quantora, a premium fashion and lifestyle store.

Your job is to help customers:
- Find products that match their needs
- Check product availability and stock levels
- Compare products
- Answer questions about the store
- Recommend products based on preferences
- Track and explain order processes

--- CURRENT STORE INVENTORY (Real-Time) ---
${inventoryContext}

--- STORE POLICIES ---
- Shipping: Standard 3-5 business days. Express 1-2 business days (+$10).
- Returns: 30-day return policy. Free returns on orders over $50.
- Payment: Visa, Mastercard, PayPal, GCash, PayMaya accepted.
- Customer Service: Available Monday-Friday, 9AM-6PM.

--- RESPONSE RULES ---
- Be warm, helpful, and concise. Keep responses under 4 sentences unless comparing products.
- If a product is sold out, suggest the nearest available alternative.
- If asked about a product not in inventory, politely say it is not currently available.
- Always mention price and availability when discussing products.
- Use emojis sparingly to feel friendly but professional.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10), // keep last 10 messages for context window
    { role: "user", content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    temperature: 0.7,
    max_tokens: 512,
  });

  return completion.choices[0]?.message?.content || "I'm sorry, I could not process your request right now.";
}

module.exports = { chat, buildInventoryContext };
