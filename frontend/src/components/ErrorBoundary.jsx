import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0e0d16 0%, #171026 100%)',
            color: '#f3e8ff',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '24px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '480px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <AlertCircle size={28} color="#f87171" />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800 }}>
              Rendering Recovery
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#c4b5fd', lineHeight: 1.5 }}>
              A WebGL or interface error occurred. The application has protected your session.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#fda4af',
                  textAlign: 'left',
                  overflowX: 'auto',
                  marginBottom: '20px'
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  border: 'none',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} /> Resume Boutique
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

