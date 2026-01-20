import React, { useState, useEffect } from 'react';
import RestaurantVendorUI from './components/ui/RestaurantVendorUI.jsx';

// 1. Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error: error, errorInfo: errorInfo });
    console.error("React Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: '#fff' }}>
          <h1>⚠️ Something went wrong.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children; 
  }
}

function App() {
  // 2. Clear corrupted storage on load to prevent loops
  useEffect(() => {
    try {
      // Just accessing this to see if it works
      const test = localStorage.getItem('vendor_orders');
    } catch (e) {
      console.error("Storage Access Error:", e);
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="App min-h-screen bg-slate-950">
        <RestaurantVendorUI />
      </div>
    </ErrorBoundary>
  );
}

export default App;
