'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/api';
import { Package, Loader2 } from 'lucide-react';

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://orionops-keycloak.onrender.com';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'orionops';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'orionops-web';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://orionops-enterprise-service.onrender.com/api/v1';

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    async function exchangeCode() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const oauthError = searchParams.get('error');

      if (oauthError) {
        setError(searchParams.get('error_description') || oauthError);
        return;
      }

      if (!code) {
        setError('No authorization code received.');
        return;
      }

      // Validate state for CSRF protection
      const savedState = sessionStorage.getItem('orionops_oauth_state');
      if (state !== savedState) {
        setError('Invalid state parameter. Possible CSRF attack.');
        return;
      }

      const verifier = sessionStorage.getItem('orionops_pkce_verifier');
      if (!verifier) {
        setError('Missing PKCE verifier. Please try logging in again.');
        return;
      }

      try {
        // Exchange authorization code for tokens
        const tokenResponse = await fetch(
          `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: KEYCLOAK_CLIENT_ID,
              code,
              redirect_uri: `${window.location.origin}/login/callback`,
              code_verifier: verifier,
            }),
          }
        );

        if (!tokenResponse.ok) {
          const errData = await tokenResponse.json().catch(() => ({}));
          throw new Error(errData.error_description || `Token exchange failed (${tokenResponse.status})`);
        }

        const tokens = await tokenResponse.json();
        const { access_token, refresh_token } = tokens;

        // Store tokens
        auth.setTokens(access_token, refresh_token);

        // Clear PKCE values
        sessionStorage.removeItem('orionops_pkce_verifier');
        sessionStorage.removeItem('orionops_oauth_state');

        // Set auth cookie for middleware
        document.cookie = 'orionops_authenticated=true; path=/; max-age=36000; SameSite=Lax';

        // Decode JWT and sync user with backend
        try {
          const claims = decodeJwtPayload(access_token);
          const realmAccess = claims.realm_access as { roles?: string[] } | undefined;
          const groups = (claims.groups as string[]) || [];

          await fetch(`${API_BASE_URL}/auth/sync-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${access_token}`,
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
        } catch {
          // Sync failure shouldn't block login — user can retry later
        }

        router.replace('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed.');
      }
    }

    exchangeCode();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive shadow-medium">
              <Package className="h-8 w-8 text-destructive-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Authentication Failed</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <a
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-medium hover:shadow-large transition-all"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto spinner-modern" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Completing sign in</p>
          <p className="text-xs text-muted-foreground">Securing your session...</p>
        </div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
