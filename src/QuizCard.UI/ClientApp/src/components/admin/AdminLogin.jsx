import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Loader2, ArrowLeft, Lock, User, Eye, EyeOff } from 'lucide-react';
import { api } from '../../api';
import './AdminLogin.css';

export const AdminLogin = ({ onLoginSuccess, onBackToApp }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await api.adminLogin(usernameOrEmail, password, rememberMe);
      if (res?.success) {
        onLoginSuccess?.(res.admin);
      } else {
        setErrorMessage(res?.message || 'Đăng nhập không thành công.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Tên đăng nhập hoặc mật khẩu quản trị viên không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login-wrapper">
      <div className="adm-login-container">
        {/* Nút quay về ứng dụng chính */}
        {onBackToApp && (
          <button type="button" className="adm-btn-back" onClick={onBackToApp}>
            <ArrowLeft size={16} />
            <span>Quay lại ứng dụng chính</span>
          </button>
        )}

        <div className="adm-login-card">
          {/* Logo & Header */}
          <div className="adm-login-header">
            <div className="adm-login-badge">
              <ShieldCheck size={28} color="#0d99ff" />
            </div>
            <h1 className="adm-login-title">
              QuizCard <span className="adm-text-accent">Admin Portal</span>
            </h1>
            <p className="adm-login-subtitle">
              Cổng quản trị hệ thống bài giảng, video Cloudinary và quản lý QuizCard
            </p>
          </div>

          {/* Form đăng nhập */}
          <form onSubmit={handleSubmit} className="adm-login-form">
            {errorMessage && (
              <div className="adm-error-banner">
                <ShieldAlert size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="adm-input-group">
              <label className="adm-input-label">Tài khoản hoặc Email Admin</label>
              <div className="adm-input-wrap">
                <User size={16} className="adm-input-icon" />
                <input
                  type="text"
                  className="adm-input"
                  placeholder="admin"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="adm-input-group">
              <label className="adm-input-label">Mật khẩu quản trị viên</label>
              <div className="adm-input-wrap">
                <Lock size={16} className="adm-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="adm-input"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="adm-btn-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="adm-form-row">
              <label className="adm-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ghi nhớ phiên đăng nhập (72h)</span>
              </label>
            </div>

            <button type="submit" className="adm-btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="adm-spinner" />
                  <span>Đang xác thực thông tin...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Đăng Nhập Quản Trị</span>
                </>
              )}
            </button>
          </form>

          {/* Hướng dẫn tài khoản mặc định */}
          <div className="adm-login-footer">
            <span className="adm-hint-badge">💡 Mặc định:</span>
            <span>Tài khoản: <strong>admin</strong> • Mật khẩu: <strong>Admin@123456</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

