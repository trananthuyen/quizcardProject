import React, { useState, useMemo } from 'react';
import {
  Globe,
  Search,
  X,
  Play,
  HelpCircle,
  Eye,
  Heart,
  Tag,
  BookOpen,
  Sparkles,
  Users,
  Compass,
} from 'lucide-react';
import { api } from '../api';
import './CommunityView.css';

// Preset avatar và tên tác giả minh họa cho các bộ thẻ hệ thống/cộng đồng
const CREATOR_PRESETS = [
  { name: 'Nastaran Jamali', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80', likes: 933 },
  { name: 'Hardik Gondhiya', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80', likes: 616 },
  { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80', likes: 512 },
  { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=80', likes: 340 },
  { name: 'QuizCard Team', avatar: '', likes: 785 },
];

export const CommunityView = ({
  decks = [],
  loading = false,
  currentUser = null,
  onSelectDeckForStudy,
  onSelectDeckForQuiz,
}) => {
  // Trạng thái tìm kiếm từ khóa
  const [searchQuery, setSearchQuery] = useState('');
  // Tag chủ đề đang chọn
  const [selectedTag, setSelectedTag] = useState('ALL');
  // Thứ tự sắp xếp
  const [sortBy, setSortBy] = useState('newest');

  // Trạng thái yêu thích (likes)
  const [likedDecks, setLikedDecks] = useState({});

  // Trạng thái Modal xem trước nội dung bộ thẻ
  const [previewDeck, setPreviewDeck] = useState(null);
  const [previewCards, setPreviewCards] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Danh sách an toàn bảo đảm là array
  const safeDecks = useMemo(() => (Array.isArray(decks) ? decks.filter(Boolean) : []), [decks]);

  // Trích xuất toàn bộ các tag chủ đề duy nhất từ các bộ thẻ công khai
  const allTags = useMemo(() => {
    const set = new Set();
    safeDecks.forEach((d) => {
      if (d?.tag && typeof d.tag === 'string') {
        d.tag.split(',').forEach((t) => {
          const clean = t.trim().toLowerCase();
          if (clean) set.add(clean);
        });
      }
    });
    return Array.from(set);
  }, [safeDecks]);

  // Đếm số lượng bộ thẻ theo từng tag chủ đề
  const tagCounts = useMemo(() => {
    const counts = {};
    safeDecks.forEach((d) => {
      if (d?.tag && typeof d.tag === 'string') {
        const uniqueTags = new Set(
          d.tag.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        );
        uniqueTags.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return counts;
  }, [safeDecks]);

  // Sắp xếp các tag từ cao đến thấp theo số lượng bộ thẻ, lấy tối đa 20 tag hiển thị
  const topTags = useMemo(() => {
    return [...allTags]
      .sort((a, b) => {
        const countA = tagCounts[a] || 0;
        const countB = tagCounts[b] || 0;
        if (countB !== countA) {
          return countB - countA; // Từ cao đến thấp
        }
        return a.localeCompare(b);
      })
      .slice(0, 20); // Nếu tổng số thẻ tag > 20 thì chỉ lấy 20 thẻ tag để hiển thị
  }, [allTags, tagCounts]);

  // Lọc và sắp xếp danh sách bộ thẻ hiển thị
  const filteredDecks = useMemo(() => {
    let list = safeDecks.filter((deck) => {
      if (!deck) return false;

      // 1. Lọc theo Tag chủ đề
      if (selectedTag !== 'ALL') {
        const filterLower = selectedTag.toLowerCase();
        const deckTags = (deck.tag || '')
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
        const hasTag = deckTags.includes(filterLower) || deckTags.some((t) => t.includes(filterLower));
        if (!hasTag) return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm (Tiêu đề, Mô tả, Tag)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (deck.title || '').toLowerCase().includes(q);
        const matchDesc = (deck.description || '').toLowerCase().includes(q);
        const matchTag = (deck.tag || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTag) return false;
      }

      return true;
    });

    // 3. Sắp xếp danh sách
    if (sortBy === 'most_cards') {
      list = [...list].sort((a, b) => (b?.totalCards || 0) - (a?.totalCards || 0));
    } else if (sortBy === 'title') {
      list = [...list].sort((a, b) => (a?.title || '').localeCompare(b?.title || ''));
    } else {
      // Mặc định: Mới nhất
      list = [...list].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    }

    return list;
  }, [safeDecks, selectedTag, searchQuery, sortBy]);

  // Xử lý bật/tắt yêu thích (like)
  const handleToggleLike = (deckId, initialCount, e) => {
    e.stopPropagation();
    setLikedDecks((prev) => {
      const isLiked = !!prev[deckId]?.liked;
      const count = prev[deckId]?.count !== undefined ? prev[deckId].count : initialCount;
      return {
        ...prev,
        [deckId]: {
          liked: !isLiked,
          count: !isLiked ? count + 1 : count - 1,
        },
      };
    });
  };

  // Mở modal xem trước danh sách thẻ của bộ bài
  const handleOpenPreview = async (deck, e) => {
    if (e) e.stopPropagation();
    setPreviewDeck(deck);
    setPreviewLoading(true);
    setPreviewCards([]);
    try {
      const cards = await api.getCards(deck.id);
      setPreviewCards(cards || []);
    } catch (err) {
      console.error('Không thể tải danh sách thẻ để xem trước:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Đóng modal xem trước
  const handleClosePreview = () => {
    setPreviewDeck(null);
    setPreviewCards([]);
  };

  return (
    <div className="cv-container">
      {/* ------------------------------------------------------------- */}
      {/* 1. Community Hero Header (Khu vực chào đón & Tìm kiếm)          */}
      {/* ------------------------------------------------------------- */}
      <div className="cv-hero">
        <div className="cv-hero-badge">
          <Globe size={13} />
          <span>Cộng Đồng Học Tập Mở</span>
        </div>

        <h1 className="cv-hero-title">Khám Phá &amp; Học Tập Bộ Thẻ Flashcard</h1>
        <p className="cv-hero-subtitle">
          Nơi tổng hợp các bộ thẻ công khai do cộng đồng người học và giáo viên chia sẻ.
          Chọn bất kỳ chủ đề nào để học lật thẻ ghi nhớ ngắt quãng (Spaced Repetition) và thi trắc nghiệm ngay!
        </p>


      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Dải lọc Tag theo chủ đề & Thanh sắp xếp                      */}
      {/* ------------------------------------------------------------- */}
      <div className="cv-filter-section">
        <div className="cv-filter-top-row">
          <div className="cv-filter-heading">
            <Tag size={15} className="cv-tag-header-icon" />
            <span>Chủ đề phổ biến</span>

            {/* Thanh tìm kiếm lớn nổi bật */}
            <div className="cv-search-bar">
              <Search size={18} className="cv-search-icon" />
              <input
                type="text"
                className="cv-search-input"
                placeholder="Tìm kiếm bộ thẻ theo tên, từ khóa hoặc tag chủ đề (#english, #toeic, #programming...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="cv-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Xóa tìm kiếm"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Dải các thẻ Tag tự động xuống dòng, sắp xếp từ cao đến thấp (tối đa 20 tag) */}
        <div className="cv-tags-wrap">
          {topTags.map((tagName) => {
            const count = tagCounts[tagName] || 0;
            const isSelected = selectedTag === tagName;
            return (
              <button
                type="button"
                key={tagName}
                className={`cv-tag-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedTag((prev) => (prev === tagName ? 'ALL' : tagName))}
                title={isSelected ? `Bỏ lọc #${tagName}` : `Lọc theo chủ đề #${tagName}`}
              >
                <span>#{tagName}</span>
                <span className="cv-tag-chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Lưới các bộ thẻ Community (Cards Grid)                      */}
      {/* ------------------------------------------------------------- */}
      {loading ? (
        <div className="cv-loading-state">
          <div className="dl-loading-spinner" style={{ margin: '0 auto 12px auto' }} />
          <span>Đang tải các bộ thẻ từ cộng đồng...</span>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="cv-empty-state">
          <div className="cv-empty-icon">
            <Search size={28} />
          </div>
          <div className="cv-empty-title">Không tìm thấy bộ thẻ cộng đồng phù hợp</div>
          <p className="cv-empty-desc">
            {searchQuery
              ? `Không có bộ thẻ nào khớp với từ khóa "${searchQuery}". Hãy thử tìm kiếm với từ khóa khác.`
              : 'Chưa có bộ thẻ nào thuộc chủ đề này.'}
          </p>
          {(searchQuery || selectedTag !== 'ALL') && (
            <button
              type="button"
              className="cv-btn-reset"
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('ALL');
              }}
            >
              Xem tất cả bộ thẻ
            </button>
          )}
        </div>
      ) : (
        <div className="cv-decks-grid">
          {filteredDecks.map((deck, idx) => {
            const preset = CREATOR_PRESETS[idx % CREATOR_PRESETS.length];
            const deckUserId = deck.userId || deck.UserId;
            const currentUserId = currentUser?.id || currentUser?.Id;
            const isOwner = Boolean(
              currentUserId &&
              deckUserId &&
              String(currentUserId).toLowerCase() === String(deckUserId).toLowerCase()
            );

            // Xử lý like
            const likeState = likedDecks[deck.id];
            const isLiked = likeState ? likeState.liked : false;
            const likesCount = likeState ? likeState.count : preset.likes;

            // Xử lý tags
            const tags = deck.tag
              ? deck.tag
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
              : [];

            return (
              <div key={deck.id} className="cv-card">
                {/* Phần trên cùng: Huy hiệu công khai & Nút Like */}
                <div className="cv-card-topbar">
                  <div className="cv-public-pill">
                    <Globe size={11} />
                    <span>Công khai</span>
                  </div>

                  <button
                    type="button"
                    className={`cv-like-button ${isLiked ? 'liked' : ''}`}
                    onClick={(e) => handleToggleLike(deck.id, preset.likes, e)}
                    title={isLiked ? 'Bỏ thích' : 'Yêu thích bộ thẻ này'}
                  >
                    <Heart
                      size={14}
                      fill={isLiked ? '#ef4444' : 'none'}
                      color={isLiked ? '#ef4444' : 'currentColor'}
                    />
                    <span>{likesCount}</span>
                  </button>
                </div>

                {/* Phần nội dung chính: Tiêu đề, Mô tả, Tags */}
                <div className="cv-card-body">
                  <h3 className="cv-card-title" title={deck.title}>
                    {deck.title}
                  </h3>

                  <p className="cv-card-desc">
                    {deck.description || 'Bộ thẻ kiến thức học tập phương pháp ngắt quãng do cộng đồng chia sẻ.'}
                  </p>

                  {/* Dải tags */}
                  {tags.length > 0 && (
                    <div className="cv-card-tags">
                      {tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="cv-card-tag"
                          onClick={() => setSelectedTag(t.toLowerCase())}
                          style={{ cursor: 'pointer' }}
                          title={`Xem các bộ thẻ chủ đề #${t}`}
                        >
                          #{t}
                        </span>
                      ))}
                      {tags.length > 4 && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          +{tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tác giả & Số lượng thẻ */}
                  <div className="cv-card-meta-row">
                    <div className="cv-author-info">
                      <div className="cv-author-avatar">
                        {preset.avatar ? (
                          <img src={preset.avatar} alt={preset.name} />
                        ) : (
                          <span>{preset.name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="cv-author-name" title={isOwner ? 'Bạn là người tạo' : preset.name}>
                        {isOwner ? '⭐ Bạn (Tác giả)' : preset.name}
                      </span>
                    </div>

                    <div className="cv-cards-count" title={`Gồm ${deck.totalCards || 0} thẻ flashcard`}>
                      <BookOpen size={13} />
                      <span>{deck.totalCards || 0} thẻ</span>
                    </div>
                  </div>
                </div>

                {/* Footer nút hành động: HỌC LẬT THẺ, THI TRẮC NGHIỆM, XEM TRƯỚC */}
                <div className="cv-card-actions">
                  <button
                    type="button"
                    className="cv-btn-study-main"
                    disabled={(deck.totalCards || 0) === 0}
                    onClick={() => onSelectDeckForStudy && onSelectDeckForStudy(deck)}
                    title="Bắt đầu học lật thẻ Flashcard 3D"
                  >
                    <Play size={15} fill="#ffffff" />
                    <span>Bắt Đầu Học Thẻ</span>
                  </button>

                  <div className="cv-secondary-actions-row">
                    <button
                      type="button"
                      className="cv-btn-quiz"
                      disabled={(deck.totalCards || 0) < 2}
                      onClick={() => onSelectDeckForQuiz && onSelectDeckForQuiz(deck)}
                      title={(deck.totalCards || 0) < 2 ? 'Cần tối thiểu 2 thẻ để thi trắc nghiệm' : 'Luyện thi trắc nghiệm 4 đáp án'}
                    >
                      <HelpCircle size={14} className="cv-btn-quiz-icon" />
                      <span>Thi Trắc Nghiệm</span>
                    </button>

                    <button
                      type="button"
                      className="cv-btn-preview"
                      onClick={(e) => handleOpenPreview(deck, e)}
                      title="Xem trước nội dung các thẻ có trong bộ"
                    >
                      <Eye size={14} className="cv-btn-preview-icon" />
                      <span>Xem trước</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. Modal Xem trước nội dung các thẻ trong bộ bài              */}
      {/* ------------------------------------------------------------- */}
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
                  if (onSelectDeckForQuiz) onSelectDeckForQuiz(previewDeck);
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
                  if (onSelectDeckForStudy) onSelectDeckForStudy(previewDeck);
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

