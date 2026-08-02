import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetKey?: string;
}
interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidUpdate(prev: Props) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: undefined });
    }
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught:', error);
  }

  reset = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.hash = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold-400/10 flex items-center justify-center">
            <span className="gold-text text-2xl font-bold">!</span>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold gold-gradient-text mb-2">حدث خطأ غير متوقع</h2>
            <p className="text-sm text-gold-200/60 max-w-md">
              نواجه مشكلة مؤقتة في عرض هذه الصفحة. يمكنك العودة للصفحة الرئيسية والمتابعة.
            </p>
          </div>
          <button onClick={this.reset} className="btn-gold rounded-xl px-6 py-2.5">
            العودة للرئيسية
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
