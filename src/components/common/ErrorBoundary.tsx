// Audited: 11/08/2025

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen flex items-center justify-center p-4'>
          <Card className='max-w-md w-full p-8 text-center'>
            <AlertTriangle className='w-16 h-16 text-red-500 mx-auto mb-4' />
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              Something went wrong
            </h1>
            <p className='text-gray-600 mb-6'>
              We encountered an unexpected error. Please try refreshing the
              page.
            </p>

            <div className='space-y-4'>
              <Button onClick={this.handleReset} className='w-full'>
                <RefreshCw className='w-4 h-4 mr-2' />
                Try Again
              </Button>

              <Button
                variant='secondary'
                onClick={() => window.location.reload()}
                className='w-full'>
                Refresh Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mt-6 text-left'>
                <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
                  Error Details (Development)
                </summary>
                <div className='mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto'>
                  <div className='mb-2'>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className='whitespace-pre-wrap mt-1'>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
