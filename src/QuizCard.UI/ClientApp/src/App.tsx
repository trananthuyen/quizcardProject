/**
 * File App.tsx: Component gốc (Root Component) của ứng dụng Frontend.
 * Đóng vai trò điều phối chính:
 * 1. Quản lý trạng thái màn hình hiện tại (view: 'DECKS' | 'CARDS' | 'STUDY' | 'QUIZ').
 * 2. Lưu trữ danh sách bộ thẻ (decks), bộ thẻ đang chọn (selectedDeck), danh sách thẻ con (cards).
 * 3. Chứa các hàm xử lý gọi API (Handlers) và truyền props xuống cho các Component con.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Deck, Card, Category } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { DeckList } from './components/DeckList';
import { CardManager } from './components/CardManager';
import { StudyArena } from './components/StudyArena';
import { QuizArena } from './components/QuizArena';

export type ViewType = 'DECKS' | 'CARDS' | 'STUDY' | 'QUIZ';

interface ParsedRoute {
  view: ViewType;
  deckId?: string;
}

/**
 * Phân tích URL Hash để lấy trạng thái màn hình và ID bộ thẻ.
 * Định dạng hỗ trợ:
 * - '#/decks' hoặc rỗng: Danh sách bộ thẻ (Trang chủ)
 * - '#/cards/{deckId}': Quản lý danh sách thẻ flashcard
 * - '#/study/{deckId}': Phòng học lật thẻ 3D (Study Mode)
 * - '#/quiz/{deckId}': Luyện thi trắc nghiệm (Quiz Mode)
 */
const parseRoute = (hash: string): ParsedRoute => {
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);

  if (parts.length === 0) {
    return { view: 'DECKS' };
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

  return { view: 'DECKS' };
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
  return '#/decks';
};

