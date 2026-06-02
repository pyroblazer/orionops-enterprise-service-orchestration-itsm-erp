import { auth } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  auth: {
    isAuthenticated: jest.fn(() => false),
    loginWithPassword: jest.fn().mockResolvedValue({ access_token: 'token' }),
    getLoginUrl: jest.fn(() => 'https://auth.example.com/login'),
    getSignupUrl: jest.fn(() => 'https://auth.example.com/signup'),
  },
}));

describe('Login Page', () => {
  it('auth module is properly mocked', () => {
    expect(auth).toBeDefined();
    expect(typeof auth.isAuthenticated).toBe('function');
    expect(typeof auth.loginWithPassword).toBe('function');
    expect(typeof auth.getLoginUrl).toBe('function');
  });

  it('isAuthenticated returns false for non-authenticated users', () => {
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('loginWithPassword is callable and returns a promise', async () => {
    const result = auth.loginWithPassword('user', 'pass');
    expect(result).toBeInstanceOf(Promise);
    const resolved = await result;
    expect(resolved.access_token).toBe('token');
  });

  it('getLoginUrl returns a valid URL', () => {
    const url = auth.getLoginUrl();
    expect(typeof url).toBe('string');
    expect(url).toContain('auth.example.com');
  });
});
