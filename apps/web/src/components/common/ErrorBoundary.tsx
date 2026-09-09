import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);

    const errStr = String(error?.message || '');
    const isChunkLoadFailed =
      /loading dynamically imported module/i.test(errStr) ||
      /Failed to fetch dynamically imported module/i.test(errStr) ||
      /disallowed MIME type/i.test(errStr) ||
      /Importing a module script failed/i.test(errStr);

    if (isChunkLoadFailed && typeof window !== 'undefined') {
      const lastReload = sessionStorage.getItem('finance_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('finance_chunk_reload', String(now));
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunkError =
        /loading dynamically imported module/i.test(this.state.error?.message || '') ||
        /Failed to fetch dynamically imported module/i.test(this.state.error?.message || '') ||
        /disallowed MIME type/i.test(this.state.error?.message || '') ||
        /Importing a module script failed/i.test(this.state.error?.message || '');

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <Card className="max-w-sm w-full p-6 text-center space-y-4 border border-borderDefault shadow-sm rounded-2xl">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                isChunkError ? 'bg-blue-50 text-brand-primary' : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isChunkError ? <Sparkles className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-textDefault">
                {isChunkError ? 'App Updated' : 'Something went wrong'}
              </h2>
              <p className="text-xs text-textMuted leading-relaxed max-w-xs mx-auto">
                {isChunkError
                  ? 'A fresh update is ready. Tap refresh to continue.'
                  : 'We could not load this screen. Please refresh to try again.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReload}
                icon={<RefreshCw className="w-3.5 h-3.5 shrink-0" />}
                className="w-full sm:w-auto whitespace-nowrap shrink-0"
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleGoHome}
                icon={<Home className="w-3.5 h-3.5 shrink-0" />}
                className="w-full sm:w-auto whitespace-nowrap shrink-0"
              >
                Go to Home
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
