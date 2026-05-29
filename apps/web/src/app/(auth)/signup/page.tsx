'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, decodeJwtPayload } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, ExternalLink, Shield, ArrowLeft, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      // Register the user
      await auth.register({
        username,
        email,
        password,
        firstName,
        lastName,
      });

      // Auto-login
      await auth.loginWithPassword(username, password);

      // Decode JWT and sync user
      const accessToken = auth.getAccessToken();
      if (accessToken) {
        const claims = decodeJwtPayload(accessToken);
        const realmAccess = claims.realm_access as { roles?: string[] } | undefined;
        const groups = (claims.groups as string[]) || [];

        const syncRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth/sync-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            keycloakId: claims.sub,
            username: claims.preferred_username || '',
            email: claims.email || '',
            firstName: claims.given_name || '',
            lastName: claims.family_name || '',
            roles: realmAccess?.roles || [],
            groups,
          }),
        });
        if (!syncRes.ok) console.warn('User sync failed, but signup succeeded');
      }

      // Set auth cookie
      document.cookie = 'orionops_authenticated=true; path=/; max-age=1800; SameSite=Lax';
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
      setLoading(false);
    }
  };

  const handleSSOSignup = async () => {
    window.location.href = await auth.getSignupUrl();
  };

  const handleGoogleSignup = async () => {
    window.location.href = await auth.getGoogleLoginUrl();
  };

  return (
    <Card
        className="relative w-full max-w-md rounded-3xl shadow-large transition-all duration-300 hover:shadow-float"
        role="main"
        aria-label="Sign up form"
      >
        <CardHeader className="text-center pb-2">
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-medium transition-all duration-300"
              aria-hidden="true"
            >
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight gradient-text">Create Account</CardTitle>
          <CardDescription className="text-sm mt-2">
            Join OrionOps today
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="firstName"
                type="text"
                label="First Name"
                placeholder="Alice"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                required
              />
              <Input
                id="lastName"
                type="text"
                label="Last Name"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="alice@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              id="username"
              type="text"
              label="Username"
              placeholder="alice"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />

            <Button
              type="submit"
              className="w-full h-11 font-semibold shadow-medium hover:shadow-large transition-all"
              disabled={loading}
              aria-label="Create account with username and password"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-semibold shadow-medium hover:shadow-large transition-all"
            onClick={handleSSOSignup}
            disabled={loading}
            aria-label="Sign up with Keycloak"
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Keycloak
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-semibold shadow-medium hover:shadow-large transition-all"
            onClick={handleGoogleSignup}
            disabled={loading}
            aria-label="Sign up with Google"
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary/90 transition-colors flex items-center justify-center gap-1 mt-2"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Sign In
            </Link>
          </p>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" aria-hidden="true" />
            <span>ISO 20000 compliant authentication</span>
          </div>
        </CardContent>
      </Card>
  );
}
