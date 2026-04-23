import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProfileStore } from './profileStore';

type LichessAuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error';

interface TokenPayload {
  access_token: string;
  token_type?: string;
  scope?: string;
}

interface LichessAccountResponse {
  id?: string;
  username?: string;
}

interface LichessAuthState {
  accessToken: string | null;
  username: string;
  status: LichessAuthStatus;
  error: string | null;
  initialize: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

interface PersistedLichessAuthState {
  accessToken?: unknown;
  username?: unknown;
  status?: unknown;
  error?: unknown;
}

const LICHESS_HOST = 'https://lichess.org';
const AUTH_STATE_KEY = 'openingslab-lichess-oauth-state';
const AUTH_VERIFIER_KEY = 'openingslab-lichess-oauth-verifier';

let initPromise: Promise<void> | null = null;

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asStatus(value: unknown): LichessAuthStatus {
  return value === 'authenticated' || value === 'authenticating' || value === 'error' ? value : 'idle';
}

function sanitiseState(state?: PersistedLichessAuthState) {
  return {
    accessToken: asString(state?.accessToken) || null,
    username: asString(state?.username),
    status: asStatus(state?.status),
    error: asString(state?.error) || null,
  };
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomString(size = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return base64UrlEncode(bytes);
}

async function sha256Base64Url(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function getRedirectUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  return url.href;
}

function getClientId() {
  return `openingslab:${window.location.host}${window.location.pathname}`;
}

async function fetchLichessAccount(accessToken: string): Promise<string> {
  const response = await fetch(`${LICHESS_HOST}/api/account`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Lichess account lookup returned ${response.status}`);
  }

  const data = (await response.json()) as LichessAccountResponse;
  return data.username || data.id || 'Lichess Player';
}

async function resolveUsername(accessToken: string): Promise<string> {
  try {
    return await fetchLichessAccount(accessToken);
  } catch {
    return 'Lichess Player';
  }
}

function clearAuthQueryParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  window.history.replaceState({}, document.title, url.toString());
}

async function exchangeCodeForToken(code: string, verifier: string) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUrl(),
    code_verifier: verifier,
    client_id: getClientId(),
  });

  const response = await fetch(`${LICHESS_HOST}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`Lichess token exchange returned ${response.status}`);
  }

  return (await response.json()) as TokenPayload;
}

async function revokeToken(accessToken: string) {
  await fetch(`${LICHESS_HOST}/api/token`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).catch(() => undefined);
}

async function beginOauthRedirect() {
  const verifier = randomString(64);
  const state = randomString(24);
  const challenge = await sha256Base64Url(verifier);

  sessionStorage.setItem(AUTH_VERIFIER_KEY, verifier);
  sessionStorage.setItem(AUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getClientId(),
    redirect_uri: getRedirectUrl(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  });

  window.location.assign(`${LICHESS_HOST}/oauth?${params.toString()}`);
}

async function finishOauthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    const description = params.get('error_description');
    clearAuthQueryParams();
    throw new Error(description || error);
  }

  if (!code) {
    return null;
  }

  const expectedState = sessionStorage.getItem(AUTH_STATE_KEY);
  const verifier = sessionStorage.getItem(AUTH_VERIFIER_KEY);

  sessionStorage.removeItem(AUTH_STATE_KEY);
  sessionStorage.removeItem(AUTH_VERIFIER_KEY);

  if (!state || !expectedState || state !== expectedState || !verifier) {
    clearAuthQueryParams();
    throw new Error('Lichess OAuth state did not match the login request');
  }

  const token = await exchangeCodeForToken(code, verifier);
  const username = await resolveUsername(token.access_token);
  clearAuthQueryParams();

  return {
    accessToken: token.access_token,
    username,
  };
}

export const useLichessAuthStore = create<LichessAuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      username: '',
      status: 'idle',
      error: null,

      initialize: async () => {
        if (initPromise) return initPromise;

        initPromise = (async () => {
          try {
            const callbackResult = await finishOauthCallback();
            if (callbackResult) {
              set({
                accessToken: callbackResult.accessToken,
                username: callbackResult.username,
                status: 'authenticated',
                error: null,
              });
              useProfileStore.getState().setAuthenticatedProfile(callbackResult.username);
              return;
            }

            const { accessToken, username } = get();
            if (!accessToken) {
              set({ status: 'idle', error: null });
              return;
            }

            const resolvedUsername = username || await resolveUsername(accessToken);
            set({
              username: resolvedUsername,
              status: 'authenticated',
              error: null,
            });
            useProfileStore.getState().setAuthenticatedProfile(resolvedUsername);
          } catch (error) {
            set({
              accessToken: null,
              username: '',
              status: 'error',
              error: error instanceof Error ? error.message : 'Could not sign in with Lichess',
            });
            useProfileStore.getState().clearAuthenticatedProfile();
          } finally {
            initPromise = null;
          }
        })();

        return initPromise;
      },

      login: async () => {
        set({ status: 'authenticating', error: null });
        await beginOauthRedirect();
      },

      logout: async () => {
        const accessToken = get().accessToken;
        set({
          accessToken: null,
          username: '',
          status: 'idle',
          error: null,
        });
        useProfileStore.getState().clearAuthenticatedProfile();
        if (accessToken) {
          await revokeToken(accessToken);
        }
      },
    }),
    {
      name: 'openingslab-lichess-auth-v1',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitiseState(persistedState as PersistedLichessAuthState | undefined),
      }),
    },
  ),
);
