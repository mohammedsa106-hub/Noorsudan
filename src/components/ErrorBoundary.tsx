import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('App error boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <div className="glass-card rounded-2xl p-8 max-w-md gold-glow">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="font-display text-xl font-bold text-gold-100 mb-2">
              حدث خطأ غير متوقع
            </h1>
            <p className="text-sm text-gold-200/60 mb-6">
              نعتذر عن المشكلة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="glass-card border border-gold-400/20 rounded-xl px-5 py-2.5 text-sm text-gold-100 hover:border-gold-400/40 transition-all"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => {
                  window.location.hash = '/';
                  window.location.reload();
                }}
                className="btn-gold rounded-xl px-5 py-2.5 text-sm"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
