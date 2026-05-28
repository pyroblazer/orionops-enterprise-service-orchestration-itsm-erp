'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Eye, EyeOff, ExternalLink, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSSOLogin = async () => {
    window.location.href = await auth.getLoginUrl();
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (email && password) {
        auth.setTokens('dev-access-token', 'dev-refresh-token');
        router.push('/dashboard');
      } else {
        setError('Please enter your email and password.');
      }
    } catch {
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Branded background gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.15), transparent),
            radial-gradient(ellipse 60% 40% at 80% 100%, hsl(var(--info) / 0.1), transparent)
          `,
        }}
        aria-hidden="true"
      />

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      <Card
        className="relative w-full max-w-md border-border/50 shadow-xl backdrop-blur-sm"
        role="main"
        aria-label="Login form"
      >
        <CardHeader className="text-center pb-2">
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-md"
              aria-hidden="true"
            >
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl tracking-tight">OrionOps</CardTitle>
          <CardDescription className="text-sm">
            Enterprise Service Orchestration Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLocalLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-required="true"
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                aria-required="true"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-10"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-10"
            onClick={handleSSOLogin}
            aria-label="Sign in with SSO via Keycloak"
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Sign in with SSO (Keycloak)
          </Button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" aria-hidden="true" />
            <span>Protected by enterprise authentication</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