export const App: React.FC = () => {
  // Đọc route hiện tại từ URL hash hoặc sessionStorage khi người dùng F5 / Refresh
  const initialRoute = parseRoute(getInitialHash());

  // Trạng thái điều hướng màn hình: 'DECKS' | 'CARDS' | 'STUDY' | 'QUIZ'
  const [view, setView] = useState<ViewType>(initialRoute.view);

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

  // Gọi tải danh sách bộ thẻ và phân loại ngay khi ứng dụng vừa mount
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
  // CÁC HÀM XỬ LÝ BỘ THẺ (DECK HANDLERS)
  // ==========================================================================

  /**
   * Tạo bộ thẻ mới và làm mới lại danh sách
   */
  const handleCreateDeck = async (data: { title: string; description?: string; category?: string }) => {
    await api.createDeck(data);
    await loadDecks();
  };

  /**
   * Cập nhật thông tin bộ thẻ (tên, mô tả, phân loại)
   */
  const handleUpdateDeck = async (id: string, data: { title: string; description?: string; category?: string }) => {
    await api.updateDeck(id, data);
    await loadDecks();
    if (selectedDeck && selectedDeck.id === id) {
      setSelectedDeck({ ...selectedDeck, ...data, category: data.category || selectedDeck.category });
    }
  };

  /**
   * Xóa một bộ thẻ và quay về danh sách nếu đang ở bộ thẻ đó
   */
  const handleDeleteDeck = async (id: string) => {
    await api.deleteDeck(id);
    await loadDecks();
    if (selectedDeck && selectedDeck.id === id) {
      setSelectedDeck(null);
      setView('DECKS');
    }
  };

  // ==========================================================================
  // CÁC HÀM XỬ LÝ PHÂN LOẠI (CATEGORY HANDLERS)
  // ==========================================================================

  /**
   * Tạo một phân loại bộ thẻ mới
   */
  const handleCreateCategory = async (data: { name: string; description?: string; icon?: string; color?: string }) => {
    const created = await api.createCategory(data);
    await loadCategories();
    return created;
  };

  /**
   * Cập nhật phân loại bộ thẻ
   */
  const handleUpdateCategory = async (id: string, data: { name: string; description?: string; icon?: string; color?: string }) => {
    const updated = await api.updateCategory(id, data);
    await Promise.all([loadCategories(), loadDecks()]);
    return updated;
  };

  /**
   * Xóa một phân loại bộ thẻ
   */
  const handleDeleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    await Promise.all([loadCategories(), loadDecks()]);
  };

  // ==========================================================================
  // CÁC HÀM XỬ LÝ THẺ FLASHCARD (CARD HANDLERS)
  // ==========================================================================

  /**
   * Thêm một thẻ lẻ vào bộ thẻ
   */
  const handleCreateCard = async (deckId: string, data: { term: string; definition: string; example?: string }) => {
    await api.createCard(deckId, data);
    await loadCards(deckId);
    await loadDecks();
  };

  /**
   * Thêm hàng loạt nhiều thẻ từ chuỗi văn bản (Bulk Import)
   */
  const handleBatchCreateCards = async (deckId: string, batchCards: Array<{ term: string; definition: string; example?: string }>) => {
    await api.createCardsBatch(deckId, batchCards);
    await loadCards(deckId);
    await loadDecks();
  };

  /**
   * Cập nhật nội dung thẻ
   */
  const handleUpdateCard = async (id: string, data: { term: string; definition: string; example?: string }) => {
    await api.updateCard(id, data);
    if (selectedDeck) {
      await loadCards(selectedDeck.id);
    }
    await loadDecks();
  };

  /**
   * Xóa một thẻ
   */
  const handleDeleteCard = async (id: string) => {
    await api.deleteCard(id);
    if (selectedDeck) {
      await loadCards(selectedDeck.id);
    }
    await loadDecks();
  };

  // ==========================================================================
  // CÁC HÀM ĐIỀU HƯỚNG MÀN HÌNH (NAVIGATION & ROUTE SYNCHRONIZATION)
  // ==========================================================================

  /**
   * Điều hướng chuyển màn hình, đồng bộ URL Hash và lưu vào sessionStorage
   * Giúp trình duyệt khi Refresh (F5) hoặc bấm Back/Forward vẫn giữ nguyên trang cũ
   */
  const navigateTo = useCallback((newView: ViewType, deck?: Deck | null) => {
    if (newView === 'DECKS' || !deck) {
      setSelectedDeck(null);
      selectedDeckRef.current = null;
      setView('DECKS');
      window.location.hash = '#/decks';
      try {
        sessionStorage.setItem('quizcard_last_hash', '#/decks');
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
  }, []);

  /**
   * Theo dõi sự kiện hashchange của trình duyệt hoặc khi khởi chạy ứng dụng (F5 / Refresh)
   * Tự động khôi phục dữ liệu bộ thẻ và trạng thái trang tương ứng
   */
  useEffect(() => {
    const syncRouteWithHash = async () => {
      let currentHash = window.location.hash;
      if (!currentHash || currentHash === '#' || currentHash === '#/') {
        try {
          const savedHash = sessionStorage.getItem('quizcard_last_hash');
          if (savedHash && savedHash !== '#/decks' && savedHash !== '#' && savedHash !== '#/') {
            window.location.hash = savedHash;
            return;
          }
        } catch {}
        currentHash = '#/decks';
      }

      try {
        sessionStorage.setItem('quizcard_last_hash', currentHash);
      } catch {}

      const route = parseRoute(currentHash);
      setView(route.view);

      if (route.deckId) {
        // Nếu bộ thẻ chưa được nạp hoặc khác với bộ thẻ hiện tại
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
            // Nếu không tìm thấy bộ thẻ (ví dụ đã bị xóa), quay về danh sách bộ thẻ
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
   * Quay về trang chủ danh sách bộ thẻ
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Thanh điều hướng cố định trên cùng */}
      <Navbar onGoHome={handleGoHome} />

      {/* Nội dung chính thay đổi linh hoạt theo trạng thái 'view' */}
      <main style={{ flex: 1 }}>
        {/* Hiển thị màn hình chờ khi đang khôi phục dữ liệu bộ thẻ sau khi Refresh F5 */}
        {restoringDeck && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '16px',
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              border: '3px solid #e2e8f0',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Đang tải bộ thẻ và khôi phục màn hình học...
            </div>
          </div>
        )}

        {/* VIEW 1: Danh sách các bộ thẻ */}
        {!restoringDeck && view === 'DECKS' && (
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
          />
        )}

        {/* VIEW 2: Màn hình quản lý thẻ (Thêm/Sửa/Xóa/Tìm kiếm/Nhập từ chuỗi) */}
        {!restoringDeck && view === 'CARDS' && selectedDeck && (
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
        )}

        {/* VIEW 3: Chế độ Học Lật Thẻ 3D (Study Mode) */}
        {!restoringDeck && view === 'STUDY' && selectedDeck && (
          <StudyArena
            deck={selectedDeck}
            onExit={handleGoHome}
            onGoToCards={() => navigateTo('CARDS', selectedDeck)}
            onGoToQuiz={() => navigateTo('QUIZ', selectedDeck)}
          />
        )}

        {/* VIEW 4: Chế độ Luyện Thi Trắc Nghiệm (Quiz Mode) */}
        {!restoringDeck && view === 'QUIZ' && selectedDeck && (
          <QuizArena
            deck={selectedDeck}
            onExit={handleGoHome}
            onGoToStudy={() => navigateTo('STUDY', selectedDeck)}
            onGoToCards={() => navigateTo('CARDS', selectedDeck)}
          />
        )}
      </main>

      {/* Chân trang */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 20px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: '13px',
        backgroundColor: '#ffffff',
      }}>
        QuizCard • Hệ thống ghi nhớ Flashcard theo phương pháp Lặp lại ngắt quãng (Spaced Repetition)
      </footer>
    </div>
  );
};

export default App;
