import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('BAOMS: uncaught render error', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.handleReset);
    }

    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-lg font-bold text-slate-800">Something went wrong</h2>
        <p className="text-sm text-slate-500 max-w-md">
          This page hit an unexpected error and couldn't render. Your data hasn't been affected -
          try again, or reload the page if the problem continues.
        </p>
        <button
          onClick={this.handleReset}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
