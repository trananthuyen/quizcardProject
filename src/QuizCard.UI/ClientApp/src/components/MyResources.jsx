import React, { useMemo } from 'react';
import { Package, BookOpen, Clock, Sparkles, Plus, Folder } from 'lucide-react';
import { FilterPills } from './FilterPills';
import { DeckCard } from './DeckCard';
import './MyResources.css';
import './DeckList.css';
export const MyResources = ({
    decks = [],
    currentUser = null,
    folders,
    categories,
    loading,
    searchQuery = '',
    onSearchChange,
    selectedFilter = 'ALL',
    onSelectFilter,
    onOpenLoginModal,
    onOpenCreateDeck,
    onOpenFolders,
    onOpenCategories,
    onSelectDeckForStudy,
    onSelectDeckForQuiz,
    onSelectDeckForCards,
    onEditDeck,
    onDeleteDeck,
}) => {
    const handleOpenFolders = onOpenFolders || onOpenCategories;
    const folderList = folders || categories || [];
    const deckList = decks || [];

    // Xử lý khi click vào Tạo Thẻ: Nếu chưa đăng nhập thì mở modal đăng nhập
    const handleCreateClick = () => {
        if (!currentUser) {
            if (onOpenLoginModal) {
                onOpenLoginModal();
            }
            return;
        }
        if (onOpenCreateDeck) {
            onOpenCreateDeck();
        }
    };
    // Thống kê tổng hợp số liệu
    const totalDecks = deckList.length;
    const totalCards = useMemo(() => deckList.reduce((sum, d) => sum + (d.totalCards || 0), 0), [deckList]);
    const masteredCards = useMemo(() => deckList.reduce((sum, d) => sum + (d.masteredCards || 0), 0), [deckList]);
    const learningCards = useMemo(() => deckList.reduce((sum, d) => sum + (d.learningCards || 0), 0), [deckList]);
    // Danh sách tên thư mục
    const allFolderNames = useMemo(() => {
        if (!currentUser) {
            return ['Chung'];
        }
        const set = new Set();
        (folderList || []).forEach((c) => {
            if (c?.name && typeof c.name === 'string') {
                set.add(c.name.trim());
            }
        });
        deckList.forEach((d) => {
            if (!d?.isSaved) {
                const fName = d?.folder;
                if (fName && typeof fName === 'string' && fName.trim())
                    set.add(fName.trim());
            }
        });
        if (!set.has('Chung'))
            set.add('Chung');
        return Array.from(set);
    }, [currentUser, folderList, deckList]);
    // Đếm số lượng bộ thẻ theo từng bộ lọc
    const filterCounts = useMemo(() => {
        const total = deckList.length;
        const studied = deckList.filter((d) => !d?.isSaved && ((d?.masteredCards || 0) + (d?.learningCards || 0)) > 0).length;
        const notStarted = deckList.filter((d) => !d?.isSaved && ((d?.masteredCards || 0) + (d?.learningCards || 0)) === 0).length;
        const folderCounts = {};
        deckList.forEach((d) => {
            if (!d?.isSaved) {
                const cat = (d?.folder || d?.Folder || '').trim() || 'Chung';
                folderCounts[cat] = (folderCounts[cat] || 0) + 1;
            }
        });
        return { total, studied, notStarted, folderCounts };
    }, [deckList]);
    // Lọc danh sách bộ thẻ theo bộ lọc và tìm kiếm
    const filteredDecks = useMemo(() => {
        return deckList.filter((deck) => {
            if (!deck) return false;
            // Bộ thẻ lưu từ cộng đồng: chỉ hiển thị ở mục 'Tất cả' (ALL)
            if (deck.isSaved && selectedFilter !== 'ALL') {
                return false;
            }
            if (selectedFilter === 'STUDIED') {
                const isStudied = ((deck.masteredCards || 0) + (deck.learningCards || 0)) > 0;
                if (!isStudied)
                    return false;
            }
            else if (selectedFilter === 'NOT_STARTED') {
                const isNotStarted = ((deck.masteredCards || 0) + (deck.learningCards || 0)) === 0;
                if (!isNotStarted)
                    return false;
            }
            else if (selectedFilter && selectedFilter !== 'ALL') {
                const deckFolder = (deck.folder || deck.Folder || '').toLowerCase();
                const deckTag = (deck.tag || deck.Tag || '').toLowerCase();
                const filterLower = (selectedFilter || '').toLowerCase();
                if (deckFolder !== filterLower && !deckTag.includes(filterLower)) {
                    return false;
                }
            }
            if (searchQuery && searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTitle = (deck.title || deck.Title || '').toLowerCase().includes(q);
                const matchDesc = (deck.description || deck.Description || '').toLowerCase().includes(q);
                const matchFolder = (deck.folder || deck.Folder || '').toLowerCase().includes(q);
                const matchTag = (deck.tag || deck.Tag || '').toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchFolder && !matchTag)
                    return false;
            }
            return true;
        });
    }, [deckList, selectedFilter, searchQuery]);
    return (<div className="mr-container">
      {/* 1. Header khu vực My Resources */}
      <div className="mr-header">
        <div>
          <h1 className="mr-title">
            <Package size={26} color="#0d99ff"/>
            My Resources
          </h1>
          <p className="mr-subtitle">
            Kho học liệu cá nhân & thống kê tiến độ học tập bộ thẻ của bạn
          </p>
        </div>
        <div className="mr-header-actions">
          <button type="button" className="mr-btn-categories" onClick={handleOpenFolders} title="Quản lý các thư mục chứa bộ thẻ">
            <Folder size={15}/>
            Quản lý thư mục
          </button>
          <button type="button" className="mr-btn-create" onClick={handleCreateClick} title="Tạo bộ thẻ flashcard mới">
            <Plus size={16}/>
            Tạo Bộ Thẻ
          </button>
        </div>
      </div>

      {/* 2. Lưới thẻ thống kê (Stats Grid) */}
      <div className="mr-stats-grid">
        <div className="mr-stat-card">
          <div className="mr-stat-icon blue">
            <Package size={20}/>
          </div>
          <div>
            <div className="mr-stat-num">{totalDecks}</div>
            <div className="mr-stat-label">Bộ thẻ đã tạo</div>
          </div>
        </div>

        <div className="mr-stat-card">
          <div className="mr-stat-icon purple">
            <BookOpen size={20}/>
          </div>
          <div>
            <div className="mr-stat-num">{totalCards}</div>
            <div className="mr-stat-label">Tổng số Flashcard</div>
          </div>
        </div>

        <div className="mr-stat-card">
          <div className="mr-stat-icon green">
            <Sparkles size={20}/>
          </div>
          <div>
            <div className="mr-stat-num">{masteredCards}</div>
            <div className="mr-stat-label">Thẻ đã thuộc làu</div>
          </div>
        </div>

        <div className="mr-stat-card">
          <div className="mr-stat-icon amber">
            <Clock size={20}/>
          </div>
          <div>
            <div className="mr-stat-num">{learningCards}</div>
            <div className="mr-stat-label">Thẻ đang học & ôn tập</div>
          </div>
        </div>
      </div>

      {/* 3. Thanh bộ lọc FilterPills */}
      <FilterPills
        selectedFilter={selectedFilter}
        onSelectFilter={onSelectFilter}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onOpenCreateFolder={handleOpenFolders}
        allFolderNames={allFolderNames}
        filterCounts={filterCounts}
        mode="folder"
      />

      {/* 4. Danh sách bộ thẻ */}
      {loading ? (<div className="dl-loading">
          <div className="dl-loading-spinner"/>
          <span className="dl-loading-text">Đang tải kho học liệu của bạn...</span>
        </div>) : filteredDecks.length === 0 ? (<div className="dl-empty-state">
          <div className="dl-empty-title">
            {!currentUser ? 'Bạn chưa đăng nhập' : 'Không tìm thấy bộ thẻ nào phù hợp'}
          </div>
          <p className="dl-empty-desc">
            {!currentUser
              ? 'Vui lòng đăng nhập để xem, tạo và quản lý kho học liệu bộ thẻ của riêng bạn.'
              : 'Hãy thử tìm kiếm với từ khóa khác hoặc bấm nút bên dưới để tạo bộ thẻ đầu tiên của bạn.'}
          </p>
          <button type="button" className="dl-btn-empty-create" onClick={handleCreateClick}>
            {!currentUser ? 'Đăng Nhập Để Tạo Bộ Thẻ' : '+ Tạo Bộ Thẻ Mới'}
          </button>
        </div>) : (<div className="qc-card-grid">
          {filteredDecks.map((deck, idx) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              index={idx}
              isCommunity={false}
              currentUser={currentUser}
              onSelectStudy={onSelectDeckForStudy}
              onSelectQuiz={onSelectDeckForQuiz}
              onSelectCards={onSelectDeckForCards}
              onEditDeck={onEditDeck}
              onDeleteDeck={onDeleteDeck}
            />
          ))}
        </div>)}
    </div>);
};
