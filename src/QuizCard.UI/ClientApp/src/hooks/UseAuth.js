import { useState, useEffect, useCallback } from 'react';

/**
 * Hàm tiện ích lấy thông tin tài khoản người dùng đã lưu từ LocalStorage.
 */
export const getStoredUser = () => {
    try {
        const saved = localStorage.getItem('quizcard_user');
        if (!saved) return null;
        const user = JSON.parse(saved);
        return {
            id: user.id || user.Id,
            email: user.email || user.Email || '',
            fullName: user.fullName || user.FullName || user.name || user.Name || (user.email || user.Email || '').split('@')[0] || 'User',
            avatarUrl: user.avatarUrl || user.AvatarUrl || '',
            provider: user.provider || user.Provider || 'oauth',
            termsAccepted: user.termsAccepted ?? user.TermsAccepted ?? true,
            token: user.token || user.Token || ''
        };
    } catch {
        return null;
    }
};

// Bí danh tương thích
export const handleCurrentUser = getStoredUser;

/**
 * Custom Hook useAuth:
 * Quản lý trạng thái người dùng, đóng/mở LoginModal, đăng xuất và lắng nghe callback OAuth (Google / Facebook).
 */
export const useAuth = () => {
    // Trạng thái người dùng hiện tại (nạp từ LocalStorage khi khởi tạo)
    const [currentUser, setCurrentUser] = useState(() => getStoredUser());

    // Trạng thái đóng / mở LoginModal
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    /**
     * Xử lý khi đăng nhập thành công (từ API hoặc từ OAuth Callback)
     */
    const handleLoginSuccess = useCallback((user) => {
        if (!user) return;
        const normalized = {
            id: user.id || user.Id,
            email: user.email || user.Email || '',
            fullName: user.fullName || user.FullName || user.name || user.Name || (user.email || user.Email || '').split('@')[0] || 'User',
            avatarUrl: user.avatarUrl || user.AvatarUrl || '',
            provider: user.provider || user.Provider || 'oauth',
            termsAccepted: user.termsAccepted ?? user.TermsAccepted ?? true,
            token: user.token || user.Token || ''
        };

        try {
            localStorage.setItem('quizcard_user', JSON.stringify(normalized));
        } catch { }

        setCurrentUser(normalized);
        setIsLoginModalOpen(false);
    }, []);

    /**
     * Xử lý đăng xuất tài khoản
     */
    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        try {
            localStorage.removeItem('quizcard_user');
        } catch { }
    }, []);

    /**
     * Lắng nghe và xử lý kết quả đăng nhập OAuth từ Backend Callback (Google / Facebook)
     */
    useEffect(() => {
        const checkAuthCallback = () => {
            const hash = window.location.hash || '';
            if (hash.includes('auth-callback')) {
                try {
                    const queryPart = hash.includes('?') ? hash.split('?')[1] : '';
                    const params = new URLSearchParams(queryPart);
                    const userParam = params.get('user');
                    if (userParam) {
                        const jsonStr = decodeURIComponent(escape(atob(userParam)));
                        const user = JSON.parse(jsonStr);
                        handleLoginSuccess(user);
                        window.location.hash = '#/community';
                    }
                } catch (err) {
                    console.error('Không thể phân tích dữ liệu đăng nhập từ URL:', err);
                }
            } else if (hash.includes('auth_error')) {
                alert('Đăng nhập OAuth không thành công từ nhà cung cấp. Vui lòng thử lại.');
                window.location.hash = '#/community';
            }
        };

        checkAuthCallback();
        window.addEventListener('hashchange', checkAuthCallback);
        return () => window.removeEventListener('hashchange', checkAuthCallback);
    }, [handleLoginSuccess]);

    return {
        currentUser,
        setCurrentUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        handleLoginSuccess,
        handleLogout,
    };
};

export const UseAuth = useAuth;
export default useAuth;
