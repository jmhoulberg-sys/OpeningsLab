import { useEffect, useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { useProfileStore } from '../../store/profileStore';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authMode,
    closeAuthModal,
    openAuthModal,
    setAuthMode,
    signIn,
    signUp,
  } = useProfileStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthModalOpen) {
      setUsername('');
      setPassword('');
      setError('');
    }
  }, [isAuthModalOpen, authMode]);

  function handleSubmit() {
    const result = authMode === 'signup'
      ? signUp(username, password)
      : signIn(username, password);

    if (!result.ok) {
      setError(result.message ?? 'Could not continue.');
      return;
    }

    setUsername('');
    setPassword('');
    setError('');
  }

  function handleBackdropClick() {
    closeAuthModal();
  }

  if (!isAuthModalOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-[1px]"
        onClick={handleBackdropClick}
      />
      <div className="fixed inset-0 z-[91] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[28px] border border-stone-800/70 bg-stone-950 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                {authMode === 'signup' ? 'Create account' : 'Log in'}
              </div>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {authMode === 'signup'
                  ? 'Save your progress and keep the streak alive'
                  : 'Welcome back'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                {authMode === 'signup'
                  ? 'Create a local account with a username and password. You can log in to the same browser later.'
                  : 'Log in with your local OpeningsLab account.'}
              </p>
            </div>
            <button
              onClick={closeAuthModal}
              className="rounded-xl border border-stone-700/45 bg-stone-800 px-2.5 py-2 text-stone-300 transition-colors hover:bg-stone-700 hover:text-white cursor-pointer"
              aria-label="Close auth modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Choose a username"
                className="w-full rounded-2xl border border-stone-700/45 bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-sky-400/55 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Your password'}
                className="w-full rounded-2xl border border-stone-700/45 bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-sky-400/55 focus:outline-none"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSubmit();
                }}
              />
            </div>
            {error && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
            >
              {authMode === 'signup' ? <UserPlus size={16} /> : <LogIn size={16} />}
              {authMode === 'signup' ? 'Create account' : 'Log in'}
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-stone-400">
            {authMode === 'signup' ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => {
                setError('');
                setAuthMode(authMode === 'signup' ? 'login' : 'signup');
              }}
              className="font-semibold text-sky-300 transition-colors hover:text-sky-200 cursor-pointer"
            >
              {authMode === 'signup' ? 'Log in' : 'Sign up'}
            </button>
          </div>

          {authMode === 'login' && (
            <div className="mt-3 text-center">
              <button
                onClick={() => {
                  setError('');
                  openAuthModal('signup');
                }}
                className="text-sm font-semibold text-stone-500 transition-colors hover:text-stone-300 cursor-pointer"
              >
                Create a new account instead
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
