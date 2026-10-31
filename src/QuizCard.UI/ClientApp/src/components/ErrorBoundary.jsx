import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('QuizCard UI Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.history.replaceState(null, '', '/community');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
          color: '#1e293b',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px 28px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              Đã xảy ra lỗi khi hiển thị giao diện
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
              Hệ thống đã ghi nhận lỗi này. Vui lòng bấm nút bên dưới để quay về trang chủ hoặc tải lại dữ liệu.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'left',
                overflowX: 'auto',
                fontFamily: 'monospace'
              }}>
                {this.state.error.message}
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Tải lại trang Community
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

