import React, { useMemo } from 'react';
import { Package, BookOpen, Clock, Sparkles, Plus, Folder } from 'lucide-react';
import { FilterPills } from './FilterPills';
import { DeckCard } from './DeckCard';
import './MyResources.css';
import './DeckList.css';
export const MyResources = ({
    decks,
    currentUser = null,
    categories,
    loading,
    searchQuery,
    selectedFilter,
    onSelectFilter,
    onOpenLoginModal,
    onOpenCreateDeck,
    onOpenCategories,
    onSelectDeckForStudy,
    onSelectDeckForQuiz,
    onSelectDeckForCards,
    onEditDeck,
    onDeleteDeck,
}) => {
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
    const totalDecks = decks.length;
    const totalCards = useMemo(() => decks.reduce((sum, d) => sum + (d.totalCards || 0), 0), [decks]);
    const masteredCards = useMemo(() => decks.reduce((sum, d) => sum + (d.masteredCards || 0), 0), [decks]);
    const learningCards = useMemo(() => decks.reduce((sum, d) => sum + (d.learningCards || 0), 0), [decks]);
    // Danh sách tên phân loại
    const allCategoryNames = useMemo(() => {
        const set = new Set();
        categories.forEach((c) => set.add(c.name.trim()));
        decks.forEach((d) => {
            if (d.category && d.category.trim())
                set.add(d.category.trim());
        });
        if (!set.has('Chung'))
            set.add('Chung');
        return Array.from(set);
    }, [categories, decks]);
    // Đếm số lượng bộ thẻ theo từng bộ lọc
    const filterCounts = useMemo(() => {
        const total = decks.length;
        const studied = decks.filter((d) => (d.masteredCards + d.learningCards) > 0).length;
        const notStarted = decks.filter((d) => (d.masteredCards + d.learningCards) === 0).length;
        const categoryCounts = {};
        decks.forEach((d) => {
            const cat = d.category?.trim() || 'Chung';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        return { total, studied, notStarted, categoryCounts };
    }, [decks]);
    // Lọc danh sách bộ thẻ theo bộ lọc và tìm kiếm
    const filteredDecks = useMemo(() => {
        return decks.filter((deck) => {
            if (selectedFilter === 'STUDIED') {
                const isStudied = (deck.masteredCards + deck.learningCards) > 0;
                if (!isStudied)
                    return false;
            }
            else if (selectedFilter === 'NOT_STARTED') {
                const isNotStarted = (deck.masteredCards + deck.learningCards) === 0;
                if (!isNotStarted)
                    return false;
            }
            else if (selectedFilter !== 'ALL') {
                if (deck.category?.toLowerCase() !== selectedFilter.toLowerCase()) {
                    return false;
                }
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTitle = deck.title.toLowerCase().includes(q);
                const matchDesc = deck.description?.toLowerCase().includes(q) || false;
                const matchCat = deck.category?.toLowerCase().includes(q) || false;
                if (!matchTitle && !matchDesc && !matchCat)
                    return false;
            }
            return true;
        });
    }, [decks, selectedFilter, searchQuery]);
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
          <button type="button" className="mr-btn-categories" onClick={onOpenCategories} title="Quản lý các nhóm phân loại">
            <Folder size={15}/>
            Quản lý phân loại
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
      <FilterPills selectedFilter={selectedFilter} onSelectFilter={onSelectFilter} categories={categories} onOpenCreateCategory={onOpenCategories} allCategoryNames={allCategoryNames} filterCounts={filterCounts}/>

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
          {filteredDecks.map((deck, idx) => (<DeckCard key={deck.id} deck={deck} index={idx} onSelectStudy={onSelectDeckForStudy} onSelectQuiz={onSelectDeckForQuiz} onSelectCards={onSelectDeckForCards} onEditDeck={onEditDeck} onDeleteDeck={onDeleteDeck}/>))}
        </div>)}
    </div>);
};
