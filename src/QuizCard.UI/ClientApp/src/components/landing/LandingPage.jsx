import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  Heart,
  Play,
  HelpCircle,
  Eye,
  Layers,
  Sparkles,
  Clock,
  Flame,
  Award,
  Globe,
  ShieldCheck,
  ArrowUp,
  RefreshCw,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  X,
} from 'lucide-react';
import {
  HelloKittyFace,
  CinnamorollFace,
  PompompurinFace,
  BadtzMaruFace,
} from './HelloKittyIllustrations';
import { VideoPreviewModal } from './VideoPreviewModal';
import { api } from '../../api';
import { recordRecentDeck } from '../../utils/recentStorage';
import { getSavedDeckIds, toggleSaveDeck } from '../../utils/savedStorage';
import quizLibraryLogo from '../../assets/Image_quizlibrary.png';
import '../CommunityView.css';
import './LandingPage.css';

/**
 * Thuật toán xáo trộn mảng ngẫu nhiên Fisher-Yates (Knuth Shuffle)
 * Đảm bảo chọn ngẫu nhiên đồng đều khi lấy 3 thẻ Decks và 3 Videos từ Backend
 */
const shuffleArray = (array) => {
  if (!Array.isArray(array)) return [];
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickRandomItems = (items, count = 3) => {
  return shuffleArray(items).slice(0, count);
};

const getInitialDeckLikes = (deckId) => {
  if (!deckId) return 120;
  const str = String(deckId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  return (Math.abs(hash) % 700) + 65;
};

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '04:15';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const resolveVideoThumbnail = (v) => {
  if (v.thumbnailUrl) return v.thumbnailUrl;
  const srcUrl = v.secureUrl || v.url || '';
  if (srcUrl.includes('cloudinary.com') && /\.(mp4|webm|mov|mkv|avi|m4v)(\?.*)?$/i.test(srcUrl)) {
    return srcUrl.replace(/\.(mp4|webm|mov|mkv|avi|m4v)(\?.*)?$/i, '.jpg');
  }
  return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';
};

const mapBackendVideo = (v) => {
  return {
    ...v,
    id: v.publicId || v.id,
    title: v.title || 'Bài giảng video QuizLibrary',
    description: v.description || 'Bài giảng video tương tác kèm phụ đề song ngữ trên QuizLibrary.',
    author: v.createdBy || 'QuizLibrary Studio',
    duration: formatDuration(v.duration),
    thumbnail: resolveVideoThumbnail(v),
    videoUrl: v.secureUrl || v.url,
    secureUrl: v.secureUrl,
    vttEnText: v.vttEnText,
    vttEnUrl: v.vttEnUrl,
    vttViText: v.vttViText,
    vttViUrl: v.vttViUrl,
  };
};

const CURRENT_YEAR = new Date().getFullYear();

export const LandingPage = ({
  currentUser = null,
  onSelectDeckForStudy,
  onSelectDeckForQuiz,
  onOpenCreateDeck: _onOpenCreateDeck,
  onNavigateTab,
  onStartLearning,
  onOpenVideoLesson,
}) => {
  // Điều hướng chuyển sang trang Video Tutorials khi người dùng click vào Start Learning
  const handleStartLearning = () => {
    if (onStartLearning) {
      onStartLearning();
    } else if (onNavigateTab) {
      onNavigateTab('video');
    }
  };

  // Cuộn mượt mà xuống các phân đoạn theo ID
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Quản lý trạng thái carousel
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true);

  // Dữ liệu Decks & Videos lấy từ Backend và chọn ngẫu nhiên 3 thẻ mỗi loại
  const [allBackendDecks, setAllBackendDecks] = useState([]);
  const [allBackendVideos, setAllBackendVideos] = useState([]);
  const [featuredDecks, setFeaturedDecks] = useState([]);
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);

  // Quản lý tương tác like & lưu (bookmarks) giống CommunityView
  const [likedDecks, setLikedDecks] = useState({});
  const [savedDeckIds, setSavedDeckIds] = useState(() => getSavedDeckIds(currentUser));

  useEffect(() => {
    const syncSaved = () => setSavedDeckIds(getSavedDeckIds(currentUser));
    syncSaved();
    window.addEventListener('quizcard:saved-decks-changed', syncSaved);
    return () => window.removeEventListener('quizcard:saved-decks-changed', syncSaved);
  }, [currentUser]);

  // Modal xem trước thẻ bộ bài
  const [previewDeck, setPreviewDeck] = useState(null);
  const [previewCards, setPreviewCards] = useState([]);
  const [loadingPreviewCards, setLoadingPreviewCards] = useState(false);

  // Modal xem video
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Modal trợ giúp
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Tải danh sách Decks và Videos từ Backend và chọn ngẫu nhiên tối đa 3 thẻ hiển thị
  const fetchFeaturedFromBackend = useCallback(async (isCancelled = () => false) => {
    const [decksResult, videosResult] = await Promise.allSettled([
      api.getCommunityDecks(),
      api.getPublicVideos(),
    ]);

    if (isCancelled()) return;

    // 1. Xử lý tối đa 3 thẻ Decks ngẫu nhiên từ Backend
    let rawDecks = [];
    if (decksResult.status === 'fulfilled' && Array.isArray(decksResult.value) && decksResult.value.length > 0) {
      rawDecks = decksResult.value;
    } else {
      try {
        const allDecks = await api.getDecks();
        if (!isCancelled() && Array.isArray(allDecks)) {
          rawDecks = allDecks.filter((d) => (d.totalCards || 0) > 0 && d.isPublic !== false);
        }
      } catch {
        rawDecks = [];
      }
    }

    if (!isCancelled()) {
      if (rawDecks.length > 0) {
        setAllBackendDecks(rawDecks);
        setFeaturedDecks(pickRandomItems(rawDecks, 3));
      } else {
        setAllBackendDecks([]);
        setFeaturedDecks([]);
      }
      setLoadingDecks(false);
    }

    // 2. Xử lý tối đa 3 Video ngẫu nhiên từ Backend
    if (!isCancelled()) {
      const rawVideos =
        videosResult.status === 'fulfilled' && Array.isArray(videosResult.value)
          ? videosResult.value
          : [];

      if (rawVideos.length > 0) {
        const mappedVideos = rawVideos.map((v) => mapBackendVideo(v));
        setAllBackendVideos(mappedVideos);
        setFeaturedVideos(pickRandomItems(mappedVideos, 3));
      } else {
        setAllBackendVideos([]);
        setFeaturedVideos([]);
      }
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchFeaturedFromBackend(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchFeaturedFromBackend]);

  // Đổi ngẫu nhiên 3 thẻ Decks khác từ danh sách Backend (hoặc tải lại từ Backend nếu rỗng)
  const handleShuffleDecks = useCallback(() => {
    if (allBackendDecks.length > 0) {
      setFeaturedDecks(pickRandomItems(allBackendDecks, 3));
    } else {
      setLoadingDecks(true);
      setLoadingVideos(true);
      fetchFeaturedFromBackend();
    }
  }, [allBackendDecks, fetchFeaturedFromBackend]);

  // Đổi ngẫu nhiên 3 Videos khác từ danh sách Backend (hoặc tải lại từ Backend nếu rỗng)
  const handleShuffleVideos = useCallback(() => {
    if (allBackendVideos.length > 0) {
      setFeaturedVideos(pickRandomItems(allBackendVideos, 3));
    } else {
      setLoadingDecks(true);
      setLoadingVideos(true);
      fetchFeaturedFromBackend();
    }
  }, [allBackendVideos, fetchFeaturedFromBackend]);

  // Tự động chuyển slide sau mỗi 5 giây nếu đang bật
  useEffect(() => {
    if (!isCarouselPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [isCarouselPlaying]);

  // Xử lý lưu / bỏ lưu bộ thẻ vào My Resources
  const handleToggleSave = (deck, e) => {
    if (e) e.stopPropagation();
    toggleSaveDeck(deck, currentUser);
  };

  // Xử lý bật/tắt yêu thích (like) giống CommunityView
  const handleToggleLike = (deck, initialCount, e) => {
    e.stopPropagation();
    if (!deck) return;
    const deckId = deck.id || deck.Id;
    if (!deckId) return;

    setLikedDecks((prev) => {
      const isLiked = !!prev[deckId]?.liked;
      const count = prev[deckId]?.count !== undefined ? prev[deckId].count : initialCount;
      const nextLiked = !isLiked;

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

  // Mở modal xem trước thẻ Flashcard (nạp danh sách thẻ thực từ Backend)
  const handleOpenPreviewDeck = async (deck, e) => {
    if (e) e.stopPropagation();
    setPreviewDeck(deck);
    if (!deck?.id) {
      setPreviewCards([]);
      setLoadingPreviewCards(false);
      return;
    }

    setLoadingPreviewCards(true);
    setPreviewCards([]);
    recordRecentDeck({ deck, actionType: 'VIEW', currentUser });
    try {
      const cards = await api.getCards(deck.id);
      setPreviewCards(Array.isArray(cards) ? cards : []);
    } catch (err) {
      console.warn('Không thể tải danh sách thẻ xem trước:', err);
      setPreviewCards([]);
    } finally {
      setLoadingPreviewCards(false);
    }
  };

  // Mở chế độ học lật thẻ cho bộ thẻ từ Backend
  const handleStudyDeck = (deck) => {
    if (!deck) return;
    recordRecentDeck({ deck, actionType: 'STUDY', currentUser });
    if (onSelectDeckForStudy) {
      onSelectDeckForStudy(deck);
    }
  };

  // Mở màn hình thi trắc nghiệm
  const handleQuiz = (deck) => {
    if (!deck) return;
    recordRecentDeck({ deck, actionType: 'QUIZ', currentUser });
    if (onSelectDeckForQuiz) {
      onSelectDeckForQuiz(deck);
    }
  };

  return (
    <div className="qc-landing-root">
      {/* ============================================================ */}
      {/* 1. TOP NAVBAR (Thanh điều hướng trên cùng chuẩn Figma UI)   */}
      {/* ============================================================ */}
      <header className="qc-f-navbar">
        {/* Nhóm bên trái: Logo QuizLibrary */}
        <div className="qc-fn-left">
          <div className="qc-fn-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="QuizLibrary">
            <img
              src={quizLibraryLogo}
              alt="QuizLibrary Logo"
              className="qc-fn-brand-logo"
            />
          </div>
        </div>

        {/* Nhóm ở giữa: Các mục danh mục tài nguyên (What is new, About Us) */}
        <nav className="qc-fn-nav" aria-label="Menu chính">
          <button
            type="button"
            className="qc-fn-nav-item active-nav"
            onClick={handleStartLearning}
            title="Bắt đầu học ngay với video bài giảng"
          >
            <span className="qc-fn-badge-new">Start Learning</span>
          </button>
          <button
            type="button"
            className="qc-fn-nav-item"
            onClick={() => scrollToSection('what-is-new')}
            title="Khám phá các tính năng và cập nhật mới"
          >
            <span className="qc-fn-dot" />
            <span>What is new</span>
          </button>

          <button
            type="button"
            className="qc-fn-nav-item"
            onClick={() => scrollToSection('about-us')}
            title="Tìm hiểu về dự án và đội ngũ QuizLibrary"
          >
            <span>About Us</span>
          </button>
        </nav>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION (Doodle icons, Headline, Search Bar)         */}
      {/* ============================================================ */}
      <section className="qc-hero-container">
        {/* Dải các biểu tượng doodle nét vẽ uốn cong nghệ thuật */}
        <div className="qc-doodle-arc" aria-hidden="true">
          {/* Cụm biểu tượng chính ở giữa uốn cong */}
          <div className="qc-doodle-center-arc">
            {/* 1. Profile circle */}
            <div className="qc-doodle-icon d-user" title="Profile">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </div>

            {/* 2. Home icon */}
            <div className="qc-doodle-icon d-home" title="Home">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>

            {/* 3. Heart icon */}
            <div className="qc-doodle-icon d-heart" title="Favorites">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>

            {/* 4. Smile emoji */}
            <div className="qc-doodle-icon d-smile" title="Community">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
              </svg>
            </div>

            {/* 5. Speech bubble */}
            <div className="qc-doodle-icon d-chat" title="Discussions">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>

          {/* Doodles bên trái */}
          <div className="qc-doodle-icon d-star-left" title="Sparkle">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8">
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
            </svg>
          </div>

          <div className="qc-doodle-icon d-at-left" title="Mentions">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8">
              <circle cx="12" cy="12" r="4" />
              <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
            </svg>
          </div>

          {/* Doodles bên phải */}
          <div className="qc-doodle-icon d-bookmark-right" title="Bookmarks">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          <div className="qc-doodle-icon d-gear-right" title="Settings">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
        </div>

        {/* Tiêu đề chính */}
        <h1 className="qc-hero-headline">
          Discover community-made libraries, and more
        </h1>

      </section>

      {/* ============================================================ */}
      {/* 3. FEATURED BANNER CAROUSEL (Figma is better with friends)   */}
      {/* ============================================================ */}
      <section className="qc-featured-banner-section">
        <div className="qc-banner-card">
          {/* Cột trái: Tiêu đề, giới thiệu và nút điều khiển Carousel */}
          <div className="qc-banner-left">
            <h2 className="qc-banner-title">
              {activeSlide === 0
                ? 'is better'
                : activeSlide === 1
                ? 'QuizCard Spaced Repetition Mastery'
                : 'Interactive Flashcard Studio'}
            </h2>
            <p
              className="qc-banner-desc"
              style={{ cursor: 'pointer' }}
              title="Nhấn để bắt đầu học với video bài giảng"
            >
              {activeSlide === 0
                ? 'Add your favorite to your Community.'
                : activeSlide === 1
                ? 'Học thuộc kiến thức sâu với phương pháp lặp lại ngắt quãng SM-2 và thẻ 3D lật tương tác.'
                : 'Tự động bóc tách từ vựng từ video, phụ đề song ngữ và chuyển đổi thành bộ thẻ ôn luyện.'}
            </p>

            {/* Các nút điều khiển Carousel: ←, →, ⏸ 00 */}
            <div className="qc-carousel-controls">
              <button
                type="button"
                className="qc-carousel-btn"
                onClick={() => setActiveSlide((prev) => (prev === 0 ? 2 : prev - 1))}
                aria-label="Slide trước"
              >
                ←
              </button>
              <button
                type="button"
                className="qc-carousel-btn"
                onClick={() => setActiveSlide((prev) => (prev + 1) % 3)}
                aria-label="Slide tiếp theo"
              >
                →
              </button>
              <button
                type="button"
                className={`qc-carousel-btn qc-carousel-pause ${!isCarouselPlaying ? 'paused' : ''}`}
                onClick={() => setIsCarouselPlaying((prev) => !prev)}
                title={isCarouselPlaying ? 'Tạm dừng tự động chạy' : 'Tiếp tục tự động chạy'}
              >
                {isCarouselPlaying ? '⏸' : '▶'} 0{activeSlide + 1}
              </button>
            </div>
          </div>

          {/* Cột phải: 3 thẻ xếp lớp đồ họa (Red, Cyan, Yellow) & Mascots */}
          <div className="qc-banner-right">
            <div className="qc-fanned-cards-wrapper">
              {/* Thẻ 1: Khung đỏ - Hello Kitty */}
              <div className="qc-fan-card card-red">
                <div className="qc-fan-card-inner">
                  <div className="qc-fan-cloud cloud-1" />
                  <div className="qc-fan-cloud cloud-2" />
                  <div className="qc-fan-char">
                    <HelloKittyFace size={54} />
                  </div>
                </div>
              </div>

              {/* Thẻ 2: Khung xanh ngọc - Cinnamoroll */}
              <div className="qc-fan-card card-cyan">
                <div className="qc-fan-card-inner">
                  <div className="qc-fan-char">
                    <CinnamorollFace size={60} />
                  </div>
                </div>
              </div>

              {/* Thẻ 3: Khung vàng kem - Pompompurin */}
              <div className="qc-fan-card card-yellow">
                <div className="qc-fan-card-inner">
                  <div className="qc-fan-char">
                    <PompompurinFace size={58} />
                  </div>
                </div>
              </div>

              {/* Cụm Mascot bên phải (Badtz-Maru, My Melody, Kuromi, Kitty) */}
              <div className="qc-banner-mascots-cluster">
                <div className="qc-cluster-item item-badtz">
                  <BadtzMaruFace size={48} />
                </div>
                <div className="qc-cluster-item item-kitty">
                  <HelloKittyFace size={52} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SECTION 1: 3 THẺ DECKS NGẪU NHIÊN TỪ BACKEND              */}
      {/* ============================================================ */}
      <section className="qc-section-decks">
        <div className="qc-section-header with-link">
          <div>
            <h2 className="qc-section-title">Decks 🎀</h2>
            <p className="qc-section-subtitle">
              Khám phá bộ thẻ flashcard nổi bật từ cộng đồng QuizLibrary.
            </p>
          </div>
          <div className="qc-section-header-actions">
            <button
              type="button"
              className="qc-browse-riffs-link"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('community');
              }}
            >
              <span>Xem Community</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Lưới hiển thị tối đa 3 thẻ Decks ngẫu nhiên từ Backend */}
        {loadingDecks ? (
          <div className="qc-decks-row-3">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="qc-card-skeleton">
                <div className="qc-skeleton-banner" />
                <div className="qc-skeleton-body">
                  <div className="qc-skeleton-line w-75" />
                  <div className="qc-skeleton-line w-50" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredDecks.length === 0 ? (
          <div className="qc-section-empty-box">
            <BookOpen size={28} color="#94a3b8" />
            <p>Hiện chưa có bộ thẻ công khai nào từ hệ thống.</p>
            <button
              type="button"
              className="qc-shuffle-pill-btn"
              onClick={handleShuffleDecks}
            >
              <RefreshCw size={13} />
              <span>Tải lại từ Backend</span>
            </button>
          </div>
        ) : (
          <div className="qc-decks-row-3">
            {featuredDecks.map((deck) => {
              const initialLikes = getInitialDeckLikes(deck.id);
              const likeState = likedDecks[deck.id];
              const isLiked = likeState ? likeState.liked : false;
              const likesCount = likeState ? likeState.count : initialLikes;

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

              const rawAuthorName = deck.authorName || deck.AuthorName || (deckUserId ? 'Thành viên QuizCard' : 'QuizCard Team');
              const authorDisplayName = isOwner
                ? `${currentUser?.fullName || currentUser?.userName || rawAuthorName} (Tác giả)`
                : rawAuthorName;

              const authorAvatar = isOwner
                ? (currentUser?.avatarUrl || currentUser?.AvatarUrl || deck.authorAvatar || deck.AuthorAvatar || '')
                : (deck.authorAvatar || deck.AuthorAvatar || '');
              const authorInitial = authorDisplayName.replace(/[^a-zA-Z0-9À-ỹ]/g, '').charAt(0).toUpperCase() || 'Q';
              const isSaved = savedDeckIds.has(String(deck.id));

              return (
                <div key={deck.id} className="cv-card">
                  {/* Phần trên cùng của Card: Huy hiệu công khai, Lưu & Thích */}
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

                  {/* Phần nội dung chính của Card: Tiêu đề, Tags, Tác giả & Số thẻ */}
                  <div className="cv-card-body">
                    <h3 className="cv-card-title" title={deck.title}>
                      {deck.title}
                    </h3>

                    {tags.length > 0 && (
                      <div className="cv-card-tags">
                        {tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="cv-card-tag"
                            onClick={() => {
                              if (onNavigateTab) onNavigateTab('community');
                            }}
                            style={{ cursor: 'pointer' }}
                            title={`Xem các bộ thẻ chủ đề #${t} trong Community`}
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
                      onClick={() => handleStudyDeck(deck)}
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
                        onClick={() => handleQuiz(deck)}
                        title={(deck.totalCards || 0) < 2 ? 'Cần tối thiểu 2 thẻ để thi trắc nghiệm' : 'Luyện thi trắc nghiệm 4 đáp án'}
                      >
                        <HelpCircle size={14} className="cv-btn-quiz-icon" />
                        <span>Thi Trắc Nghiệm</span>
                      </button>

                      <button
                        type="button"
                        className="cv-btn-preview"
                        onClick={(e) => handleOpenPreviewDeck(deck, e)}
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
      </section>

      {/* ============================================================ */}
      {/* 5. SECTION 2: 3 VIDEOS NGẪU NHIÊN TỪ BACKEND                 */}
      {/* ============================================================ */}
      <section className="qc-section-videos">
        <div className="qc-section-header with-link">
          <div>
            <h2 className="qc-section-title">Videos</h2>
            <p className="qc-section-subtitle">
              Khám phá bài giảng video tương tác kèm phụ đề song ngữ.
            </p>
          </div>
          <div className="qc-section-header-actions">
            <button
              type="button"
              className="qc-browse-riffs-link"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('video');
              }}
            >
              <span>Xem tất cả</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Lưới hiển thị tối đa 3 video cards ngẫu nhiên từ Backend */}
        {loadingVideos ? (
          <div className="qc-videos-row-3">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="qc-card-skeleton">
                <div className="qc-skeleton-banner" />
                <div className="qc-skeleton-body">
                  <div className="qc-skeleton-line w-75" />
                  <div className="qc-skeleton-line w-50" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredVideos.length === 0 ? (
          <div className="qc-section-empty-box">
            <Play size={28} color="#94a3b8" />
            <p>Hiện chưa có bài giảng video công khai nào từ hệ thống.</p>
            <button
              type="button"
              className="qc-shuffle-pill-btn"
              onClick={handleShuffleVideos}
            >
              <RefreshCw size={13} />
              <span>Tải lại từ Backend</span>
            </button>
          </div>
        ) : (
          <div className="qc-videos-row-3">
            {featuredVideos.map((video) => {
              const hasBilingualSub = Boolean(video.vttEnUrl || video.vttEnText || video.vttViUrl || video.vttViText);

              return (
                <div
                  key={video.id}
                  className="qc-video-card-v2"
                  onClick={() => setActiveVideoModal(video)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Box Preview Thumbnail */}
                  <div className="qc-video-preview-box box-real-video">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="qc-video-real-thumb"
                      onError={(e) => {
                        if (!e.currentTarget.dataset.fallbackApplied) {
                          e.currentTarget.dataset.fallbackApplied = 'true';
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';
                        }
                      }}
                    />
                    {hasBilingualSub && (
                      <span className="qc-video-sub-pill">Phụ đề song ngữ</span>
                    )}

                    {/* Nút Play overlay */}
                    <div className="qc-video-play-overlay always-visible-soft">
                      <div className="qc-play-circle-btn">
                        <Play size={18} fill="#ffffff" color="#ffffff" />
                      </div>
                      <span className="qc-video-duration-pill">{video.duration}</span>
                    </div>
                  </div>

                  {/* Thông tin mô tả Video */}
                  <div className="qc-video-info-box">
                    <h3 className="qc-video-item-title" title={video.title}>
                      {video.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 6. SECTION: WHAT IS NEW (Giới thiệu tính năng & dự án mới)   */}
      {/* ============================================================ */}
      <section id="what-is-new" className="qc-section-what-new">
        <div className="qc-section-header-center">
          <span className="qc-section-badge-pill">
            <Sparkles size={13} color="#0d99ff" />
            <span>What's New • Cập Nhật Tính Năng</span>
          </span>
          <h2 className="qc-section-headline-lg">
            Đột Phá Phương Pháp Học Tập Cùng QuizLibrary
          </h2>
          <p className="qc-section-subline-lg">
            Khám phá những công cụ học tập thông minh được xây dựng trên nền tảng khoa học não bộ,
            giúp bạn ghi nhớ sâu và tiết kiệm 70% thời gian ôn luyện.
          </p>
        </div>

        <div className="qc-features-grid">
          {/* Feature 1: Spaced Repetition */}
          <div className="qc-feature-card">
            <div className="qc-feature-icon-box icon-blue">
              <Clock size={22} />
            </div>
            <div className="qc-feature-content">
              <div className="qc-feature-tag-row">
                <span className="qc-feature-tag">Khoa học trí nhớ</span>
                <span className="qc-feature-version">v2.4</span>
              </div>
              <h3 className="qc-feature-title">Thuật Toán Spaced Repetition SM-2</h3>
              <p className="qc-feature-desc">
                Hệ thống tự động phân tích độ nhớ của từng flashcard và tính toán thời điểm vàng ôn lại theo chu kỳ 1 ngày, 3 ngày, 7 ngày, giúp khắc phục triệt để đường cong lãng quên Ebbinghaus.
              </p>
            </div>
          </div>

          {/* Feature 2: 3D Flashcards */}
          <div className="qc-feature-card">
            <div className="qc-feature-icon-box icon-purple">
              <Layers size={22} />
            </div>
            <div className="qc-feature-content">
              <div className="qc-feature-tag-row">
                <span className="qc-feature-tag">Trải nghiệm tương tác</span>
                <span className="qc-feature-version">Mới</span>
              </div>
              <h3 className="qc-feature-title">Thẻ Flashcard 3D &amp; Phát Âm Chuẩn</h3>
              <p className="qc-feature-desc">
                Học lật thẻ 3 chiều sinh động với 4 phong cách hiển thị trực quan. Tích hợp công nghệ Text-to-Speech (TTS) đọc mẫu phát âm tiếng Anh chuẩn xác cho từng thuật ngữ.
              </p>
            </div>
          </div>

          {/* Feature 3: Interactive Video Studio */}
          <div className="qc-feature-card">
            <div className="qc-feature-icon-box icon-cyan">
              <Play size={22} />
            </div>
            <div className="qc-feature-content">
              <div className="qc-feature-tag-row">
                <span className="qc-feature-tag">Học qua Video</span>
                <span className="qc-feature-version">Hot</span>
              </div>
              <h3 className="qc-feature-title">Interactive Caption Studio</h3>
              <p className="qc-feature-desc">
                Video bài giảng tích hợp phụ đề song ngữ Anh - Việt thông minh. Nhấp vào từng câu thoại để nghe lại chậm, tra nghĩa trực tiếp và lưu ngay vào bộ thẻ cá nhân.
              </p>
            </div>
          </div>

          {/* Feature 4: Quiz Arena */}
          <div className="qc-feature-card">
            <div className="qc-feature-icon-box icon-emerald">
              <Award size={22} />
            </div>
            <div className="qc-feature-content">
              <div className="qc-feature-tag-row">
                <span className="qc-feature-tag">Luyện thi phản xạ</span>
                <span className="qc-feature-version">Pro</span>
              </div>
              <h3 className="qc-feature-title">Quiz Arena - Đấu Trường Trắc Nghiệm</h3>
              <p className="qc-feature-desc">
                Tự động tạo bài kiểm tra trắc nghiệm 4 đáp án với bộ đếm thời gian. Chấm điểm tức thì, thống kê câu sai và gợi ý ôn tập trọng tâm trước kỳ thi.
              </p>
            </div>
          </div>

          {/* Feature 5: Gamification Streak */}
          <div className="qc-feature-card">
            <div className="qc-feature-icon-box icon-amber">
              <Flame size={22} />
            </div>
            <div className="qc-feature-content">
              <div className="qc-feature-tag-row">
                <span className="qc-feature-tag">Gamification</span>
                <span className="qc-feature-version">Daily</span>
              </div>
              <h3 className="qc-feature-title">Chuỗi Lửa Streak &amp; Năng Lượng</h3>
              <p className="qc-feature-desc">
                Duy trì ngọn lửa học tập mỗi ngày, điểm danh nhận điểm năng lượng (Energy Points) và xây dựng kỷ luật ôn luyện kiến thức bền bỉ mà không áp lực.
              </p>
            </div>
          </div>

          {/* Feature 6: Community Sharing */}
          <div className="qc-feature-card">
            <div className="qc-feature-icon-box icon-rose">
              <Globe size={22} />
            </div>
            <div className="qc-feature-content">
              <div className="qc-feature-tag-row">
                <span className="qc-feature-tag">Cộng đồng mở</span>
                <span className="qc-feature-version">Free</span>
              </div>
              <h3 className="qc-feature-title">Khám Phá &amp; Chia Sẻ Mở</h3>
              <p className="qc-feature-desc">
                Truy cập kho tài liệu cộng đồng phong phú thuộc mọi lĩnh vực: Ngoại ngữ, Lập trình, Y dược, Kinh tế. Tùy biến và lưu vào My Resources với một cú nhấp chuột.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. SECTION: ABOUT US (Giới thiệu về trang & Sứ mệnh dự án)   */}
      {/* ============================================================ */}
      <section id="about-us" className="qc-section-about-us">
        <div className="qc-about-card">
          <div className="qc-about-top-row">
            <span className="qc-section-badge-pill pill-about">
              <ShieldCheck size={13} color="#16a34a" />
              <span>Về Dự Án QuizLibrary • About Us</span>
            </span>
            <h2 className="qc-about-headline">
              Sứ Mệnh với Phương Pháp Ghi Nhớ Thông Minh
            </h2>
            <p className="qc-about-desc">
              QuizLibrary được hình thành với mục tiêu giúp người học tiếp cận và ghi nhớ kiến thức.
              Thay vì lối học vẹt nhàm chán, chúng tôi kết hợp <strong>Khoa học nhận thức</strong>, <strong>Thiết kế trực quan</strong> và <strong>Công nghệ video tương tác</strong> để việc học trở nên dễ dàng, hiệu quả và có thể duy trì bền vững.
            </p>
          </div>

          <div className="qc-about-values-grid">
            <div className="qc-value-item">
              <div className="qc-value-badge">01</div>
              <h4>Khoa Học &amp; Bền Vững</h4>
              <p>Mọi tính năng đều bám sát các nguyên tắc Active Recall và Spaced Repetition đã được khoa học thần kinh chứng minh hiệu quả.</p>
            </div>

            <div className="qc-value-item">
              <div className="qc-value-badge">02</div>
              <h4>Trải Nghiệm Thân Thiện</h4>
              <p>Giao diện hiện đại, loại bỏ hoàn toàn các yếu tố gây xao nhãng để bạn tập trung 100% vào việc ghi nhớ.</p>
            </div>

            <div className="qc-value-item">
              <div className="qc-value-badge">03</div>
              <h4>Miễn Phí &amp; Bảo Mật</h4>
              <p>Tôn trọng quyền riêng tư người học, không gắn quảng cáo làm phiền và cam kết bảo vệ an toàn toàn bộ dữ liệu học tập cá nhân.</p>
            </div>
          </div>

          <div className="qc-about-footer-cta">
            <div className="qc-about-cta-text">
              <h4>Sẵn sàng nâng tầm trí nhớ của bạn?</h4>
              <p>Bắt đầu khám phá kho bài giảng và hàng trăm bộ thẻ tương tác ngay hôm nay.</p>
            </div>
            <button
              type="button"
              className="qc-hero-start-learning-btn"
              onClick={handleStartLearning}
              style={{
                background: '#0d99ff',
                color: '#ffffff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(13, 153, 255, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              <Play size={14} fill="#ffffff" />
              <span>Start learning ngay bây giờ</span>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. FOOTER: THÔNG TIN DỰ ÁN & LIÊN KẾT BOTTOM                 */}
      {/* ============================================================ */}
      <footer className="qc-landing-footer">
        <div className="qc-footer-container">
          {/* Cột 1: Thông tin thương hiệu QuizLibrary */}
          <div className="qc-footer-col-brand">
            <div
              className="qc-footer-brand-wrap"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="Về đầu trang"
            >
              <img src={quizLibraryLogo} alt="QuizLibrary Logo" className="qc-footer-logo-img" />
            </div>
            <p className="qc-footer-desc">
              QuizLibrary là nền tảng học tập thông minh kết hợp khoa học thần kinh nhận thức, thuật toán Spaced Repetition SM-2, thẻ Flashcard 3D và Video bài giảng tương tác song ngữ.
            </p>
            <div className="qc-footer-meta-stats">
              <span className="qc-fstat-item">
                <strong>5.1k+</strong> Học viên tích cực
              </span>
              <span className="qc-fstat-dot">•</span>
              <span className="qc-fstat-item">
                <strong>1,200+</strong> Bộ thẻ bài học
              </span>
            </div>
          </div>

          {/* Cột 2: Điều hướng trang */}
          <div className="qc-footer-col">
            <h4 className="qc-footer-heading">Khám Phá</h4>
            <ul className="qc-footer-links">
              <li>
                <button type="button" onClick={() => scrollToSection('what-is-new')}>
                  Tính năng mới (What's New)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('about-us')}>
                  Về dự án (About Us)
                </button>
              </li>
              <li>
                <button type="button" onClick={handleStartLearning}>
                  Video Tutorials &amp; Bài giảng
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.querySelector('.qc-section-decks');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  Bộ thẻ Decks nổi bật
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 3: Phương pháp & Tính năng cốt lõi */}
          <div className="qc-footer-col">
            <h4 className="qc-footer-heading">Tính Năng Cốt Lõi</h4>
            <ul className="qc-footer-links">
              <li>
                <span className="qc-footer-text-link">Spaced Repetition SM-2</span>
              </li>
              <li>
                <span className="qc-footer-text-link">Thẻ lật Flashcard 3D &amp; TTS</span>
              </li>
              <li>
                <span className="qc-footer-text-link">Quiz Arena - Thi trắc nghiệm</span>
              </li>
              <li>
                <span className="qc-footer-text-link">Interactive Caption Studio</span>
              </li>
              <li>
                <span className="qc-footer-text-link">Chuỗi ngọn lửa Streak &amp; Năng lượng</span>
              </li>
            </ul>
          </div>

          {/* Cột 4: Hỗ trợ & Chính sách */}
          <div className="qc-footer-col">
            <h4 className="qc-footer-heading">Hỗ Trợ &amp; Điều Khoản</h4>
            <ul className="qc-footer-links">
              <li>
                <button type="button" onClick={() => setIsHelpOpen(true)}>
                  Trung tâm trợ giúp (?)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('quizcard:open-cookie-settings'))}
                >
                  Cài đặt Cookie Consent
                </button>
              </li>
              <li>
                <span className="qc-footer-text-link">Chính sách Cookie &amp; Quyền riêng tư</span>
              </li>
              <li>
                <span className="qc-footer-text-link">Điều khoản sử dụng</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Dải chân trang cuối cùng */}
        <div className="qc-footer-bottom-bar">
          <div className="qc-footer-bottom-inner">
            <div className="qc-footer-copyright">
              <span>© {CURRENT_YEAR} <strong>QuizLibrary</strong>. Nền tảng học tập &amp; ghi nhớ thông minh theo phương pháp khoa học.</span>
            </div>

            <button
              type="button"
              className="qc-footer-back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="Cuộn lên đầu trang"
            >
              <span>Về đầu trang</span>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* 6. FLOATING HELP BUTTON (?) Góc dưới bên phải                */}
      {/* ============================================================ */}
      <button
        type="button"
        className="qc-floating-help-btn"
        onClick={() => setIsHelpOpen(true)}
        title="Trợ giúp & Hướng dẫn sử dụng QuizCard"
        aria-label="Trợ giúp"
      >
        <span className="qc-help-question-mark">?</span>
      </button>

      {/* Modal Trợ Giúp */}
      {isHelpOpen && (
        <div className="qc-help-modal-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="qc-help-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="qc-help-modal-header">
              <h3>Trung Tâm Trợ Giúp QuizLibrary</h3>
              <button
                type="button"
                className="qc-help-modal-close"
                onClick={() => setIsHelpOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="qc-help-modal-body">
              <h4>🎯 Bắt đầu học tập nhanh:</h4>
              <p>• Nhấn vào bất kỳ bộ thẻ nào để học lật thẻ flashcard 3D hoặc luyện thi trắc nghiệm.</p>
              <p>• Sử dụng Spaced Repetition SM-2 để ghi nhớ kiến thức ngắt quãng theo chu kỳ khoa học.</p>
              <p>• Nhấn vào Video Riffs để trải nghiệm học tập cùng phụ đề song ngữ và studio tương tác.</p>
              <hr style={{ margin: '14px 0', border: 'none', borderTop: '1px solid #f1f5f9' }} />
              <h4>🍪 Quản lý Cookie:</h4>
              <p>Bạn có thể mở lại thanh lựa chọn chính sách cookie bất cứ lúc nào:</p>
              <button
                type="button"
                className="qc-btn-reopen-cookie"
                onClick={() => {
                  setIsHelpOpen(false);
                  window.dispatchEvent(new Event('quizcard:open-cookie-settings'));
                }}
              >
                Mở Cài Đặt Cookie Consent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. MODAL XEM TRƯỚC THẺ FLASHCARD (Đồng bộ CommunityView)      */}
      {/* ============================================================ */}
      {previewDeck && (
        <div className="cv-preview-modal-overlay" onClick={() => setPreviewDeck(null)}>
          <div className="cv-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cv-preview-header">
              <div>
                <h3 className="cv-preview-title">{previewDeck.title}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Xem trước nội dung ({previewCards.length || previewDeck.totalCards || 0} thẻ)
                </span>
              </div>
              <button
                type="button"
                className="cv-preview-close"
                onClick={() => setPreviewDeck(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cv-preview-cards-list">
              {loadingPreviewCards ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <div className="qc-dpm-spinner" style={{ margin: '0 auto 12px auto' }} />
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
                className={`cv-save-button cv-preview-save-btn ${savedDeckIds.has(String(previewDeck.id)) ? 'saved' : ''}`}
                onClick={(e) => handleToggleSave(previewDeck, e)}
                title={savedDeckIds.has(String(previewDeck.id)) ? 'Bỏ lưu bộ thẻ này' : 'Lưu bộ thẻ vào My Resources (không thể sửa)'}
              >
                {savedDeckIds.has(String(previewDeck.id)) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                <span>{savedDeckIds.has(String(previewDeck.id)) ? 'Đã lưu' : 'Lưu bộ thẻ'}</span>
              </button>

              <button
                type="button"
                className="cv-btn-quiz"
                disabled={(previewCards.length || previewDeck.totalCards || 0) < 2}
                onClick={() => {
                  const deck = previewDeck;
                  setPreviewDeck(null);
                  handleQuiz(deck);
                }}
              >
                <HelpCircle size={14} className="cv-btn-quiz-icon" />
                <span>Thi Trắc Nghiệm</span>
              </button>

              <button
                type="button"
                className="cv-btn-study-main"
                style={{ width: 'auto', padding: '8px 20px' }}
                disabled={previewCards.length === 0 && (previewDeck.totalCards || 0) === 0}
                onClick={() => {
                  const deck = previewDeck;
                  setPreviewDeck(null);
                  handleStudyDeck(deck);
                }}
              >
                <Play size={14} fill="#ffffff" />
                <span>Bắt Đầu Học Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Video Player */}
      {activeVideoModal && (
        <VideoPreviewModal
          video={activeVideoModal}
          onClose={() => setActiveVideoModal(null)}
          onOpenStudio={(video) => {
            if (onOpenVideoLesson && video?.videoUrl) {
              onOpenVideoLesson(video);
            } else if (onNavigateTab) {
              onNavigateTab('video');
            }
          }}
        />
      )}
    </div>
  );
};

export default LandingPage;
