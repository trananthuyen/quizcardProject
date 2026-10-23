/**
 * File App.tsx: Component gốc (Root Component) của ứng dụng Frontend.
 * Đóng vai trò điều phối chính:
 * 1. Điều phối màn hình theo Sidebar (Community, My Resources, Videos, Recents, Drafts, Folders, Trash)
 * 2. Điều phối các chế độ học: Quản lý thẻ (CARDS), Học lật thẻ 3D (STUDY), Luyện thi trắc nghiệm (QUIZ)
 * 3. Quản lý trạng thái dữ liệu tập trung (Decks, Cards, Categories) và đồng bộ URL Hash.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Deck, Card, Category } from './types';
import { api } from './api';
import { Sidebar, type SidebarTab } from './components/Sidebar';
import { DeckList } from './components/DeckList';
import { MyResources } from './components/MyResources';
import { VideoTutorials } from './components/VideoTutorials';
import { FolderList } from './components/FolderList';
import { TrashView } from './components/TrashView';
import { CardManager } from './components/CardManager';
import { StudyArena } from './components/StudyArena';
import { QuizArena } from './components/QuizArena';
import { DeckModal } from './components/DeckModal';
import { CategoryModal } from './components/CategoryModal';

import { Search } from 'lucide-react';
import './App.css';

export type ViewType = 'DECKS' | 'CARDS' | 'STUDY' | 'QUIZ';

interface ParsedRoute {
  view: ViewType;
  deckId?: string;
  tab?: SidebarTab;
}

/**
 * Phân tích URL Hash để lấy trạng thái màn hình, tab sidebar và ID bộ thẻ.
 */
const parseRoute = (hash: string): ParsedRoute => {
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);

  if (parts.length === 0) {
    return { view: 'DECKS', tab: 'community' };
  }

  const segment = parts[0].toLowerCase();
  const deckId = parts[1];

  if (segment === 'cards' && deckId) {
    return { view: 'CARDS', deckId };
  }
  if (segment === 'study' && deckId) {
    return { view: 'STUDY', deckId };
  }
  if (segment === 'quiz' && deckId) {
    return { view: 'QUIZ', deckId };
  }

  const validTabs: SidebarTab[] = ['community', 'resources', 'video', 'recents', 'drafts', 'folders', 'trash'];
  if (validTabs.includes(segment as SidebarTab)) {
    return { view: 'DECKS', tab: segment as SidebarTab };
  }

  return { view: 'DECKS', tab: 'community' };
};

/**
 * Lấy URL Hash ban đầu từ trình duyệt hoặc khôi phục từ sessionStorage
 */
const getInitialHash = (): string => {
  if (typeof window !== 'undefined' && window.location.hash && window.location.hash !== '#' && window.location.hash !== '#/') {
    return window.location.hash;
  }
  try {
    const saved = sessionStorage.getItem('quizcard_last_hash');
    if (saved && saved !== '#' && saved !== '#/') {
      return saved;
    }
  } catch {}
  return '#/community';
};

