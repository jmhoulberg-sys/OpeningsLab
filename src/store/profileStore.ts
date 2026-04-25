import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface LocalAccount {
  username: string;
  password: string;
  createdAt: number;
}

type AuthMode = 'signup' | 'login';

interface AuthResult {
  ok: boolean;
  message?: string;
}

interface ProfileState {
  profileId: string;
  displayName: string;
  isLoggedIn: boolean;
  accounts: LocalAccount[];
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  setDisplayName: (name: string) => void;
  setAuthenticatedProfile: (name: string) => void;
  clearAuthenticatedProfile: () => void;
  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
  setAuthMode: (mode: AuthMode) => void;
  signUp: (username: string, password: string) => AuthResult;
  signIn: (username: string, password: string) => AuthResult;
  logout: () => void;
  exportData: () => string;
  importData: (code: string) => boolean;
}

interface PersistedProfileState {
  profileId?: unknown;
  displayName?: unknown;
  isLoggedIn?: unknown;
  accounts?: unknown;
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function sanitiseAccounts(value: unknown): LocalAccount[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is LocalAccount => {
      return !!entry
        && typeof entry === 'object'
        && typeof (entry as LocalAccount).username === 'string'
        && typeof (entry as LocalAccount).password === 'string';
    })
    .map((entry) => ({
      username: entry.username.trim(),
      password: entry.password,
      createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : Date.now(),
    }))
    .filter((entry) => entry.username.length > 0);
}

function sanitiseProfileState(state?: PersistedProfileState) {
  return {
    profileId: asString(state?.profileId, generateId()),
    displayName: asString(state?.displayName),
    isLoggedIn: asBoolean(state?.isLoggedIn),
    accounts: sanitiseAccounts(state?.accounts),
  };
}

function normaliseUsername(username: string) {
  return username.trim().toLowerCase();
}

function validateCredentials(username: string, password: string): AuthResult {
  const cleanUsername = username.trim();
  if (cleanUsername.length < 3) {
    return { ok: false, message: 'Username must be at least 3 characters.' };
  }
  if (cleanUsername.length > 24) {
    return { ok: false, message: 'Username must be 24 characters or fewer.' };
  }
  if (!/^[a-zA-Z0-9_ -]+$/.test(cleanUsername)) {
    return { ok: false, message: 'Use letters, numbers, spaces, hyphens, or underscores.' };
  }
  if (password.length < 6) {
    return { ok: false, message: 'Password must be at least 6 characters.' };
  }
  return { ok: true };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profileId: generateId(),
      displayName: '',
      isLoggedIn: false,
      accounts: [],
      isAuthModalOpen: false,
      authMode: 'signup',

      setDisplayName: (name) => set({ displayName: name }),
      setAuthenticatedProfile: (name) =>
        set({
          isLoggedIn: true,
          displayName: name.trim() || 'Opening Player',
        }),
      clearAuthenticatedProfile: () => set({ isLoggedIn: false }),
      openAuthModal: (mode = 'signup') => set({ isAuthModalOpen: true, authMode: mode }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      setAuthMode: (mode) => set({ authMode: mode }),

      signUp: (username, password) => {
        const validation = validateCredentials(username, password);
        if (!validation.ok) return validation;

        const cleanUsername = username.trim();
        const usernameKey = normaliseUsername(cleanUsername);
        const exists = get().accounts.some((account) => normaliseUsername(account.username) === usernameKey);
        if (exists) {
          return { ok: false, message: 'That username is already taken.' };
        }

        const nextAccount: LocalAccount = {
          username: cleanUsername,
          password,
          createdAt: Date.now(),
        };

        set((state) => ({
          accounts: [...state.accounts, nextAccount],
          displayName: cleanUsername,
          isLoggedIn: true,
          isAuthModalOpen: false,
          authMode: 'login',
        }));

        return { ok: true };
      },

      signIn: (username, password) => {
        const cleanUsername = username.trim();
        const usernameKey = normaliseUsername(cleanUsername);
        const account = get().accounts.find((entry) => normaliseUsername(entry.username) === usernameKey);
        if (!account || account.password !== password) {
          return { ok: false, message: 'Incorrect username or password.' };
        }

        set({
          displayName: account.username,
          isLoggedIn: true,
          isAuthModalOpen: false,
        });

        return { ok: true };
      },

      logout: () => set({ isLoggedIn: false }),

      exportData: () => {
        try {
          const progress = localStorage.getItem('openingslab-progress-v1') ?? '{}';
          const settings = localStorage.getItem('openingslab-settings-v1') ?? '{}';
          const payload = JSON.stringify({
            version: 1,
            profileId: get().profileId,
            displayName: get().displayName,
            isLoggedIn: get().isLoggedIn,
            progress: JSON.parse(progress),
            settings: JSON.parse(settings),
          });
          return btoa(unescape(encodeURIComponent(payload)));
        } catch {
          return '';
        }
      },

      importData: (code: string) => {
        try {
          const raw = decodeURIComponent(escape(atob(code.trim())));
          const payload = JSON.parse(raw) as {
            version: number;
            profileId?: string;
            displayName?: string;
            isLoggedIn?: boolean;
            progress?: unknown;
            settings?: unknown;
          };
          if (payload.version !== 1) return false;
          if (payload.progress) {
            localStorage.setItem('openingslab-progress-v1', JSON.stringify(payload.progress));
          }
          if (payload.settings) {
            localStorage.setItem('openingslab-settings-v1', JSON.stringify(payload.settings));
          }
          if (payload.displayName) set({ displayName: payload.displayName });
          if (payload.profileId) set({ profileId: payload.profileId });
          if (typeof payload.isLoggedIn === 'boolean') set({ isLoggedIn: payload.isLoggedIn });
          window.location.reload();
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'openingslab-profile-v1',
      partialize: (state) => ({
        profileId: state.profileId,
        displayName: state.displayName,
        isLoggedIn: state.isLoggedIn,
        accounts: state.accounts,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitiseProfileState(persistedState as PersistedProfileState | undefined),
      }),
    },
  ),
);
