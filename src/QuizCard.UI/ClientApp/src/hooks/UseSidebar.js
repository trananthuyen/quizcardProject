import { useState, useEffect, useCallback } from 'react';

/**
 * Custom Hook useSidebar:
 * Quản lý trạng thái đóng / mở thanh Sidebar:
 * - Đọc và lưu trạng thái vào localStorage ('quizcard_sidebar_open').
 * - Cung cấp hàm toggleSidebar chuyển đổi trạng thái đóng / mở.
 * - Lắng nghe phím tắt bàn phím toàn cục Ctrl+B (hoặc Cmd+B) để đóng/mở nhanh.
 *
 * @param {boolean} [initialDefault=true] - Trạng thái mặc định ban đầu
 * @returns {{
 *   isSidebarOpen: boolean,
 *   setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>,
 *   toggleSidebar: () => void,
 * }}
 */
export const useSidebar = (initialDefault = true) => {
    // Trạng thái đóng / mở sidebar (lưu lựa chọn vào localStorage)
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        try {
            const saved = localStorage.getItem('quizcard_sidebar_open');
            return saved !== null ? saved === 'true' : initialDefault;
        } catch {
            return initialDefault;
        }
    });

    /**
     * Chuyển đổi trạng thái đóng / mở và cập nhật vào localStorage
     */
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('quizcard_sidebar_open', String(next));
            } catch { }
            return next;
        });
    }, []);

    /**
     * Hỗ trợ phím tắt bàn phím Ctrl+B để đóng/mở sidebar
     */
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                toggleSidebar();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    return {
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
    };
};

export const UseSidebar = useSidebar;
export default useSidebar;

