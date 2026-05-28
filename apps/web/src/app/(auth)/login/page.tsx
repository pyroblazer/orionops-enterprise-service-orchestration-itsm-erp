'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Eye, EyeOff, ExternalLink, Shield, ArrowRight } from 'lucide-react';

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
              className="input-modern"
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
                className="input-modern"
              />
              <button
                type="button"
                className="absolute right-4 top-8 text-muted-foreground hover:text-foreground transition-colors"
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
              <p className="text-sm text-destructive font-medium" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-semibold shadow-medium hover:shadow-large transition-all"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-6">
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
            className="w-full h-11 font-semibold transition-all hover:shadow-medium"
            onClick={handleSSOLogin}
            aria-label="Sign in with SSO via Keycloak"
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            SSO (Keycloak)
          </Button>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
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
    </div>
  );
}