export const App: React.FC = () => {
  // Đọc route hiện tại từ URL hash hoặc sessionStorage khi người dùng F5 / Refresh
  const initialRoute = parseRoute(getInitialHash());

  // Trạng thái điều hướng màn hình: 'DECKS' | 'CARDS' | 'STUDY' | 'QUIZ'
  const [view, setView] = useState<ViewType>(initialRoute.view);

  // Tab Sidebar hiện đang hoạt động
  const [activeTab, setActiveTab] = useState<SidebarTab>(initialRoute.tab || 'community');

  // Danh sách toàn bộ các bộ thẻ lấy từ Backend
  const [decks, setDecks] = useState<Deck[]>([]);

  // Danh sách toàn bộ các phân loại bộ thẻ từ Backend
  const [categories, setCategories] = useState<Category[]>([]);

  // Bộ thẻ hiện đang được người dùng bấm chọn để xem/học/thi
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const selectedDeckRef = useRef<Deck | null>(null);

  // Cờ báo hiệu đang khôi phục dữ liệu bộ thẻ sau khi người dùng Refresh F5 ở màn hình con
  const [restoringDeck, setRestoringDeck] = useState<boolean>(initialRoute.view !== 'DECKS' && !!initialRoute.deckId);

  // Danh sách các thẻ con thuộc về bộ thẻ đang chọn
  const [cards, setCards] = useState<Card[]>([]);

  // Trạng thái hiển thị loading khi tải danh sách bộ thẻ
  const [loadingDecks, setLoadingDecks] = useState(false);

  // Trạng thái hiển thị loading khi tải danh sách thẻ con
  const [loadingCards, setLoadingCards] = useState(false);

  // Điều khiển mở Modal Tạo / Sửa bộ thẻ tập trung
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  // Điều khiển mở Modal Quản lý phân loại tập trung
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Từ khóa tìm kiếm toàn cục (đồng bộ giữa Sidebar và Topbar)
  const [searchQuery, setSearchQuery] = useState('');

  // Bộ lọc danh mục đang chọn (ALL, STUDIED, NOT_STARTED, hoặc tên Category)
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Trạng thái đóng / mở sidebar (lưu lựa chọn vào localStorage)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('quizcard_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('quizcard_sidebar_open', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Hỗ trợ phím tắt bàn phím Ctrl+B để đóng/mở sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  // ==========================================================================
  // HÀM TẢI DỮ LIỆU TỪ SERVER (DATA FETCHING)
  // ==========================================================================

  /**
   * Tải toàn bộ danh sách bộ thẻ từ Backend (/api/decks)
   */
  const loadDecks = useCallback(async () => {
    try {
      setLoadingDecks(true);
      const data = await api.getDecks();
      setDecks(data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách bộ thẻ:', err);
    } finally {
      setLoadingDecks(false);
    }
  }, []);

  /**
   * Tải toàn bộ danh sách phân loại từ Backend (/api/categories)
   */
  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách phân loại:', err);
    }
  }, []);

  // Gọi tải danh sách bộ thẻ và phân loại ngay khi ứng dụng mount
  useEffect(() => {
    loadDecks();
    loadCategories();
  }, [loadDecks, loadCategories]);

  /**
   * Tải danh sách các thẻ con thuộc một bộ thẻ (/api/decks/{deckId}/cards)
   */
  const loadCards = useCallback(async (deckId: string) => {
    try {
      setLoadingCards(true);
      const data = await api.getCards(deckId);
      setCards(data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách thẻ:', err);
    } finally {
      setLoadingCards(false);
    }
  }, []);

  // ==========================================================================
  // CÁC HÀM XỬ LÝ BỘ THẺ (DECK CRUD HANDLERS)
  // ==========================================================================

  const handleCreateDeck = async (data: { title: string; description?: string; category?: string }) => {
    await api.createDeck(data);
    await loadDecks();
  };

  const handleUpdateDeck = async (id: string, data: { title: string; description?: string; category?: string }) => {
    await api.updateDeck(id, data);
    await loadDecks();
    if (selectedDeck && selectedDeck.id === id) {
      setSelectedDeck({ ...selectedDeck, ...data, category: data.category || selectedDeck.category });
    }
  };

  const handleDeleteDeck = async (id: string) => {
    await api.deleteDeck(id);
    await loadDecks();
    if (selectedDeck && selectedDeck.id === id) {
      setSelectedDeck(null);
      selectedDeckRef.current = null;
      setView('DECKS');
    }
  };

  // ==========================================================================
  // CÁC HÀM XỬ LÝ PHÂN LOẠI (CATEGORY CRUD HANDLERS)
  // ==========================================================================

  const handleCreateCategory = async (data: { name: string; description?: string; icon?: string; color?: string }) => {
    const created = await api.createCategory(data);
    await loadCategories();
    return created;
  };

  const handleUpdateCategory = async (id: string, data: { name: string; description?: string; icon?: string; color?: string }) => {
    const updated = await api.updateCategory(id, data);
    await Promise.all([loadCategories(), loadDecks()]);
    return updated;
  };

  const handleDeleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    await Promise.all([loadCategories(), loadDecks()]);
  };

  // ==========================================================================
  // CÁC HÀM XỬ LÝ THẺ FLASHCARD (CARD CRUD HANDLERS)
  // ==========================================================================

  const handleCreateCard = async (deckId: string, data: { term: string; definition: string; example?: string }) => {
    await api.createCard(deckId, data);
    await loadCards(deckId);
    await loadDecks();
  };

  const handleBatchCreateCards = async (deckId: string, batchCards: Array<{ term: string; definition: string; example?: string }>) => {
    await api.createCardsBatch(deckId, batchCards);
    await loadCards(deckId);
    await loadDecks();
  };

  const handleUpdateCard = async (id: string, data: { term: string; definition: string; example?: string }) => {
    await api.updateCard(id, data);
    if (selectedDeck) {
      await loadCards(selectedDeck.id);
    }
    await loadDecks();
  };

  const handleDeleteCard = async (id: string) => {
    await api.deleteCard(id);
    if (selectedDeck) {
      await loadCards(selectedDeck.id);
    }
    await loadDecks();
  };

  // ==========================================================================
  // ĐIỀU PHỐI GIAO DIỆN KHI TƯƠNG TÁC VỚI SIDEBAR VÀ ROUTING
  // ==========================================================================

  /**
   * Chuyển tab Sidebar và điều phối giao diện tương ứng
   */
  const handleSelectTab = useCallback((tab: SidebarTab) => {
    setActiveTab(tab);
    if (view !== 'DECKS') {
      setView('DECKS');
      setSelectedDeck(null);
      selectedDeckRef.current = null;
    }

    if (tab === 'community') {
      setSelectedFilter('ALL');
      window.location.hash = '#/community';
    } else if (tab === 'resources') {
      setSelectedFilter('ALL');
      window.location.hash = '#/resources';
    } else if (tab === 'video') {
      window.location.hash = '#/video';
    } else if (tab === 'recents') {
      setSelectedFilter('STUDIED');
      window.location.hash = '#/recents';
    } else if (tab === 'drafts') {
      setSelectedFilter('NOT_STARTED');
      window.location.hash = '#/drafts';
    } else if (tab === 'folders') {
      window.location.hash = '#/folders';
    } else if (tab === 'trash') {
      window.location.hash = '#/trash';
    }

    try {
      sessionStorage.setItem('quizcard_last_hash', window.location.hash);
    } catch {}
  }, [view]);

  /**
   * Điều hướng chuyển màn hình, đồng bộ URL Hash và lưu vào sessionStorage
   */
  const navigateTo = useCallback((newView: ViewType, deck?: Deck | null) => {
    if (newView === 'DECKS' || !deck) {
      setSelectedDeck(null);
      selectedDeckRef.current = null;
      setView('DECKS');
      const hash = `#/${activeTab}`;
      window.location.hash = hash;
      try {
        sessionStorage.setItem('quizcard_last_hash', hash);
      } catch {}
    } else {
      setSelectedDeck(deck);
      selectedDeckRef.current = deck;
      setView(newView);
      const seg = newView.toLowerCase();
      const newHash = `#/${seg}/${deck.id}`;
      window.location.hash = newHash;
      try {
        sessionStorage.setItem('quizcard_last_hash', newHash);
      } catch {}
    }
  }, [activeTab]);

  /**
   * Theo dõi sự kiện hashchange của trình duyệt hoặc khi khởi chạy ứng dụng (F5 / Refresh)
   */
  useEffect(() => {
    const syncRouteWithHash = async () => {
      let currentHash = window.location.hash;
      if (!currentHash || currentHash === '#' || currentHash === '#/') {
        try {
          const savedHash = sessionStorage.getItem('quizcard_last_hash');
          if (savedHash && savedHash !== '#' && savedHash !== '#/') {
            window.location.hash = savedHash;
            return;
          }
        } catch {}
        currentHash = '#/community';
      }

      try {
        sessionStorage.setItem('quizcard_last_hash', currentHash);
      } catch {}

      const route = parseRoute(currentHash);
      setView(route.view);
      if (route.tab) {
        setActiveTab(route.tab);
      }

      if (route.deckId) {
        if (!selectedDeckRef.current || selectedDeckRef.current.id !== route.deckId) {
          try {
            setRestoringDeck(true);
            const deck = await api.getDeck(route.deckId);
            setSelectedDeck(deck);
            selectedDeckRef.current = deck;
            if (route.view === 'CARDS') {
              await loadCards(deck.id);
            }
          } catch (err) {
            console.error('Không tìm thấy bộ thẻ khi khôi phục trang:', err);
            navigateTo('DECKS');
          } finally {
            setRestoringDeck(false);
          }
        } else {
          setRestoringDeck(false);
          if (route.view === 'CARDS') {
            loadCards(route.deckId);
          }
        }
      } else {
        setSelectedDeck(null);
        selectedDeckRef.current = null;
        setRestoringDeck(false);
      }
    };

    syncRouteWithHash();
    window.addEventListener('hashchange', syncRouteWithHash);
    return () => {
      window.removeEventListener('hashchange', syncRouteWithHash);
    };
  }, [loadCards, navigateTo]);

  /**
   * Quay về trang chủ bộ thẻ
   */
  const handleGoHome = () => {
    navigateTo('DECKS');
    loadDecks();
  };

  /**
   * Mở màn hình quản lý chi tiết các thẻ của 1 bộ
   */
  const handleSelectDeckForCards = (deck: Deck) => {
    navigateTo('CARDS', deck);
    loadCards(deck.id);
  };

  /**
   * Chuyển sang chế độ Học Lật Thẻ (Flashcard Study Mode)
   */
  const handleSelectDeckForStudy = (deck: Deck) => {
    navigateTo('STUDY', deck);
  };

  /**
   * Chuyển sang chế độ Luyện Thi Trắc Nghiệm (Multiple-Choice Quiz Mode)
   */
  const handleSelectDeckForQuiz = (deck: Deck) => {
    navigateTo('QUIZ', deck);
  };

  /**
   * Mở modal tạo mới bộ thẻ
   */
  const handleOpenCreateDeck = () => {
    setEditingDeck(null);
    setIsDeckModalOpen(true);
  };

  /**
   * Mở modal chỉnh sửa bộ thẻ
   */
  const handleOpenEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setIsDeckModalOpen(true);
  };

  /**
   * Tiêu đề hiển thị động trên Topbar theo SidebarTab
   */
  const getPageTitle = () => {
    switch (activeTab) {
      case 'resources':
        return 'My Resources';
      case 'video':
        return 'Videos & Tutorials';
      case 'recents':
        return 'Recents';
      case 'drafts':
        return 'Drafts';
      case 'folders':
        return 'All Folders';
      case 'trash':
        return 'Trash';
      case 'community':
      default:
        return 'Community';
    }
  };

  return (
    <div className="qc-app-container">
      {/* 1. Thanh Sidebar điều phối chính bên trái */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        currentView={view}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onNavigateHome={handleGoHome}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCreateDeck={handleOpenCreateDeck}
        onOpenCategories={() => setIsCategoryModalOpen(true)}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        categories={categories}
      />

      {/* 2. Vùng nội dung chính bên phải */}
      <div className="qc-main-area">
        {/* Topbar điều hướng trên cùng */}
        <header className="qc-topbar">
          <div className="qc-topbar-left">
            {view === 'DECKS' ? (
              <span className="qc-page-title">{getPageTitle()}</span>
            ) : (
              <div className="qc-breadcrumb">
                <button 
                  onClick={handleGoHome} 
                  className="qc-breadcrumb-back"
                >
                  ← {getPageTitle()}
                </button>
                <span className="qc-breadcrumb-sep">/</span>
                <span className="qc-breadcrumb-current">{selectedDeck?.title}</span>
                <span className="qc-breadcrumb-sep">/</span>
                <span className="qc-breadcrumb-sub">
                  {view === 'STUDY' ? 'Học lật thẻ 3D' : view === 'QUIZ' ? 'Luyện thi trắc nghiệm' : 'Quản lý thẻ'}
                </span>
              </div>
            )}
          </div>

          <div className="qc-topbar-search">
            <Search size={14} className="qc-topbar-search-icon" />
            <input 
              type="text" 
              placeholder={`Search ${getPageTitle()}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Nội dung thay đổi theo view và sidebar tab */}
        <main className="qc-main-scroll">
          {/* Màn hình chờ khi khôi phục trang sau F5 */}
          {restoringDeck && (
            <div className="qc-restoring-state">
              <div className="qc-restoring-spinner" />
              <div className="qc-restoring-text">
                Đang tải dữ liệu và khôi phục màn hình học...
              </div>
            </div>
          )}

          {/* VIEW 1: Quản lý chi tiết danh sách thẻ flashcard */}
          {!restoringDeck && view === 'CARDS' && selectedDeck && (
            <div className="qc-view-wrapper-wide">
              <CardManager
                deck={selectedDeck}
                cards={cards}
                loading={loadingCards}
                onBack={handleGoHome}
                onStartStudy={() => navigateTo('STUDY', selectedDeck)}
                onStartQuiz={() => navigateTo('QUIZ', selectedDeck)}
                onCreateCard={handleCreateCard}
                onBatchCreateCards={handleBatchCreateCards}
                onUpdateCard={handleUpdateCard}
                onDeleteCard={handleDeleteCard}
              />
            </div>
          )}

          {/* VIEW 2: Chế độ Học Lật Thẻ 3D (Study Mode) */}
          {!restoringDeck && view === 'STUDY' && selectedDeck && (
            <div className="qc-view-wrapper">
              <StudyArena
                deck={selectedDeck}
                onExit={handleGoHome}
                onGoToCards={() => navigateTo('CARDS', selectedDeck)}
                onGoToQuiz={() => navigateTo('QUIZ', selectedDeck)}
              />
            </div>
          )}

          {/* VIEW 3: Chế độ Luyện Thi Trắc Nghiệm (Quiz Mode) */}
          {!restoringDeck && view === 'QUIZ' && selectedDeck && (
            <div className="qc-view-wrapper">
              <QuizArena
                deck={selectedDeck}
                onExit={handleGoHome}
                onGoToStudy={() => navigateTo('STUDY', selectedDeck)}
                onGoToCards={() => navigateTo('CARDS', selectedDeck)}
              />
            </div>
          )}

          {/* VIEW 4: Các tab màn hình tương tác từ Sidebar khi ở view === 'DECKS' */}
          {!restoringDeck && view === 'DECKS' && (
            <>
              {/* Tab 4.1: My Resources (Kho học liệu và thống kê cá nhân) */}
              {activeTab === 'resources' && (
                <MyResources
                  decks={decks}
                  categories={categories}
                  loading={loadingDecks}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedFilter={selectedFilter}
                  onSelectFilter={setSelectedFilter}
                  onOpenCreateDeck={handleOpenCreateDeck}
                  onOpenCategories={() => setIsCategoryModalOpen(true)}
                  onSelectDeckForStudy={handleSelectDeckForStudy}
                  onSelectDeckForQuiz={handleSelectDeckForQuiz}
                  onSelectDeckForCards={handleSelectDeckForCards}
                  onEditDeck={(deck, e) => {
                    e.stopPropagation();
                    handleOpenEditDeck(deck);
                  }}
                  onDeleteDeck={async (deck, e) => {
                    e.stopPropagation();
                    if (window.confirm(`Bạn có chắc muốn xóa bộ thẻ "${deck.title}"?`)) {
                      await handleDeleteDeck(deck.id);
                    }
                  }}
                />
              )}

              {/* Tab 4.2: Videos (Video bài giảng & hướng dẫn kỹ thuật ghi nhớ) */}
              {activeTab === 'video' && <VideoTutorials />}

              {/* Tab 4.3: All Folders (Toàn bộ thư mục và phân loại) */}
              {activeTab === 'folders' && (
                <FolderList
                  categories={categories}
                  decks={decks}
                  onOpenCreateCategory={() => setIsCategoryModalOpen(true)}
                  onSelectCategory={(catName) => {
                    setSelectedFilter(catName);
                    setActiveTab('community');
                  }}
                />
              )}

              {/* Tab 4.4: Trash (Thùng rác) */}
              {activeTab === 'trash' && (
                <TrashView onGoHome={() => handleSelectTab('community')} />
              )}

              {/* Tab 4.5: Recents (Các bộ thẻ đã bắt đầu học) */}
              {activeTab === 'recents' && (
                <DeckList
                  decks={decks}
                  categories={categories}
                  loading={loadingDecks}
                  onCreateDeck={handleCreateDeck}
                  onUpdateDeck={handleUpdateDeck}
                  onDeleteDeck={handleDeleteDeck}
                  onCreateCategory={handleCreateCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onSelectDeckForStudy={handleSelectDeckForStudy}
                  onSelectDeckForQuiz={handleSelectDeckForQuiz}
                  onSelectDeckForCards={handleSelectDeckForCards}
                  onOpenCreateDeck={handleOpenCreateDeck}
                  onOpenEditDeck={handleOpenEditDeck}
                  onOpenCategories={() => setIsCategoryModalOpen(true)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedFilter="STUDIED"
                  onSelectFilter={setSelectedFilter}
                />
              )}

              {/* Tab 4.6: Drafts (Các bộ thẻ bản nháp chưa bắt đầu) */}
              {activeTab === 'drafts' && (
                <DeckList
                  decks={decks}
                  categories={categories}
                  loading={loadingDecks}
                  onCreateDeck={handleCreateDeck}
                  onUpdateDeck={handleUpdateDeck}
                  onDeleteDeck={handleDeleteDeck}
                  onCreateCategory={handleCreateCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onSelectDeckForStudy={handleSelectDeckForStudy}
                  onSelectDeckForQuiz={handleSelectDeckForQuiz}
                  onSelectDeckForCards={handleSelectDeckForCards}
                  onOpenCreateDeck={handleOpenCreateDeck}
                  onOpenEditDeck={handleOpenEditDeck}
                  onOpenCategories={() => setIsCategoryModalOpen(true)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedFilter="NOT_STARTED"
                  onSelectFilter={setSelectedFilter}
                />
              )}

              {/* Tab 4.7: Community (Khám phá cộng đồng - Mặc định) */}
              {activeTab === 'community' && (
                <DeckList
                  decks={decks}
                  categories={categories}
                  loading={loadingDecks}
                  onCreateDeck={handleCreateDeck}
                  onUpdateDeck={handleUpdateDeck}
                  onDeleteDeck={handleDeleteDeck}
                  onCreateCategory={handleCreateCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onSelectDeckForStudy={handleSelectDeckForStudy}
                  onSelectDeckForQuiz={handleSelectDeckForQuiz}
                  onSelectDeckForCards={handleSelectDeckForCards}
                  onOpenCreateDeck={handleOpenCreateDeck}
                  onOpenEditDeck={handleOpenEditDeck}
                  onOpenCategories={() => setIsCategoryModalOpen(true)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedFilter={selectedFilter}
                  onSelectFilter={setSelectedFilter}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal Tạo & Sửa Bộ Thẻ tập trung */}
      <DeckModal
        isOpen={isDeckModalOpen}
        onClose={() => {
          setIsDeckModalOpen(false);
          setEditingDeck(null);
        }}
        onSubmit={async (data) => {
          if (editingDeck) {
            await handleUpdateDeck(editingDeck.id, data);
          } else {
            await handleCreateDeck(data);
          }
        }}
        editingDeck={editingDeck}
        categories={categories}
        decks={decks}
        defaultCategory={selectedFilter !== 'ALL' && selectedFilter !== 'STUDIED' && selectedFilter !== 'NOT_STARTED' ? selectedFilter : 'Chung'}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
      />

      {/* Modal Quản Lý Phân Loại tập trung */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        decks={decks}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
};

export default App;
