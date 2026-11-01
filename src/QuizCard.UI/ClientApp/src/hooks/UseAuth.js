import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

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
 * Hàm giải mã chuỗi Base64 UTF-8 an toàn:
 * - Hỗ trợ cả khi '+' bị biến thành ' ' bởi URLSearchParams
 * - Tự động bổ sung padding '=' nếu bị thiếu
 * - Dùng TextDecoder('utf-8') giải mã tiếng Việt chuẩn xác tuyệt đối, tránh lỗi URI malformed
 */
export const parseSafeBase64Json = (base64Str) => {
    if (!base64Str) return null;
    try {
        let clean = decodeURIComponent(base64Str).trim();
        clean = clean.replace(/ /g, '+');
        while (clean.length % 4 !== 0) {
            clean += '=';
        }

        try {
            const binary = atob(clean);
            const bytes = Uint8Array.from(binary, (m) => m.charCodeAt(0));
            const jsonStr = new TextDecoder('utf-8').decode(bytes);
            return JSON.parse(jsonStr);
        } catch {
            const jsonStr = decodeURIComponent(escape(atob(clean)));
            return JSON.parse(jsonStr);
        }
    } catch (err) {
        console.error('Lỗi khi giải mã Base64 JSON người dùng:', err);
        return null;
    }
};

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
    const handleLogout = useCallback(async () => {
        setCurrentUser(null);
        try {
            localStorage.removeItem('quizcard_user');
        } catch { }
        try {
            await api.logout();
        } catch { }
    }, []);

    /**
     * Lắng nghe và xử lý kết quả đăng nhập OAuth từ Backend Callback (Google / Facebook),
     * đồng thời tự động khôi phục phiên làm việc từ Cookie máy chủ nếu cần.
     */
    useEffect(() => {
        const checkAuthCallback = () => {
            const hash = window.location.hash || '';
            const search = window.location.search || '';
            const fullUrl = window.location.href || '';

            if (hash.includes('auth-callback') || search.includes('user=') || fullUrl.includes('auth-callback')) {
                try {
                    let userParam = null;
                    if (hash.includes('?')) {
                        const hashParams = new URLSearchParams(hash.split('?')[1]);
                        userParam = hashParams.get('user');
                    }
                    if (!userParam && search) {
                        const searchParams = new URLSearchParams(search);
                        userParam = searchParams.get('user');
                    }

                    if (userParam) {
                        const user = parseSafeBase64Json(userParam);
                        if (user) {
                            handleLoginSuccess(user);
                            if (window.history?.replaceState) {
                                window.history.replaceState(null, '', window.location.pathname + '#/community');
                            } else {
                                window.location.hash = '#/community';
                            }
                            return;
                        }
                    }
                } catch (err) {
                    console.error('Không thể phân tích dữ liệu đăng nhập từ URL:', err);
                }
            } else if (hash.includes('auth_error') || search.includes('auth_error')) {
                alert('Đăng nhập OAuth không thành công từ nhà cung cấp. Vui lòng thử lại.');
                window.location.hash = '#/community';
            } else if (search.includes('ReturnUrl') || search.includes('login') || hash.includes('login')) {
                setIsLoginModalOpen(true);
            }
        };

        checkAuthCallback();

        // Đồng bộ và khôi phục thông tin phiên người dùng từ máy chủ (Cookie Session)
        api.getCurrentUser().then((serverUser) => {
            if (serverUser && (serverUser.id || serverUser.Id)) {
                handleLoginSuccess(serverUser);
            }
        }).catch(() => { });

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
