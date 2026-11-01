import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import './LoginModal.css';

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [loadingProvider, setLoadingProvider] = useState(null);

    if (!isOpen)
        return null;

    const handleOAuthLogin = async (provider) => {
        if (!termsAccepted) {
            setErrorMessage('Vui lòng đánh dấu xác nhận đã đọc và đồng ý với Điều khoản sử dụng của nền tảng trước khi đăng nhập.');
            return;
        }

        setErrorMessage(null);
        setLoadingProvider(provider);

        try {
             // Chuyển hướng tới Backend OAuth endpoint kèm returnUrl để sau khi đăng nhập sẽ quay lại đúng cổng hiện tại (vd: 5173 khi dev)
            const currentOrigin = window.location.origin;
            window.location.href = `/api/auth/login-${provider}?returnUrl=${encodeURIComponent(currentOrigin)}`;
        }
        catch (err) {
            setErrorMessage(err.message || 'Đăng nhập không thành công, vui lòng thử lại.');
            setLoadingProvider(null);
        }
    };

    return (
        <div className="qc-login-overlay" onClick={onClose}>
            <div className="qc-login-container" onClick={(e) => e.stopPropagation()}>
                {/* Nút đóng modal */}
                <button type="button" className="qc-login-close-btn" onClick={onClose} aria-label="Đóng">
                    <X size={20} />
                </button>

                {/* CỘT TRÁI: FORM ĐĂNG NHẬP */}
                <div className="qc-login-left">
                    {/* Logo & Tên nền tảng */}
                    <div className="qc-login-brand">
                        <div className="qc-login-brand-icon">
                            <Sparkles size={22} />
                        </div>
                        <div className="qc-login-brand-name">
                            Quiz<span>Card</span>
                        </div>
                    </div>

                    <div className="qc-login-header">
                        <h2 className="qc-login-title">Sign In</h2>
                        <p className="qc-login-subtitle">
                            Chào mừng bạn quay trở lại! Đăng nhập nhanh chóng và bảo mật qua tài khoản mạng xã hội của bạn.
                        </p>
                    </div>

                    {/* Thông báo lỗi nếu chưa tích chọn điều khoản */}
                    {errorMessage && (
                        <div className="qc-login-error-alert">
                            <AlertCircle size={18} />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Hộp xác nhận đã đọc điều khoản của nền tảng */}
                    <div className="qc-login-terms-box">
                        <label className="qc-login-terms-label">
                            <input
                                type="checkbox"
                                className="qc-login-checkbox"
                                checked={termsAccepted}
                                onChange={(e) => {
                                    setTermsAccepted(e.target.checked);
                                    if (e.target.checked) setErrorMessage(null);
                                }}
                            />
                            <span className="qc-login-terms-text">
                                Tôi xác nhận đã đọc, hiểu và đồng ý với{' '}
                                <a
                                    href="#terms"
                                    className="qc-login-terms-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert('ĐIỀU KHOẢN NỀN TẢNG QUIZCARD:\n\n1. Người dùng chịu trách nhiệm với nội dung thẻ ghi nhớ tạo trên hệ thống.\n2. QuizCard bảo vệ dữ liệu học tập cá nhân và tiến trình SM-2 theo tiêu chuẩn bảo mật.\n3. Nền tảng không chia sẻ trái phép dữ liệu học liệu với bên thứ ba.');
                                    }}
                                >
                                    Điều khoản dịch vụ
                                </a>{' '}
                                và{' '}
                                <a
                                    href="#privacy"
                                    className="qc-login-terms-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert('CHÍNH SÁCH BẢO MẬT:\n\n- Thông tin tài khoản Google / Facebook chỉ dùng để định danh và đồng bộ hóa tiến độ ôn tập bộ thẻ.');
                                    }}
                                >
                                    Chính sách bảo mật
                                </a>{' '}
                                của QuizCard.
                            </span>
                        </label>
                    </div>

                    {/* CÁC NÚT ĐĂNG NHẬP GOOGLE & FACEBOOK */}
                    <div className="qc-login-oauth-buttons">
                        {/* Đăng nhập bằng Google */}
                        <button
                            type="button"
                            className={`qc-btn-oauth qc-btn-google ${loadingProvider === 'google' ? 'loading' : ''}`}
                            onClick={() => handleOAuthLogin('google')}
                            disabled={loadingProvider !== null}
                        >
                            <svg className="qc-oauth-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <span>
                                {loadingProvider === 'google' ? 'Đang chuyển hướng...' : 'Sign up with Google'}
                            </span>
                        </button>

                        {/* Đăng nhập bằng Facebook */}
                        <button
                            type="button"
                            className={`qc-btn-oauth qc-btn-facebook ${loadingProvider === 'facebook' ? 'loading' : ''}`}
                            onClick={() => handleOAuthLogin('facebook')}
                            disabled={loadingProvider !== null}
                        >
                            <svg className="qc-oauth-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span>
                                {loadingProvider === 'facebook' ? 'Đang chuyển hướng...' : 'Sign up with Facebook'}
                            </span>
                        </button>
                    </div>

                    <div className="qc-login-footer-info">
                        <ShieldCheck size={16} className="qc-login-shield-icon" />
                        <span>Cam kết bảo mật thông tin & tiến độ ôn tập của bạn tuyệt đối.</span>
                    </div>
                </div>

                {/* CỘT PHẢI: BANNER CHÀO MỪNG */}
                <div className="qc-login-right">
                    <div className="qc-login-right-content">
                        <h1 className="qc-login-hero-title">Welcome back!</h1>
                        <h2 className="qc-login-hero-subtitle">
                            Sẵn sàng chinh phục mọi kiến thức cùng QuizCard
                        </h2>
                        <p className="qc-login-hero-desc">
                            Hệ thống ôn tập thông minh ứng dụng thuật toán lặp lại ngắt quãng SuperMemo SM-2 giúp bạn ghi nhớ sâu và lâu hơn 10 lần.
                        </p>

                        {/* Widget minh họa đồ thị học tập */}
                        <div className="qc-login-chart-card">
                            <div className="qc-login-chart-header">
                                <span className="qc-chart-title">Tiến độ ghi nhớ tuần qua</span>
                                <span className="qc-chart-badge">+98% Hiệu quả</span>
                            </div>
                            <div className="qc-login-bars">
                                <div className="qc-bar-item">
                                    <div className="qc-bar-track">
                                        <div className="qc-bar-fill" style={{ height: '40%' }}></div>
                                    </div>
                                    <span className="qc-bar-day">T2</span>
                                </div>
                                <div className="qc-bar-item">
                                    <div className="qc-bar-track">
                                        <div className="qc-bar-fill" style={{ height: '65%' }}></div>
                                    </div>
                                    <span className="qc-bar-day">T3</span>
                                </div>
                                <div className="qc-bar-item">
                                    <div className="qc-bar-track">
                                        <div className="qc-bar-fill" style={{ height: '55%' }}></div>
                                    </div>
                                    <span className="qc-bar-day">T4</span>
                                </div>
                                <div className="qc-bar-item">
                                    <div className="qc-bar-track">
                                        <div className="qc-bar-fill" style={{ height: '80%' }}></div>
                                    </div>
                                    <span className="qc-bar-day">T5</span>
                                </div>
                                <div className="qc-bar-item">
                                    <div className="qc-bar-track">
                                        <div className="qc-bar-fill" style={{ height: '70%' }}></div>
                                    </div>
                                    <span className="qc-bar-day">T6</span>
                                </div>
                                <div className="qc-bar-item active">
                                    <div className="qc-bar-track">
                                        <div className="qc-bar-fill" style={{ height: '95%' }}></div>
                                    </div>
                                    <span className="qc-bar-day">T7</span>
                                </div>
                                <div className="qc-bar-item">
                                    <div className="qc-bar-track">
                                        <div className="qc-bar-fill" style={{ height: '85%' }}></div>
                                    </div>
                                    <span className="qc-bar-day">CN</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
