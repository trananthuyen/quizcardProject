/**
 * File App.tsx: Component gốc (Root Component) của ứng dụng Frontend.
 * Đóng vai trò điều phối chính:
 * 1. Điều phối màn hình theo Sidebar (Community, My Resources, Videos, Recents, Drafts, Folders, Trash)
 * 2. Điều phối các chế độ học: Quản lý thẻ (CARDS), Học lật thẻ 3D (STUDY), Luyện thi trắc nghiệm (QUIZ)
 * 3. Quản lý trạng thái dữ liệu tập trung (Decks, Cards, Folders) và đồng bộ URL Hash.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import { Sidebar } from './components/Sidebar';
import { CommunityView } from './components/CommunityView';
import { DeckList } from './components/DeckList';
import { MyResources } from './components/MyResources';
import { VideoTutorials } from './components/VideoTutorials';
import { FolderList } from './components/FolderList';
import { TrashView } from './components/TrashView';
import { CardManager } from './components/CardManager';
import { StudyArena } from './components/StudyArena';
import { QuizArena } from './components/QuizArena';
import { DeckModal } from './components/DeckModal';
import { FolderModal } from './components/FolderModal';
import { LoginModal } from './components/LoginModal';
import { DraftsView } from './components/DraftsView';
import { Search, Flame, Zap, LogIn, Bell} from 'lucide-react';
import './App.css';

import { useAuth } from './hooks/UseAuth.js';
import { useAttendance } from './hooks/UseAttendance.js';
import { useDeck } from './hooks/UseDeck.js';
import { useSidebar } from './hooks/UseSidebar.js';
import {
    parseRoute,
    getInitialHash,
    saveLastHash,
    getPageTitle,
    getTabFilter,
    buildRouteHash,
} from './utils/navigation.js';
export const App = () => {
    // Đọc route hiện tại từ URL hash hoặc sessionStorage khi người dùng F5 / Refresh
    const initialRoute = parseRoute(getInitialHash());
    // Trạng thái điều hướng màn hình: 'DECKS' | 'CARDS' | 'STUDY' | 'QUIZ'
    const [view, setView] = useState(initialRoute.view);
    // Tab Sidebar hiện đang hoạt động
    const [activeTab, setActiveTab] = useState(initialRoute.tab || 'community');
    // Danh sách toàn bộ các thư mục bộ thẻ từ Backend
    const [folders, setFolders] = useState([]);
    // Bộ thẻ hiện đang được người dùng bấm chọn để xem/học/thi
    const [selectedDeck, setSelectedDeck] = useState(null);
    const selectedDeckRef = useRef(null);
    // Cờ báo hiệu đang khôi phục dữ liệu bộ thẻ sau khi người dùng Refresh F5 ở màn hình con
    const [restoringDeck, setRestoringDeck] = useState(initialRoute.view !== 'DECKS' && !!initialRoute.deckId);
    // Danh sách các thẻ con thuộc về bộ thẻ đang chọn
    const [cards, setCards] = useState([]);
    // Trạng thái hiển thị loading khi tải danh sách thẻ con
    const [loadingCards, setLoadingCards] = useState(false);
    // Điều khiển mở Modal Quản lý thư mục tập trung
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    // Từ khóa tìm kiếm toàn cục (đồng bộ giữa Sidebar và Topbar)
    const [searchQuery, setSearchQuery] = useState('');
    // Bộ lọc thư mục/tag đang chọn (ALL, STUDIED, NOT_STARTED, hoặc tên Folder)
    const [selectedFilter, setSelectedFilter] = useState('ALL');

    // Quản lý xác thực người dùng (Google, Facebook OAuth, session) qua custom hook useAuth
    const {
        currentUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        handleLoginSuccess,
        handleLogout: authLogout,
    } = useAuth();

    // Xử lý đăng xuất tài khoản và xóa sạch dữ liệu thư mục cá nhân ngay lập tức
    const handleLogout = async () => {
        setFolders([]);
        await authLogout();
        await loadFolders(null);
        await loadDecks();
    };

    // Quản lý điểm danh, chuỗi lửa và năng lượng học tập qua custom hook useAttendance
    const {
        attendanceStatus,
        handleCheckIn,
    } = useAttendance(currentUser, () => setIsLoginModalOpen(true));

    // Quản lý toàn bộ dữ liệu và thao tác bộ thẻ qua custom hook useDeck
    const {
        communityDecks,
        myResourcesDecks,
        decks,
        loadingDecks,
        isDeckModalOpen,
        editingDeck,
        loadDecks,
        handleCreateDeck,
        handleUpdateDeck,
        handleDeleteDeck,
        handleOpenCreateDeck,
        handleOpenEditDeck,
        handleCloseDeckModal,
    } = useDeck({
        currentUser,
        selectedDeck,
        setSelectedDeck,
        onDeckDeleted: () => {
            selectedDeckRef.current = null;
            setView('DECKS');
        },
    });

    // Quản lý trạng thái đóng / mở sidebar và phím tắt Ctrl+B qua custom hook useSidebar
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    // ==========================================================================
    // HÀM TẢI DỮ LIỆU TỪ SERVER (DATA FETCHING)
    // ==========================================================================
    /**
     * Tải danh sách thư mục từ Backend (/api/folders?userId=...)
     */
    const loadFolders = useCallback(async (targetUserId) => {
        try {
            const uid = targetUserId !== undefined ? targetUserId : currentUser?.id;
            const data = await api.getFolders(uid);
            setFolders(data || []);
        }
        catch (err) {
            console.error('Lỗi khi tải danh sách thư mục:', err);
            setFolders([]);
        }
    }, [currentUser?.id]);

    // Tải danh sách thư mục ngay khi ứng dụng mount hoặc currentUser thay đổi
    useEffect(() => {
        loadFolders();
    }, [loadFolders]);

    /**
     * Tải danh sách các thẻ con thuộc một bộ thẻ (/api/decks/{deckId}/cards)
     */
    const loadCards = useCallback(async (deckId) => {
        try {
            setLoadingCards(true);
            const data = await api.getCards(deckId);
            setCards(data);
        }
        catch (err) {
            console.error('Lỗi khi tải danh sách thẻ:', err);
        }
        finally {
            setLoadingCards(false);
        }
    }, []);
    // ==========================================================================
    // CÁC HÀM XỬ LÝ THƯ MỤC (FOLDER CRUD HANDLERS)
    // ==========================================================================
    const handleCreateFolder = async (data) => {
        if (!currentUser) {
            setIsLoginModalOpen(true);
            throw new Error('Vui lòng đăng nhập để tạo thư mục bộ thẻ');
        }
        const payload = { ...data, userId: currentUser.id };
        const created = await api.createFolder(payload);
        await loadFolders(currentUser.id);
        return created;
    };
    const handleUpdateFolder = async (id, data) => {
        const updated = await api.updateFolder(id, data);
        await Promise.all([loadFolders(currentUser?.id), loadDecks()]);
        return updated;
    };
    const handleDeleteFolder = async (id) => {
        await api.deleteFolder(id);
        await Promise.all([loadFolders(currentUser?.id), loadDecks()]);
    };
    // ==========================================================================
    // CÁC HÀM XỬ LÝ THẺ FLASHCARD (CARD CRUD HANDLERS)
    // ==========================================================================
    const handleCreateCard = async (deckId, data) => {
        await api.createCard(deckId, data);
        await loadCards(deckId);
        await loadDecks();
    };
    const handleBatchCreateCards = async (deckId, batchCards) => {
        await api.createCardsBatch(deckId, batchCards);
        await loadCards(deckId);
        await loadDecks();
    };
    const handleUpdateCard = async (id, data) => {
        await api.updateCard(id, data);
        if (selectedDeck) {
            await loadCards(selectedDeck.id);
        }
        await loadDecks();
    };
    const handleDeleteCard = async (id) => {
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
    const handleSelectTab = useCallback((tab) => {
        setActiveTab(tab);
        if (view !== 'DECKS') {
            setView('DECKS');
            setSelectedDeck(null);
            selectedDeckRef.current = null;
        }
        const defaultFilter = getTabFilter(tab);
        if (defaultFilter) {
            setSelectedFilter(defaultFilter);
        }
        const newHash = `#/${tab}`;
        window.location.hash = newHash;
        saveLastHash(newHash);
    }, [view]);
    /**
     * Điều hướng chuyển màn hình, đồng bộ URL Hash và lưu vào sessionStorage
     */
    const navigateTo = useCallback((newView, deck) => {
        if (newView === 'DECKS' || !deck) {
            setSelectedDeck(null);
            selectedDeckRef.current = null;
            setView('DECKS');
        }
        else {
            setSelectedDeck(deck);
            selectedDeckRef.current = deck;
            setView(newView);
        }
        const newHash = buildRouteHash(newView, activeTab, deck);
        window.location.hash = newHash;
        saveLastHash(newHash);
    }, [activeTab]);
    /**
     * Theo dõi sự kiện hashchange của trình duyệt hoặc khi khởi chạy ứng dụng (F5 / Refresh)
     */
    useEffect(() => {
        const syncRouteWithHash = async () => {
            let currentHash = window.location.hash;
            if (!currentHash || currentHash === '#' || currentHash === '#/') {
                currentHash = getInitialHash();
                window.location.hash = currentHash;
            }
            saveLastHash(currentHash);
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
                    }
                    catch (err) {
                        console.error('Không tìm thấy bộ thẻ khi khôi phục trang:', err);
                        navigateTo('DECKS');
                    }
                    finally {
                        setRestoringDeck(false);
                    }
                }
                else {
                    setRestoringDeck(false);
                    if (route.view === 'CARDS') {
                        loadCards(route.deckId);
                    }
                }
            }
            else {
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
    const handleSelectDeckForCards = (deck) => {
        navigateTo('CARDS', deck);
        loadCards(deck.id);
    };
    /**
     * Chuyển sang chế độ Học Lật Thẻ (Flashcard Study Mode)
     */
    const handleSelectDeckForStudy = (deck) => {
        navigateTo('STUDY', deck);
    };
    /**
     * Chuyển sang chế độ Luyện Thi Trắc Nghiệm (Multiple-Choice Quiz Mode)
     */
    const handleSelectDeckForQuiz = (deck) => {
        navigateTo('QUIZ', deck);
    };

    const pageTitle = getPageTitle(activeTab);
    return (<div className="qc-app-container">
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
            onOpenFolders={() => setIsFolderModalOpen(true)}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            folders={folders}
            currentUser={currentUser}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onLogout={handleLogout}
        />

        {/* 2. Vùng nội dung chính bên phải */}
        <div className="qc-main-area">
            {/* Topbar điều hướng trên cùng */}
            <header className="qc-topbar">
                <div className="qc-topbar-left">
                    {view === 'DECKS' ? (<span className="qc-page-title">{pageTitle}</span>) : (<div className="qc-breadcrumb">
                        <button onClick={handleGoHome} className="qc-breadcrumb-back">
                            ← {pageTitle}
                        </button>
                        <span className="qc-breadcrumb-sep">/</span>
                        <span className="qc-breadcrumb-current">{selectedDeck?.title}</span>
                        <span className="qc-breadcrumb-sep">/</span>
                        <span className="qc-breadcrumb-sub">
                            {view === 'STUDY' ? 'Học lật thẻ 3D' : view === 'QUIZ' ? 'Luyện thi trắc nghiệm' : 'Quản lý thẻ'}
                        </span>
                    </div>)}
                </div>

                <div className="qc-topbar-center">
                    <div className="qc-stat-pill qc-stat-energy" title={`Tổng năng lượng: ${attendanceStatus?.energyPoints ?? 20} điểm`}>
                        <Zap size={16} />
                        <span>{attendanceStatus?.energyPoints ?? 20}</span>
                    </div>

                    <div
                        className={`qc-stat-pill qc-stat-streak ${attendanceStatus?.hasCheckedInToday ? 'active-streak' : 'pending-streak'}`}
                        title={attendanceStatus?.hasCheckedInToday ? `Chuỗi lửa: ${attendanceStatus?.currentStreak ?? 10} ngày (Đã điểm danh hôm nay! Bấm để xem lịch Drafts)` : `Chuỗi lửa: ${attendanceStatus?.currentStreak ?? 10} ngày (Chưa điểm danh! Bấm để vào Drafts điểm danh)`}
                        onClick={() => {
                            if (activeTab !== 'drafts') {
                                handleSelectTab('drafts');
                            }
                        }}
                    >
                        <Flame size={16} className={attendanceStatus?.hasCheckedInToday ? 'qc-flame-active' : 'qc-flame-pending'} />
                        <span>{attendanceStatus?.currentStreak ?? 10} days</span>
                    </div>
                </div>

                <div className="qc-topbar-right">
                    <button type="button" className="qc-bell-btn" title="Thông báo" onClick={() => alert('Không có thông báo mới')} aria-label="Thông báo">
                        <Bell size={16} />
                    </button>
                </div>
            </header>

            {/* Nội dung thay đổi theo view và sidebar tab */}
            <main className="qc-main-scroll">
                {/* Màn hình chờ khi khôi phục trang sau F5 */}
                {restoringDeck && (<div className="qc-restoring-state">
                    <div className="qc-restoring-spinner" />
                    <div className="qc-restoring-text">
                        Đang tải dữ liệu và khôi phục màn hình học...
                    </div>
                </div>)}

                {/* VIEW 1: Quản lý chi tiết danh sách thẻ flashcard */}
                {!restoringDeck && view === 'CARDS' && selectedDeck && (<div className="qc-view-wrapper-wide">
                    <CardManager
                        deck={selectedDeck}
                        cards={cards}
                        loading={loadingCards}
                        currentUser={currentUser}
                        onBack={handleGoHome}
                        onStartStudy={() => navigateTo('STUDY', selectedDeck)}
                        onStartQuiz={() => navigateTo('QUIZ', selectedDeck)}
                        onCreateCard={handleCreateCard}
                        onBatchCreateCards={handleBatchCreateCards}
                        onUpdateCard={handleUpdateCard}
                        onDeleteCard={handleDeleteCard}
                        onUpdateDeck={handleUpdateDeck}
                    />
                </div>)}

                {/* VIEW 2: Chế độ Học Lật Thẻ 3D (Study Mode) */}
                {!restoringDeck && view === 'STUDY' && selectedDeck && (<div className="qc-view-wrapper">
                    <StudyArena
                        deck={selectedDeck}
                        currentUser={currentUser}
                        onExit={handleGoHome}
                        onGoToCards={() => navigateTo('CARDS', selectedDeck)}
                        onGoToQuiz={() => navigateTo('QUIZ', selectedDeck)}
                    />
                </div>)}

                {/* VIEW 3: Chế độ Luyện Thi Trắc Nghiệm (Quiz Mode) */}
                {!restoringDeck && view === 'QUIZ' && selectedDeck && (<div className="qc-view-wrapper">
                    <QuizArena
                        deck={selectedDeck}
                        currentUser={currentUser}
                        onExit={handleGoHome}
                        onGoToStudy={() => navigateTo('STUDY', selectedDeck)}
                        onGoToCards={() => navigateTo('CARDS', selectedDeck)}
                    />
                </div>)}

                {/* VIEW 4: Các tab màn hình tương tác từ Sidebar khi ở view === 'DECKS' */}
                {!restoringDeck && view === 'DECKS' && (<>
                    {/* Tab 4.1: My Resources (Kho học liệu và thống kê cá nhân) */}
                    {activeTab === 'resources' && (
                        <MyResources
                            decks={myResourcesDecks}
                            currentUser={currentUser}
                            onOpenLoginModal={() => setIsLoginModalOpen(true)}
                            folders={folders}
                            loading={loadingDecks}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            selectedFilter={selectedFilter}
                            onSelectFilter={setSelectedFilter}
                            onOpenCreateDeck={() => {
                                if (!currentUser) {
                                    setIsLoginModalOpen(true);
                                    return;
                                }
                                handleOpenCreateDeck();
                            }}
                            onOpenFolders={() => setIsFolderModalOpen(true)}
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

                    {/* Tab 4.3: All Folders (Toàn bộ thư mục chứa bộ thẻ) */}
                    {activeTab === 'folders' && (
                        <FolderList
                            folders={folders}
                            decks={decks}
                            currentUser={currentUser}
                            onOpenCreateFolder={() => {
                                if (!currentUser) {
                                    setIsLoginModalOpen(true);
                                    return;
                                }
                                setIsFolderModalOpen(true);
                            }}
                            onOpenCreateDeck={(folderName) => {
                                if (!currentUser) {
                                    setIsLoginModalOpen(true);
                                    return;
                                }
                                if (folderName) {
                                    setSelectedFilter(folderName);
                                }
                                handleOpenCreateDeck();
                            }}
                            onOpenEditDeck={handleOpenEditDeck}
                            onDeleteDeck={handleDeleteDeck}
                            onSelectDeckForStudy={handleSelectDeckForStudy}
                            onSelectDeckForQuiz={handleSelectDeckForQuiz}
                            onSelectDeckForCards={handleSelectDeckForCards}
                        />
                    )}

                    {/* Tab 4.4: Trash (Thùng rác) */}
                    {activeTab === 'trash' && (
                        <TrashView
                            currentUser={currentUser}
                            onDeckRestored={loadDecks}
                            onGoHome={() => handleSelectTab('resources')}
                        />
                    )}

                    {/* Tab 4.5: Recents (Các bộ thẻ đã bắt đầu học) */}
                    {activeTab === 'recents' && (
                        <DeckList
                            decks={decks}
                            folders={folders}
                            loading={loadingDecks}
                            currentUser={currentUser}
                            isCommunity={false}
                            onCreateDeck={handleCreateDeck}
                            onUpdateDeck={handleUpdateDeck}
                            onDeleteDeck={handleDeleteDeck}
                            onCreateFolder={handleCreateFolder}
                            onUpdateFolder={handleUpdateFolder}
                            onDeleteFolder={handleDeleteFolder}
                            onSelectDeckForStudy={handleSelectDeckForStudy}
                            onSelectDeckForQuiz={handleSelectDeckForQuiz}
                            onSelectDeckForCards={handleSelectDeckForCards}
                            onOpenCreateDeck={handleOpenCreateDeck}
                            onOpenEditDeck={handleOpenEditDeck}
                            onOpenFolders={() => setIsFolderModalOpen(true)}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            selectedFilter="STUDIED"
                            onSelectFilter={setSelectedFilter}
                        />
                    )}

                    {/* Tab 4.6: Drafts (Lịch điểm danh duy trì chuỗi lửa & Các bộ thẻ bản nháp) */}
                    {activeTab === 'drafts' && (
                        <DraftsView
                            currentUser={currentUser}
                            onOpenLoginModal={() => setIsLoginModalOpen(true)}
                            attendanceStatus={attendanceStatus}
                            onCheckIn={handleCheckIn}
                        />
                    )}

                    {/* Tab 4.7: Community (Khám phá & Học tập cộng đồng chia sẻ mở) */}
                    {activeTab === 'community' && (
                        <CommunityView
                            decks={communityDecks}
                            loading={loadingDecks}
                            currentUser={currentUser}
                            onSelectDeckForStudy={handleSelectDeckForStudy}
                            onSelectDeckForQuiz={handleSelectDeckForQuiz}
                        />
                    )}
                </>)}
            </main>
        </div>

        {/* Modal Tạo & Sửa Bộ Thẻ tập trung */}
        <DeckModal isOpen={isDeckModalOpen} onClose={handleCloseDeckModal} onSubmit={async (data) => {
            if (editingDeck) {
                await handleUpdateDeck(editingDeck.id, data);
            }
            else {
                await handleCreateDeck(data);
            }
        }} editingDeck={editingDeck} folders={folders} decks={decks} defaultFolder={selectedFilter !== 'ALL' && selectedFilter !== 'STUDIED' && selectedFilter !== 'NOT_STARTED' ? selectedFilter : 'Chung'} onOpenFolderModal={() => setIsFolderModalOpen(true)} />

        {/* Modal Quản Lý Thư Mục tập trung */}
        <FolderModal
            isOpen={isFolderModalOpen}
            onClose={() => setIsFolderModalOpen(false)}
            folders={folders}
            decks={decks}
            currentUser={currentUser}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
        />

        {/* Modal Đăng Nhập qua Google / Facebook */}
        <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
        />
    </div>);
};
export default App;
