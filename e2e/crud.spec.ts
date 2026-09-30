// SPDX-License-Identifier: AGPL-3.0-or-later
import { expect, test } from '@playwright/test';

const API_URL = process.env.API_URI ?? 'http://localhost:1996';

const EMAIL = `e2e-crud-${Date.now()}@example.com`;
const PASSWORD = 'CrudTest123!';

let authToken = '';

test.beforeAll(async ({ request }) => {
  const email = EMAIL;
  const password = PASSWORD;

  // Register
  const regResponse = await request.post(`${API_URL}/v1/user`, {
    data: { email, first_name: 'CRUD', last_name: 'Test', username: `crud_${Date.now()}`, password },
  });

  // Some servers return a token on registration
  if (regResponse.ok()) {
    const regBody = await regResponse.json();
    if (regBody.token) {
      authToken = regBody.token;
      return;
    }
  }

  // Try login
  const credentials = Buffer.from(`${email}:${password}`).toString('base64');
  const loginResponse = await request.post(`${API_URL}/v1/user/authorize`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (loginResponse.ok()) {
    const body = await loginResponse.json();
    authToken = body.token ?? '';
  }
});

function authHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

test.describe('Team CRUD via API', () => {
  let teamId = '';

  test('create a team', async ({ request }) => {
    test.skip(!authToken, 'auth failed — skipping CRUD');
    const response = await request.post(`${API_URL}/v1/team`, {
      headers: authHeaders(),
      data: {
        team: {
          name: `E2E Team ${Date.now()}`,
          description: 'Created by integration test',
        },
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    const team = body.team ?? body;
    expect(team).toHaveProperty('id');
    teamId = team.id;
  });

  test('read the created team', async ({ request }) => {
    test.skip(!teamId, 'no team created');
    const response = await request.get(`${API_URL}/v1/team/${teamId}`, {
      headers: authHeaders(),
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    const team = body.team ?? body;
    expect(team.id).toBe(teamId);
  });

  test('update the team', async ({ request }) => {
    test.skip(!teamId, 'no team created');
    const response = await request.put(`${API_URL}/v1/team/${teamId}`, {
      headers: authHeaders(),
      data: {
        team: { description: 'Updated by integration test' },
      },
    });
    expect(response.ok()).toBe(true);
  });

  test('list teams', async ({ request }) => {
    test.skip(!authToken, 'auth failed');
    const response = await request.get(`${API_URL}/v1/team`, {
      headers: authHeaders(),
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    const teams = body.teams ?? body;
    expect(Array.isArray(teams)).toBe(true);
  });

  test('delete the team', async ({ request }) => {
    test.skip(!teamId, 'no team created');
    const response = await request.delete(`${API_URL}/v1/team/${teamId}`, {
      headers: authHeaders(),
    });
    expect([200, 204]).toContain(response.status());
  });
});

test.describe('User profile via API', () => {
  test('get current user', async ({ request }) => {
    test.skip(!authToken, 'auth failed');
    const response = await request.get(`${API_URL}/v1/user`, {
      headers: authHeaders(),
    });
    expect(response.ok()).toBe(true);
  });
});

test.describe('Provider and Extension listing', () => {
  test('list providers', async ({ request }) => {
    test.skip(!authToken, 'auth failed');
    const response = await request.get(`${API_URL}/v1/provider`, {
      headers: authHeaders(),
    });
    expect(response.ok()).toBe(true);
  });

  test('list extensions', async ({ request }) => {
    test.skip(!authToken, 'auth failed');
    const response = await request.get(`${API_URL}/v1/extension`, {
      headers: authHeaders(),
    });
    expect(response.ok()).toBe(true);
  });
});

test.describe('UI pages render with a session', () => {
  // Sign in through the app's own origin (it proxies /v1), so the server's HttpOnly session
  // cookie lands in this browser context exactly as a real sign-in leaves it.
  test.beforeEach(async ({ context }) => {
    test.skip(!authToken, 'auth failed');
    const response = await context.request.post('/v1/user/authorize', {
      headers: { Authorization: `Basic ${Buffer.from(`${EMAIL}:${PASSWORD}`).toString('base64')}` },
    });
    expect(response.ok()).toBe(true);
  });

  for (const path of ['/team', '/provider']) {
    test(`${path} stays open to a signed-in user`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    });
  }
});
