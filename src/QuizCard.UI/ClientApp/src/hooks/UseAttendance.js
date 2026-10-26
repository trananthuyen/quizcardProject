import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

/**
 * Custom Hook useAttendance:
 * Quản lý trạng thái điểm danh, chuỗi lửa (streak), năng lượng học tập (energy) và hành động điểm danh hàng ngày.
 *
 * @param {object|null} currentUser - Người dùng hiện tại (nếu có).
 * @param {function} onRequireLogin - Hàm gọi khi người dùng chưa đăng nhập mà bấm điểm danh.
 */
export const useAttendance = (currentUser, onRequireLogin) => {
    // Trạng thái điểm danh, chuỗi lửa và năng lượng học tập
    const [attendanceStatus, setAttendanceStatus] = useState({
        currentStreak: 0,
        longestStreak: 0,
        energyPoints: 0,
        hasCheckedInToday: false,
        lastCheckInDate: null,
        checkedInDates: []
    });

    /**
     * Tải thông tin chuỗi lửa và lịch sử điểm danh từ Backend
     */
    const loadAttendance = useCallback(async () => {
        try {
            const userId = currentUser?.id || currentUser?.Id;
            const status = await api.getAttendanceStatus(userId);
            if (status) {
                setAttendanceStatus(status);
            }
        } catch (err) {
            console.warn('Không thể tải trạng thái điểm danh:', err);
        }
    }, [currentUser]);

    // Tự động tải lại thông tin điểm danh khi người dùng thay đổi (đăng nhập / đăng xuất)
    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    /**
     * Xử lý điểm danh hàng ngày:
     * - Nếu chưa đăng nhập: yêu cầu đăng nhập (gọi onRequireLogin).
     * - Nếu đã đăng nhập: gọi API checkIn, thông báo kết quả và cập nhật lại chuỗi lửa.
     */
    const handleCheckIn = useCallback(async () => {
        const userId = currentUser?.id || currentUser?.Id;
        if (!userId) {
            if (onRequireLogin) onRequireLogin();
            return;
        }

        try {
            const result = await api.checkIn(userId);
            if (result) {
                alert(result.message);
                await loadAttendance();
            }
        } catch (err) {
            if (err.status === 401 || err.status === 403 || err.message?.includes('đăng nhập')) {
                if (onRequireLogin) onRequireLogin();
            }
            alert(err.message || 'Lỗi khi điểm danh');
        }
    }, [currentUser, onRequireLogin, loadAttendance]);

    return {
        attendanceStatus,
        setAttendanceStatus,
        loadAttendance,
        handleCheckIn,
    };
};

export const UseAttendance = useAttendance;
export default useAttendance;
