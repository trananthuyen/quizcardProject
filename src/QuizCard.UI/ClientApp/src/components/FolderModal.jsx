import React, { useState, useMemo } from 'react';
import { Trash2, X, Folder as FolderIcon } from 'lucide-react';
import './FolderModal.css';

// Bảng biểu tượng Emoji gợi ý chọn nhanh cho thư mục
const SUGGESTED_ICONS = ['📁', '💻', '🇬🇧', '🇯🇵', '🔬', '📚', '🎨', '🎵', '💼', '🧠', '📐', '⚽', '🌟', '💊'];
// Bảng màu gợi ý chọn nhanh cho thư mục
const SUGGESTED_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#64748b'];

export const FolderModal = ({
    isOpen,
    onClose,
    folders = [],
    decks = [],
    currentUser,
    onOpenLogin,
    onCreateFolder,
    onDeleteFolder,
}) => {
    const folderList = useMemo(() => {
        if (!currentUser) {
            return (folders || []).filter((f) => !f.userId);
        }
        return (folders || []).filter((f) => !f.userId || f.userId === currentUser.id);
    }, [folders, currentUser]);

    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderDesc, setNewFolderDesc] = useState('');
    const [newFolderIcon, setNewFolderIcon] = useState('📁');
    const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
    const [submittingFolder, setSubmittingFolder] = useState(false);
    const [folderError, setFolderError] = useState(null);

    const folderDeckCounts = useMemo(() => {
        const counts = {};
        decks.forEach((d) => {
            const fName = d.folder?.trim() || 'Chung';
            counts[fName] = (counts[fName] || 0) + 1;
        });
        return counts;
    }, [decks]);

    if (!isOpen) return null;

    const handleCreateFolderSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            setFolderError('Vui lòng đăng nhập để tạo thư mục bộ thẻ');
            onOpenLogin?.();
            return;
        }
        if (!newFolderName.trim()) {
            setFolderError('Vui lòng nhập tên thư mục');
            return;
        }
        try {
            setSubmittingFolder(true);
            setFolderError(null);
            await onCreateFolder({
                name: newFolderName.trim(),
                description: newFolderDesc.trim() || undefined,
                icon: newFolderIcon,
                color: newFolderColor,
            });
            setNewFolderName('');
            setNewFolderDesc('');
        } catch (err) {
            setFolderError(err?.message || 'Lỗi khi tạo thư mục');
        } finally {
            setSubmittingFolder(false);
        }
    };

    const handleDeleteFolderClick = async (folderItem) => {
        const count = folderDeckCounts[folderItem.name] || 0;
        const msg = count > 0
            ? `Thư mục "${folderItem.name}" đang chứa ${count} bộ thẻ. Các bộ thẻ sẽ được chuyển về thư mục "Chung". Bạn có chắc muốn xóa không?`
            : `Bạn có chắc muốn xóa thư mục "${folderItem.name}" không?`;
        if (window.confirm(msg)) {
            try {
                await onDeleteFolder(folderItem.id);
            } catch (err) {
                alert(err?.message || 'Lỗi khi xóa thư mục');
            }
        }
    };

    return (
        <div className="fm-modal-overlay" onClick={onClose}>
            <div className="fm-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header Modal */}
                <div className="fm-modal-header">
                    <div>
                        <h2 className="fm-modal-title">
                            <FolderIcon size={20} color="#0d99ff" />
                            <span>Quản Lý Thư Mục (Folder)</span>
                        </h2>
                        <p className="fm-modal-subtitle">
                            Tạo và phân chia thư mục để bạn dễ dàng gom nhóm, quản lý các bộ thẻ
                        </p>
                    </div>
                    <button onClick={onClose} className="fm-btn-close" title="Đóng">
                        <X size={17} />
                    </button>
                </div>

                {/* Body cuộn mượt khi màn hình nhỏ */}
                <div className="fm-modal-body">
                    {folderError && (
                        <div className="fm-error-box">
                            {folderError}
                        </div>
                    )}

                    {/* Form Tạo Thư Mục Mới (Thiết kế compact tiết kiệm diện tích) */}
                    <form onSubmit={handleCreateFolderSubmit} className="fm-form-box">
                        <div>
                            <label className="fm-form-label">
                                Tên thư mục <span className="fm-required">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Ví dụ: Tiếng Anh K12, Lập trình C#, Dự án tốt nghiệp..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="fm-input-text"
                            />
                        </div>

                        {/* Hàng ngang 2 cột: Icon và Color */}
                        <div className="fm-compact-row">
                            <div>
                                <div className="fm-icon-header">
                                    <span>Biểu tượng:</span>
                                    <span className="fm-icon-preview">{newFolderIcon}</span>
                                </div>
                                <div className="fm-icon-palette">
                                    {SUGGESTED_ICONS.map((icon) => (
                                        <button
                                            type="button"
                                            key={icon}
                                            onClick={() => setNewFolderIcon(icon)}
                                            className={`fm-icon-btn ${newFolderIcon === icon ? 'selected' : ''}`}
                                            title={icon}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="fm-icon-header">
                                    <span>Màu sắc:</span>
                                </div>
                                <div className="fm-color-palette">
                                    {SUGGESTED_COLORS.map((c) => (
                                        <button
                                            type="button"
                                            key={c}
                                            onClick={() => setNewFolderColor(c)}
                                            className={`fm-color-btn ${newFolderColor === c ? 'selected' : ''}`}
                                            style={{ backgroundColor: c }}
                                            title={c}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Hàng Mô tả kết hợp Nút Tạo Thư Mục inline */}
                        <div className="fm-desc-action-row">
                            <input
                                type="text"
                                placeholder="Mô tả mục tiêu thư mục (tùy chọn)..."
                                value={newFolderDesc}
                                onChange={(e) => setNewFolderDesc(e.target.value)}
                                className="fm-input-text"
                            />
                            <button
                                type="submit"
                                disabled={submittingFolder}
                                className="fm-btn-submit"
                            >
                                {submittingFolder ? 'Đang tạo...' : '+ Tạo Thư Mục'}
                            </button>
                        </div>
                    </form>

                    {/* Danh sách Thư mục đã có */}
                    <div className="fm-list-section">
                        <h3 className="fm-list-title">
                            Danh sách thư mục ({folderList.length}):
                        </h3>

                        <div className="fm-list-container">
                            {folderList.map((fItem) => {
                                const count = folderDeckCounts[fItem.name] || 0;
                                const isOwner = fItem.name !== 'Chung' && fItem.userId && fItem.userId === currentUser?.id;

                                return (
                                    <div key={fItem.id || fItem.name} className="fm-folder-item">
                                        <div className="fm-folder-item-left">
                                            <span className="fm-folder-item-icon">{fItem.icon || '📁'}</span>
                                            <span className="fm-folder-item-name">{fItem.name}</span>
                                            <span className="fm-folder-item-count">({count} bộ thẻ)</span>
                                        </div>

                                        {isOwner && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteFolderClick(fItem)}
                                                className="fm-btn-delete"
                                                title="Xóa thư mục"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="fm-modal-footer">
                    <button type="button" onClick={onClose} className="fm-btn-close-footer">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
