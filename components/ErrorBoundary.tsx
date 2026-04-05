import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ivory dark:bg-obsidian">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="text-sm font-inter text-gray-500 dark:text-gray-400 leading-relaxed">
            An unexpected error occurred. Please try refreshing the page or click below to recover.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-black font-jakarta font-bold text-sm tracking-wide hover:bg-gold/90 transition-colors shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }
}
