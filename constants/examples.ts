
import { Scenario } from '../types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'auth',
    title: 'Authentication Flows',
    icon: 'Lock',
    examples: [
      {
        title: 'OAuth2 Token Exchange',
        description: 'Simulate a login flow to retrieve a Bearer token and use it for subsequent requests.',
        endpoint: '/auth/login',
        method: 'POST',
        requestBody: { username: 'admin', password: 'password123' },
        expectedJson: { token: "valid-token-123", expiresAt: "2025-12-31" },
        jsonSchema: {
          requestBody: {
            type: "object",
            required: ["username", "password"],
            properties: {
              username: { type: "string", description: "The administrative username" },
              password: { type: "string", description: "The administrative password" }
            }
          },
          responseBody: {
            type: "object",
            required: ["token", "expiresAt"],
            properties: {
              token: { type: "string", description: "The generated Bearer token" },
              expiresAt: { type: "string", format: "date", description: "ISO 8601 expiration date" }
            }
          }
        },
        validationPoints: [
          "Request: 'username' and 'password' are required strings",
          "Response: 'token' must be present and type string",
          "Response: 'expiresAt' must be a valid ISO 8601 date (YYYY-MM-DD)"
        ],
        playwrightCode: `import { test, expect } from '@playwright/test';

test('Advanced Auth Flow', async ({ request }) => {
  // 1. Get Token
  const loginResponse = await request.post('/auth/login', {
    data: { username: 'admin', password: 'password123' }
  });
  expect(loginResponse.ok()).toBeTruthy();
  const body = await loginResponse.json();
  
  // Validate Response Contract
  expect(typeof body.token).toBe('string');
  expect(body.expiresAt).toMatch(/^\\d{4}-\\d{2}-\\d{2}$/);
  const token = body.token;

  // 2. Use token in subsequent request
  const secureResponse = await request.get('/secure/data', {
    headers: { 'Authorization': \`Bearer \${token}\` }
  });
  expect(secureResponse.status()).toBe(200);
});`,
        cypressCode: `describe('Advanced Auth Flow', () => {
  it('should login and use the token', () => {
    // 1. Get Token
    cy.request('POST', '/auth/login', {
      username: 'admin',
      password: 'password123'
    }).then((response) => {
      expect(response.status).to.eq(200);
      
      // Validate Response Contract
      expect(response.body.token).to.be.a('string');
      expect(response.body.expiresAt).to.match(/^\\d{4}-\\d{2}-\\d{2}$/);
      
      const token = response.body.token;

      // 2. Use token in subsequent request
      cy.request({
        method: 'GET',
        url: '/secure/data',
        headers: { Authorization: \`Bearer \${token}\` }
      }).its('status').should('eq', 200);
    });
  });
});`
      }
    ]
  },
  {
    id: 'auth-methods',
    title: 'Auth: API Keys & JWT',
    icon: 'Key',
    examples: [
      {
        title: 'Static API Key Validation',
        description: 'Testing endpoints that require custom headers (X-API-Key) for machine-to-machine communication.',
        endpoint: '/auth/apikey',
        method: 'GET',
        requestBody: {},
        expectedJson: { status: "Authenticated", scope: ["read", "write"] },
        validationPoints: [
          "Header: 'x-api-key' must match 'sandbox-key-789'",
          "Status: 403 when header is missing",
          "Body: scope array contains required permissions"
        ],
        playwrightCode: `test('API Key Validation', async ({ request }) => {
  // Negative Test: Missing Key
  const resFail = await request.get('/auth/apikey');
  expect(resFail.status()).toBe(403);

  // Positive Test: Valid Key
  const resPass = await request.get('/auth/apikey', {
    headers: { 'x-api-key': 'sandbox-key-789' }
  });
  expect(resPass.ok()).toBeTruthy();
  const body = await resPass.json();
  expect(body.scope).toContain('write');
});`,
        cypressCode: `it('API Key Validation', () => {
  // Negative Test
  cy.request({
    url: '/auth/apikey',
    failOnStatusCode: false
  }).its('status').should('eq', 403);

  // Positive Test
  cy.request({
    url: '/auth/apikey',
    headers: { 'x-api-key': 'sandbox-key-789' }
  }).then((res) => {
    expect(res.status).to.eq(200);
    expect(res.body.scope).to.include('write');
  });
});`
      },
      {
        title: 'JWT Token Structure Verification',
        description: 'Verify the API correctly handles JSON Web Tokens, ensuring the Bearer prefix and 3-part structure.',
        endpoint: '/auth/jwt',
        method: 'GET',
        expectedJson: { status: "Success", user: "qa-test-bot" },
        playwrightCode: `test('JWT Header Verification', async ({ request }) => {
  const dummyJwt = 'header.payload.signature';
  const res = await request.get('/auth/jwt', {
    headers: { 'Authorization': \`Bearer \${dummyJwt}\` }
  });
  
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.user).toBe('qa-test-bot');
});`,
        cypressCode: `it('JWT Header Verification', () => {
  const dummyJwt = 'header.payload.signature';
  cy.request({
    url: '/auth/jwt',
    headers: { 'Authorization': \`Bearer \${dummyJwt}\` }
  }).then((res) => {
    expect(res.status).to.eq(200);
    expect(res.body.user).to.eq('qa-test-bot');
  });
});`
      }
    ]
  },
  {
    id: 'external-mocks',
    title: 'Interception & Mocks',
    icon: 'Globe',
    examples: [
      {
        title: 'Mocking Third-Party Gateways',
        description: 'Automate tests for endpoints that act as proxies to external services like Stripe or Twilio.',
        endpoint: '/proxy/payment',
        method: 'POST',
        requestBody: { amount: 2500, currency: 'USD' },
        expectedJson: { transactionId: "txn_823", status: "succeeded", gateway: "mock_stripe_v3" },
        validationPoints: [
          "Request: Amount must be positive integer",
          "Header check: 'X-External-Service' confirms upstream routing",
          "Verification: Transaction ID format matches gateway provider"
        ],
        playwrightCode: `test('Intercept External Dependency', async ({ request }) => {
  const paymentRes = await request.post('/proxy/payment', {
    data: { amount: 2500, currency: 'USD' }
  });

  expect(paymentRes.status()).toBe(200);
  expect(paymentRes.headers()['x-external-service']).toBe('Stripe-Mock');

  const body = await paymentRes.json();
  expect(body.transactionId).toMatch(/^txn_/);
});`,
        cypressCode: `it('Intercept External Dependency', () => {
  cy.request('POST', '/proxy/payment', { 
    amount: 2500, 
    currency: 'USD' 
  }).then((res) => {
    expect(res.status).to.eq(200);
    expect(res.headers).to.have.property('x-external-service', 'Stripe-Mock');
    expect(res.body.transactionId).to.match(/^txn_/);
  });
});`
      }
    ]
  },
  {
    id: 'webhooks',
    title: 'Webhook Integrations',
    icon: 'Share2',
    examples: [
      {
        title: 'Asynchronous Event Verification',
        description: 'Testing the "Fire and Forget" pattern by triggering an event and verifying the outgoing webhook content via history polling.',
        endpoint: '/webhooks/trigger',
        method: 'POST',
        requestBody: { type: 'shipment.delivered', payload: { id: 'SHP-101' } },
        expectedJson: { message: "Webhook event queued", eventId: "evt_123" },
        validationPoints: [
          "Status: 202 Accepted (processing started)",
          "Verification: Poll history to find the triggered event",
          "Payload: Ensure webhook payload contains the correct shipment ID"
        ],
        playwrightCode: `test('Verify Webhook Dispatch', async ({ request }) => {
  // 1. Trigger the event
  const triggerRes = await request.post('/webhooks/trigger', {
    data: { type: 'shipment.delivered', payload: { id: 'SHP-101' } }
  });
  expect(triggerRes.status()).toBe(202);
  const { eventId } = await triggerRes.json();

  // 2. Poll the history endpoint for verification
  await expect.poll(async () => {
    const res = await request.get('/webhooks/history');
    const history = await res.json();
    return history.find(e => e.id === eventId);
  }, {
    message: 'Webhook event not found in history',
    timeout: 5000,
  }).toBeTruthy();
});`,
        cypressCode: `it('Verify Webhook Dispatch', () => {
  // 1. Trigger the event
  cy.request('POST', '/webhooks/trigger', {
    type: 'shipment.delivered',
    payload: { id: 'SHP-101' }
  }).then((res) => {
    const eventId = res.body.eventId;

    // 2. Verification using recursion (Polling)
    const pollHistory = (attempts = 0) => {
      if (attempts > 5) throw new Error('Webhook timed out');
      
      cy.request('/webhooks/history').then((historyRes) => {
        const found = historyRes.body.find(e => e.id === eventId);
        if (!found) {
          cy.wait(500);
          pollHistory(attempts + 1);
        } else {
          expect(found.payload.id).to.eq('SHP-101');
        }
      });
    };
    
    pollHistory();
  });
});`
      }
    ]
  },
  {
    id: 'stateful-crud',
    title: 'Stateful CRUD Operations',
    icon: 'Terminal',
    examples: [
      {
        title: 'Full Object Lifecycle with Updates',
        description: 'Comprehensive workflow including resource creation, full state update via PUT, verification of persistent changes, and final cleanup.',
        endpoint: '/shipments',
        method: 'POST',
        requestBody: { origin: 'Tokyo', destination: 'Seoul', weight: 200 },
        expectedJson: { id: "SHP-456", origin: "Tokyo", destination: "Seoul", status: "PENDING", weight: 200 },
        jsonSchema: {
          type: "object",
          required: ["id", "origin", "destination", "status", "weight"],
          properties: {
            id: { type: "string" },
            origin: { type: "string" },
            destination: { type: "string" },
            status: { type: "string" },
            weight: { type: "number" }
          }
        },
        validationPoints: [
          "status: Updates from PENDING to IN_TRANSIT",
          "weight: Updates from initial value to new value",
          "id: Remains consistent throughout the lifecycle",
          "deletion: Final GET must return 404"
        ],
        playwrightCode: `import { test, expect } from '@playwright/test';

test('Stateful Shipment Lifecycle', async ({ request }) => {
  // 1. Create initial resource
  const postRes = await request.post('/shipments', {
    data: { origin: 'Tokyo', destination: 'Seoul', weight: 200 }
  });
  const shipment = await postRes.json();
  const id = shipment.id;

  // 2. Update the resource (Full state update)
  const updatedPayload = { ...shipment, status: 'IN_TRANSIT', weight: 250 };
  const putRes = await request.put(\`/shipments/\${id}\`, {
    data: updatedPayload
  });
  expect(putRes.ok()).toBeTruthy();
  
  // Assert PUT response reflects updated state
  const putBody = await putRes.json();
  expect(putBody.status).toBe('IN_TRANSIT');
  expect(putBody.weight).toBe(250);
  expect(putBody.id).toBe(id);

  // 3. Verify the updates with a GET
  const getRes = await request.get('/shipments');
  const allShipments = await getRes.json();
  const updated = allShipments.find(s => s.id === id);
  expect(updated.status).toBe('IN_TRANSIT');
  expect(updated.weight).toBe(250);

  // 4. Delete and cleanup
  const delRes = await request.delete(\`/shipments/\${id}\`);
  expect(delRes.status()).toBe(204);

  // 5. Final verification of non-existence
  const finalGet = await request.get('/shipments');
  const finalAll = await finalGet.json();
  expect(finalAll.some(s => s.id === id)).toBeFalsy();
});`,
        cypressCode: `it('Stateful Shipment Lifecycle', () => {
  // 1. Create
  cy.request('POST', '/shipments', { origin: 'Tokyo', destination: 'Seoul', weight: 200 })
    .then((postRes) => {
      const id = postRes.body.id;

      // 2. Update (PUT)
      const updatedPayload = { 
        ...postRes.body, 
        status: 'IN_TRANSIT', 
        weight: 250 
      };
      
      cy.request('PUT', \`/shipments/\${id}\`, updatedPayload).then((putRes) => {
        // Assert PUT response status and body
        expect(putRes.status).to.eq(200);
        expect(putRes.body.status).to.eq('IN_TRANSIT');
        expect(putRes.body.weight).to.eq(250);
        expect(putRes.body.id).to.eq(id);

        // 3. Verify updates via GET
        cy.request('/shipments').then((getRes) => {
          const updated = getRes.body.find(s => s.id === id);
          expect(updated.status).to.eq('IN_TRANSIT');
          expect(updated.weight).to.eq(250);
        });

        // 4. Delete
        cy.request('DELETE', \`/shipments/\${id}\`)
          .its('status').should('eq', 204);

        // 5. Final Verification
        cy.request('/shipments')
          .its('body')
          .should((body) => {
            const exists = body.some(s => s.id === id);
            expect(exists).to.be.false;
          });
      });
    });
});`
      }
    ]
  },
  {
    id: 'lifecycle',
    title: 'Resource Lifecycle (CRUD)',
    icon: 'Database',
    examples: [
      {
        title: 'End-to-End Shipment Cycle',
        description: 'Test the full lifecycle: Create (with Schema Validation), Verify List, Delete, and Verify Absence.',
        endpoint: '/shipments',
        method: 'POST',
        requestBody: { origin: 'Paris', destination: 'London' },
        expectedJson: { id: "SHP-782", origin: "Paris", destination: "London", status: "PENDING" },
        jsonSchema: {
          type: "object",
          required: ["id", "origin", "destination", "status"],
          properties: {
            id: { type: "string", pattern: "^SHP-\\d+$" },
            origin: { type: "string" },
            destination: { type: "string" },
            status: { type: "string", enum: ["PENDING", "IN_TRANSIT", "DELIVERED"] }
          }
        },
        validationPoints: [
          "id: Must match pattern SHP-####",
          "status: Must be one of [PENDING, IN_TRANSIT, DELIVERED]",
          "origin: Must be exactly 'Paris'",
          "destination: Must be exactly 'London'"
        ],
        playwrightCode: `import { test, expect } from '@playwright/test';

test('Full CRUD Lifecycle with Schema Validation', async ({ request }) => {
  // 1. Create
  const createRes = await request.post('/shipments', {
    data: { origin: 'Paris', destination: 'London' }
  });
  expect(createRes.status()).toBe(201);
  const newShipment = await createRes.json();
  const shipmentId = newShipment.id;

  // 2. Validate JSON Schema
  // In a real project, use a library like 'ajv'
  expect(newShipment).toMatchObject({
    id: expect.stringMatching(/^SHP-\\d+$/),
    origin: 'Paris',
    destination: 'London',
    status: 'PENDING'
  });
  expect(typeof newShipment.id).toBe('string');

  // 3. Verify in list
  const listRes = await request.get('/shipments');
  const all = await listRes.json();
  expect(all.some(s => s.id === shipmentId)).toBeTruthy();

  // 4. Delete
  const delRes = await request.delete(\`/shipments/\${shipmentId}\`);
  expect(delRes.status()).toBe(204);

  // 5. Verify Absence
  const listAfter = await (await request.get('/shipments')).json();
  expect(listAfter.every(s => s.id !== shipmentId)).toBeTruthy();
});`,
        cypressCode: `it('Full CRUD Lifecycle with Schema Validation', () => {
  // 1. Create
  cy.request('POST', '/shipments', { origin: 'Paris', destination: 'London' })
    .then((res) => {
      expect(res.status).to.eq(201);
      const shipment = res.body;
      const id = shipment.id;

      // 2. Validate JSON Schema (Manual checks as example)
      expect(shipment).to.have.all.keys('id', 'origin', 'destination', 'status');
      expect(shipment.id).to.match(/^SHP-\\d+$/);
      expect(shipment.status).to.be.oneOf(['PENDING', 'IN_TRANSIT', 'DELIVERED']);

      // 3. Verify in list
      cy.request('/shipments')
        .its('body')
        .should('contain.any.elements', [{ id }]);

      // 4. Delete
      cy.request('DELETE', \`/shipments/\${id}\`)
        .its('status').should('eq', 204);

      // 5. Verify Absence
      cy.request('/shipments')
        .its('body')
        .should('not.contain.any.elements', [{ id }]);
    });
});`
      }
    ]
  },
  {
    id: 'edge',
    title: 'Edge Cases & Errors',
    icon: 'AlertTriangle',
    examples: [
      {
        title: 'Validation Failure (400)',
        description: 'Verify that the API correctly identifies and rejects malformed requests or missing required fields.',
        endpoint: '/error/400',
        method: 'POST',
        requestBody: { invalid_key: "data" },
        expectedJson: { error: "Bad Request", message: "Missing required field: 'orderId'", code: "VALIDATION_ERROR" },
        playwrightCode: `test('Handle 400 Bad Request', async ({ request }) => {
  const res = await request.post('/error/400', {
    data: { invalid_key: "data" }
  });
  
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.code).toBe('VALIDATION_ERROR');
});`,
        cypressCode: `it('Handle 400 Bad Request', () => {
  cy.request({
    method: 'POST',
    url: '/error/400',
    body: { invalid_key: "data" },
    failOnStatusCode: false
  }).then((res) => {
    expect(res.status).to.eq(400);
    expect(res.body.error).to.eq('Bad Request');
  });
});`
      },
      {
        title: 'Permission Denied (403)',
        description: 'Verify that the API restricts access to unauthorized users or actions.',
        endpoint: '/error/403',
        method: 'GET',
        expectedJson: { error: "Forbidden", message: "You do not have permission to access this resource.", code: "ACCESS_DENIED" },
        playwrightCode: `test('Handle 403 Forbidden', async ({ request }) => {
  const res = await request.get('/error/403');
  
  expect(res.status()).toBe(403);
  const body = await res.json();
  expect(body.code).toBe('ACCESS_DENIED');
});`,
        cypressCode: `it('Handle 403 Forbidden', () => {
  cy.request({
    url: '/error/403',
    failOnStatusCode: false
  }).then((res) => {
    expect(res.status).to.eq(403);
    expect(res.body.error).to.eq('Forbidden');
  });
});`
      },
      {
        title: 'Server-Side Fault (500)',
        description: 'Simulate an internal server crash to verify global error handling and response consistency.',
        endpoint: '/error/500',
        method: 'GET',
        expectedJson: { error: "Internal Server Error", message: "An unexpected condition was encountered.", traceId: "err-992-abc" },
        playwrightCode: `test('Handle 500 Internal Server Error', async ({ request }) => {
  const res = await request.get('/error/500');
  
  expect(res.status()).toBe(500);
  const body = await res.json();
  expect(body).toHaveProperty('traceId');
});`,
        cypressCode: `it('Handle 500 Internal Server Error', () => {
  cy.request({
    url: '/error/500',
    failOnStatusCode: false
  }).then((res) => {
    expect(res.status).to.eq(500);
    expect(res.body.error).to.include('Internal');
  });
});`
      },
      {
        title: 'Bad Gateway (502)',
        description: 'Test infrastructure resilience when an upstream service or proxy fails to provide a valid response.',
        endpoint: '/error/502',
        method: 'GET',
        expectedJson: { error: "Bad Gateway", message: "The server encountered a temporary error..." },
        playwrightCode: `test('Handle 502 Bad Gateway', async ({ request }) => {
  const res = await request.get('/error/502');
  
  expect(res.status()).toBe(502);
  const body = await res.json();
  expect(body.error).toBe('Bad Gateway');
});`,
        cypressCode: `it('Handle 502 Bad Gateway', () => {
  cy.request({
    url: '/error/502',
    failOnStatusCode: false
  }).then((res) => {
    expect(res.status).to.eq(502);
  });
});`
      },
      {
        title: 'Handling Rate Limits (429)',
        description: 'Validate that the system gracefully handles rate limiting with appropriate status codes and retry headers.',
        endpoint: '/limited/resource',
        method: 'GET',
        expectedJson: { error: "Too Many Requests", retryAfter: 60 },
        playwrightCode: `test('Handle Rate Limiting', async ({ request }) => {
  // Hit endpoint multiple times quickly
  for (let i = 0; i < 11; i++) {
    const res = await request.get('/limited/resource');
    if (i === 10) {
      expect(res.status()).toBe(429);
      const body = await res.json();
      
      // Assert existence and positive value of retryAfter
      expect(body).toHaveProperty('retryAfter');
      expect(body.retryAfter).toBeGreaterThan(0);
    }
  }
});`,
        cypressCode: `it('Handle Rate Limiting', () => {
  // Recursively hit until 429
  const hitApi = (count) => {
    cy.request({
      url: '/limited/resource',
      failOnStatusCode: false
    }).then((res) => {
      if (count < 10) {
        hitApi(count + 1);
      } else {
        expect(res.status).to.eq(429);
        expect(res.body.error).to.include('Too Many Requests');
        
        // Assert existence and positive value of retryAfter
        expect(res.body).to.have.property('retryAfter');
        expect(res.body.retryAfter).to.be.greaterThan(0);
      }
    });
  };
  hitApi(0);
});`
      }
    ]
  }
];
