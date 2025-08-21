import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import EnhancedApp from './components/EnhancedApp'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }>{
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, color: '#f87171', fontFamily: 'system-ui, sans-serif' }}>
          <h2>App failed to load</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  console.error('Root element #root not found');
} else {
  console.log('Mounting EnhancedApp...');
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <EnhancedApp />
      </ErrorBoundary>
    </React.StrictMode>
  );
}