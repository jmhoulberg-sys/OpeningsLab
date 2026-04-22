import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('OpeningsLab runtime crash', error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-brand-bg px-4 py-8 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-rose-400/20 bg-stone-950/85 p-6 shadow-2xl shadow-black/40">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-300/80">
            Runtime Error
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">
            OpeningsLab crashed after loading.
          </h1>
          <p className="mt-3 text-sm text-stone-300">
            The app hit a client-side error after mount. The details below will help us fix the exact cause.
          </p>

          <div className="mt-6 rounded-2xl bg-stone-900 p-4">
            <div className="text-sm font-semibold text-white">Error message</div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-sm text-rose-200">
              {this.state.error.message || String(this.state.error)}
            </pre>
          </div>

          {this.state.error.stack && (
            <div className="mt-4 rounded-2xl bg-stone-900 p-4">
              <div className="text-sm font-semibold text-white">Stack</div>
              <pre className="mt-3 max-h-[40vh] overflow-auto whitespace-pre-wrap break-words text-xs text-stone-300">
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }
}
