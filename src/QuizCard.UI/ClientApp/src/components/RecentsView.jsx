import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  Play,
  HelpCircle,
  Eye,
  Trash2,
  Search,
  X,
  Compass,
  BookOpen,
  Calendar,
  Sparkles,
  Layers,
  Globe,
  Heart,
} from 'lucide-react';
import { api } from '../api';
import {
  fetchRecents,
  removeRecentItem,
  clearRecents,
  recordRecentDeck,
} from '../utils/recentStorage';
import './RecentsView.css';

// Hàm định dạng thời gian thân thiện (Relative Time)
function formatRelativeTime(dateString) {
  if (!dateString) return 'Gần đây';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Hôm qua';
    if (diffDay < 7) return `${diffDay} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'Gần đây';
  }
}

export const RecentsView = ({
  currentUser = null,
  onSelectDeckForStudy,
  onSelectDeckForQuiz,
  onNavigateToCommunity,
}) => {
  const [recents, setRecents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  // Trạng thái modal xem trước nội dung bộ thẻ
  const [previewDeck, setPreviewDeck] = useState(null);
  const [previewCards, setPreviewCards] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Tải danh sách recents
  const loadRecents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecents(currentUser);
      setRecents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải danh sách gần đây:', err);
      setRecents([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadRecents();

    // Lắng nghe sự kiện toàn cục khi có thay đổi recents (thích, xem, học, xóa)
    const handleRecentsChanged = () => {
      loadRecents();
    };
    window.addEventListener('quizcard:recents-changed', handleRecentsChanged);
    return () => {
      window.removeEventListener('quizcard:recents-changed', handleRecentsChanged);
    };
  }, [loadRecents]);

  // Xóa 1 mục khỏi danh sách gần đây
  const handleRemove = async (item, e) => {
    e.stopPropagation();
    if (!window.confirm(`Xóa bộ thẻ "${item.title}" khỏi danh sách gần đây?`)) return;

    await removeRecentItem(item.id, item.deckId, currentUser);
    setRecents((prev) => prev.filter((r) => r.id !== item.id && r.deckId !== item.deckId));
  };

  // Xóa toàn bộ danh sách gần đây
  const handleClearAll = async () => {
    if (recents.length === 0) return;
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử xem và học các bộ thẻ gần đây?')) return;

    await clearRecents(currentUser);
    setRecents([]);
  };

  // Mở modal xem trước
  const handleOpenPreview = async (item, e) => {
    if (e) e.stopPropagation();
    const deck = {
      id: item.deckId,
      title: item.title,
      description: item.description,
      folder: item.folder,
      tag: item.tag,
      totalCards: item.totalCards,
    };
    setPreviewDeck(deck);
    setPreviewLoading(true);
    setPreviewCards([]);
    try {
      const cards = await api.getCards(item.deckId);
      setPreviewCards(cards || []);
    } catch (err) {
      console.error('Không thể tải danh sách thẻ để xem trước:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewDeck(null);
    setPreviewCards([]);
  };

  // Tiếp tục học lật thẻ
  const handleStudy = (item) => {
    const deck = {
      id: item.deckId,
      title: item.title,
      description: item.description,
      folder: item.folder,
      tag: item.tag,
      totalCards: item.totalCards,
    };
    recordRecentDeck({ deck, actionType: 'STUDY', currentUser });
    if (onSelectDeckForStudy) onSelectDeckForStudy(deck);
  };

  // Tiếp tục thi trắc nghiệm
  const handleQuiz = (item) => {
    const deck = {
      id: item.deckId,
      title: item.title,
      description: item.description,
      folder: item.folder,
      tag: item.tag,
      totalCards: item.totalCards,
    };
    recordRecentDeck({ deck, actionType: 'QUIZ', currentUser });
    if (onSelectDeckForQuiz) onSelectDeckForQuiz(deck);
  };

  // Bộ lọc danh sách hiển thị
  const filteredRecents = useMemo(() => {
    return recents.filter((item) => {
      // 1. Lọc theo loại hành động (STUDY, QUIZ, VIEW)
      if (filterAction !== 'ALL') {
        const itemAction = (item.actionType || 'VIEW').toUpperCase();
        if (itemAction !== filterAction) return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchTag = (item.tag || '').toLowerCase().includes(q);
        const matchAuthor = (item.creatorName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTag && !matchAuthor) return false;
      }

      return true;
    });
  }, [recents, filterAction, searchQuery]);

  // Đếm theo từng phân loại
  const counts = useMemo(() => {
    const res = { ALL: recents.length, STUDY: 0, QUIZ: 0, VIEW: 0, LIKE: 0 };
    recents.forEach((r) => {
      const act = (r.actionType || 'VIEW').toUpperCase();
      if (res[act] !== undefined) res[act]++;
    });
    return res;
  }, [recents]);

  return (
    <div className="rv-container">
      {/* 1. Header Hero Banner */}
      <div className="rv-header">
        <div className="rv-header-left">
          <div className="rv-header-badge">
            <Clock size={13} />
            <span>Lịch Sử Hoạt Động</span>
          </div>
          <h1 className="rv-header-title">Bộ Thẻ Xem &amp; Học Gần Đây</h1>
          <p className="rv-header-subtitle">
            Theo dõi danh sách các bộ thẻ bạn đã xem trước hoặc luyện tập từ Cộng đồng.
            Dễ dàng quay lại tiếp tục ôn tập bất kỳ lúc nào để duy trì chuỗi ghi nhớ hiệu quả!
          </p>
        </div>

        <div className="rv-header-actions">
          {recents.length > 0 && (
            <button
              type="button"
              className="rv-btn-clear-all"
              onClick={handleClearAll}
              title="Xóa toàn bộ lịch sử xem/học"
            >
              <Trash2 size={14} />
              <span>Xóa tất cả</span>
            </button>
          )}

          {onNavigateToCommunity && (
            <button
              type="button"
              className="rv-btn-explore-comm"
              onClick={onNavigateToCommunity}
              title="Khám phá thêm bộ thẻ mới từ cộng đồng"
            >
              <Compass size={14} />
              <span>Khám phá Cộng đồng</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Thanh điều khiển Bộ lọc & Tìm kiếm */}
      {recents.length > 0 && (
        <div className="rv-controls-row">
          <div className="rv-filter-chips">
            <button
              type="button"
              className={`rv-chip ${filterAction === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterAction('ALL')}
            >
              <span>Tất cả</span>
              <span className="rv-chip-count">{counts.ALL}</span>
            </button>

            <button
              type="button"
              className={`rv-chip ${filterAction === 'STUDY' ? 'active' : ''}`}
              onClick={() => setFilterAction('STUDY')}
            >
              <BookOpen size={13} />
              <span>Đã học lật thẻ</span>
              <span className="rv-chip-count">{counts.STUDY}</span>
            </button>

            <button
              type="button"
              className={`rv-chip ${filterAction === 'QUIZ' ? 'active' : ''}`}
              onClick={() => setFilterAction('QUIZ')}
            >
              <HelpCircle size={13} />
              <span>Đã thi trắc nghiệm</span>
              <span className="rv-chip-count">{counts.QUIZ}</span>
            </button>

            <button
              type="button"
              className={`rv-chip ${filterAction === 'VIEW' ? 'active' : ''}`}
              onClick={() => setFilterAction('VIEW')}
            >
              <Eye size={13} />
              <span>Đã xem trước</span>
              <span className="rv-chip-count">{counts.VIEW}</span>
            </button>

            <button
              type="button"
              className={`rv-chip ${filterAction === 'LIKE' ? 'active' : ''}`}
              onClick={() => setFilterAction('LIKE')}
            >
              <Heart
                size={13}
                fill={filterAction === 'LIKE' ? '#ffffff' : '#ef4444'}
                color={filterAction === 'LIKE' ? '#ffffff' : '#ef4444'}
              />
              <span>Đã thích</span>
              <span className="rv-chip-count">{counts.LIKE || 0}</span>
            </button>
          </div>

          <div className="rv-search-box">
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              className="rv-search-input"
              placeholder="Tìm trong danh sách gần đây..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="rv-search-clear"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Danh sách các bộ thẻ gần đây */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div className="dl-loading-spinner" style={{ margin: '0 auto 12px auto' }} />
          <span>Đang tải các bộ thẻ gần đây...</span>
        </div>
      ) : filteredRecents.length === 0 ? (
        <div className="rv-empty-state">
          <div className="rv-empty-icon">
            <Clock size={32} />
          </div>
          <h3 className="rv-empty-title">
            {recents.length === 0
              ? 'Chưa có bộ thẻ nào được xem hoặc học gần đây'
              : 'Không có bộ thẻ nào khớp với bộ lọc'}
          </h3>
          <p className="rv-empty-desc">
            {recents.length === 0
              ? 'Khi bạn xem trước, học lật thẻ hoặc thi trắc nghiệm bất kỳ bộ thẻ nào từ Cộng đồng, hệ thống sẽ tự động lưu lại tại đây để bạn tiện theo dõi.'
              : 'Hãy thử xóa từ khóa tìm kiếm hoặc chọn bộ lọc hành động khác để hiển thị danh sách.'}
          </p>
          {recents.length === 0 && onNavigateToCommunity && (
            <button
              type="button"
              className="rv-btn-explore-large"
              onClick={onNavigateToCommunity}
            >
              <Compass size={16} />
              <span>Khám Phá Cộng Đồng Ngay</span>
            </button>
          )}
        </div>
      ) : (
        <div className="rv-grid">
          {filteredRecents.map((item) => {
            const action = (item.actionType || 'VIEW').toUpperCase();
            const tags = item.tag
              ? item.tag
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
              : [];

            return (
              <div key={item.id || item.deckId} className="rv-card">
                {/* Topbar: Badge hành động & Thời gian */}
                <div className="rv-card-topbar">
                  {action === 'STUDY' ? (
                    <span className="rv-action-badge rv-badge-study">
                      <BookOpen size={11} />
                      <span>Đã học lật thẻ</span>
                    </span>
                  ) : action === 'QUIZ' ? (
                    <span className="rv-action-badge rv-badge-quiz">
                      <HelpCircle size={11} />
                      <span>Đã thi trắc nghiệm</span>
                    </span>
                  ) : action === 'LIKE' ? (
                    <span className="rv-action-badge rv-badge-like">
                      <Heart size={11} fill="#ef4444" color="#ef4444" />
                      <span>Đã thích</span>
                    </span>
                  ) : (
                    <span className="rv-action-badge rv-badge-view">
                      <Eye size={11} />
                      <span>Đã xem trước</span>
                    </span>
                  )}

                  <div className="rv-card-top-right">
                    <span className="rv-time-tag" title={new Date(item.lastAccessedAt).toLocaleString()}>
                      <Clock size={11} />
                      {formatRelativeTime(item.lastAccessedAt)}
                    </span>
                    <button
                      type="button"
                      className="rv-btn-remove"
                      onClick={(e) => handleRemove(item, e)}
                      title="Xóa khỏi danh sách gần đây"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Nội dung thân thẻ */}
                <div className="rv-card-body">
                  <h3
                    className="rv-card-title"
                    title={item.title}
                    onClick={() => handleOpenPreview(item)}
                  >
                    {item.title}
                  </h3>

                  <p className="rv-card-desc">
                    {item.description || 'Bộ thẻ kiến thức học tập được chia sẻ từ cộng đồng.'}
                  </p>

                  {/* Dải tags */}
                  {tags.length > 0 && (
                    <div className="rv-card-tags">
                      {tags.slice(0, 3).map((t) => (
                        <span key={t} className="rv-card-tag">
                          #{t}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          +{tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tác giả & Số lượng thẻ */}
                  <div className="rv-card-meta">
                    <span className="rv-meta-author" title={item.creatorName || 'Cộng đồng chia sẻ'}>
                      <Globe size={12} color="#0d99ff" />
                      <span>{item.creatorName || 'Cộng đồng'}</span>
                    </span>

                    <span className="rv-meta-cards">
                      <Layers size={13} />
                      <span>{item.totalCards || 0} thẻ</span>
                    </span>
                  </div>
                </div>

                {/* Footer nút hành động */}
                <div className="rv-card-actions">
                  <button
                    type="button"
                    className="rv-btn-study-main"
                    onClick={() => handleStudy(item)}
                    title="Bắt đầu học lật thẻ Flashcard 3D"
                  >
                    <Play size={14} fill="#ffffff" />
                    <span>Học Lật Thẻ 3D</span>
                  </button>

                  <div className="rv-secondary-row">
                    <button
                      type="button"
                      className="rv-btn-quiz"
                      disabled={(item.totalCards || 0) < 2}
                      onClick={() => handleQuiz(item)}
                      title={(item.totalCards || 0) < 2 ? 'Cần tối thiểu 2 thẻ để thi trắc nghiệm' : 'Luyện thi trắc nghiệm 4 đáp án'}
                    >
                      <HelpCircle size={13} />
                      <span>Thi Trắc Nghiệm</span>
                    </button>

                    <button
                      type="button"
                      className="rv-btn-preview"
                      onClick={(e) => handleOpenPreview(item, e)}
                      title="Xem trước nội dung các thẻ"
                    >
                      <Eye size={13} />
                      <span>Xem trước</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal Xem trước nội dung các thẻ */}
      {previewDeck && (
        <div className="cv-preview-modal-overlay" onClick={handleClosePreview}>
          <div className="cv-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cv-preview-header">
              <div>
                <h3 className="cv-preview-title">{previewDeck.title}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Xem trước nội dung ({previewCards.length} thẻ)
                </span>
              </div>
              <button
                type="button"
                className="cv-preview-close"
                onClick={handleClosePreview}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cv-preview-cards-list">
              {previewLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <div className="dl-loading-spinner" style={{ margin: '0 auto 12px auto' }} />
                  <span>Đang tải các thẻ...</span>
                </div>
              ) : previewCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  Bộ thẻ này hiện chưa có thẻ nào.
                </div>
              ) : (
                previewCards.map((card, cIdx) => (
                  <div key={card.id || cIdx} className="cv-preview-card-item">
                    <div className="cv-preview-card-term">
                      <span style={{ color: '#0284c7', marginRight: '6px' }}>#{cIdx + 1}</span>
                      {card.term}
                    </div>
                    <div className="cv-preview-card-def">{card.definition}</div>
                    {card.example && (
                      <div className="cv-preview-card-example">
                        Ví dụ: {card.example}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="cv-preview-footer">
              <button
                type="button"
                className="cv-btn-quiz"
                disabled={previewCards.length < 2}
                onClick={() => {
                  handleClosePreview();
                  handleQuiz(previewDeck);
                }}
              >
                <HelpCircle size={14} className="cv-btn-quiz-icon" />
                <span>Thi Trắc Nghiệm</span>
              </button>

              <button
                type="button"
                className="cv-btn-study-main"
                style={{ width: 'auto', padding: '8px 20px' }}
                disabled={previewCards.length === 0}
                onClick={() => {
                  handleClosePreview();
                  handleStudy(previewDeck);
                }}
              >
                <Play size={14} fill="#ffffff" />
                <span>Bắt Đầu Học Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

