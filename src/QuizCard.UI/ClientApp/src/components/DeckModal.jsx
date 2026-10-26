import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import './DeckList.css';
export const DeckModal = ({ isOpen, onClose, onSubmit, editingDeck, categories, decks, defaultCategory = 'Chung', onOpenCategoryModal, }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(defaultCategory);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    // Danh sách các tên category gợi ý
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
    useEffect(() => {
        if (isOpen) {
            if (editingDeck) {
                setTitle(editingDeck.title);
                setDescription(editingDeck.description || '');
                setCategory(editingDeck.category || 'Chung');
            }
            else {
                setTitle('');
                setDescription('');
                setCategory(defaultCategory || (categories[0]?.name ?? 'Chung'));
            }
            setError(null);
        }
    }, [isOpen, editingDeck, defaultCategory, categories]);
    if (!isOpen)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Vui lòng nhập tên bộ thẻ');
            return;
        }
        try {
            setSubmitting(true);
            setError(null);
            await onSubmit({
                title: title.trim(),
                description: description.trim() || undefined,
                category: category.trim() || 'Chung',
            });
            onClose();
        }
        catch (err) {
            setError(err?.message || 'Đã có lỗi xảy ra');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="dl-modal-title">
              {editingDeck ? 'Chỉnh Sửa Bộ Thẻ' : 'Tạo Bộ Thẻ Mới'}
            </h2>
            <p className="dl-modal-subtitle">
              {editingDeck
                ? 'Cập nhật tiêu đề, mô tả và phân loại bộ thẻ'
                : 'Nhập thông tin bộ thẻ flashcard và chọn phân loại chủ đề'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="dl-btn-icon-close" title="Đóng" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
            <X size={20}/>
          </button>
        </div>

        {error && <div className="dl-error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
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
              <label className="dl-form-label">Phân loại / Chủ đề</label>
              {onOpenCategoryModal && (<button type="button" onClick={() => {
                onClose();
                onOpenCategoryModal();
            }} className="dl-btn-quick-new-cat">
                  <Plus size={13}/>
                  <span>Tạo phân loại mới</span>
                </button>)}
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
            <label className="dl-form-label">Mô tả (tùy chọn)</label>
            <textarea rows={3} placeholder="Mô tả mục tiêu học tập, nguồn tài liệu hoặc ghi chú..." value={description} onChange={(e) => setDescription(e.target.value)}/>
          </div>

          <div className="dl-modal-actions">
            <button type="button" onClick={onClose} className="dl-btn-cancel">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="dl-btn-submit">
              {submitting ? 'Đang lưu...' : editingDeck ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>);
};
