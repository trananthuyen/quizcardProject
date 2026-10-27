import React, { useState, useMemo } from 'react';
import {
  Folder as FolderIcon,
  Plus,
  ArrowRight,
  ArrowLeft,
  Search,
  X,
  SlidersHorizontal,
  FolderOpen,
  Settings,
} from 'lucide-react';
import { DeckCard } from './DeckCard';
import './FolderList.css';

export const FolderList = ({
  folders = [],
  decks = [],
  currentUser = null,
  onOpenCreateFolder,
  onOpenCreateDeck,
  onOpenEditDeck,
  onDeleteDeck,
  onSelectDeckForStudy,
  onSelectDeckForQuiz,
  onSelectDeckForCards,
  onSelectFolder,
}) => {
  // Thư mục hiện đang được click xem danh sách decks bên trong (null = màn hình lưới tất cả thư mục)
  const [selectedFolderName, setSelectedFolderName] = useState(null);
  // Từ khóa tìm kiếm deck trong thư mục
  const [searchQuery, setSearchQuery] = useState('');
  // Sắp xếp danh sách deck trong thư mục
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'title' | 'cards'

  // Lọc danh sách thư mục hiển thị phù hợp với người dùng
  const folderList = useMemo(() => {
    if (!currentUser) {
      return (folders || []).filter((f) => !f.userId);
    }
    return (folders || []).filter((f) => !f.userId || f.userId === currentUser.id);
  }, [folders, currentUser]);

  // Đếm số lượng bộ thẻ trong từng thư mục
  const folderCounts = useMemo(() => {
    const counts = {};
    (decks || []).forEach((d) => {
      const fName = d?.folder?.trim() || 'Chung';
      counts[fName] = (counts[fName] || 0) + 1;
    });
    return counts;
  }, [decks]);

  // Khi click vào một thư mục
  const handleFolderClick = (folderName) => {
    setSelectedFolderName(folderName);
    setSearchQuery('');
    setSortBy('newest');
    if (onSelectFolder) {
      onSelectFolder(folderName);
    }
  };

  // Thông tin đối tượng thư mục đang chọn (nếu có)
  const currentFolder = useMemo(() => {
    if (!selectedFolderName) return null;
    return (
      folderList.find(
        (f) => (f.name || '').trim().toLowerCase() === selectedFolderName.trim().toLowerCase()
      ) || {
        name: selectedFolderName,
        icon: '📁',
        color: '#0d99ff',
        description: 'Thư mục chứa các bộ thẻ flashcard học tập.',
      }
    );
  }, [folderList, selectedFolderName]);

  // Danh sách các bộ thẻ thuộc thư mục đang chọn
  const folderDecks = useMemo(() => {
    if (!selectedFolderName) return [];
    const target = selectedFolderName.trim().toLowerCase();
    return (decks || []).filter((d) => {
      const fName = (d?.folder || 'Chung').trim().toLowerCase();
      return fName === target;
    });
  }, [decks, selectedFolderName]);

  // Lọc theo từ khóa tìm kiếm và sắp xếp
  const filteredDecks = useMemo(() => {
    let list = folderDecks.filter((d) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (d.title || '').toLowerCase().includes(q);
      const matchDesc = (d.description || '').toLowerCase().includes(q);
      const matchTag = (d.tag || '').toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTag;
    });

    if (sortBy === 'cards') {
      list = [...list].sort((a, b) => (b.totalCards || 0) - (a.totalCards || 0));
    } else if (sortBy === 'title') {
      list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'oldest') {
      list = [...list].sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );
    } else {
      // newest
      list = [...list].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }

    return list;
  }, [folderDecks, searchQuery, sortBy]);

  // =========================================================================
  // VIEW 1: CHI TIẾT THƯ MỤC - HIỂN THỊ DANH SÁCH BỘ THẺ TRONG THƯ MỤC
  // =========================================================================
  if (selectedFolderName && currentFolder) {
    const folderColor = currentFolder.color || '#0d99ff';

    return (
      <div className="fl-container">
        {/* Thanh điều hướng quay lại danh sách tất cả thư mục */}
        <div className="fl-detail-nav">
          <button
            type="button"
            className="fl-btn-back"
            onClick={() => setSelectedFolderName(null)}
            title="Quay lại danh sách Tất Cả Thư Mục"
          >
            <ArrowLeft size={16} />
            <span>Tất Cả Thư Mục</span>
          </button>
          <span className="fl-breadcrumb-sep">/</span>
          <span className="fl-breadcrumb-current">{currentFolder.name}</span>
        </div>

        {/* Banner thông tin thư mục */}
        <div className="fl-folder-banner">
          <div className="fl-banner-left">
            <div
              className="fl-banner-icon-box"
              style={{
                backgroundColor: `${folderColor}18`,
                borderColor: `${folderColor}33`,
              }}
            >
              <span className="fl-banner-icon">{currentFolder.icon || '📁'}</span>
            </div>

            <div className="fl-banner-info">
              <div className="fl-banner-title-row">
                <h1 className="fl-banner-name">{currentFolder.name}</h1>
                <span className="fl-banner-count-badge">
                  {folderDecks.length} bộ thẻ
                </span>
              </div>
              <p className="fl-banner-desc">
                {currentFolder.description ||
                  'Thư mục chứa các bộ thẻ giúp quản lý, gom nhóm và ôn tập flashcard hiệu quả.'}
              </p>
            </div>
          </div>

          <div className="fl-banner-actions">
            {onOpenCreateDeck && (
              <button
                type="button"
                className="fl-btn-add-deck"
                onClick={() => onOpenCreateDeck(currentFolder.name)}
                title={`Tạo bộ thẻ mới trong thư mục "${currentFolder.name}"`}
              >
                <Plus size={16} />
                <span>Thêm Bộ Thẻ</span>
              </button>
            )}

            {onOpenCreateFolder && (
              <button
                type="button"
                className="fl-btn-manage-folder"
                onClick={onOpenCreateFolder}
                title="Quản lý hoặc chỉnh sửa thư mục"
              >
                <Settings size={15} />
                <span>Quản Lý</span>
              </button>
            )}
          </div>
        </div>

        {/* Thanh tìm kiếm và sắp xếp các bộ thẻ trong thư mục */}
        <div className="fl-folder-toolbar">
          <div className="fl-search-box">
            <Search size={16} className="fl-search-icon" />
            <input
              type="text"
              placeholder={`Tìm kiếm bộ thẻ trong "${currentFolder.name}"...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="fl-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="fl-search-clear"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="fl-sort-box">
            <SlidersHorizontal size={14} color="#64748b" />
            <span className="fl-sort-label">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="fl-sort-select"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="title">Tên (A - Z)</option>
              <option value="cards">Nhiều thẻ nhất</option>
            </select>
          </div>
        </div>

        {/* Lưới hiển thị các bộ thẻ thuộc thư mục */}
        {filteredDecks.length === 0 ? (
          <div className="fl-empty-box">
            <div
              className="fl-empty-icon-circle"
              style={{ backgroundColor: `${folderColor}15`, color: folderColor }}
            >
              <FolderOpen size={40} />
            </div>
            <h2 className="fl-empty-title">
              {searchQuery
                ? `Không tìm thấy bộ thẻ nào phù hợp với "${searchQuery}"`
                : `Thư mục "${currentFolder.name}" chưa có bộ thẻ nào`}
            </h2>
            <p className="fl-empty-desc">
              {searchQuery
                ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm.'
                : 'Bạn có thể tạo bộ thẻ mới và chọn thư mục này để bắt đầu học tập và theo dõi tiến độ.'}
            </p>
            {onOpenCreateDeck && (
              <button
                type="button"
                className="fl-btn-create-first-deck"
                onClick={() => onOpenCreateDeck(currentFolder.name)}
              >
                <Plus size={16} />
                <span>Tạo Bộ Thẻ Đầu Tiên</span>
              </button>
            )}
          </div>
        ) : (
          <div className="fl-deck-grid">
            {filteredDecks.map((deck, idx) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                index={idx}
                onSelectStudy={onSelectDeckForStudy}
                onSelectQuiz={onSelectDeckForQuiz}
                onSelectCards={onSelectDeckForCards}
                onEditDeck={onOpenEditDeck}
                onDeleteDeck={onDeleteDeck}
                currentUser={currentUser}
                isCommunity={false}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MÀN HÌNH CHÍNH - TẤT CẢ THƯ MỤC (ALL FOLDERS)
  // =========================================================================
  return (
    <div className="fl-container">
      <div className="fl-header">
        <div>
          <h1 className="fl-title">
            <FolderIcon size={26} color="#0d99ff" />
            Tất Cả Thư Mục (Folders)
          </h1>
          <p className="fl-subtitle">
            Nơi chứa các bộ thẻ giúp người sở hữu dễ dàng quản lý, gom nhóm và tổ chức học tập
          </p>
        </div>
        {onOpenCreateFolder && (
          <button type="button" className="fl-btn-create" onClick={onOpenCreateFolder}>
            <Plus size={16} />
            Tạo Thư Mục Mới
          </button>
        )}
      </div>

      <div className="fl-grid">
        {folderList.map((fItem) => {
          const count = folderCounts[fItem.name] || 0;
          const itemColor = fItem.color || '#3b82f6';
          return (
            <div
              key={fItem.id || fItem.name}
              className="fl-card"
              onClick={() => handleFolderClick(fItem.name)}
              title={`Xem danh sách các bộ thẻ thuộc thư mục "${fItem.name}"`}
            >
              <div>
                <div className="fl-card-top">
                  <div
                    className="fl-card-icon-box"
                    style={{
                      backgroundColor: `${itemColor}15`,
                      borderColor: `${itemColor}33`,
                    }}
                  >
                    <span>{fItem.icon || '📁'}</span>
                  </div>
                  <div className="fl-card-header-text">
                    <h3 className="fl-card-name">{fItem.name}</h3>
                    <div className="fl-card-count">{count} bộ thẻ flashcard</div>
                  </div>
                </div>
                <p className="fl-card-desc">
                  {fItem.description ||
                    'Thư mục ôn tập các thẻ ghi nhớ và thuật ngữ quan trọng.'}
                </p>
              </div>

              <div className="fl-card-footer">
                <span>Xem {count} bộ thẻ</span>
                <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
