import React, { useState } from 'react';
import { Clock, Compass, ChevronDown, ChevronRight, ChevronLeft, Star, Folder, ArrowUp, Package, LayoutGrid, BookOpen, Trash2, Search, Sparkles, Check, X, MonitorPlay, Bell, Lock } from 'lucide-react';
import { UserMenu } from './UserMenu';
import './Sidebar.css';

const USER_AVATAR_URL = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=160&auto=format&fit=crop&q=80';
const USER_NAME = 'Guest';
const USER_EMAIL = '';

export const Sidebar = ({
    isOpen = true,
    onToggle,
    currentView,
    activeTab,
    onSelectTab,
    onNavigateHome,
    searchQuery,
    onSearchChange,
    onOpenCreateDeck,
    onOpenFolders,
    onOpenCategories,
    onSelectFilter,
    currentUser = null,
    onOpenLoginModal,
    onLogout,
}) => {
    const displayName = currentUser 
        ? (currentUser.fullName || currentUser.FullName || currentUser.name || currentUser.Name || (currentUser.email || currentUser.Email)?.split('@')[0] || 'User') 
        : USER_NAME;
    const displayAvatar = currentUser?.avatarUrl || currentUser?.AvatarUrl || USER_AVATAR_URL;
    const displayEmail = currentUser?.email || currentUser?.Email || USER_EMAIL;

    const [internalIsOpen, setInternalIsOpen] = useState(true);
    const actualIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
    const handleToggle = () => {
        if (onToggle) {
            onToggle();
        }
        else {
            setInternalIsOpen((prev) => !prev);
        }
    };
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const handleTabClick = (tab) => {
        onSelectTab(tab);
    };

    return (<>
      <div className={`qc-sidebar-wrapper ${!actualIsOpen ? 'collapsed' : ''} ${isUserMenuOpen ? 'menu-open' : ''}`}>
        <aside className={`qc-sidebar ${!actualIsOpen ? 'collapsed' : ''} ${isUserMenuOpen ? 'menu-open' : ''}`}>
          <div className="qc-sidebar-inner">
            {/* User Profile Header */}
            <div className="qc-sidebar-header" style={{ position: 'relative' }}>
              <div className={`qc-user-profile ${isUserMenuOpen ? 'active' : ''}`} title="Tài khoản cá nhân" onClick={() => setIsUserMenuOpen((prev) => !prev)}>
                <div className="qc-avatar" style={{ overflow: 'hidden' }}>
                  {!avatarError && displayAvatar ? (
                    <img 
                      src={displayAvatar} 
                      alt={displayName} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span>{(displayName || 'U').slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <span className="qc-user-name" title={displayName}>{displayName}</span>
                <ChevronDown size={14} color="#71717a" style={{
            transform: isUserMenuOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            flexShrink: 0
        }}/>
              </div>

              <div className="qc-sidebar-header-actions">
                {/*vung ben canh ten nguoi dung*/}
              </div>

              {/* Menu Popover khi click vào tên người dùng */}
              <UserMenu
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
                avatarUrl={displayAvatar}
                userName={displayName}
                userEmail={displayEmail}
                isLoggedIn={!!currentUser}
                onOpenLoginModal={onOpenLoginModal}
                onLogout={onLogout}
              />
            </div>

            {/* Primary Navigation items */}
            <div className="qc-nav-list">
              <button type="button" className={`qc-nav-item ${activeTab === 'video' && currentView === 'DECKS' ? 'active' : ''}`} onClick={() => handleTabClick('video')}>
                <MonitorPlay size={16}/>
                <span>Videos</span>
              </button>
              <button type="button" className={`qc-nav-item ${activeTab === 'community' && currentView === 'DECKS' ? 'active' : ''}`} onClick={() => handleTabClick('community')}>
                <Compass size={16}/>
                <span>Community</span>
              </button>
              <button type="button" className={`qc-nav-item ${activeTab === 'recents' && currentView === 'DECKS' ? 'active' : ''}`} onClick={() => handleTabClick('recents')}>
                <Clock size={16}/>
                <span>Recents</span>
              </button>
            </div>

            <div className="qc-nav-divider"/>

            {/* Team section */}
            <div className="qc-team-row">
              <div className="qc-team-left">
                <div className="qc-team-avatar">
                  <span>{displayName[0]}</span>
                </div>
                <span className="qc-team-name">{displayName}</span>
                <ChevronDown size={13} color="#71717a"/>
              </div>
              <span className="qc-free-badge">Free</span>
            </div>

            {/* Team sub-items */}
            <div className="qc-nav-list sb-nav-sublist">
              <button type="button" className={`qc-nav-item ${activeTab === 'progress' && currentView === 'DECKS' ? 'active' : ''}`} onClick={() => handleTabClick('progress')}>
                <BookOpen size={15} color="#71717a"/>
                <span>Progress</span>
              </button>

              <button type="button" className={`qc-nav-item ${activeTab === 'folders' && currentView === 'DECKS' ? 'active' : ''}`} onClick={() => handleTabClick('folders')}>
                <LayoutGrid size={15} color="#71717a"/>
                <span>All folders</span>
              </button>

              <button type="button" className={`qc-nav-item ${activeTab === 'resources' && currentView === 'DECKS' ? 'active' : ''}`} onClick={() => handleTabClick('resources')}>
                <Package size={15} color="#71717a"/>
                <span>My Resources</span>
              </button>

              <button type="button" className={`qc-nav-item ${activeTab === 'trash' && currentView === 'DECKS' ? 'active' : ''}`} onClick={() => handleTabClick('trash')}>
                <Trash2 size={15} color="#71717a"/>
                <span>Trash</span>
              </button>
            </div>

            {/* Plan & Usage Card */}
            <div className="qc-plan-card" onClick={() => setIsPlanModalOpen(true)}>
              <div>
                <div className="sb-plan-title">See what's included</div>
                <div className="sb-plan-desc">Your plan and usage</div>
              </div>
              <ChevronRight size={14} color="#71717a"/>
            </div>

            {/* Starred section */}
            <div className="sb-starred-section">
              <div className="qc-section-title">
                <Star size={11} fill="#eab308" color="#eab308"/>
                <span>Starred</span>
              </div>
              <div className="qc-nav-list sb-nav-sublist">
                <button 
                  type="button" 
                  className="qc-nav-item sb-item-locked" 
                  title="Tính năng chưa phát triển"
                >
                  <div className="sb-item-locked-left">
                    <Folder size={14} color="#71717a"/>
                    <span>Team project</span>
                  </div>
                  <span className="sb-lock-pill" title="Tính năng chưa phát triển">
                    <Lock size={11} />
                  </span>
                </button>
              </div>
            </div>

            {/* Upgrade Button */}
            <button 
              type="button" 
              className="qc-upgrade-btn" 
              onClick={() => setIsPlanModalOpen(true)} 
              title="Nâng cấp gói tài khoản (Tính năng đang phát triển)"
            >
              <div className="sb-upgrade-icon-circle">
                <ArrowUp size={11} strokeWidth={3}/>
              </div>
              <span>Upgrade</span>
              <span className="sb-upgrade-lock-tag" title="Tính năng đang phát triển">
                <Lock size={11} />
              </span>
            </button>
          </div>

          
        </aside>

        {/* Nút đóng mở ở mép giữa sidebar */}
        <button type="button" className={`qc-sidebar-edge-toggle ${isUserMenuOpen ? 'hidden-by-menu' : ''}`} onClick={handleToggle} title="Thu gọn sidebar (Ctrl+B)" aria-label="Thu gọn sidebar">
          <ChevronLeft size={14}/>
        </button>
      </div>

      {/* Nút mở lại sidebar khi đang thu gọn */}
      {!actualIsOpen && (<button type="button" className="qc-sidebar-edge-toggle collapsed" onClick={handleToggle} title="Mở rộng sidebar (Ctrl+B)" aria-label="Mở rộng sidebar">
          <ChevronRight size={14}/>
        </button>)}

      {/* Modal Kế hoạch & Nâng cấp (Plan & Upgrade Modal) */}
      {isPlanModalOpen && (<div className="modal-overlay" onClick={() => setIsPlanModalOpen(false)}>
          <div className="modal-content sb-plan-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sb-modal-header">
              <div className="sb-modal-header-left">
                <div className="sb-modal-icon-box">
                  <Sparkles size={18}/>
                </div>
                <div>
                  <h3 className="sb-modal-title">QuizCard Workspace</h3>
                  <span className="sb-modal-subtitle">An trần's team • Gói Free hiện tại</span>
                </div>
              </div>
              <button type="button" onClick={() => setIsPlanModalOpen(false)} className="sb-modal-close-btn" title="Đóng">
                <X size={18}/>
              </button>
            </div>

            <div className="sb-upgrade-notice">
              <Lock size={15} style={{ flexShrink: 0 }} />
              <span>Tính năng Nâng cấp gói Pro hiện đang được phát triển. Bạn đang được trải nghiệm toàn bộ tính năng hoàn toàn miễn phí!</span>
            </div>

            <div className="sb-feature-box">
              <div className="sb-feature-title">
                Tính năng không giới hạn:
              </div>
              <ul className="sb-feature-list">
                <li className="sb-feature-item">
                  <Check size={16} color="#10b981"/> Không giới hạn số lượng bộ thẻ và flashcards
                </li>
                <li className="sb-feature-item">
                  <Check size={16} color="#10b981"/> Thuật toán lặp lại ngắt quãng SuperMemo SM-2
                </li>
                <li className="sb-feature-item">
                  <Check size={16} color="#10b981"/> Luyện thi trắc nghiệm A, B, C, D thông minh
                </li>
                <li className="sb-feature-item">
                  <Check size={16} color="#10b981"/> Phát âm AI Text-to-Speech đa ngôn ngữ
                </li>
              </ul>
            </div>

            <div className="sb-modal-footer">
              <button type="button" onClick={() => setIsPlanModalOpen(false)} className="sb-btn-modal-close">
                Đóng
              </button>
            </div>
          </div>
        </div>)}
    </>);
};
