// src/services/shopifyClient.js
// Handles all communication with Shopify's GraphQL Admin API.
// If SHOPIFY credentials are missing, falls back to mock demo data.

const fetch = require("node-fetch");

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const IS_DEMO_MODE =
  !SHOPIFY_DOMAIN ||
  SHOPIFY_DOMAIN === "your-store.myshopify.com" ||
  !ACCESS_TOKEN ||
  ACCESS_TOKEN.startsWith("shpat_xxx");

// ─── MOCK DATA (used when no Shopify credentials) ────────────────────────────
const MOCK_PRODUCTS = [
  {
    id: "mock_prod_001",
    title: "Classic Blue Oxford Shirt",
    vendor: "Quantora Brand",
    status: "active",
    image_url: "https://placehold.co/400x400/3B82F6/ffffff?text=Blue+Shirt",
    sku: "SHIRT-BLU-M",
    barcode: "012345678901",
    price: "29.99",
    inventory: [
      { location_id: "loc_001", location_name: "Warehouse A", available: 25 },
      { location_id: "loc_002", location_name: "Warehouse B", available: 8 },
      { location_id: "loc_003", location_name: "Storefront", available: 5 },
    ],
  },
  {
    id: "mock_prod_002",
    title: "Premium Leather Derby Shoes",
    vendor: "Global Footwear",
    status: "active",
    image_url: "https://placehold.co/400x400/92400E/ffffff?text=Leather+Shoes",
    sku: "SHOE-BRN-42",
    barcode: "012345678902",
    price: "89.99",
    inventory: [
      { location_id: "loc_001", location_name: "Warehouse A", available: 3 },
      { location_id: "loc_002", location_name: "Warehouse B", available: 1 },
      { location_id: "loc_003", location_name: "Storefront", available: 0 },
    ],
  },
  {
    id: "mock_prod_003",
    title: "Minimalist White Sneakers",
    vendor: "Quantora Brand",
    status: "active",
    image_url: "https://placehold.co/400x400/E5E7EB/333333?text=White+Sneakers",
    sku: "SNKR-WHT-40",
    barcode: "012345678903",
    price: "59.99",
    inventory: [
      { location_id: "loc_001", location_name: "Warehouse A", available: 0 },
      { location_id: "loc_002", location_name: "Warehouse B", available: 0 },
      { location_id: "loc_003", location_name: "Storefront", available: 0 },
    ],
  },
  {
    id: "mock_prod_004",
    title: "Slim Fit Chino Pants",
    vendor: "Quantora Brand",
    status: "active",
    image_url: "https://placehold.co/400x400/6B7280/ffffff?text=Chino+Pants",
    sku: "PANT-KHK-32",
    barcode: "012345678904",
    price: "44.99",
    inventory: [
      { location_id: "loc_001", location_name: "Warehouse A", available: 40 },
      { location_id: "loc_002", location_name: "Warehouse B", available: 20 },
      { location_id: "loc_003", location_name: "Storefront", available: 12 },
    ],
  },
  {
    id: "mock_prod_005",
    title: "Merino Wool Crewneck Sweater",
    vendor: "Manila Textile Corp",
    status: "active",
    image_url: "https://placehold.co/400x400/1E3A5F/ffffff?text=Wool+Sweater",
    sku: "SWTR-NVY-L",
    barcode: "012345678905",
    price: "74.99",
    inventory: [
      { location_id: "loc_001", location_name: "Warehouse A", available: 2 },
      { location_id: "loc_002", location_name: "Warehouse B", available: 0 },
      { location_id: "loc_003", location_name: "Storefront", available: 1 },
    ],
  },
];

