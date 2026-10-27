import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2,
  RotateCcw,
  Eye,
  AlertTriangle,
  Clock,
  BookOpen,
  Folder,
  Tag,
  ArrowLeft,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';
import './TrashView.css';

export const TrashView = ({ currentUser, onDeckRestored, onGoHome }) => {
  const [deletedDecks, setDeletedDecks] = useState([]);
  const [deletedCards, setDeletedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('decks'); // 'decks' | 'cards'

  // Modal xem chi tiết thẻ con của bộ bài đã xóa
  const [previewDeck, setPreviewDeck] = useState(null);
  const [previewCards, setPreviewCards] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Tải danh sách các mục trong thùng rác
  const loadTrash = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTrash(currentUser?.id);
      setDeletedDecks(data.decks || []);
      setDeletedCards(data.cards || []);
    } catch (err) {
      console.error('Lỗi khi tải thùng rác:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  // Khôi phục bộ thẻ
  const handleRestoreDeck = async (deck, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Bạn có muốn khôi phục bộ thẻ "${deck.title}" về kho học liệu?`)) {
      return;
    }

    try {
      setActionLoadingId(deck.id);
      await api.restoreDeckFromTrash(deck.id);
      await loadTrash();
      if (onDeckRestored) {
        onDeckRestored();
      }
      if (previewDeck?.id === deck.id) {
        setPreviewDeck(null);
      }
      alert(`Đã khôi phục thành công bộ thẻ "${deck.title}"!`);
    } catch (err) {
      alert(err.message || 'Lỗi khi khôi phục bộ thẻ');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Xóa vĩnh viễn bộ thẻ
  const handlePermanentDeleteDeck = async (deck, e) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(
      `CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN bộ thẻ "${deck.title}"?\n\nToàn bộ thẻ flashcard bên trong sẽ bị xóa khỏi cơ sở dữ liệu và KHÔNG THỂ KHÔI PHỤC được nữa.`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(deck.id);
      await api.permanentDeleteDeck(deck.id);
      await loadTrash();
      if (previewDeck?.id === deck.id) {
        setPreviewDeck(null);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa vĩnh viễn bộ thẻ');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dọn sạch toàn bộ thùng rác
  const handleEmptyTrash = async () => {
    const total = deletedDecks.length + deletedCards.length;
    if (total === 0) return;

    const confirmed = window.confirm(
      `CẢNH BÁO: Bạn có chắc muốn DỌN SẠCH THÙNG RÁC (${total} mục)?\n\nToàn bộ các bộ thẻ và thẻ flashcard trong thùng rác sẽ bị xóa vĩnh viễn ngay lập tức.`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await api.emptyTrash(currentUser?.id);
      await loadTrash();
      alert('Đã dọn sạch thùng rác thành công.');
    } catch (err) {
      alert(err.message || 'Lỗi khi dọn sạch thùng rác');
    } finally {
      setLoading(false);
    }
  };

  // Xem chi tiết thẻ của bộ đã xóa
  const handleOpenPreview = async (deck) => {
    setPreviewDeck(deck);
    setPreviewCards([]);
    setLoadingPreview(true);
    try {
      const data = await api.getTrashDeck(deck.id);
      setPreviewCards(data.cards || []);
    } catch (err) {
      console.error('Lỗi khi xem chi tiết thẻ thùng rác:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Khôi phục thẻ đơn lẻ
  const handleRestoreCard = async (card) => {
    try {
      setActionLoadingId(card.id);
      await api.restoreCardFromTrash(card.id);
      await loadTrash();
      if (onDeckRestored) onDeckRestored();
      alert(`Đã khôi phục thẻ "${card.term}" thành công!`);
    } catch (err) {
      alert(err.message || 'Không thể khôi phục thẻ');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Xóa vĩnh viễn thẻ đơn lẻ
  const handlePermanentDeleteCard = async (card) => {
    if (!window.confirm(`Xóa vĩnh viễn thẻ "${card.term}"? Thao tác không thể hoàn tác.`)) {
      return;
    }
    try {
      setActionLoadingId(card.id);
      await api.permanentDeleteCard(card.id);
      await loadTrash();
    } catch (err) {
      alert(err.message || 'Không thể xóa thẻ');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Lọc tìm kiếm
  const filteredDecks = deletedDecks.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (d.title || '').toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q) ||
      (d.folder || '').toLowerCase().includes(q) ||
      (d.tag || '').toLowerCase().includes(q)
    );
  });

  const filteredCards = deletedCards.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (c.term || '').toLowerCase().includes(q) ||
      (c.definition || '').toLowerCase().includes(q)
    );
  });

  const totalTrashCount = deletedDecks.length + deletedCards.length;

  return (
    <div className="tv-wrapper">
      {/* 1. Header Banner */}
      <div className="tv-header-card">
        <div className="tv-header-left">
          <div className="tv-header-icon-box">
            <Trash2 size={24} />
          </div>
          <div>
            <div className="tv-header-title-row">
              <h1 className="tv-header-title">Thùng Rác (Trash)</h1>
              <span className="tv-header-badge">
                <Clock size={12} />
                <span>Tự động xóa vĩnh viễn sau 5 ngày</span>
              </span>
            </div>
            <p className="tv-header-desc">
              Các bộ thẻ và thẻ flashcard đã xóa sẽ tạm lưu tại đây trong vòng 5 ngày. Trong thời gian này bạn có thể khôi phục bất cứ lúc nào.
            </p>
          </div>
        </div>

        <div className="tv-header-actions">
          <button
            type="button"
            className="tv-btn-refresh"
            onClick={loadTrash}
            disabled={loading}
            title="Tải lại danh sách"
          >
            <RefreshCw size={15} className={loading ? 'tv-spinning' : ''} />
            <span>Làm mới</span>
          </button>

          {totalTrashCount > 0 && (
            <button
              type="button"
              className="tv-btn-empty-trash"
              onClick={handleEmptyTrash}
              disabled={loading}
              title="Xóa tất cả các mục trong thùng rác ngay lập tức"
            >
              <Trash2 size={15} />
              <span>Dọn sạch thùng rác</span>
            </button>
          )}

          <button
            type="button"
            className="tv-btn-back"
            onClick={onGoHome}
            title="Quay lại Trang Chủ"
          >
            <ArrowLeft size={15} />
            <span>Quay lại</span>
          </button>
        </div>
      </div>

      {/* 2. Tabs chuyển đổi & Tìm kiếm (nếu có thẻ đơn lẻ hoặc có nhiều mục) */}
      <div className="tv-toolbar">
        <div className="tv-tabs-group">
          <button
            type="button"
            className={`tv-tab-btn ${activeTab === 'decks' ? 'active' : ''}`}
            onClick={() => setActiveTab('decks')}
          >
            <BookOpen size={15} />
            <span>Bộ thẻ đã xóa ({deletedDecks.length})</span>
          </button>

          {deletedCards.length > 0 && (
            <button
              type="button"
              className={`tv-tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
              onClick={() => setActiveTab('cards')}
            >
              <Sparkles size={15} />
              <span>Thẻ flashcard lẻ ({deletedCards.length})</span>
            </button>
          )}
        </div>

        {totalTrashCount > 0 && (
          <div className="tv-search-input-wrap">
            <input
              type="text"
              placeholder="Tìm kiếm trong thùng rác..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tv-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="tv-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Nội dung danh sách */}
      {loading ? (
        <div className="tv-loading-box">
          <div className="dl-loading-spinner" />
          <span>Đang kiểm tra và tải dữ liệu thùng rác...</span>
        </div>
      ) : activeTab === 'decks' ? (
        filteredDecks.length === 0 ? (
          <div className="tv-empty-box">
            <div className="tv-icon-circle">
              <Trash2 size={40} />
            </div>
            <h2 className="tv-title">
              {searchQuery ? 'Không tìm thấy bộ thẻ phù hợp trong thùng rác' : 'Thùng rác trống'}
            </h2>
            <p className="tv-desc">
              {searchQuery
                ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm.'
                : 'Hiện tại bạn không có bộ thẻ nào trong thùng rác. Các bộ thẻ bị xóa từ My Resources sẽ xuất hiện tại đây và được lưu tối đa 5 ngày.'}
            </p>
            <button type="button" className="tv-btn-home" onClick={onGoHome}>
              Quay lại Trang Chủ
            </button>
          </div>
        ) : (
          <div className="tv-deck-grid">
            {filteredDecks.map((deck) => {
              const isUrgent = deck.daysRemaining <= 1;
              const isBusy = actionLoadingId === deck.id;

              return (
                <div key={deck.id} className="tv-deck-card">
                  {/* Card Header: Thư mục & Tag */}
                  <div className="tv-deck-header">
                    <div className="tv-deck-pills">
                      <span className="tv-pill-folder">
                        <Folder size={12} />
                        <span>{deck.folder || 'Chung'}</span>
                      </span>
                      {deck.tag && (
                        <span className="tv-pill-tag">
                          <Tag size={11} />
                          <span>#{deck.tag.split(',')[0].trim()}</span>
                        </span>
                      )}
                    </div>

                    {/* Huy hiệu đếm ngược thời gian xóa vĩnh viễn */}
                    <div
                      className={`tv-expiry-badge ${isUrgent ? 'urgent' : ''}`}
                      title={`Đã xóa: ${new Date(deck.deletedAt).toLocaleString('vi-VN')}. Tự động xóa vĩnh viễn sau 5 ngày.`}
                    >
                      <Clock size={12} />
                      {deck.daysRemaining > 0 ? (
                        <span>Còn {deck.daysRemaining} ngày {deck.hoursRemaining}h</span>
                      ) : (
                        <span>Hết hạn sau {deck.hoursRemaining}h</span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="tv-deck-body">
                    <h3 className="tv-deck-title" title={deck.title}>
                      {deck.title}
                    </h3>
                    <p className="tv-deck-desc">
                      {deck.description || 'Không có mô tả chi tiết cho bộ thẻ này.'}
                    </p>

                    <div className="tv-deck-meta">
                      <span className="tv-meta-count">
                        <BookOpen size={13} />
                        <span>{deck.totalCards || 0} thẻ flashcard</span>
                      </span>
                      <span className="tv-meta-date">
                        Đã xóa: {new Date(deck.deletedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Các nút hành động */}
                  <div className="tv-deck-actions">
                    <button
                      type="button"
                      className="tv-btn-restore"
                      onClick={(e) => handleRestoreDeck(deck, e)}
                      disabled={isBusy}
                      title="Khôi phục bộ thẻ này về kho học liệu hoạt động"
                    >
                      <RotateCcw size={14} />
                      <span>{isBusy ? 'Đang khôi phục...' : 'Khôi phục'}</span>
                    </button>

                    <button
                      type="button"
                      className="tv-btn-preview-card"
                      onClick={() => handleOpenPreview(deck)}
                      title="Xem danh sách các thẻ có trong bộ thẻ này"
                    >
                      <Eye size={14} />
                      <span>Xem thẻ</span>
                    </button>

                    <button
                      type="button"
                      className="tv-btn-perm-delete"
                      onClick={(e) => handlePermanentDeleteDeck(deck, e)}
                      disabled={isBusy}
                      title="Xóa vĩnh viễn khỏi cơ sở dữ liệu ngay lập tức"
                    >
                      <Trash2 size={14} />
                      <span>Xóa vĩnh viễn</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Tab thẻ đơn lẻ */
        filteredCards.length === 0 ? (
          <div className="tv-empty-box">
            <h2 className="tv-title">Không có thẻ flashcard lẻ trong thùng rác</h2>
          </div>
        ) : (
          <div className="tv-cards-list">
            {filteredCards.map((card) => (
              <div key={card.id} className="tv-card-row">
                <div className="tv-card-row-content">
                  <div className="tv-card-row-term">{card.term}</div>
                  <div className="tv-card-row-def">{card.definition}</div>
                  {card.example && (
                    <div className="tv-card-row-ex">Ví dụ: {card.example}</div>
                  )}
                  <div className="tv-card-row-expiry">
                    ⏳ Còn {card.daysRemaining} ngày trước khi tự động xóa vĩnh viễn
                  </div>
                </div>

                <div className="tv-card-row-actions">
                  <button
                    type="button"
                    className="tv-btn-restore"
                    onClick={() => handleRestoreCard(card)}
                    disabled={actionLoadingId === card.id}
                  >
                    <RotateCcw size={13} />
                    <span>Khôi phục</span>
                  </button>

                  <button
                    type="button"
                    className="tv-btn-perm-delete"
                    onClick={() => handlePermanentDeleteCard(card)}
                    disabled={actionLoadingId === card.id}
                  >
                    <Trash2 size={13} />
                    <span>Xóa vĩnh viễn</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* 4. Modal Xem trước nội dung các thẻ của bộ bài đã xóa */}
      {previewDeck && (
        <div className="tv-modal-overlay" onClick={() => setPreviewDeck(null)}>
          <div className="tv-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="tv-modal-header">
              <div>
                <div className="tv-modal-badge">
                  <BookOpen size={13} />
                  <span>Xem chi tiết thẻ đã xóa</span>
                </div>
                <h3 className="tv-modal-title">{previewDeck.title}</h3>
                <span className="tv-modal-subtitle">
                  Gồm {previewCards.length} thẻ • Tự động xóa sau {previewDeck.daysRemaining} ngày
                </span>
              </div>
              <button
                type="button"
                className="tv-modal-close"
                onClick={() => setPreviewDeck(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="tv-modal-body">
              {loadingPreview ? (
                <div className="tv-modal-loading">
                  <div className="dl-loading-spinner" />
                  <span>Đang tải nội dung thẻ...</span>
                </div>
              ) : previewCards.length === 0 ? (
                <div className="tv-modal-empty">Bộ thẻ này không có flashcard nào.</div>
              ) : (
                <div className="tv-preview-cards-list">
                  {previewCards.map((card, idx) => (
                    <div key={card.id || idx} className="tv-preview-card-item">
                      <div className="tv-preview-card-num">Thẻ #{idx + 1}</div>
                      <div className="tv-preview-card-term">{card.term}</div>
                      <div className="tv-preview-card-def">{card.definition}</div>
                      {card.example && (
                        <div className="tv-preview-card-ex">Ví dụ: {card.example}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="tv-modal-footer">
              <button
                type="button"
                className="tv-btn-restore"
                onClick={() => handleRestoreDeck(previewDeck)}
              >
                <RotateCcw size={15} />
                <span>Khôi phục toàn bộ bộ thẻ</span>
              </button>

              <button
                type="button"
                className="tv-btn-perm-delete"
                onClick={() => handlePermanentDeleteDeck(previewDeck)}
              >
                <Trash2 size={15} />
                <span>Xóa vĩnh viễn</span>
              </button>

              <button
                type="button"
                className="tv-modal-btn-cancel"
                onClick={() => setPreviewDeck(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
