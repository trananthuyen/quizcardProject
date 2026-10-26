/**
 * File utility navigation.js:
 * Tập trung toàn bộ logic và hàm tiện ích xử lý định tuyến (Routing),
 * URL Hash, chuyển đổi tab Sidebar và tiêu đề trang của ứng dụng.
 */

// Danh sách các tab hợp lệ trên Sidebar
export const VALID_TABS = [
    'community',
    'resources',
    'video',
    'recents',
    'drafts',
    'folders',
    'trash',
];

// Bản đồ tiêu đề hiển thị trên thanh Topbar tương ứng với từng tab
export const TAB_TITLES = {
    resources: 'My Resources',
    video: 'Videos & Tutorials',
    recents: 'Recents',
    drafts: 'Drafts',
    folders: 'All Folders',
    trash: 'Trash',
    community: 'Community',
};

/**
 * Lấy tiêu đề trang hiển thị trên Topbar dựa theo tab hiện tại
 * @param {string} tab - Tên tab hiện tại
 * @returns {string} Tiêu đề hiển thị
 */
export const getPageTitle = (tab) => {
    return TAB_TITLES[tab] || 'Community';
};

/**
 * Phân tích URL Hash để lấy trạng thái màn hình (view), tab sidebar và ID bộ thẻ (deckId)
 * @param {string} hash - Chuỗi URL hash (ví dụ: '#/community', '#/study/123')
 * @returns {{ view: 'DECKS'|'CARDS'|'STUDY'|'QUIZ', tab?: string, deckId?: string }}
 */
export const parseRoute = (hash = '') => {
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

    if (VALID_TABS.includes(segment)) {
        return { view: 'DECKS', tab: segment };
    }

    return { view: 'DECKS', tab: 'community' };
};

/**
 * Lưu URL Hash hiện tại vào sessionStorage để giữ trạng thái khi người dùng F5 / Refresh
 * @param {string} hash - URL Hash cần lưu
 */
export const saveLastHash = (hash) => {
    if (!hash || typeof window === 'undefined') return;
    try {
        sessionStorage.setItem('quizcard_last_hash', hash);
    } catch { }
};

/**
 * Lấy URL Hash ban đầu từ trình duyệt hoặc khôi phục từ sessionStorage khi F5
 * @returns {string} URL Hash ban đầu
 */
export const getInitialHash = () => {
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash !== '#' && window.location.hash !== '#/') {
        return window.location.hash;
    }
    try {
        const saved = sessionStorage.getItem('quizcard_last_hash');
        if (saved && saved !== '#' && saved !== '#/') {
            return saved;
        }
    } catch { }
    return '#/community';
};

/**
 * Lấy bộ lọc danh mục mặc định khi chuyển sang tab tương ứng
 * @param {string} tab - Tên tab chuyển tới
 * @returns {string|null} Tên bộ lọc (ALL, STUDIED, NOT_STARTED) hoặc null nếu không đổi
 */
export const getTabFilter = (tab) => {
    switch (tab) {
        case 'community':
        case 'resources':
            return 'ALL';
        case 'recents':
            return 'STUDIED';
        case 'drafts':
            return 'NOT_STARTED';
        default:
            return null;
    }
};

/**
 * Tạo URL Hash tương ứng với View và Deck hoặc Tab
 * @param {string} view - View hiện tại: 'DECKS', 'CARDS', 'STUDY', 'QUIZ'
 * @param {string} activeTab - Tab sidebar hiện tại
 * @param {object|null} deck - Bộ thẻ đang chọn (nếu có)
 * @returns {string} Chuỗi URL hash
 */
export const buildRouteHash = (view, activeTab, deck = null) => {
    if (view === 'DECKS' || !deck) {
        return `#/${activeTab || 'community'}`;
    }
    const seg = view.toLowerCase();
    return `#/${seg}/${deck.id}`;
};

