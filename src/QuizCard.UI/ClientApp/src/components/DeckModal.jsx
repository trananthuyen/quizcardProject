import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Tag as TagIcon, Folder as FolderIcon } from 'lucide-react';
import './DeckList.css';

// Các tag gợi ý phổ biến cho người dùng chọn nhanh
const POPULAR_TAGS = ['english', 'toeic', 'ielts', 'programming', 'csharp', 'dotnet', 'frontend', 'backend', 'science', 'collocations'];

export const DeckModal = ({
    isOpen,
    onClose,
    onSubmit,
    editingDeck,
    folders = [],
    decks = [],
    defaultFolder = 'Chung',
    onOpenFolderModal,
}) => {
    const folderList = folders || [];
    const openFolderModal = onOpenFolderModal;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [folder, setFolder] = useState(defaultFolder);
    const [tag, setTag] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Danh sách các tên thư mục gợi ý
    const allFolderNames = useMemo(() => {
        const set = new Set();
        (folderList || []).forEach((f) => {
            if (f?.name && typeof f.name === 'string') {
                set.add(f.name.trim());
            }
        });
        (decks || []).forEach((d) => {
            const fName = d?.folder;
            if (fName && typeof fName === 'string' && fName.trim()) {
                set.add(fName.trim());
            }
        });
        if (!set.has('Chung'))
            set.add('Chung');
        return Array.from(set);
    }, [folderList, decks]);

    useEffect(() => {
        if (isOpen) {
            if (editingDeck) {
                setTitle(editingDeck.title || '');
                setDescription(editingDeck.description || '');
                setFolder(editingDeck.folder || 'Chung');
                setTag(editingDeck.tag || '');
                setIsPublic(editingDeck.isPublic !== false);
            }
            else {
                setTitle('');
                setDescription('');
                setFolder(defaultFolder || (folderList[0]?.name ?? 'Chung'));
                setTag('');
                setIsPublic(true);
            }
            setError(null);
        }
    }, [isOpen, editingDeck, defaultFolder, folderList]);

    if (!isOpen)
        return null;

    const handleAddSuggestedTag = (suggestedTag) => {
        const currentTags = tag
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        if (!currentTags.includes(suggestedTag)) {
            currentTags.push(suggestedTag);
            setTag(currentTags.join(', '));
        }
    };

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
                folder: folder.trim() || 'Chung',
                tag: tag.trim() || undefined,
                isPublic,
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
                ? 'Cập nhật tiêu đề, mô tả, thư mục chứa và thẻ tag'
                : 'Nhập thông tin bộ thẻ, chọn thư mục quản lý và gắn thẻ tag phân loại'}
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
            <input type="text" placeholder="Ví dụ: COLLOCATIONS VỚI MAKE, 3000 Từ vựng TOEIC..." value={title} onChange={(e) => setTitle(e.target.value)} autoFocus/>
          </div>

          {/* 1. Thư mục chứa bộ thẻ (Folder) */}
          <div className="dl-form-field-cat">
            <div className="dl-cat-label-row">
              <label className="dl-form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FolderIcon size={14} color="#3b82f6" />
                <span>Thư mục (Folder)</span>
              </label>
              {openFolderModal && (<button type="button" onClick={() => {
                onClose();
                openFolderModal();
            }} className="dl-btn-quick-new-cat">
                  <Plus size={13}/>
                  <span>Tạo thư mục mới</span>
                </button>)}
            </div>

            <input type="text" placeholder="Ví dụ: Tiếng Anh, Lập trình, Ôn thi..." value={folder} onChange={(e) => setFolder(e.target.value)} className="dl-cat-input"/>

            {/* Gợi ý thư mục */}
            <div className="dl-cat-suggest-row">
              <span className="dl-cat-suggest-label">Gợi ý thư mục:</span>
              {allFolderNames.slice(0, 6).map((fName) => {
                const isSelected = folder.trim().toLowerCase() === fName.toLowerCase();
                return (<button type="button" key={fName} onClick={() => setFolder(fName)} className={`dl-cat-suggest-btn ${isSelected ? 'active' : ''}`}>
                        {fName}
                      </button>);
              })}
            </div>
          </div>

          {/* 2. Thẻ Tag phân loại (Tag) */}
          <div className="dl-form-field" style={{ marginTop: '14px' }}>
            <div className="dl-cat-label-row">
              <label className="dl-form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <TagIcon size={14} color="#10b981" />
                <span>Thẻ Tag (Phân loại nội dung deck)</span>
              </label>
            </div>
            <input
              type="text"
              placeholder="Ví dụ: english, toeic, ielts hoặc csharp, backend..."
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="dl-cat-input"
            />
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
              Nhập các tag cách nhau bằng dấu phẩy để phân loại deck (vd: english, toeic, ielts)
            </p>

            {/* Gợi ý Tag chọn nhanh */}
            <div className="dl-cat-suggest-row" style={{ marginTop: '6px' }}>
              <span className="dl-cat-suggest-label">Tag gợi ý:</span>
              {POPULAR_TAGS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => handleAddSuggestedTag(t)}
                  className="dl-cat-suggest-btn"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  +{t}
                </button>
              ))}
            </div>
          </div>

          {/* Mô tả bộ thẻ */}
          <div className="dl-form-field-desc" style={{ marginTop: '14px' }}>
            <label className="dl-form-label">Mô tả (tùy chọn)</label>
            <textarea rows={3} placeholder="Mô tả mục tiêu học tập, nguồn tài liệu hoặc ghi chú..." value={description} onChange={(e) => setDescription(e.target.value)}/>
          </div>

          {/* Tùy chọn chia sẻ tới Community */}
          <div style={{ marginTop: '16px', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Chia sẻ tới Community</span>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '999px', backgroundColor: isPublic ? '#dbeafe' : '#f1f5f9', color: isPublic ? '#1d4ed8' : '#64748b' }}>
                  {isPublic ? 'Công khai' : 'Riêng tư'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>
                {isPublic ? 'Cho phép mọi người trên Community nhìn thấy và cùng học bộ thẻ này' : 'Chỉ mình bạn nhìn thấy trong kho học liệu cá nhân'}
              </p>
            </div>
            <label className="cm-switch" style={{ margin: 0, flexShrink: 0 }}>
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}/>
              <span className="cm-slider"></span>
            </label>
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
