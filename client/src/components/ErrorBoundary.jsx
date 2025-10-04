import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center p-8">
          <div className="max-w-2xl w-full border border-red-400/30 bg-red-400/5 p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <h1 className="text-2xl text-red-400 font-bold">
                SYSTEM_ERROR_DETECTED
              </h1>
            </div>

            <div className="mb-6">
              <p className="text-red-400/80 text-sm mb-4">
                An unexpected error has occurred in the application. This has
                been logged for debugging purposes.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="bg-black/50 border border-red-400/20 p-4 mb-4">
                  <h3 className="text-red-400 text-sm font-bold mb-2">
                    ERROR_DETAILS:
                  </h3>
                  <pre className="text-red-400/60 text-xs overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-red-400/60 text-xs cursor-pointer">
                        STACK_TRACE
                      </summary>
                      <pre className="text-red-400/40 text-xs overflow-auto max-h-32 mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-green-400 text-black hover:bg-green-300 transition-all text-sm font-bold"
              >
                <RefreshCw className="w-4 h-4" />
                [RETRY]
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all text-sm font-bold"
              >
                <Home className="w-4 h-4" />
                [GO_HOME]
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-red-400/20">
              <p className="text-red-400/60 text-xs">
                If this error persists, please contact support or try refreshing
                the page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
