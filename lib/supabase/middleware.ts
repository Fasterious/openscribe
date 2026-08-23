import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_FETCH_TIMEOUT_MS = 4_000;

function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const timeout = AbortSignal.timeout(AUTH_FETCH_TIMEOUT_MS);
  const signal =
    init?.signal && typeof AbortSignal.any === 'function'
      ? AbortSignal.any([init.signal, timeout])
      : timeout;
  return fetch(input, { ...init, signal });
}

function passThroughUnavailable(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-supabase-auth-unavailable', '1');
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return passThroughUnavailable(request);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
    global: {
      fetch: fetchWithTimeout,
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Fail open so a paused/unreachable Supabase does not 504 the whole site.
    return passThroughUnavailable(request);
  }

  return supabaseResponse;
}
