'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth, decodeJwtPayload } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, ExternalLink, Shield, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSignupSuccess = searchParams.get('signup') === 'success';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
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
        if (!syncRes.ok) console.warn('User sync failed, but login succeeded');
      }

      // Token is stored in localStorage by loginWithPassword
      // Client-side auth protection will check the token on protected routes
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      setLoading(false);
    }
  };

  const handleSSOLogin = async () => {
    window.location.href = await auth.getLoginUrl();
  };

  return (
    <Card
        className="relative w-full max-w-md rounded-3xl shadow-large transition-all duration-300 hover:shadow-float"
        role="main"
        aria-label="Login form"
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
          <CardTitle className="text-3xl font-bold tracking-tight gradient-text">OrionOps</CardTitle>
          <CardDescription className="text-sm mt-2">
            Enterprise Service Orchestration Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {showSignupSuccess && (
            <div className="rounded-lg border border-success/30 bg-success/10 p-3 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-success">Account Created</p>
                <p className="text-xs text-success/80">Welcome to OrionOps. Sign in below to continue.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handlePasswordLogin} className="space-y-3">
            <Input
              id="username"
              type="text"
              label="Username or Email"
              placeholder="alice or alice@company.com"
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
            <Button
              type="submit"
              className="w-full h-11 font-semibold shadow-medium hover:shadow-large transition-all"
              disabled={loading}
              aria-label="Sign in with username and password"
            >
              {loading ? 'Signing in...' : 'Sign In'}
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
            onClick={handleSSOLogin}
            disabled={loading}
            aria-label="Sign in with Keycloak SSO"
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Keycloak
          </Button>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-primary hover:text-primary/90 transition-colors flex items-center justify-center gap-1 mt-2"
              >
                Create one
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" aria-hidden="true" />
            <span>ISO 20000 compliant authentication</span>
          </div>
        </CardContent>
      </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>}>
      <LoginFormContent />
    </Suspense>
  );
}
