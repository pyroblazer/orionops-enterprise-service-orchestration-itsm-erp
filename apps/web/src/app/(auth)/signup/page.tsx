'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ExternalLink, Shield, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    if (auth.isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSSOSignup = async () => {
    window.location.href = await auth.getSignupUrl();
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
          <Button
            type="button"
            className="w-full h-11 font-semibold shadow-medium hover:shadow-large transition-all"
            onClick={handleSSOSignup}
            aria-label="Sign up with Keycloak"
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Create Account with Keycloak
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">Or</span>
            </div>
          </div>

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