// ─── SHOPIFY GRAPHQL QUERY ────────────────────────────────────────────────────
async function shopifyQuery(query, variables = {}) {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// ─── PUBLIC FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Fetch all products with inventory per location.
 * Returns normalized array regardless of demo or live mode.
 */
async function getProducts() {
  if (IS_DEMO_MODE) return MOCK_PRODUCTS;

  const data = await shopifyQuery(`
    query GetProductsWithInventory {
      products(first: 50) {
        edges {
          node {
            id title vendor status
            images(first: 1) { edges { node { url } } }
            variants(first: 1) {
              edges {
                node {
                  sku barcode price
                  inventoryItem {
                    id
                    inventoryLevels(first: 10) {
                      edges {
                        node {
                          quantities(names: ["available"]) { quantity }
                          location { id name }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `);

  return data.products.edges.map(({ node }) => {
    const variant = node.variants.edges[0]?.node;
    const levels = variant?.inventoryItem?.inventoryLevels?.edges || [];
    return {
      id: node.id,
      title: node.title,
      vendor: node.vendor,
      status: node.status,
      image_url: node.images.edges[0]?.node.url || "",
      sku: variant?.sku || "",
      barcode: variant?.barcode || "",
      price: variant?.price || "0",
      inventory: levels.map(({ node: lvl }) => ({
        location_id: lvl.location.id,
        location_name: lvl.location.name,
        available: lvl.quantities[0]?.quantity || 0,
        inventory_item_id: variant?.inventoryItem?.id || "",
      })),
    };
  });
}

/**
 * Find a product by barcode.
 */
async function getProductByBarcode(barcode) {
  if (IS_DEMO_MODE) {
    return MOCK_PRODUCTS.find((p) => p.barcode === barcode) || null;
  }
  const products = await getProducts();
  return products.find((p) => p.barcode === barcode) || null;
}

/**
 * Set inventory quantity for a product at a specific location.
 */
async function setInventoryLevel(inventoryItemId, locationId, quantity) {
  if (IS_DEMO_MODE) {
    return { success: true, demo: true, quantity };
  }
  const data = await shopifyQuery(
    `mutation SetQty($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        userErrors { field message }
      }
    }`,
    {
      input: {
        reason: "correction",
        name: "available",
        ignoreCompareQuantity: true,
        quantities: [{ inventoryItemId, locationId, quantity }],
      },
    }
  );
  const errors = data.inventorySetQuantities.userErrors;
  if (errors.length) throw new Error(errors.map((e) => e.message).join(", "));
  return { success: true };
}

// ─── MOCK SALES ORDERS ────────────────────────────────────────────────────────
const MOCK_SALES_ORDERS = [
  {
    id: "gid://shopify/Order/1001",
    name: "#1001",
    createdAt: new Date().toISOString(),
    customer: {
      firstName: "Elma",
      lastName: "Sajol",
      email: "rheneljhon@gmail.com",
    },
    totalPriceSet: {
      shopMoney: {
        amount: "959.00",
        currencyCode: "CAD",
      },
    },
    displayFinancialStatus: "PAID",
    displayFulfillmentStatus: "UNFULFILLED",
    lineItems: [
      {
        title: "The Complete Snowboard",
        quantity: 1,
      },
    ],
  },
  {
    id: "gid://shopify/Order/1002",
    name: "#1002",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    customer: {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@gmail.com",
    },
    totalPriceSet: {
      shopMoney: {
        amount: "89.99",
        currencyCode: "CAD",
      },
    },
    displayFinancialStatus: "PAID",
    displayFulfillmentStatus: "FULFILLED",
    lineItems: [
      {
        title: "Premium Leather Derby Shoes",
        quantity: 1,
      },
    ],
  },
];

/**
 * Fetch recent sales orders from Shopify.
 */
async function getSalesOrders() {
  if (IS_DEMO_MODE) {
    return MOCK_SALES_ORDERS;
  }

  const data = await shopifyQuery(`
    query GetSalesOrders {
      orders(first: 20, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            displayFinancialStatus
            displayFulfillmentStatus
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                }
              }
            }
          }
        }
      }
    }
  `);

  return data.orders.edges.map(({ node }) => ({
    id: node.id,
    name: node.name,
    createdAt: node.createdAt,
    customer: null, // PII fields (name, email) require specific app approval on Shopify Developer plans
    totalPriceSet: node.totalPriceSet,
    displayFinancialStatus: node.displayFinancialStatus,
    displayFulfillmentStatus: node.displayFulfillmentStatus,
    lineItems: node.lineItems.edges.map(({ node: item }) => ({
      title: item.title,
      quantity: item.quantity,
    })),
  }));
}

module.exports = {
  getProducts,
  getProductByBarcode,
  setInventoryLevel,
  getSalesOrders,
  IS_DEMO_MODE,
  MOCK_PRODUCTS,
};

