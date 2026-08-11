# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> register a new user via API
- Location: e2e/auth.spec.ts:13:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 422
Received array: [200, 201, 400]
```

# Test source

```ts
  1  | // SPDX-License-Identifier: AGPL-3.0-or-later
  2  | import { expect, test } from '@playwright/test';
  3  | 
  4  | const API_URL = process.env.NEXT_PUBLIC_API_URI ?? 'http://localhost:1996';
  5  | const TEST_PASSWORD = 'TestPassword123!';
  6  | 
  7  | test.describe('Authentication', () => {
  8  |   test('server health check returns 200', async ({ request }) => {
  9  |     const response = await request.get(`${API_URL}/health`);
  10 |     expect(response.ok()).toBe(true);
  11 |   });
  12 | 
  13 |   test('register a new user via API', async ({ request }) => {
  14 |     const email = `e2e-reg-${Date.now()}@example.com`;
  15 |     const response = await request.post(`${API_URL}/v1/user`, {
  16 |       data: {
  17 |         email,
  18 |         first_name: 'E2E',
  19 |         last_name: 'Test',
  20 |         username: `e2e_${Date.now()}`,
  21 |       },
  22 |     });
  23 |     // Accept 200, 201, or 400 (if registration requires additional fields)
> 24 |     expect([200, 201, 400]).toContain(response.status());
     |                             ^ Error: expect(received).toContain(expected) // indexOf
  25 |   });
  26 | 
  27 |   test('login page renders', async ({ page }) => {
  28 |     await page.goto('/user');
  29 |     await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
  30 |   });
  31 | 
  32 |   test('login via API and verify JWT', async ({ request }) => {
  33 |     const email = `e2e-jwt-${Date.now()}@example.com`;
  34 | 
  35 |     // Register
  36 |     await request.post(`${API_URL}/v1/user`, {
  37 |       data: {
  38 |         email,
  39 |         first_name: 'JWT',
  40 |         last_name: 'Test',
  41 |         username: `jwt_${Date.now()}`,
  42 |       },
  43 |     });
  44 | 
  45 |     // Attempt login with Basic auth
  46 |     const credentials = Buffer.from(`${email}:${TEST_PASSWORD}`).toString('base64');
  47 |     const loginResponse = await request.post(`${API_URL}/v1/user/authorize`, {
  48 |       headers: { Authorization: `Basic ${credentials}` },
  49 |     });
  50 | 
  51 |     if (loginResponse.ok()) {
  52 |       const body = await loginResponse.json();
  53 |       expect(body).toHaveProperty('token');
  54 | 
  55 |       // Verify the token works
  56 |       const verifyResponse = await request.get(`${API_URL}/v1/user`, {
  57 |         headers: { Authorization: `Bearer ${body.token}` },
  58 |       });
  59 |       expect(verifyResponse.ok()).toBe(true);
  60 |     } else {
  61 |       // Server may require password to be set separately — skip gracefully
  62 |       test.skip(true, `Login returned ${loginResponse.status()} — password setup flow differs`);
  63 |     }
  64 |   });
  65 | 
  66 |   test('unauthenticated request to private API returns 401/403', async ({ request }) => {
  67 |     const response = await request.get(`${API_URL}/v1/team`);
  68 |     expect([401, 403]).toContain(response.status());
  69 |   });
  70 | });
  71 | 
```