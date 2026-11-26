import React from 'react';

type State = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Unhandled application error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
          <div className="max-w-sm space-y-4">
            <div className="w-10 h-10 bg-neutral-950 text-white rounded-lg flex items-center justify-center font-bold text-sm mx-auto">
              H
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-neutral-950">Something went wrong</h1>
              <p className="text-xs text-neutral-500">
                An unexpected error occurred. Reload the page to continue.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary text-xs py-2 px-4"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
