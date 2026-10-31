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
export const DeckList = ({
    decks,
    folders,
    categories,
    loading,
    currentUser = null,
    isCommunity = true,
    onCreateDeck,
    onUpdateDeck,
    onDeleteDeck,
    onCreateFolder,
    onDeleteFolder,
    onCreateCategory,
    onDeleteCategory,
    onSelectDeckForStudy,
    onSelectDeckForQuiz,
    onSelectDeckForCards,
    onOpenCreateDeck,
    onOpenEditDeck,
    onOpenFolders,
    onOpenCategories,
    searchQuery: externalSearchQuery,
    onSearchChange: externalOnSearchChange,
    selectedFilter: externalSelectedFilter,
    onSelectFilter: externalOnSelectFilter,
    isDeckModalOpen: externalIsDeckModalOpen,
    setIsDeckModalOpen: externalSetIsDeckModalOpen,
    isFolderModalOpen: externalIsFolderModalOpen,
    setIsFolderModalOpen: externalSetIsFolderModalOpen,
    isCategoryModalOpen: externalIsCategoryModalOpen,
    setIsCategoryModalOpen: externalSetIsCategoryModalOpen,
}) => {
    const folderList = folders || categories || [];
    const handleOpenFolders = onOpenFolders || onOpenCategories;
    // Trạng thái tìm kiếm
    const [internalSearchQuery, setInternalSearchQuery] = useState('');
    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
    const onSearchChange = externalOnSearchChange || setInternalSearchQuery;
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
    const [folder, setFolder] = useState('Chung');
    const [tag, setTag] = useState('');
    const [submittingDeck, setSubmittingDeck] = useState(false);
    const [deckError, setDeckError] = useState(null);
    // Trạng thái Modal Quản lý thư mục
    const [internalIsFolderModalOpen, setInternalIsFolderModalOpen] = useState(false);
    const isFolderModalOpen = externalIsFolderModalOpen !== undefined
        ? externalIsFolderModalOpen
        : (externalIsCategoryModalOpen !== undefined ? externalIsCategoryModalOpen : internalIsFolderModalOpen);
    const setIsFolderModalOpen = externalSetIsFolderModalOpen || externalSetIsCategoryModalOpen || setInternalIsFolderModalOpen;
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderDesc, setNewFolderDesc] = useState('');
    const [newFolderIcon, setNewFolderIcon] = useState('📁');
    const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
    const [submittingFolder, setSubmittingFolder] = useState(false);
    const [folderError, setFolderError] = useState(null);
    // Trạng thái Modal Trợ giúp (?)
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    /**
     * Danh sách tag chủ đề duy nhất từ các bộ thẻ trong Community
     */
    const allTags = useMemo(() => {
        const set = new Set();
        (decks || []).forEach((d) => {
            if (d.tag) {
                d.tag.split(',').forEach((t) => {
                    const clean = t.trim();
                    if (clean) set.add(clean.toLowerCase());
                });
            }
        });
        return Array.from(set);
    }, [decks]);

    /**
     * Danh sách tên thư mục gợi ý khi tạo/sửa bộ thẻ
     */
    const allFolderNames = useMemo(() => {
        const set = new Set();
        (folderList || []).forEach((c) => {
            if (c?.name && typeof c.name === 'string') {
                set.add(c.name.trim());
            }
        });
        (decks || []).forEach((d) => {
            const fName = d?.folder;
            if (fName && typeof fName === 'string' && fName.trim())
                set.add(fName.trim());
        });
        if (!set.has('Chung'))
            set.add('Chung');
        return Array.from(set);
    }, [folderList, decks]);

    /**
     * Đếm số lượng bộ thẻ theo từng tag chủ đề
     */
    const tagCounts = useMemo(() => {
        const counts = {};
        (decks || []).forEach((d) => {
            if (d.tag) {
                const uniqueTags = new Set(
                    d.tag.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
                );
                uniqueTags.forEach((t) => {
                    counts[t] = (counts[t] || 0) + 1;
                });
            }
        });
        return counts;
    }, [decks]);

    /**
     * Tính toán số lượng bộ thẻ cho từng bộ lọc
     */
    const filterCounts = useMemo(() => {
        const deckArr = decks || [];
        const total = deckArr.length;
        const studied = deckArr.filter((d) => (d.masteredCards + d.learningCards) > 0).length;
        const notStarted = deckArr.filter((d) => (d.masteredCards + d.learningCards) === 0).length;
        return { total, studied, notStarted };
    }, [decks]);

    /**
     * Lọc danh sách bộ thẻ hiển thị ở Community:
     * - Loại bỏ lọc theo thư mục (Folder)
     * - Thay vào đó: Lọc chính xác theo Tag chủ đề và Tìm kiếm từ khóa (Tiêu đề, Mô tả, Tag)
     */
    const filteredDecks = useMemo(() => {
        return (decks || []).filter((deck) => {
            // 1. Phân loại theo Trạng thái học hoặc Tag chủ đề
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
            else if (selectedFilter && selectedFilter !== 'ALL') {
                // Lọc theo tag chủ đề
                const filterLower = (selectedFilter || '').toLowerCase();
                const deckTags = (deck.tag || '')
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean);
                const hasTag = deckTags.includes(filterLower) || deckTags.some(t => t.includes(filterLower));
                if (!hasTag) {
                    return false;
                }
            }
            // 2. Tìm kiếm theo từ khóa (Tiêu đề, Mô tả và Tag - không dùng thư mục)
            if (searchQuery && searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTitle = (deck.title || '').toLowerCase().includes(q);
                const matchDesc = (deck.description || '').toLowerCase().includes(q);
                const matchTag = (deck.tag || '').toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchTag)
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
            setFolder(selectedFilter);
        }
        else {
            setFolder(folderList[0]?.name || 'Chung');
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
        setFolder(deck.folder || 'Chung');
        setTag(deck.tag || '');
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
            const targetFolder = folder.trim() || 'Chung';
            if (editingDeck) {
                await onUpdateDeck(editingDeck.id, { title, description, folder: targetFolder, tag: tag.trim() || undefined });
            }
            else {
                await onCreateDeck({ title, description, folder: targetFolder, tag: tag.trim() || undefined });
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
     * Submit form Tạo Thư Mục Mới
     */
    const handleCreateFolderSubmit = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) {
            setFolderError('Vui lòng nhập tên thư mục');
            return;
        }
        try {
            setSubmittingFolder(true);
            setFolderError(null);
            const createFn = onCreateFolder || onCreateCategory;
            if (!createFn) return;
            const created = await createFn({
                name: newFolderName.trim(),
                description: newFolderDesc.trim() || undefined,
                icon: newFolderIcon,
                color: newFolderColor,
            });
            setNewFolderName('');
            setNewFolderDesc('');
            setFolder(created.name);
        }
        catch (err) {
            setFolderError(err.message || 'Không thể tạo thư mục');
        }
        finally {
            setSubmittingFolder(false);
        }
    };
    /**
     * Xóa thư mục
     */
    const handleDeleteFolderClick = async (f) => {
        if (f.name === 'Chung') {
            alert('Không thể xóa thư mục mặc định "Chung"');
            return;
        }
        if (window.confirm(`Bạn có chắc chắn muốn xóa thư mục "${f.name}"? Các bộ thẻ thuộc thư mục này sẽ tự động chuyển về "Chung".`)) {
            try {
                const deleteFn = onDeleteFolder || onDeleteCategory;
                if (!deleteFn) return;
                await deleteFn(f.id);
                if (selectedFilter.toLowerCase() === f.name.toLowerCase()) {
                    setSelectedFilter('ALL');
                }
            }
            catch (err) {
                alert(err.message || 'Không thể xóa thư mục');
            }
        }
    };
    /**
     * Xóa bộ thẻ (chỉ người sở hữu mới được xóa)
     */
    const handleDeleteDeck = async (deck, e) => {
        e.stopPropagation();
        const deckUserId = deck?.userId || deck?.UserId;
        const currentUserId = currentUser?.id || currentUser?.Id;
        const isOwner = Boolean(
            currentUserId &&
            deckUserId &&
            String(currentUserId).toLowerCase() === String(deckUserId).toLowerCase()
        );
        if (!isOwner) {
            alert('Chỉ người sở hữu bộ thẻ mới có quyền xóa bộ thẻ này.');
            return;
        }
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

      {/* 2. Filter Pills Bar: Chế độ Tag theo chủ đề cho Community */}
      <FilterPills
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        allTags={allTags}
        tagCounts={tagCounts}
        filterCounts={filterCounts}
        mode="tag"
      />

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
          {filteredDecks.map((deck, idx) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              index={idx}
              isCommunity={isCommunity}
              currentUser={currentUser}
              onSelectStudy={onSelectDeckForStudy}
              onSelectQuiz={onSelectDeckForQuiz}
              onSelectCards={onSelectDeckForCards}
              onEditDeck={openEditDeckModal}
              onDeleteDeck={handleDeleteDeck}
            />
          ))}
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

              {/* Thư mục chứa bộ thẻ */}
              <div className="dl-form-field-cat">
                <div className="dl-cat-label-row">
                  <label className="dl-form-label">
                    Thư mục chứa (Folder)
                  </label>
                  <button type="button" onClick={() => setIsFolderModalOpen(true)} className="dl-btn-quick-new-cat">
                    <Plus size={13}/>
                    <span>Tạo thư mục mới</span>
                  </button>
                </div>

                <input type="text" placeholder="Ví dụ: Lập trình, Tiếng Anh, Từ vựng..." value={folder} onChange={(e) => setFolder(e.target.value)} className="dl-cat-input"/>

                {/* Gợi ý thư mục */}
                <div className="dl-cat-suggest-row">
                  <span className="dl-cat-suggest-label">Gợi ý:</span>
                  {allFolderNames.slice(0, 6).map((fName) => {
                const isSelected = folder.trim().toLowerCase() === fName.toLowerCase();
                return (<button type="button" key={fName} onClick={() => setFolder(fName)} className={`dl-cat-suggest-btn ${isSelected ? 'active' : ''}`}>
                        {fName}
                      </button>);
            })}
                </div>
              </div>

              {/* Tag phân loại bộ thẻ */}
              <div className="dl-form-field">
                <label className="dl-form-label">
                  Thẻ tag (phân cách bằng dấu phẩy)
                </label>
                <input type="text" placeholder="Ví dụ: english, toeic, ielts..." value={tag} onChange={(e) => setTag(e.target.value)}/>
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
      {/* MODAL 2: QUẢN LÝ VÀ TẠO THƯ MỤC BỘ THẺ */}
      {/* ==================================================================== */}
      {!handleOpenFolders && isFolderModalOpen && (<div className="modal-overlay" onClick={() => setIsFolderModalOpen(false)}>
          <div className="modal-content dl-cat-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="dl-modal-header">
              <div>
                <h2 className="dl-cat-modal-title">
                  Quản Lý Thư Mục (Folders)
                </h2>
                <p className="dl-cat-modal-subtitle">
                  Tạo thư mục mới để dễ dàng sắp xếp và quản lý các bộ thẻ
                </p>
              </div>
              <button onClick={() => setIsFolderModalOpen(false)} className="dl-btn-icon-close" title="Đóng">
                <X size={18}/>
              </button>
            </div>

            {folderError && (<div className="dl-error-box">
                {folderError}
              </div>)}

            {/* Form Thêm Thư Mục */}
            <form onSubmit={handleCreateFolderSubmit} className="dl-cat-form-box">
              <div className="dl-cat-form-row">
                <label className="dl-cat-form-label">
                  Tên thư mục <span className="dl-required">*</span>
                </label>
                <input type="text" placeholder="Ví dụ: Lập trình, Tiếng Anh..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="dl-cat-name-input"/>
              </div>

              {/* Emoji icon */}
              <div className="dl-cat-form-row">
                <label className="dl-cat-form-label">
                  Biểu tượng: <span className="dl-icon-preview">{newFolderIcon}</span>
                </label>
                <div className="dl-icon-grid">
                  {SUGGESTED_ICONS.map((icon) => (<button type="button" key={icon} onClick={() => setNewFolderIcon(icon)} className={`dl-icon-btn ${newFolderIcon === icon ? 'selected' : ''}`}>
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
                  {SUGGESTED_COLORS.map((c) => (<button type="button" key={c} onClick={() => setNewFolderColor(c)} className={`dl-color-btn ${newFolderColor === c ? 'selected' : ''}`} style={{ backgroundColor: c }} title={c}/>))}
                </div>
              </div>

              <div className="dl-cat-form-submit-row">
                <button type="submit" disabled={submittingFolder} className="dl-btn-cat-submit">
                  {submittingFolder ? 'Đang tạo...' : '+ Tạo Thư Mục'}
                </button>
              </div>
            </form>

            {/* Danh sách thư mục */}
            <div>
              <h3 className="dl-cat-list-title">
                Danh sách thư mục ({folderList.length}):
              </h3>

              <div className="dl-cat-list-container">
                {folderList.map((f) => {
                const count = filterCounts?.folderCounts?.[f.name] || 0;
                return (<div key={f.id} className="dl-cat-item">
                      <div className="dl-cat-item-left">
                        <span>{f.icon || '📁'}</span>
                        <span className="dl-cat-item-name">{f.name}</span>
                        <span className="dl-cat-item-count">({count} bộ thẻ)</span>
                      </div>

                      {f.name !== 'Chung' && (<button onClick={() => handleDeleteFolderClick(f)} className="dl-btn-cat-delete" title="Xóa thư mục">
                          <Trash2 size={14}/>
                        </button>)}
                    </div>);
            })}
              </div>
            </div>

            <div className="dl-cat-modal-footer">
              <button type="button" onClick={() => setIsFolderModalOpen(false)} className="dl-btn-cat-close">
                Đóng
              </button>
            </div>
          </div>
        </div>)}
    </div>);
};
