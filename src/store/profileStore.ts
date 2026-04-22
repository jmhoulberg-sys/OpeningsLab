import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ProfileState {
  profileId: string;
  displayName: string;
  isLoggedIn: boolean;
  setDisplayName: (name: string) => void;
  login: () => void;
  logout: () => void;
  /** Returns a base64 sync code containing all progress + settings. */
  exportData: () => string;
  /** Imports a base64 sync code. Returns true on success, false on failure. */
  importData: (code: string) => boolean;
}

interface PersistedProfileState {
  profileId?: unknown;
  displayName?: unknown;
  isLoggedIn?: unknown;
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function sanitiseProfileState(state?: PersistedProfileState) {
  return {
    profileId: asString(state?.profileId, generateId()),
    displayName: asString(state?.displayName),
    isLoggedIn: asBoolean(state?.isLoggedIn),
  };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profileId: generateId(),
      displayName: '',
      isLoggedIn: false,

      setDisplayName: (name) => set({ displayName: name }),
      login: () =>
        set((state) => ({
          isLoggedIn: true,
          displayName: state.displayName.trim() || 'Opening Player',
        })),
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
            localStorage.setItem(
              'openingslab-progress-v1',
              JSON.stringify(payload.progress),
            );
          }
          if (payload.settings) {
            localStorage.setItem(
              'openingslab-settings-v1',
              JSON.stringify(payload.settings),
            );
          }
          if (payload.displayName) set({ displayName: payload.displayName });
          if (payload.profileId)   set({ profileId: payload.profileId });
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
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitiseProfileState(persistedState as PersistedProfileState | undefined),
      }),
    },
  ),
);
