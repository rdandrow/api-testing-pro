
import { ApiResponse } from '../types';

class MockApiService {
  private shipments = [
    { id: 'SHP-101', origin: 'Singapore', destination: 'Rotterdam', status: 'IN_TRANSIT', weight: 5000 },
    { id: 'SHP-102', origin: 'Los Angeles', destination: 'Tokyo', status: 'PENDING', weight: 1200 },
  ];

  private inventory = [
    { sku: 'WGT-001', name: 'Standard Widget', stock: 150 },
    { sku: 'GGT-999', name: 'Premium Gadget', stock: 45 },
  ];

  private webhookEvents: any[] = [];
  private tokens: Set<string> = new Set(['valid-token-123']);
  private rateLimitCounter: number = 0;
  private lastResetTime: number = Date.now();

  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.rateLimitCounter = 0;
      this.lastResetTime = now;
    }
    this.rateLimitCounter++;
    return this.rateLimitCounter <= 10;
  }

  async handleRequest(method: string, endpoint: string, body?: any, headers?: any): Promise<ApiResponse> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));

    // Rate Limiting Simulation
    if (endpoint.includes('/limited') && !this.checkRateLimit()) {
      return { status: 429, data: { error: "Too Many Requests", retryAfter: 60 }, headers: {} };
    }

    // Explicit Error Simulations
    if (endpoint === '/error/400') {
      return { 
        status: 400, 
        data: { error: "Bad Request", message: "Missing required field: 'orderId'", code: "VALIDATION_ERROR" }, 
        headers: {} 
      };
    }

    if (endpoint === '/error/403') {
      return { 
        status: 403, 
        data: { error: "Forbidden", message: "You do not have permission to access this resource.", code: "ACCESS_DENIED" }, 
        headers: {} 
      };
    }

    if (endpoint === '/error/500') {
      return { 
        status: 500, 
        data: { error: "Internal Server Error", message: "An unexpected condition was encountered.", traceId: "err-992-abc" }, 
        headers: {} 
      };
    }

    if (endpoint === '/error/502') {
      return { 
        status: 502, 
        data: { error: "Bad Gateway", message: "The server encountered a temporary error and could not complete your request." }, 
        headers: {} 
      };
    }

    // AUTH METHODS
    // API Key Auth
    if (endpoint === '/auth/apikey') {
      const apiKey = headers?.['x-api-key'];
      if (apiKey === 'sandbox-key-789') {
        return { status: 200, data: { status: "Authenticated", access: "full", scope: ["read", "write"] }, headers: {} };
      }
      return { status: 403, data: { error: "Forbidden", message: "Invalid or missing X-API-Key" }, headers: {} };
    }

    // JWT Auth
    if (endpoint === '/auth/jwt') {
      const authHeader = headers?.['Authorization'] || '';
      if (authHeader.startsWith('Bearer ') && authHeader.split('.').length === 3) {
        return { status: 200, data: { status: "Success", user: "qa-test-bot", role: "admin" }, headers: {} };
      }
      return { status: 401, data: { error: "Unauthorized", message: "Bearer token malformed or expired" }, headers: {} };
    }

    // EXTERNAL DEPENDENCY PROXY
    if (endpoint === '/proxy/payment' && method === 'POST') {
      // Simulation of a call to Stripe/Braintree
      const { amount, currency } = body || {};
      if (!amount || !currency) {
        return { status: 400, data: { error: "Missing payment details" }, headers: {} };
      }
      return { 
        status: 200, 
        data: { 
          transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
          status: "succeeded",
          gateway: "mock_stripe_v3",
          captured: true
        }, 
        headers: { 'X-External-Service': 'Stripe-Mock' }
      };
    }

    // WEBHOOKS
    if (endpoint === '/webhooks/trigger' && method === 'POST') {
      const event = {
        id: `evt_${Date.now()}`,
        type: body?.type || 'ping',
        payload: body?.payload || {},
        timestamp: new Date().toISOString()
      };
      this.webhookEvents.unshift(event);
      if (this.webhookEvents.length > 10) this.webhookEvents.pop();
      return { status: 202, data: { message: "Webhook event queued", eventId: event.id }, headers: {} };
    }

    if (endpoint === '/webhooks/history' && method === 'GET') {
      return { status: 200, data: this.webhookEvents, headers: {} };
    }

    // Auth Simulation (Existing Secure paths)
    const authHeader = headers?.['Authorization'] || '';
    const isAuthenticated = this.tokens.has(authHeader.replace('Bearer ', ''));

    if (endpoint.startsWith('/secure') && !isAuthenticated) {
      return { status: 401, data: { error: "Unauthorized access" }, headers: {} };
    }

    // Routing (Existing)
    if (endpoint === '/auth/login' && method === 'POST') {
      if (body?.username === 'admin' && body?.password === 'password123') {
        return { status: 200, data: { token: 'valid-token-123', expiresAt: '2025-12-31' }, headers: {} };
      }
      return { status: 403, data: { error: "Invalid credentials" }, headers: {} };
    }

    if (endpoint === '/shipments' && method === 'GET') {
      return { status: 200, data: this.shipments, headers: { 'X-Total-Count': this.shipments.length.toString() } };
    }

    if (endpoint === '/shipments' && method === 'POST') {
      const newShipment = { ...body, id: `SHP-${Math.floor(Math.random() * 1000)}`, status: 'PENDING' };
      this.shipments.push(newShipment);
      return { status: 201, data: newShipment, headers: {} };
    }

    if (endpoint.startsWith('/shipments/') && (method === 'PUT' || method === 'PATCH')) {
      const id = endpoint.split('/').pop();
      const index = this.shipments.findIndex(s => s.id === id);
      if (index > -1) {
        this.shipments[index] = { ...this.shipments[index], ...body };
        return { status: 200, data: this.shipments[index], headers: {} };
      }
      return { status: 404, data: { error: "Shipment not found" }, headers: {} };
    }

    if (endpoint.startsWith('/shipments/') && method === 'DELETE') {
      const id = endpoint.split('/').pop();
      const index = this.shipments.findIndex(s => s.id === id);
      if (index > -1) {
        this.shipments.splice(index, 1);
        return { status: 204, data: null, headers: {} };
      }
      return { status: 404, data: { error: "Shipment not found" }, headers: {} };
    }

    if (endpoint === '/inventory' && method === 'GET') {
      return { status: 200, data: this.inventory, headers: {} };
    }

    return { status: 404, data: { error: "Endpoint not found" }, headers: {} };
  }
}

export const mockApi = new MockApiService();
