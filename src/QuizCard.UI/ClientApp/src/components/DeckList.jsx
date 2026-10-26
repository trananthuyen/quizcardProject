/**
 * Component DeckList: Giao diện danh sách Bộ thẻ theo phong cách Community
 * =============================================================================
 * Tái hiện giao diện Dashboard:
 * 1. Hero banner với background xanh pastel và các sticker vui tươi nổi bật.
 * 2. Thanh filter pills ngang: Saved, Riffs (New), Design resources, Extensions...
 * 3. Hàng thẻ phân loại thực tế theo chủ đề của database (Tất cả, Đã học, Chưa học, COLLOCATIONS...)
 * 4. Thẻ Upload files đầu tiên phong cách bóng rổ (Basketball Hoop Dropzone).
 * 5. Các thẻ bộ thẻ (Deck cards) thiết kế đỉnh cao theo style:
 *    - Split dark/light gauge theme (Nastaran Jamali style)
 *    - Mindmap node graph theme (Hardik Gondhiya style)
 *    - 3D app icons grid theme
 *    - Aurora gradient theme
 *    - Footer với avatar tác giả và nút like thả tim tương tác
 *    - Hover action overlay: Học lật thẻ, Thi trắc nghiệm, Quản lý thẻ, Sửa, Xóa
 * 6. Modal Tạo / Sửa bộ thẻ & Quản lý phân loại đầy đủ tính năng.
 * 7. Nút floating '?' góc dưới bên phải mở modal hướng dẫn phím tắt.
 */
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { HeroBanner } from './HeroBanner';
import { FilterPills } from './FilterPills';
import { DeckCard } from './DeckCard';
import { HelpModal } from './HelpModal';
import './DeckList.css';
// Bảng biểu tượng Emoji gợi ý chọn nhanh cho phân loại
const SUGGESTED_ICONS = ['💻', '🇬🇧', '🇯🇵', '🔬', '📚', '🎨', '🎵', '💼', '🧠', '📐', '⚽', '🌟', '💊', '📁'];
// Bảng màu gợi ý chọn nhanh cho phân loại
const SUGGESTED_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#64748b'];
export const DeckList = ({ decks, categories, loading, onCreateDeck, onUpdateDeck, onDeleteDeck, onCreateCategory, onDeleteCategory, onSelectDeckForStudy, onSelectDeckForQuiz, onSelectDeckForCards, onOpenCreateDeck, onOpenEditDeck, onOpenCategories, searchQuery: externalSearchQuery, selectedFilter: externalSelectedFilter, onSelectFilter: externalOnSelectFilter, isDeckModalOpen: externalIsDeckModalOpen, setIsDeckModalOpen: externalSetIsDeckModalOpen, isCategoryModalOpen: externalIsCategoryModalOpen, setIsCategoryModalOpen: externalSetIsCategoryModalOpen, }) => {
    // Trạng thái tìm kiếm
    const [internalSearchQuery] = useState('');
    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
    // Trạng thái bộ lọc
    const [internalSelectedFilter, setInternalSelectedFilter] = useState('ALL');
    const selectedFilter = externalSelectedFilter !== undefined ? externalSelectedFilter : internalSelectedFilter;
    const setSelectedFilter = externalOnSelectFilter || setInternalSelectedFilter;
    // Trạng thái Modal Tạo / Sửa bộ thẻ
    const [internalIsDeckModalOpen, setInternalIsDeckModalOpen] = useState(false);
    const isDeckModalOpen = externalIsDeckModalOpen !== undefined ? externalIsDeckModalOpen : internalIsDeckModalOpen;
    const setIsDeckModalOpen = externalSetIsDeckModalOpen || setInternalIsDeckModalOpen;
    const [editingDeck, setEditingDeck] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Chung');
    const [submittingDeck, setSubmittingDeck] = useState(false);
    const [deckError, setDeckError] = useState(null);
    // Trạng thái Modal Quản lý phân loại
    const [internalIsCategoryModalOpen, setInternalIsCategoryModalOpen] = useState(false);
    const isCategoryModalOpen = externalIsCategoryModalOpen !== undefined ? externalIsCategoryModalOpen : internalIsCategoryModalOpen;
    const setIsCategoryModalOpen = externalSetIsCategoryModalOpen || setInternalIsCategoryModalOpen;
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [newCatIcon, setNewCatIcon] = useState('💻');
    const [newCatColor, setNewCatColor] = useState('#3b82f6');
    const [submittingCategory, setSubmittingCategory] = useState(false);
    const [categoryError, setCategoryError] = useState(null);
    // Trạng thái Modal Trợ giúp (?)
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    /**
     * Danh sách tên phân loại duy nhất
     */
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
    /**
     * Tính toán số lượng bộ thẻ cho từng bộ lọc
     */
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
    /**
     * Lọc danh sách bộ thẻ hiển thị
     */
    const filteredDecks = useMemo(() => {
        return decks.filter((deck) => {
            // 1. Phân loại
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
            // 2. Tìm kiếm
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
    /**
     * Mở modal Tạo Bộ Thẻ Mới
     */
    const openCreateDeckModal = () => {
        if (onOpenCreateDeck) {
            onOpenCreateDeck();
            return;
        }
        setEditingDeck(null);
        setTitle('');
        setDescription('');
        if (selectedFilter !== 'ALL' && selectedFilter !== 'STUDIED' && selectedFilter !== 'NOT_STARTED') {
            setCategory(selectedFilter);
        }
        else {
            setCategory(categories[0]?.name || 'COLLOCATIONS');
        }
        setDeckError(null);
        setIsDeckModalOpen(true);
    };
    /**
     * Mở modal Chỉnh Sửa Bộ Thẻ
     */
    const openEditDeckModal = (deck, e) => {
        e.stopPropagation();
        if (onOpenEditDeck) {
            onOpenEditDeck(deck);
            return;
        }
        setEditingDeck(deck);
        setTitle(deck.title);
        setDescription(deck.description || '');
        setCategory(deck.category || 'Chung');
        setDeckError(null);
        setIsDeckModalOpen(true);
    };
    /**
     * Submit form Tạo hoặc Sửa Bộ Thẻ
     */
    const handleSubmitDeck = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setDeckError('Vui lòng nhập tên bộ thẻ');
            return;
        }
        try {
            setSubmittingDeck(true);
            setDeckError(null);
            const cat = category.trim() || 'Chung';
            if (editingDeck) {
                await onUpdateDeck(editingDeck.id, { title, description, category: cat });
            }
            else {
                await onCreateDeck({ title, description, category: cat });
            }
            setIsDeckModalOpen(false);
        }
        catch (err) {
            setDeckError(err.message || 'Đã có lỗi xảy ra');
        }
        finally {
            setSubmittingDeck(false);
        }
    };
    /**
     * Submit form Tạo Phân Loại Mới
     */
    const handleCreateCategorySubmit = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) {
            setCategoryError('Vui lòng nhập tên phân loại');
            return;
        }
        try {
            setSubmittingCategory(true);
            setCategoryError(null);
            const created = await onCreateCategory({
                name: newCatName.trim(),
                description: newCatDesc.trim() || undefined,
                icon: newCatIcon,
                color: newCatColor,
            });
            setNewCatName('');
            setNewCatDesc('');
            setCategory(created.name);
        }
        catch (err) {
            setCategoryError(err.message || 'Không thể tạo phân loại');
        }
        finally {
            setSubmittingCategory(false);
        }
    };
    /**
     * Xóa phân loại
     */
    const handleDeleteCategoryClick = async (cat) => {
        if (cat.name === 'Chung') {
            alert('Không thể xóa phân loại mặc định "Chung"');
            return;
        }
        if (window.confirm(`Bạn có chắc chắn muốn xóa phân loại "${cat.name}"? Các bộ thẻ thuộc phân loại này sẽ tự động chuyển về "Chung".`)) {
            try {
                await onDeleteCategory(cat.id);
                if (selectedFilter.toLowerCase() === cat.name.toLowerCase()) {
                    setSelectedFilter('ALL');
                }
            }
            catch (err) {
                alert(err.message || 'Không thể xóa phân loại');
            }
        }
    };
    /**
     * Xóa bộ thẻ
     */
    const handleDeleteDeck = async (deck, e) => {
        e.stopPropagation();
        if (window.confirm(`Bạn có chắc chắn muốn xóa bộ thẻ "${deck.title}" cùng toàn bộ thẻ bên trong không?`)) {
            try {
                await onDeleteDeck(deck.id);
            }
            catch (err) {
                alert(err.message || 'Không thể xóa bộ thẻ');
            }
        }
    };
    return (<div className="qc-community-body">
      {/* 1. Hero Banner matching Figma Community */}
      <HeroBanner />

      {/* 2. Filter Pills Bar */}
      <FilterPills selectedFilter={selectedFilter} onSelectFilter={setSelectedFilter} categories={categories} onOpenCreateCategory={onOpenCategories || (() => setIsCategoryModalOpen(true))} allCategoryNames={allCategoryNames} filterCounts={filterCounts}/>

      {/* 3. Section Title (Riffs >) */}
      <div className="qc-feed-header">
        <div className="qc-feed-title" onClick={() => setSelectedFilter('ALL')}>
          <span className="dl-feed-count">
            ({filteredDecks.length} bộ thẻ)
          </span>
        </div>

        <button onClick={openCreateDeckModal} className="dl-btn-create-deck-header">
          <Plus size={14}/>
          <span>Tạo Bộ Thẻ</span>
        </button>
      </div>

      {/* 4. Loading State */}
      {loading && (<div className="dl-loading">
          <div className="dl-loading-spinner"/>
          <span className="dl-loading-text">Đang tải danh sách bộ thẻ từ máy chủ...</span>
        </div>)}

      {/* 5. Cards Grid */}
      {!loading && (<div className="qc-card-grid">
          {/* Cards 2..N: Deck Cards */}
          {filteredDecks.map((deck, idx) => (<DeckCard key={deck.id} deck={deck} index={idx} onSelectStudy={onSelectDeckForStudy} onSelectQuiz={onSelectDeckForQuiz} onSelectCards={onSelectDeckForCards} onEditDeck={openEditDeckModal} onDeleteDeck={handleDeleteDeck}/>))}
        </div>)}

      {/* Empty State */}
      {!loading && filteredDecks.length === 0 && (<div className="dl-empty-state">
          <div className="dl-empty-title">
            Không tìm thấy bộ thẻ nào phù hợp
          </div>
          <p className="dl-empty-desc">
            Hãy thử tìm kiếm với từ khóa khác hoặc bấm nút bên dưới để tạo bộ thẻ mới.
          </p>
          <button onClick={openCreateDeckModal} className="dl-btn-empty-create">
            + Tạo Bộ Thẻ Mới
          </button>
        </div>)}

      {/* Floating '?' button */}
      <button className="qc-floating-help" onClick={() => setIsHelpOpen(true)} title="Hướng dẫn & Phím tắt">
        ?
      </button>

      {/* Modal Hướng dẫn Help & Shortcuts */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)}/>

      {/* ==================================================================== */}
      {/* MODAL 1: TẠO MỚI HOẶC CHỈNH SỬA BỘ THẺ */}
      {/* ==================================================================== */}
      {!onOpenCreateDeck && isDeckModalOpen && (<div className="modal-overlay" onClick={() => setIsDeckModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="dl-modal-title">
              {editingDeck ? 'Chỉnh Sửa Bộ Thẻ' : 'Tạo Bộ Thẻ Mới'}
            </h2>
            <p className="dl-modal-subtitle">
              {editingDeck ? 'Cập nhật tiêu đề, mô tả và phân loại bộ thẻ' : 'Nhập thông tin bộ thẻ flashcard và chọn phân loại chủ đề'}
            </p>

            {deckError && (<div className="dl-error-box">
                {deckError}
              </div>)}

            <form onSubmit={handleSubmitDeck}>
              {/* Tên bộ thẻ */}
              <div className="dl-form-field">
                <label className="dl-form-label">
                  Tên bộ thẻ <span className="dl-required">*</span>
                </label>
                <input type="text" placeholder="Ví dụ: COLLOCATIONS VỚI MAKE, Từ vựng IELTS..." value={title} onChange={(e) => setTitle(e.target.value)} autoFocus/>
              </div>

              {/* Phân loại bộ thẻ */}
              <div className="dl-form-field-cat">
                <div className="dl-cat-label-row">
                  <label className="dl-form-label">
                    Phân loại / Chủ đề
                  </label>
                  <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="dl-btn-quick-new-cat">
                    <Plus size={13}/>
                    <span>Tạo phân loại mới</span>
                  </button>
                </div>

                <input type="text" placeholder="Ví dụ: COLLOCATIONS, Lập trình, Tiếng Anh..." value={category} onChange={(e) => setCategory(e.target.value)} className="dl-cat-input"/>

                {/* Gợi ý phân loại */}
                <div className="dl-cat-suggest-row">
                  <span className="dl-cat-suggest-label">Gợi ý:</span>
                  {allCategoryNames.slice(0, 6).map((catName) => {
                const isSelected = category.trim().toLowerCase() === catName.toLowerCase();
                return (<button type="button" key={catName} onClick={() => setCategory(catName)} className={`dl-cat-suggest-btn ${isSelected ? 'active' : ''}`}>
                        {catName}
                      </button>);
            })}
                </div>
              </div>

              {/* Mô tả bộ thẻ */}
              <div className="dl-form-field-desc">
                <label className="dl-form-label">
                  Mô tả (tùy chọn)
                </label>
                <textarea rows={3} placeholder="Mô tả mục tiêu học tập, nguồn tài liệu hoặc ghi chú..." value={description} onChange={(e) => setDescription(e.target.value)}/>
              </div>

              <div className="dl-modal-actions">
                <button type="button" onClick={() => setIsDeckModalOpen(false)} className="dl-btn-cancel">
                  Hủy
                </button>
                <button type="submit" disabled={submittingDeck} className="dl-btn-submit">
                  {submittingDeck ? 'Đang lưu...' : editingDeck ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* ==================================================================== */}
      {/* MODAL 2: QUẢN LÝ VÀ TẠO PHÂN LOẠI BỘ THẺ */}
      {/* ==================================================================== */}
      {!onOpenCategories && isCategoryModalOpen && (<div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="modal-content dl-cat-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="dl-modal-header">
              <div>
                <h2 className="dl-cat-modal-title">
                  Quản Lý Phân Loại Bộ Thẻ
                </h2>
                <p className="dl-cat-modal-subtitle">
                  Tạo phân loại mới để dễ dàng sắp xếp và tìm kiếm các bộ thẻ
                </p>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="dl-btn-icon-close" title="Đóng">
                <X size={18}/>
              </button>
            </div>

            {categoryError && (<div className="dl-error-box">
                {categoryError}
              </div>)}

            {/* Form Thêm Phân Loại */}
            <form onSubmit={handleCreateCategorySubmit} className="dl-cat-form-box">
              <div className="dl-cat-form-row">
                <label className="dl-cat-form-label">
                  Tên phân loại <span className="dl-required">*</span>
                </label>
                <input type="text" placeholder="Ví dụ: Lập trình, Tiếng Anh, COLLOCATIONS..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="dl-cat-name-input"/>
              </div>

              {/* Emoji icon */}
              <div className="dl-cat-form-row">
                <label className="dl-cat-form-label">
                  Biểu tượng: <span className="dl-icon-preview">{newCatIcon}</span>
                </label>
                <div className="dl-icon-grid">
                  {SUGGESTED_ICONS.map((icon) => (<button type="button" key={icon} onClick={() => setNewCatIcon(icon)} className={`dl-icon-btn ${newCatIcon === icon ? 'selected' : ''}`}>
                      {icon}
                    </button>))}
                </div>
              </div>

              {/* Colors */}
              <div className="dl-form-field">
                <label className="dl-cat-form-label">
                  Màu sắc:
                </label>
                <div className="dl-color-row">
                  {SUGGESTED_COLORS.map((c) => (<button type="button" key={c} onClick={() => setNewCatColor(c)} className={`dl-color-btn ${newCatColor === c ? 'selected' : ''}`} style={{ backgroundColor: c }} title={c}/>))}
                </div>
              </div>

              <div className="dl-cat-form-submit-row">
                <button type="submit" disabled={submittingCategory} className="dl-btn-cat-submit">
                  {submittingCategory ? 'Đang tạo...' : '+ Tạo Phân Loại'}
                </button>
              </div>
            </form>

            {/* Danh sách phân loại */}
            <div>
              <h3 className="dl-cat-list-title">
                Danh sách phân loại ({categories.length}):
              </h3>

              <div className="dl-cat-list-container">
                {categories.map((cat) => {
                const count = filterCounts.categoryCounts[cat.name] || 0;
                return (<div key={cat.id} className="dl-cat-item">
                      <div className="dl-cat-item-left">
                        <span>{cat.icon || '📁'}</span>
                        <span className="dl-cat-item-name">{cat.name}</span>
                        <span className="dl-cat-item-count">({count} bộ thẻ)</span>
                      </div>

                      {cat.name !== 'Chung' && (<button onClick={() => handleDeleteCategoryClick(cat)} className="dl-btn-cat-delete" title="Xóa phân loại">
                          <Trash2 size={14}/>
                        </button>)}
                    </div>);
            })}
              </div>
            </div>

            <div className="dl-cat-modal-footer">
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="dl-btn-cat-close">
                Đóng
              </button>
            </div>
          </div>
        </div>)}
    </div>);
};
