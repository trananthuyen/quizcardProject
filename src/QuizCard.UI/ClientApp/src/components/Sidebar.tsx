import React, { useState } from 'react';
import { 
  Clock, Compass, ChevronDown, ChevronRight, ChevronLeft, Star, 
  Folder, ArrowUp, Package, LayoutGrid, BookOpen, Trash2, 
  Search, Sparkles, Check, X, MonitorPlay, PanelLeftClose 
} from 'lucide-react';
import type { Category } from '../types';
import './Sidebar.css';

export type SidebarTab = 'community' | 'resources' | 'video' | 'recents' | 'drafts' | 'folders' | 'trash';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  currentView: string;
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  onNavigateHome: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreateDeck: () => void;
  onOpenCategories: () => void;
  selectedFilter?: string;
  onSelectFilter: (filter: string) => void;
  categories?: Category[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onToggle,
  currentView,
  activeTab,
  onSelectTab,
  onNavigateHome,
  searchQuery,
  onSearchChange,
  onOpenCreateDeck,
  onOpenCategories,
  onSelectFilter,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const actualIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const handleTabClick = (tab: SidebarTab) => {
    onSelectTab(tab);
  };

  return (
    <>
      <div className={`qc-sidebar-wrapper ${!actualIsOpen ? 'collapsed' : ''}`}>
        <aside className={`qc-sidebar ${!actualIsOpen ? 'collapsed' : ''}`}>
          <div className="qc-sidebar-inner">
            {/* User Profile Header */}
            <div className="qc-sidebar-header">
              <div className="qc-user-profile" title="Tài khoản cá nhân">
                <div className="qc-avatar">
                  <span>TA</span>
                </div>
                <span className="qc-user-name">tran an thuyen</span>
                <ChevronDown size={14} color="#71717a" />
              </div>

              <div className="qc-sidebar-header-actions">
                <button
                  type="button"
                  className="qc-sidebar-close-btn"
                  title="Thu gọn sidebar (Ctrl+B)"
                  onClick={handleToggle}
                  aria-label="Thu gọn sidebar"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
            </div>

            {/* Search input in sidebar */}
            <div className="qc-sidebar-search">
              <Search size={14} className="qc-sidebar-search-icon" />
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            {/* Primary Navigation items */}
            <div className="qc-nav-list">
              <button 
                type="button"
                className={`qc-nav-item ${activeTab === 'video' && currentView === 'DECKS' ? 'active' : ''}`}
                onClick={() => handleTabClick('video')}
              >
                <MonitorPlay size={16} />
                <span>Videos</span>
              </button>
              <button 
                type="button"
                className={`qc-nav-item ${activeTab === 'community' && currentView === 'DECKS' ? 'active' : ''}`}
                onClick={() => handleTabClick('community')}
              >
                <Compass size={16} />
                <span>Community</span>
              </button>
              <button 
                type="button"
                className={`qc-nav-item ${activeTab === 'recents' && currentView === 'DECKS' ? 'active' : ''}`}
                onClick={() => handleTabClick('recents')}
              >
                <Clock size={16} />
                <span>Recents</span>
              </button>
            </div>

            <div className="qc-nav-divider" />

            {/* Team section */}
            <div className="qc-team-row" onClick={() => onOpenCategories()} title="Quản lý nhóm & phân loại">
              <div className="qc-team-left">
                <div className="qc-team-avatar">
                  <span>A</span>
                </div>
                <span className="qc-team-name">An trần</span>
                <ChevronDown size={13} color="#71717a" />
              </div>
              <span className="qc-free-badge">Free</span>
            </div>

            {/* Team sub-items */}
            <div className="qc-nav-list sb-nav-sublist">
              <button 
                type="button"
                className={`qc-nav-item ${activeTab === 'drafts' && currentView === 'DECKS' ? 'active' : ''}`}
                onClick={() => handleTabClick('drafts')}
              >
                <BookOpen size={15} color="#71717a" />
                <span>Drafts</span>
              </button>

              <button 
                type="button"
                className={`qc-nav-item ${activeTab === 'folders' && currentView === 'DECKS' ? 'active' : ''}`}
                onClick={() => handleTabClick('folders')}
              >
                <LayoutGrid size={15} color="#71717a" />
                <span>All folders</span>
              </button>

              <button 
                type="button"
                className={`qc-nav-item ${activeTab === 'resources' && currentView === 'DECKS' ? 'active' : ''}`}
                onClick={() => handleTabClick('resources')}
              >
                <Package size={15} color="#71717a" />
                <span>My Resources</span>
              </button>

              <button 
                type="button"
                className={`qc-nav-item ${activeTab === 'trash' && currentView === 'DECKS' ? 'active' : ''}`}
                onClick={() => handleTabClick('trash')}
              >
                <Trash2 size={15} color="#71717a" />
                <span>Trash</span>
              </button>
            </div>

            {/* Plan & Usage Card */}
            <div className="qc-plan-card" onClick={() => setIsPlanModalOpen(true)}>
              <div>
                <div className="sb-plan-title">See what's included</div>
                <div className="sb-plan-desc">Your plan and usage</div>
              </div>
              <ChevronRight size={14} color="#71717a" />
            </div>

            {/* Starred section */}
            <div className="sb-starred-section">
              <div className="qc-section-title">
                <Star size={11} fill="#eab308" color="#eab308" />
                <span>Starred</span>
              </div>
              <div className="qc-nav-list sb-nav-sublist">
                <button 
                  type="button"
                  className="qc-nav-item"
                  onClick={() => {
                    onSelectFilter('ALL');
                    onNavigateHome();
                  }}
                >
                  <Folder size={14} color="#71717a" />
                  <span>Team project</span>
                </button>
              </div>
            </div>

            {/* Upgrade Button */}
            <button 
              type="button"
              className="qc-upgrade-btn"
              onClick={() => setIsPlanModalOpen(true)}
              title="Nâng cấp gói tài khoản"
            >
              <div className="sb-upgrade-icon-circle">
                <ArrowUp size={11} strokeWidth={3} />
              </div>
              <span>Upgrade</span>
            </button>
          </div>

          
        </aside>

        {/* Nút đóng mở ở mép giữa sidebar */}
        <button
          type="button"
          className={`qc-sidebar-edge-toggle ${!actualIsOpen ? 'collapsed' : ''}`}
          onClick={handleToggle}
          title={actualIsOpen ? "Thu gọn sidebar (Ctrl+B)" : "Mở rộng sidebar (Ctrl+B)"}
          aria-label={actualIsOpen ? "Thu gọn sidebar" : "Mở rộng sidebar"}
        >
          {actualIsOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nút đóng mở ở mép giữa sidebar */}
        <button
          type="button"
          className={`qc-sidebar-edge-toggle ${!actualIsOpen ? 'collapsed' : ''}`}
          onClick={handleToggle}
          title={actualIsOpen ? "Thu gọn sidebar (Ctrl+B)" : "Mở rộng sidebar (Ctrl+B)"}
          aria-label={actualIsOpen ? "Thu gọn sidebar" : "Mở rộng sidebar"}
        >
          {actualIsOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

      {/* Modal Kế hoạch & Nâng cấp (Plan & Upgrade Modal) */}
      {isPlanModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPlanModalOpen(false)}>
          <div className="modal-content sb-plan-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sb-modal-header">
              <div className="sb-modal-header-left">
                <div className="sb-modal-icon-box">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="sb-modal-title">QuizCard Workspace</h3>
                  <span className="sb-modal-subtitle">An trần's team • Gói Free hiện tại</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsPlanModalOpen(false)} 
                className="sb-modal-close-btn" 
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="sb-feature-box">
              <div className="sb-feature-title">
                Tính năng không giới hạn:
              </div>
              <ul className="sb-feature-list">
                <li className="sb-feature-item">
                  <Check size={16} color="#10b981" /> Không giới hạn số lượng bộ thẻ và flashcards
                </li>
                <li className="sb-feature-item">
                  <Check size={16} color="#10b981" /> Thuật toán lặp lại ngắt quãng SuperMemo SM-2
                </li>
                <li className="sb-feature-item">
                  <Check size={16} color="#10b981" /> Luyện thi trắc nghiệm A, B, C, D thông minh
                </li>
                <li className="sb-feature-item">
                  <Check size={16} color="#10b981" /> Phát âm AI Text-to-Speech đa ngôn ngữ
                </li>
              </ul>
            </div>

            <div className="sb-modal-footer">
              <button
                type="button"
                onClick={() => {
                  setIsPlanModalOpen(false);
                  onOpenCreateDeck();
                }}
                className="sb-btn-create-deck"
              >
                + Tạo Bộ Thẻ Ngay
              </button>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="sb-btn-modal-close"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
