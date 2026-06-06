import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Proxy for Keycloak token endpoint — eliminates browser CORS issues.
// The browser calls same-origin /api/auth/token; this route forwards
// the request server-side to Keycloak (where CORS doesn't apply).
// Supports: password grant, authorization_code exchange, refresh_token.
// ---------------------------------------------------------------------------

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8180';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'orionops';

const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const upstream = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data.error || 'token_error', error_description: data.error_description || 'Token request failed' },
        { status: upstream.status },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'proxy_error', error_description: err instanceof Error ? err.message : 'Proxy request failed' },
      { status: 502 },
    );
  }
}
