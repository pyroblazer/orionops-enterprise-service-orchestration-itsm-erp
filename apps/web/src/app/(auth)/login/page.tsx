'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ExternalLink, Shield, ArrowRight, CheckCircle } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSignupSuccess = searchParams.get('signup') === 'success';

  useEffect(() => {
    if (auth.isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

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

          <Button
            type="button"
            className="w-full h-11 font-semibold shadow-medium hover:shadow-large transition-all"
            onClick={handleSSOLogin}
            aria-label="Sign in with SSO via Keycloak"
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Sign In with Keycloak
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
