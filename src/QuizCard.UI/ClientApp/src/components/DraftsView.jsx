import React, { useState, useMemo } from 'react';
import { Flame, Zap, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, Trophy, Lock, Sparkles, Award } from 'lucide-react';
import './DraftsView.css';

// Danh sách các mốc thành tựu chuỗi ngày và phần thưởng tia sét (⚡) tương ứng
const STREAK_ACHIEVEMENTS = [
    {
        days: 3,
        name: 'Khởi Đầu Rực Cháy',
        desc: 'Điểm danh liên tiếp 3 ngày',
        reward: 1,
        icon: '🔥',
        color: '#f97316',
        bg: '#fff7ed',
        border: '#fed7aa',
    },
    {
        days: 5,
        name: 'Bền Bỉ Thắp Lửa',
        desc: 'Điểm danh liên tiếp 5 ngày',
        reward: 2,
        icon: '⚡',
        color: '#eab308',
        bg: '#fefce8',
        border: '#fef08a',
    },
    {
        days: 7,
        name: 'Chiến Binh Tuần',
        desc: 'Chuỗi 7 ngày (1 tuần trọn vẹn)',
        reward: 3,
        icon: '🌟',
        color: '#3b82f6',
        bg: '#eff6ff',
        border: '#bfdbfe',
    },
    {
        days: 10,
        name: 'Kiên Định Vững Vàng',
        desc: 'Chuỗi 10 ngày không ngắt quãng',
        reward: 5,
        icon: '🛡️',
        color: '#8b5cf6',
        bg: '#f5f3ff',
        border: '#ddd6fe',
    },
    {
        days: 14,
        name: 'Thói Quen Thép',
        desc: 'Chuỗi 14 ngày (2 tuần liên tiếp)',
        reward: 8,
        icon: '⚔️',
        color: '#06b6d4',
        bg: '#ecfeff',
        border: '#a5f3fc',
    },
    {
        days: 21,
        name: 'Bậc Thầy Kỷ Luật',
        desc: 'Chuỗi 21 ngày hình thành thói quen',
        reward: 12,
        icon: '💎',
        color: '#10b981',
        bg: '#ecfdf5',
        border: '#a7f3d0',
    },
    {
        days: 30,
        name: 'Huyền Thoại 1 Tháng',
        desc: 'Chuỗi 30 ngày kiên trì phi thường',
        reward: 20,
        icon: '👑',
        color: '#ec4899',
        bg: '#fdf2f8',
        border: '#fbcfe8',
    },
    {
        days: 60,
        name: 'Bất Diệt Nhiệt Huyết',
        desc: 'Chuỗi 60 ngày chinh phục mọi giới hạn',
        reward: 35,
        icon: '🌌',
        color: '#6366f1',
        bg: '#eef2ff',
        border: '#c7d2fe',
    },
    {
        days: 100,
        name: 'Thần Thoại Tối Thượng',
        desc: 'Chuỗi 100 ngày đỉnh cao thói quen',
        reward: 50,
        icon: '⚡',
        color: '#f59e0b',
        bg: '#fffbeb',
        border: '#fde68a',
    },
];

