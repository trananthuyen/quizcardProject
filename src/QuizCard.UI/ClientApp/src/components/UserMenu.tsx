import React, { useEffect, useRef, useState } from 'react';
import { 
  AppWindow, SlidersHorizontal, Download, Plus, LogOut, ChevronRight, Check 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl: string;
  userName: string;
  userEmail: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  isOpen,
  onClose,
  avatarUrl,
  userName,
  userEmail,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { themeMode, setThemeMode } = useTheme();
  const [isThemeSubmenuOpen, setIsThemeSubmenuOpen] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
        setIsThemeSubmenuOpen(false);
      }
    };

    // Đóng menu khi nhấn phím Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isThemeSubmenuOpen) {
          setIsThemeSubmenuOpen(false);
        } else {
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

  if (!isOpen) return null;

  return (
    <div 
      className="qc-user-menu-popover" 
      ref={menuRef} 
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Profile Header */}
      <div className="qc-user-menu-header">
        <div className="qc-user-menu-avatar-large">
          <img 
            src={avatarUrl} 
            alt={userName}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <div className="qc-user-menu-name" title={userName}>
          {userName}
        </div>
        <div className="qc-user-menu-email">
          {userEmail}
        </div>
      </div>

      <div className="qc-user-menu-divider" />

      {/* 2. Menu Mục Cài đặt & Tùy chọn */}
      <div className="qc-user-menu-list">
        {/* Nút Change theme với Submenu Popover bên phải */}
        <div 
          className="qc-theme-menu-wrapper"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
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
                className="qc-theme-sub-item"
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
                className="qc-theme-sub-item"
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
                className="qc-theme-sub-item"
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

      {/* 4. Tài khoản & Đăng xuất */}
      <div className="qc-user-menu-list">
        <button 
          type="button" 
          className="qc-user-menu-item"
          onClick={() => {
            alert('Thêm tài khoản khác (Add account)');
            onClose();
          }}
        >
          <Plus size={16} className="qc-user-menu-icon" />
          <span className="qc-user-menu-label">Add account</span>
        </button>

        <button 
          type="button" 
          className="qc-user-menu-item"
          onClick={() => {
            alert('Đăng xuất khỏi tài khoản');
            onClose();
          }}
        >
          <LogOut size={16} className="qc-user-menu-icon" />
          <span className="qc-user-menu-label">Log out</span>
        </button>
      </div>
    </div>
  );
};
