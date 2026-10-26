import React, { useState, useMemo } from 'react';
import { Trash2, X } from 'lucide-react';
import './DeckList.css';
// Bảng biểu tượng Emoji gợi ý chọn nhanh cho phân loại
const SUGGESTED_ICONS = ['💻', '🇬🇧', '🇯🇵', '🔬', '📚', '🎨', '🎵', '💼', '🧠', '📐', '⚽', '🌟', '💊', '📁'];
// Bảng màu gợi ý chọn nhanh cho phân loại
const SUGGESTED_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#64748b'];
export const CategoryModal = ({ isOpen, onClose, categories, decks, currentUser, onOpenLogin, onCreateCategory, onDeleteCategory, }) => {
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [newCatIcon, setNewCatIcon] = useState('💻');
    const [newCatColor, setNewCatColor] = useState('#3b82f6');
    const [submittingCategory, setSubmittingCategory] = useState(false);
    const [categoryError, setCategoryError] = useState(null);
    const categoryCounts = useMemo(() => {
        const counts = {};
        decks.forEach((d) => {
            const cat = d.category?.trim() || 'Chung';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [decks]);
    if (!isOpen)
        return null;
    const handleCreateCategorySubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            setCategoryError('Vui lòng đăng nhập để tạo phân loại bộ thẻ');
            onOpenLogin?.();
            return;
        }
        if (!newCatName.trim()) {
            setCategoryError('Vui lòng nhập tên phân loại');
            return;
        }
        try {
            setSubmittingCategory(true);
            setCategoryError(null);
            await onCreateCategory({
                name: newCatName.trim(),
                description: newCatDesc.trim() || undefined,
                icon: newCatIcon,
                color: newCatColor,
            });
            setNewCatName('');
            setNewCatDesc('');
        }
        catch (err) {
            setCategoryError(err?.message || 'Lỗi khi tạo phân loại');
        }
        finally {
            setSubmittingCategory(false);
        }
    };
    const handleDeleteCategoryClick = async (cat) => {
        const count = categoryCounts[cat.name] || 0;
        const msg = count > 0
            ? `Phân loại "${cat.name}" đang có ${count} bộ thẻ. Bạn có chắc muốn xóa không?`
            : `Bạn có chắc muốn xóa phân loại "${cat.name}" không?`;
        if (window.confirm(msg)) {
            try {
                await onDeleteCategory(cat.id);
            }
            catch (err) {
                alert(err?.message || 'Lỗi khi xóa phân loại');
            }
        }
    };
    return (<div className="modal-overlay" onClick={onClose}>
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
          <button onClick={onClose} className="dl-btn-icon-close" title="Đóng">
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
            const count = categoryCounts[cat.name] || 0;
            return (<div key={cat.id} className="dl-cat-item">
                  <div className="dl-cat-item-left">
                    <span>{cat.icon || '📁'}</span>
                    <span className="dl-cat-item-name">{cat.name}</span>
                    <span className="dl-cat-item-count">({count} bộ thẻ)</span>
                  </div>

                  {cat.name !== 'Chung' && cat.userId && cat.userId === currentUser?.id && (<button onClick={() => handleDeleteCategoryClick(cat)} className="dl-btn-cat-delete" title="Xóa phân loại">
                      <Trash2 size={14}/>
                    </button>)}
                </div>);
        })}
          </div>
        </div>

        <div className="dl-cat-modal-footer">
          <button type="button" onClick={onClose} className="dl-btn-cat-close">
            Đóng
          </button>
        </div>
      </div>
    </div>);
};