export const DraftsView = ({
    currentUser,
    onOpenLoginModal,
    attendanceStatus,
    onCheckIn,
}) => {
    // Ngày hiện tại
    const today = useMemo(() => new Date(), []);
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const [, setSelectedDateInfo] = useState(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    // Lấy thông tin tháng và năm đang xem
    const viewYear = currentMonthDate.getFullYear();
    const viewMonth = currentMonthDate.getMonth(); // 0 - 11

    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const prevMonth = () => {
        setCurrentMonthDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonthDate(new Date(viewYear, viewMonth + 1, 1));
    };

    const goToToday = () => {
        setCurrentMonthDate(new Date());
    };

    // Chuẩn bị danh sách ngày trong tháng
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
        const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

        // Thứ trong tuần của ngày 1 (Chuyển sang định dạng Thứ Hai = 0 ... Chủ Nhật = 6)
        let firstDayOfWeek = firstDayOfMonth.getDay() - 1;
        if (firstDayOfWeek === -1) firstDayOfWeek = 6;

        const totalDays = lastDayOfMonth.getDate();
        const days = [];

        // Các ô trống đầu tháng
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push({ day: null, dateStr: null, isCurrentMonth: false });
        }

        // Các ngày trong tháng
        for (let day = 1; day <= totalDays; day++) {
            const m = String(viewMonth + 1).padStart(2, '0');
            const d = String(day).padStart(2, '0');
            const dateStr = `${viewYear}-${m}-${d}`;

            const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === day;

            const isPast = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            days.push({
                day,
                dateStr,
                isCurrentMonth: true,
                isToday,
                isPast,
            });
        }

        return days;
    }, [viewYear, viewMonth, today]);

    // Tập hợp các ngày đã điểm danh để tra cứu O(1)
    const checkedInDateSet = useMemo(() => {
        return new Set(attendanceStatus?.checkedInDates || []);
    }, [attendanceStatus?.checkedInDates]);

    // Đếm số ngày đã điểm danh trong tháng đang xem
    const checkInCountThisMonth = useMemo(() => {
        const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
        return (attendanceStatus?.checkedInDates || []).filter(d => d.startsWith(prefix)).length;
    }, [attendanceStatus?.checkedInDates, viewYear, viewMonth]);

    const currentStreak = attendanceStatus?.currentStreak || 0;
    const longestStreak = attendanceStatus?.longestStreak || 0;
    const effectiveStreak = Math.max(currentStreak, longestStreak);

    // Tìm mốc thưởng tiếp theo
    const nextMilestone = useMemo(() => {
        return STREAK_ACHIEVEMENTS.find(m => m.days > currentStreak) || null;
    }, [currentStreak]);

    const handlePerformCheckIn = async () => {
        if (!currentUser) {
            onOpenLoginModal?.();
            return;
        }
        if (attendanceStatus?.hasCheckedInToday || isCheckingIn) return;
        setIsCheckingIn(true);
        try {
            await onCheckIn();
        } finally {
            setIsCheckingIn(false);
        }
    };

    return (
        <div className="qc-drafts-container">
            {/* 1. KHU VỰC THÔNG TIN CHUỖI LỬA & NÚT ĐIỂM DANH */}
            <div className="qc-streak-card">
                <div className="qc-streak-header">
                    <div className="qc-streak-title-col">
                        <div className="qc-streak-badge-row">
                            <span className="qc-streak-pill-flame">
                                <Flame size={17} className="qc-flame-icon-pulse" />
                                <strong>{currentStreak} ngày</strong> liên tục
                            </span>
                            <span className="qc-energy-pill">
                                <Zap size={15} />
                                <strong>{attendanceStatus?.energyPoints || 20}</strong> Tia sét
                            </span>
                            <span className="qc-trophy-pill">
                                <Trophy size={15} />
                                Kỷ lục: <strong>{longestStreak} ngày</strong>
                            </span>
                        </div>
                        <h2 className="qc-streak-title">Điểm Danh & Duy Trì Chuỗi Lửa</h2>
                        <p className="qc-streak-desc">
                            Mỗi ngày điểm danh để giữ ngọn lửa không tắt. Điểm danh vào các <strong>mốc chuỗi ngày nhất định (3, 5, 7, 10,...)</strong> sẽ nhận thưởng tia sét (⚡) để gia tăng năng lượng học tập!
                        </p>
                    </div>

                    <div className="qc-streak-action-col">
                        {attendanceStatus?.hasCheckedInToday ? (
                            <button type="button" className="qc-checkin-btn-done" disabled title="Hôm nay bạn đã điểm danh thành công">
                                <Check size={18} strokeWidth={2.5} />
                                <span>Đã điểm danh hôm nay</span>
                            </button>
                        ) : !currentUser ? (
                            <button
                                type="button"
                                className="qc-checkin-btn-active"
                                onClick={handlePerformCheckIn}
                                title="Bạn chưa đăng nhập. Bấm để đăng nhập và bắt đầu chuỗi lửa!"
                            >
                                <Flame size={18} className="qc-flame-bounce" />
                                <span>Đăng nhập để điểm danh</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                className={`qc-checkin-btn-active ${isCheckingIn ? 'loading' : ''}`}
                                onClick={handlePerformCheckIn}
                                disabled={isCheckingIn}
                                title="Bấm để điểm danh ngay và giữ chuỗi lửa!"
                            >
                                <Flame size={18} className="qc-flame-bounce" />
                                <span>{isCheckingIn ? 'Đang điểm danh...' : 'Điểm Danh Giữ Lửa Ngay'}</span>
                            </button>
                        )}
                        <span className="qc-checkin-note">
                            {!currentUser
                                ? '🔒 Vui lòng đăng nhập tài khoản để điểm danh và mở khóa phần thưởng!'
                                : attendanceStatus?.hasCheckedInToday
                                    ? '🔥 Chuỗi lửa của bạn đang được bảo vệ an toàn!'
                                    : nextMilestone
                                        ? `⚡ Mốc thưởng kế tiếp: Chuỗi ${nextMilestone.days} ngày (+${nextMilestone.reward} tia sét)`
                                        : '⚠️ Đừng để tắt ngọn lửa! Điểm danh trước 23:59 hôm nay.'}
                        </span>
                    </div>
                </div>

                {/* 2. BỘ LỊCH THÁNG ĐIỂM DANH (ĐÃ ĐƯỢC GIẢM KÍCH CỠ NHỎ GỌN TINH TẾ) */}
                <div className="qc-calendar-wrapper qc-calendar-compact">
                    <div className="qc-calendar-topbar">
                        <div className="qc-cal-nav-left">
                            <CalendarIcon size={16} className="qc-cal-icon-primary" />
                            <h3 className="qc-cal-month-title">
                                {monthNames[viewMonth]}, Năm {viewYear}
                            </h3>
                            <button type="button" className="qc-cal-today-btn" onClick={goToToday} title="Quay lại tháng hiện tại">
                                Hôm nay
                            </button>
                        </div>

                        <div className="qc-cal-nav-right">
                            <span className="qc-cal-stats-badge">
                                Đã điểm danh: <strong>{checkInCountThisMonth} ngày</strong>
                            </span>
                            <div className="qc-cal-arrows">
                                <button type="button" className="qc-cal-arrow-btn" onClick={prevMonth} aria-label="Tháng trước">
                                    <ChevronLeft size={16} />
                                </button>
                                <button type="button" className="qc-cal-arrow-btn" onClick={nextMonth} aria-label="Tháng sau">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lưới lịch 7 ngày nhỏ gọn */}
                    <div className="qc-calendar-grid">
                        {/* Hàng tiêu đề thứ trong tuần */}
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dayName, idx) => (
                            <div key={idx} className="qc-cal-weekday-header">
                                {dayName}
                            </div>
                        ))}

                        {/* Các ô ngày trong tháng */}
                        {calendarDays.map((item, index) => {
                            if (!item.isCurrentMonth) {
                                return <div key={index} className="qc-cal-cell empty"></div>;
                            }

                            const isChecked = checkedInDateSet.has(item.dateStr);

                            return (
                                <div
                                    key={index}
                                    className={`qc-cal-cell ${item.isToday ? 'today' : ''} ${isChecked ? 'checked-in' : ''} ${item.isPast && !isChecked ? 'missed' : ''}`}
                                    onClick={() => {
                                        setSelectedDateInfo({
                                            dateStr: item.dateStr,
                                            day: item.day,
                                            isChecked,
                                            isToday: item.isToday,
                                        });
                                    }}
                                    title={`Ngày ${item.dateStr}: ${isChecked ? 'Đã điểm danh giữ lửa 🔥' : item.isToday ? 'Chưa điểm danh hôm nay' : 'Chưa điểm danh'}`}
                                >
                                    <span className="qc-cal-day-num">{item.day}</span>
                                    {isChecked && (
                                        <div className="qc-cal-flame-badge" title="Đã điểm danh giữ lửa">
                                            <Flame size={12} fill="#f97316" color="#ea580c" />
                                        </div>
                                    )}
                                    {item.isToday && !isChecked && (
                                        <span className="qc-cal-today-dot" title="Hôm nay"></span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Chú giải lịch (Legend) */}
                    <div className="qc-calendar-legend">
                        <div className="qc-legend-item">
                            <span className="qc-legend-box flame">
                                <Flame size={11} fill="#ea580c" color="#ea580c" />
                            </span>
                            <span>Đã điểm danh ({attendanceStatus?.checkedInDates?.length || 0} ngày)</span>
                        </div>
                        <div className="qc-legend-item">
                            <span className="qc-legend-box today"></span>
                            <span>Hôm nay</span>
                        </div>
                        <div className="qc-legend-item">
                            <span className="qc-legend-box future"></span>
                            <span>Chưa đến ngày</span>
                        </div>
                    </div>
                </div>

                {/* 3. DANH SÁCH CÁC HUY HIỆU THÀNH TỰU & PHẦN THƯỞNG TIA SÉT (⚡) */}
                <div className="qc-achievements-container">
                    <div className="qc-achievements-header">
                        <div className="qc-achievements-title-row">
                            <Award size={20} className="qc-achievements-icon" />
                            <h3 className="qc-achievements-title">Huy Hiệu Thành Tựu & Mốc Thưởng Tia Sét</h3>
                        </div>
                        <p className="qc-achievements-desc">
                            Đạt các mốc chuỗi ngày điểm danh để nhận ngay điểm thưởng tia sét (⚡) tương ứng!
                        </p>
                    </div>

                    <div className="qc-achievements-grid">
                        {STREAK_ACHIEVEMENTS.map((item) => {
                            const isUnlocked = effectiveStreak >= item.days;
                            const isCurrentGoal = !isUnlocked && nextMilestone?.days === item.days;
                            const progressPercent = Math.min(100, Math.round((currentStreak / item.days) * 100));

                            return (
                                <div
                                    key={item.days}
                                    className={`qc-badge-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrentGoal ? 'current-goal' : ''}`}
                                    style={{
                                        '--badge-color': item.color,
                                        '--badge-bg': item.bg,
                                        '--badge-border': item.border,
                                    }}
                                >
                                    <div className="qc-badge-card-top">
                                        <div className="qc-badge-icon-box">
                                            <span className="qc-badge-emoji">{item.icon}</span>
                                        </div>
                                        <div className="qc-badge-reward-pill" title={`Thưởng +${item.reward} điểm năng lượng tia sét`}>
                                            <Zap size={14} className="qc-zap-shimmer" />
                                            <span>+{item.reward} tia sét</span>
                                        </div>
                                    </div>

                                    <div className="qc-badge-card-body">
                                        <h4 className="qc-badge-name">{item.name}</h4>
                                        <p className="qc-badge-desc">{item.desc}</p>
                                    </div>

                                    <div className="qc-badge-card-footer">
                                        {isUnlocked ? (
                                            <div className="qc-badge-status-unlocked">
                                                <Check size={14} strokeWidth={3} />
                                                <span>Đã đạt được</span>
                                            </div>
                                        ) : (
                                            <div className="qc-badge-progress-col">
                                                <div className="qc-badge-progress-bar">
                                                    <div
                                                        className="qc-badge-progress-fill"
                                                        style={{ width: `${progressPercent}%`, backgroundColor: item.color }}
                                                    />
                                                </div>
                                                <div className="qc-badge-progress-text">
                                                    <span className="qc-badge-lock-tag">
                                                        <Lock size={11} />
                                                        {currentStreak}/{item.days} ngày
                                                    </span>
                                                    <span className="qc-badge-remain-tag">
                                                        (còn {item.days - currentStreak} ngày)
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
