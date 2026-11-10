import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Settings, Check, X } from 'lucide-react';
import './CookieConsentBar.css';

const COOKIE_STORAGE_KEY = 'quizcard_cookie_consent';

const getInitialPreferences = () => {
  try {
    const savedConsent = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (savedConsent) {
      const parsed = JSON.parse(savedConsent);
      if (parsed?.preferences) {
        return {
          essential: true,
          learning: parsed.preferences.learning ?? true,
          analytics: parsed.preferences.analytics ?? true,
          marketing: parsed.preferences.marketing ?? false,
        };
      }
    }
  } catch {
    // Default fallback
  }
  return {
    essential: true,
    learning: true,
    analytics: true,
    marketing: false,
  };
};

export const CookieConsentBar = () => {
  // Trạng thái hiển thị thanh cookie banner ở dưới màn hình
  const [isVisible, setIsVisible] = useState(false);
  // Trạng thái mở modal tùy chỉnh chi tiết từng loại cookie
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Trạng thái mở modal đọc toàn văn chính sách cookie
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  // Tùy chọn chi tiết từng loại cookie khởi tạo trực tiếp từ localStorage
  const [preferences, setPreferences] = useState(getInitialPreferences);

  // Kiểm tra người dùng mới khi tải ứng dụng
  useEffect(() => {
    try {
      const savedConsent = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!savedConsent) {
        // Người dùng mới chưa có lựa chọn cookie -> hiển thị thanh banner
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  // Lắng nghe sự kiện để người dùng hoặc tester có thể mở lại cài đặt Cookie bất cứ lúc nào
  useEffect(() => {
    const handleReopen = () => {
      setIsVisible(true);
      setIsModalOpen(true);
    };
    window.addEventListener('quizcard:open-cookie-settings', handleReopen);
    return () => window.removeEventListener('quizcard:open-cookie-settings', handleReopen);
  }, []);

  // Xử lý khi bấm "Chấp nhận tất cả"
  const handleAcceptAll = () => {
    const consentData = {
      accepted: true,
      type: 'ALL',
      timestamp: new Date().toISOString(),
      preferences: {
        essential: true,
        learning: true,
        analytics: true,
        marketing: true,
      },
    };
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(consentData));
    } catch {
      console.error('Không thể lưu Cookie Consent');
    }
    setPreferences({
      essential: true,
      learning: true,
      analytics: true,
      marketing: true,
    });
    setIsVisible(false);
    setIsModalOpen(false);
  };

  // Xử lý khi bấm "Chỉ cookie cần thiết" (Từ chối theo dõi tùy chọn)
  const handleEssentialOnly = () => {
    const consentData = {
      accepted: true,
      type: 'ESSENTIAL_ONLY',
      timestamp: new Date().toISOString(),
      preferences: {
        essential: true,
        learning: false,
        analytics: false,
        marketing: false,
      },
    };
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(consentData));
    } catch {
      console.error('Không thể lưu Cookie Consent');
    }
    setPreferences({
      essential: true,
      learning: false,
      analytics: false,
      marketing: false,
    });
    setIsVisible(false);
    setIsModalOpen(false);
  };

  // Xử lý khi lưu tùy chỉnh từ Modal
  const handleSaveCustomPreferences = () => {
    const consentData = {
      accepted: true,
      type: 'CUSTOM',
      timestamp: new Date().toISOString(),
      preferences: {
        ...preferences,
        essential: true, // Luôn đảm bảo bật
      },
    };
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(consentData));
    } catch {
      console.error('Không thể lưu Cookie Consent');
    }
    setIsVisible(false);
    setIsModalOpen(false);
  };

  // Cho phép tester đặt lại trạng thái người dùng mới để kiểm thử
  const handleResetForTesting = () => {
    try {
      localStorage.removeItem(COOKIE_STORAGE_KEY);
      setIsVisible(true);
      alert('Đã xóa dữ liệu Cookie Consent! Bạn đang ở trạng thái Người Dùng Mới.');
    } catch {
      console.error('Không thể đặt lại Cookie');
    }
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. Thanh Cookie Consent Banner nằm ở dưới cùng màn hình      */}
      {/* ------------------------------------------------------------- */}
      {isVisible && (
        <aside
          role="region"
          aria-label="Chính sách sử dụng Cookie"
          className="qc-cookie-banner"
        >
          <div className="qc-cookie-banner-inner">
            {/* Cột bên trái: Biểu tượng & Nội dung giải thích */}
            <div className="qc-cookie-content">
              <div className="qc-cookie-icon-wrapper" aria-hidden="true">
                <span className="qc-cookie-emoji">🍪</span>
              </div>
              <div className="qc-cookie-text">
                <div className="qc-cookie-heading-row">
                  <h4 className="qc-cookie-heading">
                    Chính sách Thu thập &amp; Sử dụng Cookie
                  </h4>
                  <span className="qc-cookie-badge-new">Dành cho người dùng mới</span>
                </div>
                <p className="qc-cookie-desc">
                  Trang web <strong>QuizCard</strong> sử dụng cookie và bộ nhớ cục bộ để nâng cao trải nghiệm học tập,
                  lưu trữ tiến độ thuật toán ghi nhớ lặp lại ngắt quãng (Spaced Repetition SM-2), duy trì chuỗi lửa ngày học (Streak),
                  và phân tích hiệu năng nhằm mang lại dịch vụ tốt nhất cho bạn.
                  {' '}
                  <button
                    type="button"
                    className="qc-cookie-policy-link"
                    onClick={() => setIsPolicyModalOpen(true)}
                  >
                    Xem chi tiết chính sách
                  </button>
                </p>
              </div>
            </div>

            {/* Cột bên phải: Nhóm các nút hành động */}
            <div className="qc-cookie-actions">
              <button
                type="button"
                className="qc-cookie-btn qc-cookie-btn-accept"
                onClick={handleAcceptAll}
                title="Chấp nhận tất cả cookie để trải nghiệm đầy đủ tính năng"
              >
                <Check size={16} />
                <span>Chấp nhận tất cả</span>
              </button>

              <button
                type="button"
                className="qc-cookie-btn qc-cookie-btn-decline"
                onClick={handleEssentialOnly}
                title="Chỉ cho phép các cookie cần thiết để ứng dụng hoạt động"
              >
                <span>Chỉ cookie cần thiết</span>
              </button>

              <button
                type="button"
                className="qc-cookie-btn qc-cookie-btn-customize"
                onClick={() => setIsModalOpen(true)}
                title="Tự chọn các loại dữ liệu cookie muốn chia sẻ"
              >
                <Settings size={15} />
                <span>Tùy chỉnh</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. Modal Tùy Chỉnh Chi Tiết Từng Loại Cookie                  */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="qc-cookie-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="qc-cookie-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qc-cookie-modal-header">
              <div className="qc-cookie-modal-title-group">
                <Cookie size={22} color="#0284c7" />
                <h3 id="cookie-modal-title">Cài Đặt Tùy Chọn Cookie &amp; Quyền Riêng Tư</h3>
              </div>
              <button
                type="button"
                className="qc-cookie-modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <p className="qc-cookie-modal-intro">
              Bạn có toàn quyền kiểm soát dữ liệu của mình. Dưới đây là các loại cookie QuizCard sử dụng.
              Bạn có thể bật hoặc tắt theo ý muốn, ngoại trừ các cookie thiết yếu để hệ thống vận hành.
            </p>

            <div className="qc-cookie-options-list">
              {/* Option 1: Essential Cookies */}
              <div className="qc-cookie-option-card disabled">
                <div className="qc-cookie-option-info">
                  <div className="qc-cookie-option-header">
                    <span className="qc-cookie-option-title">1. Cookie Thiết Yếu (Bắt buộc)</span>
                    <span className="qc-cookie-pill-required">Luôn hoạt động</span>
                  </div>
                  <p className="qc-cookie-option-desc">
                    Cần thiết để website hoạt động ổn định, xác thực tài khoản đăng nhập, bảo vệ CSRF và lưu trạng thái chuyển hướng trang.
                  </p>
                </div>
                <div className="qc-cookie-toggle">
                  <input type="checkbox" checked={true} disabled aria-label="Cookie thiết yếu" />
                  <span className="qc-toggle-slider locked"></span>
                </div>
              </div>

              {/* Option 2: Learning & Spaced Repetition */}
              <div className="qc-cookie-option-card">
                <div className="qc-cookie-option-info">
                  <div className="qc-cookie-option-header">
                    <span className="qc-cookie-option-title">2. Cookie Học Tập &amp; Spaced Repetition</span>
                    <span className="qc-cookie-pill-recommended">Khuyên dùng</span>
                  </div>
                  <p className="qc-cookie-option-desc">
                    Lưu trữ cục bộ các thẻ flashcard đã thành thạo, chuỗi ngày học liên tục (Streak),
                    và thời điểm nhắc nhở ôn bài để tối ưu hóa khả năng ghi nhớ dài hạn.
                  </p>
                </div>
                <label className="qc-cookie-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.learning}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, learning: e.target.checked }))
                    }
                    aria-label="Cookie học tập"
                  />
                  <span className="qc-toggle-slider"></span>
                </label>
              </div>

              {/* Option 3: Analytics */}
              <div className="qc-cookie-option-card">
                <div className="qc-cookie-option-info">
                  <div className="qc-cookie-option-header">
                    <span className="qc-cookie-option-title">3. Cookie Phân Tích &amp; Hiệu Năng</span>
                  </div>
                  <p className="qc-cookie-option-desc">
                    Thu thập số liệu ẩn danh về tốc độ tải trang, lỗi kỹ thuật và các thao tác phổ biến
                    để đội ngũ phát triển cải tiến giao diện người dùng QuizCard.
                  </p>
                </div>
                <label className="qc-cookie-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                    }
                    aria-label="Cookie phân tích"
                  />
                  <span className="qc-toggle-slider"></span>
                </label>
              </div>

              {/* Option 4: Personalization */}
              <div className="qc-cookie-option-card">
                <div className="qc-cookie-option-info">
                  <div className="qc-cookie-option-header">
                    <span className="qc-cookie-option-title">4. Cookie Cá Nhân Hóa &amp; Đề Xuất</span>
                  </div>
                  <p className="qc-cookie-option-desc">
                    Gợi ý các bộ thẻ cộng đồng và video bài giảng liên quan tới chủ đề bạn thường xuyên ôn tập.
                  </p>
                </div>
                <label className="qc-cookie-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))
                    }
                    aria-label="Cookie cá nhân hóa"
                  />
                  <span className="qc-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="qc-cookie-modal-footer">
              <button
                type="button"
                className="qc-cookie-btn qc-cookie-btn-decline"
                onClick={handleResetForTesting}
                title="Xóa lựa chọn và quay về chế độ người dùng mới (Dành cho kiểm thử)"
              >
                Đặt lại (Thử nghiệm)
              </button>

              <div className="qc-cookie-modal-footer-right">
                <button
                  type="button"
                  className="qc-cookie-btn qc-cookie-btn-decline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="qc-cookie-btn qc-cookie-btn-accept"
                  onClick={handleSaveCustomPreferences}
                >
                  <Check size={16} />
                  <span>Lưu Tùy Chọn Của Tôi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. Modal Đọc Chi Tiết Chính Sách Cookie                       */}
      {/* ------------------------------------------------------------- */}
      {isPolicyModalOpen && (
        <div className="qc-cookie-modal-overlay" onClick={() => setIsPolicyModalOpen(false)}>
          <div
            className="qc-cookie-modal qc-policy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-policy-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qc-cookie-modal-header">
              <div className="qc-cookie-modal-title-group">
                <ShieldCheck size={22} color="#16a34a" />
                <h3 id="cookie-policy-title">Chính Sách Thu Thập &amp; Bảo Vệ Dữ Liệu Cookie</h3>
              </div>
              <button
                type="button"
                className="qc-cookie-modal-close"
                onClick={() => setIsPolicyModalOpen(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="qc-policy-body">
              <h4>1. Mục đích thu thập</h4>
              <p>
                QuizCard chỉ thu thập và lưu trữ các giá trị cookie và local storage cần thiết để phục vụ
                việc học tập của bạn: duy trì trạng thái đăng nhập, bộ lọc chủ đề yêu thích, và lịch trình
                ôn tập ngắt quãng (SM-2).
              </p>

              <h4>2. Quyền riêng tư của bạn</h4>
              <p>
                Chúng tôi tuyệt đối không chia sẻ hoặc bán dữ liệu học tập cá nhân cho bất kỳ bên thứ ba
                nào nhằm mục đích quảng cáo thương mại.
              </p>

              <h4>3. Cách xóa và quản lý cookie</h4>
              <p>
                Bạn có thể thay đổi tùy chọn bất cứ lúc nào bằng cách bấm nút <strong>"Cài đặt Cookie"</strong> ở chân trang
                hoặc xóa lịch sử duyệt web trong trình duyệt của bạn.
              </p>
            </div>

            <div className="qc-cookie-modal-footer">
              <button
                type="button"
                className="qc-cookie-btn qc-cookie-btn-accept"
                style={{ marginLeft: 'auto' }}
                onClick={() => setIsPolicyModalOpen(false)}
              >
                Đã hiểu &amp; Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
