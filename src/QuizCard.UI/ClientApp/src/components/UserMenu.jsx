import React, { useEffect, useRef, useState } from 'react';
import { AppWindow, SlidersHorizontal, Download, Plus, LogOut, ChevronRight, Check, LogIn } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const UserMenu = ({
  isOpen,
  onClose,
  avatarUrl,
  userName,
  userEmail,
  isLoggedIn = false,
  onOpenLoginModal,
  onLogout,
}) => {
  const menuRef = useRef(null);
  const { themeMode, setThemeMode } = useTheme();
  const [isThemeSubmenuOpen, setIsThemeSubmenuOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsThemeSubmenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsThemeSubmenuOpen(false);
    }, 280); // 280ms grace period so user can comfortably move mouse to submenu
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsThemeSubmenuOpen(false);
      return;
    }

    // Đóng menu khi nhấp chuột ra ngoài
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
        setIsThemeSubmenuOpen(false);
      }
    };

    // Đóng menu khi bấm phím ESC
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isThemeSubmenuOpen) {
          setIsThemeSubmenuOpen(false);
        }
        else {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isThemeSubmenuOpen]);

  if (!isOpen)
    return null;

  return (
    <div className="qc-user-menu-popover" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      {/* 1. Profile Header */}
      <div
        className="qc-user-menu-header"
        onClick={() => {
          if (!isLoggedIn) {
            onOpenLoginModal?.();
            onClose();
          }
        }}
        style={{ cursor: !isLoggedIn ? 'pointer' : 'default' }}
        title={!isLoggedIn ? 'Bấm để đăng nhập' : userName}
      >
        <div className="qc-user-menu-avatar-large">
          <img
            src={avatarUrl}
            alt={userName}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="qc-user-menu-name" title={userName}>
          {userName}
        </div>
        <div className="qc-user-menu-email">
          {isLoggedIn && userEmail ? userEmail : (isLoggedIn ? userName : 'Chưa đăng nhập')}
        </div>
      </div>

      <div className="qc-user-menu-divider" />

      {/* 2. Menu Mục Cài đặt & Tùy chọn */}
      <div className="qc-user-menu-list">
        {/* Nút Change theme với Submenu Popover bên phải */}
        <div className="qc-theme-menu-wrapper" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <button
            type="button"
            className={`qc-user-menu-item ${isThemeSubmenuOpen ? 'active-sub' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsThemeSubmenuOpen((prev) => !prev);
            }}
            title="Đổi giao diện: Sáng, Tối, hoặc Theo hệ thống"
          >
            <AppWindow size={16} className="qc-user-menu-icon" />
            <span className="qc-user-menu-label">Change theme</span>
            <ChevronRight size={14} className="qc-user-menu-chevron" />
          </button>

          {/* Submenu Popover lựa chọn: Light / Dark / System theme */}
          {isThemeSubmenuOpen && (
            <div
              className="qc-theme-submenu-popover"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={`qc-theme-sub-item ${themeMode === 'light' ? 'selected' : ''}`}
                onClick={() => {
                  setThemeMode('light');
                  setIsThemeSubmenuOpen(false);
                }}
              >
                <span className="qc-theme-check-box">
                  {themeMode === 'light' && <Check size={14} strokeWidth={2.5} />}
                </span>
                <span>Light</span>
              </button>

              <button
                type="button"
                className={`qc-theme-sub-item ${themeMode === 'dark' ? 'selected' : ''}`}
                onClick={() => {
                  setThemeMode('dark');
                  setIsThemeSubmenuOpen(false);
                }}
              >
                <span className="qc-theme-check-box">
                  {themeMode === 'dark' && <Check size={14} strokeWidth={2.5} />}
                </span>
                <span>Dark</span>
              </button>

              <button
                type="button"
                className={`qc-theme-sub-item ${themeMode === 'system' ? 'selected' : ''}`}
                onClick={() => {
                  setThemeMode('system');
                  setIsThemeSubmenuOpen(false);
                }}
              >
                <span className="qc-theme-check-box">
                  {themeMode === 'system' && <Check size={14} strokeWidth={2.5} />}
                </span>
                <span>System theme</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="qc-user-menu-item"
          onClick={() => {
            alert('Cài đặt tài khoản (Settings)');
            onClose();
          }}
        >
          <SlidersHorizontal size={16} className="qc-user-menu-icon" />
          <span className="qc-user-menu-label">Settings</span>
        </button>

        <button
          type="button"
          className="qc-user-menu-item"
          onClick={() => {
            alert('Tải ứng dụng Desktop (Get desktop app)');
            onClose();
          }}
        >
          <Download size={16} className="qc-user-menu-icon" />
          <span className="qc-user-menu-label">Get desktop app</span>
        </button>
      </div>

      <div className="qc-user-menu-divider" />

      {/* 3. Hồ sơ cộng đồng (Community Profile) */}
      {isLoggedIn && (
        <>
          <div className="qc-user-menu-list">
            <button
              type="button"
              className="qc-user-menu-item qc-user-menu-community-item"
              onClick={() => {
                alert('Tạo hồ sơ cộng đồng (Create a community profile)');
                onClose();
              }}
            >
              <div className="qc-user-menu-avatar-small">
                <img src={avatarUrl} alt={userName} />
              </div>
              <div className="qc-user-menu-community-col">
                <span className="qc-user-menu-community-title">Create a community profile</span>
                <span className="qc-user-menu-community-email">{userEmail}</span>
              </div>
            </button>
          </div>
          <div className="qc-user-menu-divider" />
        </>
      )}

      {/* 4. Tài khoản & Đăng nhập / Đăng xuất */}
      <div className="qc-user-menu-list">
        {isLoggedIn ? (
          <>
            <button
              type="button"
              className="qc-user-menu-item"
              onClick={() => {
                onOpenLoginModal?.();
                onClose();
              }}
            >
              <Plus size={16} className="qc-user-menu-icon" />
              <span className="qc-user-menu-label">Chuyển tài khoản (Switch account)</span>
            </button>
            <button
              type="button"
              className="qc-user-menu-item"
              onClick={() => {
                onLogout?.();
                onClose();
              }}
            >
              <LogOut size={16} className="qc-user-menu-icon" />
              <span className="qc-user-menu-label">Log out</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            className="qc-user-menu-item"
            style={{ color: '#2563eb', fontWeight: 600 }}
            onClick={() => {
              onOpenLoginModal?.();
              onClose();
            }}
          >
            <LogIn size={16} className="qc-user-menu-icon" />
            <span className="qc-user-menu-label">Đăng nhập (Sign In)</span>
          </button>
        )}
      </div>
    </div>
  );
};
