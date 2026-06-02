import { api, auth, decodeJwtPayload } from '@/lib/api';

describe('API Client', () => {
  it('api object has expected domains (incidents, changes, vendors, etc.)', () => {
    expect(api).toBeDefined();
    const expectedDomains = ['getIncidents', 'getChanges', 'getProblems', 'search'];
    expectedDomains.forEach(method => {
      expect(typeof api[method as keyof typeof api]).toBe('function');
    });
  });

  it('api has CRUD methods for incidents', () => {
    expect(typeof api.createIncident).toBe('function');
    expect(typeof api.updateIncident).toBe('function');
    expect(typeof api.deleteIncident).toBe('function');
  });

  it('auth module has required methods', () => {
    expect(auth).toBeDefined();
    expect(typeof auth.setTokens).toBe('function');
    expect(typeof auth.getAccessToken).toBe('function');
    expect(typeof auth.isAuthenticated).toBe('function');
  });

  it('decodeJwtPayload decodes a valid JWT', () => {
    // Create a simple JWT payload (base64url encoded)
    const payload = { sub: 'user123', email: 'test@example.com' };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const token = `header.${encodedPayload}.signature`;

    const decoded = decodeJwtPayload(token);
    expect(decoded).toEqual(payload);
  });

  it('auth.setTokens and getAccessToken work together', () => {
    auth.setTokens('test-access-token', 'test-refresh-token');
    const accessToken = auth.getAccessToken();
    expect(accessToken).toBe('test-access-token');
    auth.clearTokens();
  });

  it('isAuthenticated returns false when no token', () => {
    auth.clearTokens();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated returns true when token is set', () => {
    auth.setTokens('test-token', 'refresh-token');
    expect(auth.isAuthenticated()).toBe(true);
    auth.clearTokens();
  });
});
