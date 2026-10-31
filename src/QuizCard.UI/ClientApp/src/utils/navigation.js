/**
 * File utility navigation.js:
 * Tập trung toàn bộ logic và hàm tiện ích xử lý định tuyến (Routing) qua HTML5 History API,
 * chuyển đổi tab Sidebar, cập nhật đường dẫn URL (Path-based không còn /#) và tiêu đề trang.
 */

// Danh sách các tab hợp lệ trên Sidebar
export const VALID_TABS = [
    'community',
    'resources',
    'video',
    'recents',
    'progress',
    'folders',
    'trash',
];

// Bản đồ tiêu đề hiển thị trên thanh Topbar tương ứng với từng tab
export const TAB_TITLES = {
    resources: 'My Resources',
    video: 'Videos & Tutorials',
    recents: 'Recents',
    progress: 'Progress',
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
 * Phân tích đường dẫn URL (Pathname hoặc Hash cũ) để lấy trạng thái màn hình (view), tab sidebar và ID bộ thẻ (deckId)
 * Hỗ trợ cả định dạng sạch '/video', '/study/123' và định dạng cũ '#/video' để tương thích ngược.
 * @param {string} urlString - Chuỗi URL pathname hoặc hash
 * @returns {{ view: 'DECKS'|'CARDS'|'STUDY'|'QUIZ', tab?: string, deckId?: string }}
 */
export const parseRoute = (urlString = '') => {
    // Loại bỏ dấu # hoặc hash prefix nếu còn tồn tại
    const clean = urlString.replace(/^#\/?/, '').replace(/^\//, '');
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
 * Lưu đường dẫn URL hiện tại vào sessionStorage để giữ trạng thái khi người dùng F5 / Refresh
 * @param {string} path - Đường dẫn URL cần lưu (ví dụ: '/video')
 */
export const saveLastPath = (path) => {
    if (!path || typeof window === 'undefined') return;
    try {
        sessionStorage.setItem('quizcard_last_path', path);
    } catch { }
};

// Giữ lại alias saveLastHash để tương thích ngược
export const saveLastHash = saveLastPath;

/**
 * Lấy đường dẫn URL ban đầu từ trình duyệt hoặc khôi phục từ sessionStorage khi F5
 * Tự động chuyển đổi nếu người dùng truy cập bằng link cũ có chứa /#
 * @returns {string} Đường dẫn URL ban đầu sạch (ví dụ: '/video', '/community')
 */
export const getInitialPath = () => {
    if (typeof window !== 'undefined') {
        // Nếu người dùng truy cập bằng link có hash cũ (e.g. /#/video hoặc #/study/...)
        if (window.location.hash && window.location.hash.startsWith('#/')) {
            const cleanPath = window.location.hash.replace(/^#/, '');
            try {
                window.history.replaceState(null, '', cleanPath);
            } catch { }
            return cleanPath;
        }

        // Lấy pathname hiện tại nếu không phải trang gốc '/'
        const pathname = window.location.pathname;
        if (pathname && pathname !== '/' && pathname !== '/index.html') {
            return pathname;
        }
    }

    try {
        const saved = sessionStorage.getItem('quizcard_last_path') || sessionStorage.getItem('quizcard_last_hash');
        if (saved && saved !== '/' && saved !== '#' && saved !== '#/') {
            return saved.replace(/^#/, '');
        }
    } catch { }

    return '/community';
};

// Giữ lại alias getInitialHash để tương thích ngược
export const getInitialHash = getInitialPath;

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
        case 'progress':
            return 'NOT_STARTED';
        default:
            return null;
    }
};

/**
 * Tạo đường dẫn URL Pathname tương ứng với View và Deck hoặc Tab (KHÔNG CÒN DẤU #)
 * @param {string} view - View hiện tại: 'DECKS', 'CARDS', 'STUDY', 'QUIZ'
 * @param {string} activeTab - Tab sidebar hiện tại
 * @param {object|null} deck - Bộ thẻ đang chọn (nếu có)
 * @returns {string} Chuỗi đường dẫn (ví dụ: '/video', '/study/123')
 */
export const buildRoutePath = (view, activeTab, deck = null) => {
    if (view === 'DECKS' || !deck) {
        return `/${activeTab || 'community'}`;
    }
    const seg = view.toLowerCase();
    return `/${seg}/${deck.id}`;
};

// Giữ lại alias buildRouteHash để tương thích ngược
export const buildRouteHash = buildRoutePath;
