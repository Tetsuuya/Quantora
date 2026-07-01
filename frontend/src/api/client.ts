// src/api/client.ts
// Central API client — all requests go through here to our Express backend.

const BASE = 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }
  return json;
}

export const api = {
  // Products
  getProducts: () => request<any>('/products'),
  getProductByBarcode: (code: string) => request<any>(`/products/barcode/${encodeURIComponent(code)}`),
  updateProductExtension: (id: string, data: any) =>
    request<any>(`/products/${encodeURIComponent(id)}/extension`, { method: 'PUT', body: JSON.stringify(data) }),

  // Inventory
  adjustInventory: (data: any) =>
    request<any>('/inventory/adjust', { method: 'PATCH', body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: () => request<any>('/suppliers'),
  createSupplier: (data: any) =>
    request<any>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: string, data: any) =>
    request<any>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: string) =>
    request<any>(`/suppliers/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: () => request<any>('/orders'),
  createOrder: (data: any) =>
    request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrder: (id: string, data: any) =>
    request<any>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrder: (id: string) =>
    request<any>(`/orders/${id}`, { method: 'DELETE' }),

  // Alerts
  getAlerts: () => request<any>('/alerts'),
  resolveAlert: (id: string) =>
    request<any>(`/alerts/${id}/resolve`, { method: 'PATCH' }),

  // Chat
  sendMessage: (message: string, sessionId: string) =>
    request<any>('/chat', { method: 'POST', body: JSON.stringify({ message, session_id: sessionId }) }),
  getChatHistory: (sessionId: string) =>
    request<any>(`/chat/${sessionId}`),
};
