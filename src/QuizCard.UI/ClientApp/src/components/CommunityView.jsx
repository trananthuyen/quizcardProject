import React, { useState, useMemo, useEffect } from 'react';
import {
  Globe,
  X,
  Play,
  HelpCircle,
  Eye,
  Heart,
  Tag,
  BookOpen,
  Sparkles,
  Shuffle,
  Users,
  Compass,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { api } from '../api';
import { recordRecentDeck } from '../utils/recentStorage';
import { getSavedDeckIds, toggleSaveDeck } from '../utils/savedStorage';
import './CommunityView.css';

// Hàm tính số lượt thích ban đầu dựa trên mã bộ thẻ để duy trì tính nhất quán
const getInitialDeckLikes = (deckId) => {
  if (!deckId) return 120;
  let hash = 0;
  for (let i = 0; i < deckId.length; i++) {
    hash = (hash * 31 + deckId.charCodeAt(i)) & 0xffffffff;
  }
  return (Math.abs(hash) % 700) + 65;
};

/**
 * Thuật toán xáo trộn mảng ngẫu nhiên Fisher-Yates (Knuth Shuffle)
 * Độ phức tạp O(n), đảm bảo tính ngẫu nhiên đồng đều tuyệt đối cho mọi hoán vị
 */
const shuffleArray = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const CommunityView = ({
  decks = [],
  loading = false,
  currentUser = null,
  onSelectDeckForStudy,
  onSelectDeckForQuiz,
}) => {
  // Tag chủ đề đang chọn (Lọc danh sách, không dùng tìm kiếm)
  const [selectedTag, setSelectedTag] = useState('ALL');

  // Seed điều khiển xáo trộn ngẫu nhiên
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const handleReshuffle = () => {
    setShuffleSeed((prev) => prev + 1);
  };

  // Trạng thái yêu thích (likes)
  const [likedDecks, setLikedDecks] = useState({});

  // Trạng thái các bộ thẻ đã lưu (Bookmarks)
  const [savedDeckIds, setSavedDeckIds] = useState(() => getSavedDeckIds(currentUser));

  // Cập nhật danh sách ID đã lưu khi người dùng thay đổi hoặc có sự kiện lưu/bỏ lưu
  useEffect(() => {
    setSavedDeckIds(getSavedDeckIds(currentUser));
  }, [currentUser]);

  useEffect(() => {
    const handleSavedChange = () => {
      setSavedDeckIds(getSavedDeckIds(currentUser));
    };
    window.addEventListener('quizcard:saved-decks-changed', handleSavedChange);
    return () => window.removeEventListener('quizcard:saved-decks-changed', handleSavedChange);
  }, [currentUser]);

  // Xử lý lưu / bỏ lưu bộ thẻ vào My Resources
  const handleToggleSave = (deck, e) => {
    if (e) e.stopPropagation();
    toggleSaveDeck(deck, currentUser);
  };

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

  // 1. Lọc danh sách bộ thẻ theo Tag chủ đề (Lọc danh sách, không sử dụng tìm kiếm)
  const filteredDecks = useMemo(() => {
    if (selectedTag === 'ALL') {
      return safeDecks;
    }
    const filterLower = selectedTag.toLowerCase();
    return safeDecks.filter((deck) => {
      if (!deck) return false;
      const deckTags = (deck.tag || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      return deckTags.includes(filterLower) || deckTags.some((t) => t.includes(filterLower));
    });
  }, [safeDecks, selectedTag]);

  // 2. Tự động sắp xếp ngẫu nhiên danh sách bộ thẻ bằng thuật toán Fisher-Yates
  const displayedDecks = useMemo(() => {
    return shuffleArray(filteredDecks);
  }, [filteredDecks, shuffleSeed]);

  // Xử lý bật/tắt yêu thích (like) và ghi nhận vào Recents khi thích
  const handleToggleLike = (deck, initialCount, e) => {
    e.stopPropagation();
    if (!deck) return;
    const deckId = deck.id || deck.Id;
    if (!deckId) return;

    setLikedDecks((prev) => {
      const isLiked = !!prev[deckId]?.liked;
      const count = prev[deckId]?.count !== undefined ? prev[deckId].count : initialCount;
      const nextLiked = !isLiked;

      // Khi người dùng bấm thích (tim) -> ghi nhận vào Recents với actionType 'LIKE'
      if (nextLiked) {
        recordRecentDeck({ deck, actionType: 'LIKE', currentUser });
      }

      return {
        ...prev,
        [deckId]: {
          liked: nextLiked,
          count: nextLiked ? count + 1 : count - 1,
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
    // Ghi nhận lịch sử xem trước (VIEW) vào Recents
    recordRecentDeck({ deck, actionType: 'VIEW', currentUser });
    try {
      const cards = await api.getCards(deck.id);
      setPreviewCards(cards || []);
    } catch (err) {
      console.error('Không thể tải danh sách thẻ để xem trước:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Bắt đầu học lật thẻ và ghi nhận vào Recents
  const handleStartStudy = (deck) => {
    recordRecentDeck({ deck, actionType: 'STUDY', currentUser });
    if (onSelectDeckForStudy) onSelectDeckForStudy(deck);
  };

  // Bắt đầu thi trắc nghiệm và ghi nhận vào Recents
  const handleStartQuiz = (deck) => {
    recordRecentDeck({ deck, actionType: 'QUIZ', currentUser });
    if (onSelectDeckForQuiz) onSelectDeckForQuiz(deck);
  };

  // Đóng modal xem trước
  const handleClosePreview = () => {
    setPreviewDeck(null);
    setPreviewCards([]);
  };

  return (
    <div className="cv-container">
      {/* ------------------------------------------------------------- */}
      {/* 1. Community Hero Header (Khu vực chào đón)                     */}
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
      {/* 2. Dải lọc Tag theo chủ đề & Tự động sắp xếp ngẫu nhiên        */}
      {/* ------------------------------------------------------------- */}
      <div className="cv-filter-section">
        <div className="cv-filter-top-row">
          <div className="cv-filter-heading">
            <Tag size={16} className="cv-tag-header-icon" />
            <span>Lọc bộ thẻ theo chủ đề</span>
          </div>

        </div>

        {/* Dải các thẻ Tag tự động xuống dòng (Tối đa 20 tag + Thẻ Tất cả) */}
        <div className="cv-tags-wrap">
          <button
            type="button"
            className={`cv-tag-chip ${selectedTag === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedTag('ALL')}
            title="Xem tất cả bộ thẻ"
          >
            <span>Tất cả</span>
          </button>
          {topTags.map((tagName) => {
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
      ) : displayedDecks.length === 0 ? (
        <div className="cv-empty-state">
          <div className="cv-empty-icon">
            <Compass size={28} />
          </div>
          <div className="cv-empty-title">Không tìm thấy bộ thẻ cộng đồng phù hợp</div>
          <p className="cv-empty-desc">
            Chưa có bộ thẻ nào thuộc chủ đề này. Hãy chọn chủ đề khác để khám phá.
          </p>
          {selectedTag !== 'ALL' && (
            <button
              type="button"
              className="cv-btn-reset"
              onClick={() => setSelectedTag('ALL')}
            >
              Xem tất cả bộ thẻ
            </button>
          )}
        </div>
      ) : (
        <div className="cv-decks-grid">
          {displayedDecks.map((deck) => {
            const initialLikes = getInitialDeckLikes(deck.id);

            // Xử lý like
            const likeState = likedDecks[deck.id];
            const isLiked = likeState ? likeState.liked : false;
            const likesCount = likeState ? likeState.count : initialLikes;

            // Xử lý tags
            const tags = deck.tag
              ? deck.tag
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
              : [];

            const deckUserId = deck.userId || deck.UserId;
            const currentUserId = currentUser?.id || currentUser?.Id;
            const isOwner = Boolean(
              currentUserId &&
              deckUserId &&
              String(currentUserId).toLowerCase() === String(deckUserId).toLowerCase()
            );

            // Lấy tên thật của người tạo từ Database (hoặc tài khoản hiện tại nếu là chủ sở hữu)
            const rawAuthorName = deck.authorName || deck.AuthorName || (deckUserId ? 'Thành viên QuizCard' : 'QuizCard Team');
            const authorDisplayName = isOwner
              ? `${currentUser?.fullName || currentUser?.userName || rawAuthorName} (Tác giả)`
              : rawAuthorName;

            // Avatar thật của người tạo từ Database
            const authorAvatar = isOwner
              ? (currentUser?.avatarUrl || currentUser?.AvatarUrl || deck.authorAvatar || deck.AuthorAvatar || '')
              : (deck.authorAvatar || deck.AuthorAvatar || '');
            const authorInitial = authorDisplayName.replace(/[^a-zA-Z0-9À-ỹ]/g, '').charAt(0).toUpperCase() || 'Q';
            const isSaved = savedDeckIds.has(String(deck.id));

            return (
              <div key={deck.id} className="cv-card">
                {/* Phần trên cùng: Huy hiệu công khai & Nút Lưu & Nút Like */}
                <div className="cv-card-topbar">
                  <div className="cv-public-pill">
                    <Globe size={11} />
                    <span>Công khai</span>
                  </div>

                  <div className="cv-card-topbar-actions">
                    <button
                      type="button"
                      className={`cv-save-button ${isSaved ? 'saved' : ''}`}
                      onClick={(e) => handleToggleSave(deck, e)}
                      title={isSaved ? 'Bỏ lưu bộ thẻ này' : 'Lưu bộ thẻ vào My Resources (không thể sửa)'}
                    >
                      {isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                      <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
                    </button>

                    <button
                      type="button"
                      className={`cv-like-button ${isLiked ? 'liked' : ''}`}
                      onClick={(e) => handleToggleLike(deck, initialLikes, e)}
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
                </div>

                {/* Phần nội dung chính: Tiêu đề, Mô tả, Tags */}
                <div className="cv-card-body">
                  <h3 className="cv-card-title" title={deck.title}>
                    {deck.title}
                  </h3>

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
                        {authorAvatar ? (
                          <img src={authorAvatar} alt={authorDisplayName} />
                        ) : (
                          <span>{authorInitial}</span>
                        )}
                      </div>
                      <span className="cv-author-name" title={authorDisplayName}>
                        {isOwner ? `⭐ ${authorDisplayName}` : authorDisplayName}
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
                    onClick={() => handleStartStudy(deck)}
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
                      onClick={() => handleStartQuiz(deck)}
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
                className={`cv-save-button cv-preview-save-btn ${previewDeck && savedDeckIds.has(String(previewDeck.id)) ? 'saved' : ''}`}
                onClick={(e) => handleToggleSave(previewDeck, e)}
                title={previewDeck && savedDeckIds.has(String(previewDeck.id)) ? 'Bỏ lưu bộ thẻ này' : 'Lưu bộ thẻ vào My Resources (không thể sửa)'}
              >
                {previewDeck && savedDeckIds.has(String(previewDeck.id)) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                <span>{previewDeck && savedDeckIds.has(String(previewDeck.id)) ? 'Đã lưu' : 'Lưu bộ thẻ'}</span>
              </button>

              <button
                type="button"
                className="cv-btn-quiz"
                disabled={previewCards.length < 2}
                onClick={() => {
                  handleClosePreview();
                  handleStartQuiz(previewDeck);
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
                  handleStartStudy(previewDeck);
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
