'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-100">
          <div className="bg-white rounded-xl shadow p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              Terjadi kesalahan pada halaman ini
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Coba muat ulang halaman. Jika masalah berlanjut, hubungi administrator.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-800 text-white text-sm px-5 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
