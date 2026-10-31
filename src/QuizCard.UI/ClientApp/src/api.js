/**
 * File API Client: Tập trung toàn bộ các hàm gọi HTTP request tới Backend ASP.NET Core.
 * Sử dụng Fetch API tiêu chuẩn của trình duyệt kèm kiểm tra mã lỗi HTTP (res.ok) và phân tích JSON.
 */
// Đường dẫn gốc của API (được Vite proxy sang http://localhost:5030 khi phát triển,
// hoặc gọi trực tiếp cùng host khi chạy sản phẩm)
const API_BASE = '/api';

// Bọc hàm fetch trong phạm vi api.js để tự động nhận diện và xử lý mã lỗi 429 (Rate Limiting - Quá nhiều yêu cầu)
const nativeFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : globalThis.fetch;
const fetch = async (url, options) => {
    const res = await nativeFetch(url, options);
    if (res.status === 429) {
        let errMessage = 'Bạn đang gửi yêu cầu quá nhanh và liên tục. Vui lòng chờ vài giây rồi thử lại.';
        try {
            const data = await res.clone().json();
            if (data?.message) errMessage = data.message;
        } catch {}
        console.warn('[Rate Limit 429]', errMessage);
        const error = new Error(errMessage);
        error.status = 429;
        throw error;
    }
    return res;
};

export const api = {
    // ==========================================================================
    // NHÓM 0: XÁC THỰC NGƯỜI DÙNG (AUTHENTICATION)
    // ==========================================================================
    /**
     * Đăng nhập hoặc đăng ký tài khoản qua Google hoặc Facebook kèm xác nhận điều khoản
     */
    async externalLogin(payload) {
        const res = await fetch(`${API_BASE}/auth/external-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Đăng nhập không thành công');
        }
        return res.json();
    },
    /**
     * Lấy thông tin tài khoản hiện tại theo userId
     */
    async getCurrentUser(userId) {
        const res = await fetch(`${API_BASE}/auth/me/${userId}`);
        if (!res.ok)
            throw new Error('Không thể lấy thông tin tài khoản');
        return res.json();
    },
    /**
     * Gọi POST /api/auth/logout để xóa cookie phiên đăng nhập phía máy chủ
     */
    async logout() {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
            });
        } catch (err) {
            console.error('Lỗi khi gọi API đăng xuất:', err);
        }
    },
    // ==========================================================================
    // NHÓM 1: CÁC HÀM QUẢN LÝ BỘ THẺ (DECK MANAGEMENT)
    // ==========================================================================
    /**
     * 1. Gọi GET /api/decks/community để lấy tất cả bộ thẻ hiển thị ở Community.
     * Hỗ trợ lọc theo thư mục (folder) và thẻ tag: /api/decks/community?folder=...&tag=...
     */
    async getCommunityDecks(folder, tag) {
        const params = new URLSearchParams();
        if (folder) params.append('folder', folder);
        if (tag) params.append('tag', tag);
        const url = params.toString() ? `${API_BASE}/decks/community?${params.toString()}` : `${API_BASE}/decks/community`;
        const res = await fetch(url);
        if (!res.ok)
            throw new Error('Không thể tải danh sách bộ thẻ cộng đồng');
        return res.json();
    },
    /**
     * 2. Gọi GET /api/decks/my-resources để lấy tất cả bộ thẻ của người dùng tại My Resources.
     * Hỗ trợ lọc theo userId, thư mục (folder) và thẻ tag: /api/decks/my-resources?userId=...&folder=...&tag=...
     */
    async getMyResourcesDecks(userId, folder, tag) {
        if (!userId) return [];
        const params = new URLSearchParams();
        params.append('userId', userId);
        if (folder) params.append('folder', folder);
        if (tag) params.append('tag', tag);
        const res = await fetch(`${API_BASE}/decks/my-resources?${params.toString()}`);
        if (!res.ok)
            throw new Error('Không thể tải danh sách bộ thẻ của bạn');
        return res.json();
    },
    /**
     * Gọi GET /api/decks để lấy danh sách toàn bộ bộ thẻ kèm số lượng thẻ theo trạng thái.
     * Hỗ trợ lọc theo thư mục (folder), userId và tag.
     */
    async getDecks(folder, userId, tag) {
        const params = new URLSearchParams();
        if (folder) params.append('folder', folder);
        if (userId) params.append('userId', userId);
        if (tag) params.append('tag', tag);
        const url = params.toString() ? `${API_BASE}/decks?${params.toString()}` : `${API_BASE}/decks`;
        const res = await fetch(url);
        if (!res.ok)
            throw new Error('Không thể tải danh sách bộ thẻ');
        return res.json();
    },
    /**
     * Gọi GET /api/decks/{id} để lấy thông tin chi tiết một bộ thẻ.
     */
    async getDeck(id) {
        const res = await fetch(`${API_BASE}/decks/${id}`);
        if (!res.ok)
            throw new Error('Không thể tải thông tin bộ thẻ');
        return res.json();
    },
    /**
     * Gọi POST /api/decks để tạo bộ thẻ mới kèm thư mục folder và thẻ tag.
     */
    async createDeck(data) {
        const res = await fetch(`${API_BASE}/decks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể tạo bộ thẻ mới');
        }
        return res.json();
    },
    /**
     * Gọi PUT /api/decks/{id} để cập nhật tên, mô tả hoặc phân loại bộ thẻ.
     */
    async updateDeck(id, data, userId) {
        const url = userId ? `${API_BASE}/decks/${id}?userId=${userId}` : `${API_BASE}/decks/${id}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể cập nhật bộ thẻ');
        }
        return res.json();
    },
    /**
     * Gọi DELETE /api/decks/{id} để xóa vĩnh viễn một bộ thẻ.
     */
    async deleteDeck(id, userId) {
        const url = userId ? `${API_BASE}/decks/${id}?userId=${userId}` : `${API_BASE}/decks/${id}`;
        const res = await fetch(url, {
            method: 'DELETE',
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể xóa bộ thẻ');
        }
    },
    // ==========================================================================
    // NHÓM 2: CÁC HÀM QUẢN LÝ THẺ FLASHCARD (CARD MANAGEMENT)
    // ==========================================================================
    /**
     * Gọi GET /api/decks/{deckId}/cards để lấy tất cả thẻ trong bộ.
     */
    async getCards(deckId) {
        const res = await fetch(`${API_BASE}/decks/${deckId}/cards`);
        if (!res.ok)
            throw new Error('Không thể tải danh sách thẻ');
        return res.json();
    },
    /**
     * Gọi POST /api/decks/{deckId}/cards để thêm một thẻ Flashcard đơn lẻ.
     */
    async createCard(deckId, data) {
        const res = await fetch(`${API_BASE}/decks/${deckId}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || err.title || 'Không thể thêm thẻ mới');
        }
        return res.json();
    },
    /**
     * Gọi POST /api/decks/{deckId}/cards/batch (hoặc /bulk) để tạo hàng loạt thẻ từ chuỗi văn bản parse được.
     */
    async createCardsBatch(deckId, cards) {
        const res = await fetch(`${API_BASE}/decks/${deckId}/cards/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cards),
            credentials: 'include',
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || err.title || 'Không thể nhập danh sách thẻ');
        }
        return res.json();
    },
    /**
     * Gọi PUT /api/cards/{id} để chỉnh sửa nội dung thẻ.
     */
    async updateCard(id, data) {
        const res = await fetch(`${API_BASE}/cards/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || err.title || 'Không thể cập nhật thẻ');
        }
        return res.json();
    },
    /**
     * Gọi DELETE /api/cards/{id} để xóa thẻ.
     */
    async deleteCard(id) {
        const res = await fetch(`${API_BASE}/cards/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || err.title || 'Không thể xóa thẻ');
        }
    },
    // ==========================================================================
    // NHÓM 3: CÁC HÀM PHỤC VỤ PHIÊN HỌC & TRẮC NGHIỆM (STUDY & QUIZ MODE)
    // ==========================================================================
    /**
     * Gọi GET /api/study/{deckId}/stats để lấy số liệu thống kê tiến độ ôn tập.
     */
    async getStudyStats(deckId) {
        const res = await fetch(`${API_BASE}/study/${deckId}/stats`);
        if (!res.ok)
            throw new Error('Không thể tải thống kê học tập');
        return res.json();
    },
    /**
     * Gọi GET /api/study/{deckId}/cards để lấy danh sách thẻ cho phiên học hoặc bài thi trắc nghiệm.
     * @param dueOnly Nếu true chỉ lấy thẻ đến hạn ôn; nếu false lấy toàn bộ thẻ trong bộ.
     */
    async getStudySessionCards(deckId, dueOnly = false, userId = null) {
        const params = new URLSearchParams();
        if (dueOnly) params.append('dueOnly', 'true');
        if (userId) params.append('userId', userId);
        const url = params.toString() ? `${API_BASE}/study/${deckId}/cards?${params.toString()}` : `${API_BASE}/study/${deckId}/cards`;
        const res = await fetch(url);
        if (!res.ok)
            throw new Error('Không thể tải danh sách thẻ cần học');
        return res.json();
    },
    /**
     * Alias tương thích getStudyCards
     */
    async getStudyCards(deckId, dueOnly = false, userId = null) {
        return this.getStudySessionCards(deckId, dueOnly, userId);
    },
    /**
     * Gọi GET /api/study/{deckId}/quiz để lấy danh sách câu hỏi trắc nghiệm ngẫu nhiên.
     * Mỗi câu hỏi có 4 lựa chọn và đáp án đúng.
     */
    async getQuizCards(deckId, userId = null) {
        const url = userId ? `${API_BASE}/study/${deckId}/quiz?userId=${encodeURIComponent(userId)}` : `${API_BASE}/study/${deckId}/quiz`;
        const res = await fetch(url);
        if (!res.ok)
            throw new Error('Không thể tải câu hỏi trắc nghiệm');
        return res.json();
    },
    /**
     * Gọi POST /api/study/cards/{cardId}/answer để gửi kết quả người dùng trả lời (Đúng hoặc Sai).
     * Backend sẽ chạy thuật toán Spaced Repetition và cập nhật trạng thái thẻ theo UserId.
     */
    async answerCard(cardId, isCorrect, userId = null) {
        const res = await fetch(`${API_BASE}/study/cards/${cardId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isCorrect, userId }),
        });
        if (!res.ok)
            throw new Error('Không thể gửi kết quả học tập');
        return res.json();
    },
    /**
     * Gọi POST /api/study/{deckId}/reset để đặt lại tiến độ học tập của bộ thẻ về 0.
     */
    async resetDeckProgress(deckId, userId = null) {
        const url = userId ? `${API_BASE}/study/${deckId}/reset?userId=${encodeURIComponent(userId)}` : `${API_BASE}/study/${deckId}/reset`;
        const res = await fetch(url, {
            method: 'POST',
        });
        if (!res.ok)
            throw new Error('Không thể đặt lại tiến độ');
    },
    // ==========================================================================
    // NHÓM 4: CÁC HÀM QUẢN LÝ THƯ MỤC (FOLDER MANAGEMENT)
    // ==========================================================================
    /**
     * Gọi GET /api/folders?userId=... để lấy danh sách các thư mục kèm số lượng bộ thẻ.
     */
    async getFolders(userId) {
        const url = userId ? `${API_BASE}/folders?userId=${encodeURIComponent(userId)}` : `${API_BASE}/folders`;
        const res = await fetch(url);
        if (!res.ok)
            throw new Error('Không thể tải danh sách thư mục');
        return res.json();
    },
    /**
     * Gọi POST /api/folders để tạo mới một thư mục bộ thẻ.
     */
    async createFolder(data) {
        const res = await fetch(`${API_BASE}/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể tạo thư mục mới');
        }
        return res.json();
    },
    /**
     * Gọi PUT /api/folders/{id} để chỉnh sửa thông tin thư mục.
     */
    async updateFolder(id, data) {
        const res = await fetch(`${API_BASE}/folders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể cập nhật thư mục');
        }
        return res.json();
    },
    /**
     * Gọi DELETE /api/folders/{id} để xóa một thư mục bộ thẻ.
     */
    async deleteFolder(id) {
        const res = await fetch(`${API_BASE}/folders/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok)
            throw new Error('Không thể xóa thư mục');
    },

    // ==========================================================================
    // NHÓM 6: ĐIỂM DANH & CHUỖI LỬA (ATTENDANCE & STREAK)
    // ==========================================================================
    /**
     * Lấy trạng thái điểm danh, chuỗi lửa và lịch sử điểm danh.
     * Nếu chưa đăng nhập hoặc có lỗi, trả về trạng thái mặc định an toàn.
     */
    async getAttendanceStatus(userId) {
        if (!userId) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                energyPoints: 0,
                hasCheckedInToday: false,
                lastCheckInDate: null,
                checkedInDates: []
            };
        }

        const params = new URLSearchParams();
        params.append('userId', userId);

        try {
            const res = await fetch(`${API_BASE}/attendance/status?${params.toString()}`);
            if (!res.ok) {
                return {
                    currentStreak: 0,
                    longestStreak: 0,
                    energyPoints: 0,
                    hasCheckedInToday: false,
                    lastCheckInDate: null,
                    checkedInDates: []
                };
            }
            return await res.json();
        } catch {
            return {
                currentStreak: 0,
                longestStreak: 0,
                energyPoints: 20,
                hasCheckedInToday: false,
                lastCheckInDate: null,
                checkedInDates: []
            };
        }
    },

    /**
     * Thực hiện điểm danh trong ngày để duy trì chuỗi lửa và cộng điểm năng lượng.
     * Yêu cầu người dùng phải đăng nhập trước khi gọi API.
     */
    async checkIn(userId) {
        if (!userId) {
            const err = new Error('Vui lòng đăng nhập tài khoản trước khi thực hiện điểm danh.');
            err.status = 401;
            throw err;
        }

        const res = await fetch(`${API_BASE}/attendance/check-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });

        if (res.status === 401 || res.status === 403) {
            const err = new Error('Vui lòng đăng nhập tài khoản trước khi thực hiện điểm danh.');
            err.status = res.status;
            throw err;
        }

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const err = new Error(errData.message || 'Điểm danh không thành công');
            err.status = res.status;
            throw err;
        }
        return res.json();
    },

    // ==========================================================================
    // NHÓM 5: QUẢN LÝ THÙNG RÁC (TRASH MANAGEMENT)
    // ==========================================================================
    /**
     * Lấy danh sách các bộ thẻ và thẻ trong thùng rác
     */
    async getTrash(userId) {
        const url = userId ? `${API_BASE}/trash?userId=${userId}` : `${API_BASE}/trash`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Không thể tải dữ liệu thùng rác');
        return res.json();
    },

    /**
     * Xem chi tiết một bộ thẻ trong thùng rác kèm danh sách các thẻ con
     */
    async getTrashDeck(id) {
        const res = await fetch(`${API_BASE}/trash/decks/${id}`);
        if (!res.ok) throw new Error('Không tìm thấy bộ thẻ trong thùng rác');
        return res.json();
    },

    /**
     * Khôi phục bộ thẻ từ thùng rác trở về danh sách hoạt động
     */
    async restoreDeckFromTrash(id) {
        const res = await fetch(`${API_BASE}/trash/decks/${id}/restore`, { method: 'POST' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể khôi phục bộ thẻ');
        }
        return res.json();
    },

    /**
     * Xóa vĩnh viễn một bộ thẻ khỏi thùng rác
     */
    async permanentDeleteDeck(id) {
        const res = await fetch(`${API_BASE}/trash/decks/${id}/permanent`, { method: 'DELETE' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể xóa vĩnh viễn bộ thẻ');
        }
        return res.json();
    },

    /**
     * Dọn sạch toàn bộ thùng rác
     */
    async emptyTrash(userId) {
        const url = userId ? `${API_BASE}/trash/empty?userId=${userId}` : `${API_BASE}/trash/empty`;
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể dọn sạch thùng rác');
        }
        return res.json();
    },

    /**
     * Khôi phục thẻ flashcard đơn lẻ
     */
    async restoreCardFromTrash(id) {
        const res = await fetch(`${API_BASE}/trash/cards/${id}/restore`, { method: 'POST' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể khôi phục thẻ');
        }
        return res.json();
    },

    /**
     * Xóa vĩnh viễn một thẻ flashcard
     */
    async permanentDeleteCard(id) {
        const res = await fetch(`${API_BASE}/trash/cards/${id}/permanent`, { method: 'DELETE' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể xóa vĩnh viễn thẻ');
        }
        return res.json();
    },

    // ==========================================================================
    // NHÓM 8: CÁC HÀM QUẢN LÝ DANH SÁCH GẦN ĐÂY (RECENTS MANAGEMENT)
    // ==========================================================================
    /**
     * Lấy danh sách các bộ thẻ gần đây của người dùng
     */
    async getRecents(userId) {
        if (!userId) return [];
        const res = await fetch(`${API_BASE}/recents?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error('Không thể tải danh sách gần đây');
        return res.json();
    },

    /**
     * Ghi nhận xem hoặc học một bộ thẻ
     */
    async recordRecent(deckId, actionType = 'VIEW', userId = null) {
        const res = await fetch(`${API_BASE}/recents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deckId, userId, actionType }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể lưu lịch sử gần đây');
        }
        return res.json();
    },

    /**
     * Xóa 1 mục khỏi danh sách gần đây theo ID
     */
    async deleteRecent(id, userId = null) {
        const url = userId ? `${API_BASE}/recents/${id}?userId=${encodeURIComponent(userId)}` : `${API_BASE}/recents/${id}`;
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa mục khỏi danh sách gần đây');
        return res.json();
    },

    /**
     * Xóa bộ thẻ khỏi danh sách gần đây theo deckId
     */
    async deleteRecentByDeck(deckId, userId = null) {
        const url = userId ? `${API_BASE}/recents/deck/${deckId}?userId=${encodeURIComponent(userId)}` : `${API_BASE}/recents/deck/${deckId}`;
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa bộ thẻ khỏi danh sách gần đây');
        return res.json();
    },

    /**
     * Xóa toàn bộ danh sách gần đây
     */
    async clearAllRecents(userId = null) {
        const url = userId ? `${API_BASE}/recents/clear?userId=${encodeURIComponent(userId)}` : `${API_BASE}/recents/clear`;
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa toàn bộ danh sách gần đây');
        return res.json();
    },

    // ==========================================================================
    // NHÓM 9: QUẢN TRỊ VIÊN & CLOUDINARY (ADMIN AREA & CLOUDINARY MEDIA)
    // ==========================================================================
    /**
     * Đăng nhập tài khoản Quản trị viên (Admin Area)
     */
    async adminLogin(usernameOrEmail, password, rememberMe = true) {
        const res = await fetch(`${API_BASE}/admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameOrEmail, password, rememberMe }),
            credentials: 'include',
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.message || 'Tên đăng nhập hoặc mật khẩu quản trị viên không đúng.');
        }
        return data;
    },

    /**
     * Đăng xuất khỏi tài khoản Quản trị viên
     */
    async adminLogout() {
        const res = await fetch(`${API_BASE}/admin/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        return await res.json().catch(() => ({ success: true }));
    },

    /**
     * Kiểm tra trạng thái phiên làm việc hiện tại của Quản trị viên
     */
    async getAdminStatus() {
        try {
            const res = await fetch(`${API_BASE}/admin/auth/status`, {
                credentials: 'include',
            });
            if (!res.ok) return { isAuthenticated: false };
            return await res.json();
        } catch {
            return { isAuthenticated: false };
        }
    },

    /**
     * Lấy danh sách toàn bộ các video đã lưu trữ trong database (Dành cho Admin)
     */
    async getAdminVideos() {
        try {
            const res = await fetch(`${API_BASE}/admin/videos`);
            if (!res.ok) return [];
            return await res.json();
        } catch {
            return [];
        }
    },

    /**
     * Lấy thống kê tổng quan hệ thống người dùng, decks, cards (Admin)
     */
    async getAdminUsersOverview() {
        const res = await fetch(`${API_BASE}/admin/users/stats`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Không thể tải số liệu thống kê quản trị viên');
        return await res.json();
    },

    /**
     * Lấy danh sách toàn bộ người dùng và số lượng decks, cards đã tạo (Admin)
     */
    async getAdminUsersList({ search = '', sort = 'decks_desc' } = {}) {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (sort) params.append('sort', sort);

        const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Không thể tải danh sách người dùng');
        return await res.json();
    },

    /**
     * Lấy danh sách các bộ thẻ của một người dùng cụ thể (Admin)
     */
    async getAdminUserDecks(userId) {
        const res = await fetch(`${API_BASE}/admin/users/${userId}/decks`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Không thể tải danh sách bộ thẻ của người dùng');
        return await res.json();
    },

    /**
     * Lấy danh sách bộ thẻ hệ thống/mẫu (Admin)
     */
    async getAdminSystemDecks() {
        const res = await fetch(`${API_BASE}/admin/users/system/decks`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Không thể tải danh sách bộ thẻ hệ thống');
        return await res.json();
    },

    /**
     * Quản trị viên xóa một bộ thẻ (Admin Moderation)
     */
    async deleteAdminUserDeck(deckId) {
        const res = await fetch(`${API_BASE}/admin/users/decks/${deckId}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể xóa bộ thẻ');
        }
        return await res.json();
    },

    // ==========================================================================
    // NHÓM 10: QUẢN TRỊ NHẬT KÝ YÊU CẦU (REQUEST LOGS MONITORING)
    // ==========================================================================
    /**
     * Lấy số liệu phân tích và hiệu năng logs (Admin)
     */
    async getAdminLogStats() {
        const res = await fetch(`${API_BASE}/admin/logs/stats`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Không thể tải thống kê nhật ký yêu cầu');
        return await res.json();
    },

    /**
     * Lấy danh sách Request Logs có lọc và phân trang (Admin)
     */
    async getAdminLogs({
        page = 1,
        pageSize = 25,
        search = '',
        method = '',
        statusCode = '',
        onlyErrors = false,
        userId = null,
        fromDate = null,
        toDate = null,
    } = {}) {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('pageSize', pageSize);
        if (search) params.append('search', search);
        if (method && method !== 'ALL') params.append('method', method);
        if (statusCode) params.append('statusCode', statusCode);
        if (onlyErrors) params.append('onlyErrors', 'true');
        if (userId) params.append('userId', userId);
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);

        const res = await fetch(`${API_BASE}/admin/logs?${params.toString()}`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Không thể tải danh sách nhật ký yêu cầu');
        return await res.json();
    },

    /**
     * Lấy chi tiết một bản ghi log (Admin)
     */
    async getAdminLogDetail(id) {
        const res = await fetch(`${API_BASE}/admin/logs/${id}`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Không thể tải chi tiết bản ghi nhật ký');
        return await res.json();
    },

    /**
     * Dọn dẹp nhật ký yêu cầu (Admin)
     */
    async clearAdminLogs(days = null) {
        const url = days !== null && days !== undefined
            ? `${API_BASE}/admin/logs/clear?days=${days}`
            : `${API_BASE}/admin/logs/clear`;

        const res = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể dọn dẹp nhật ký');
        }
        return await res.json();
    },

    /**
     * Lấy danh sách các video bài học đang hoạt động (Dành cho học viên)
     */
    async getPublicVideos() {
        try {
            const res = await fetch(`${API_BASE}/videos`);
            if (!res.ok) return [];
            return await res.json();
        } catch {
            return [];
        }
    },

    /**
     * Lấy trạng thái cấu hình Cloudinary từ máy chủ
     */
    async getCloudinaryConfig() {
        try {
            const res = await fetch(`${API_BASE}/admin/videos/config`);
            if (!res.ok) return { isConfigured: false, cloudName: '' };
            return await res.json();
        } catch {
            return { isConfigured: false, cloudName: '' };
        }
    },

    /**
     * Tải file video lên Cloudinary (Chỉ dành cho Admin qua /api/admin/videos/upload)
     * Hỗ trợ đính kèm phụ đề VTT tiếng Anh & tiếng Việt (file upload, nội dung text hoặc URL)
     */
    async uploadVideoToCloudinary(
        file,
        folder = null,
        title = null,
        description = null,
        vttEnFile = null,
        vttViFile = null,
        vttEnUrl = null,
        vttViUrl = null,
        vttEnText = null,
        vttViText = null
    ) {
        const formData = new FormData();
        formData.append('file', file);
        if (folder) formData.append('folder', folder);
        if (title) formData.append('title', title);
        if (description) formData.append('description', description);
        if (vttEnFile) formData.append('vttEn', vttEnFile);
        if (vttViFile) formData.append('vttVi', vttViFile);
        if (vttEnUrl) formData.append('vttEnUrl', vttEnUrl);
        if (vttViUrl) formData.append('vttViUrl', vttViUrl);
        if (vttEnText) formData.append('vttEnText', vttEnText);
        if (vttViText) formData.append('vttViText', vttViText);

        // Ưu tiên gọi API của Admin Area
        let res = await fetch(`${API_BASE}/admin/videos/upload`, {
            method: 'POST',
            body: formData,
        });

        // Fallback sang /api/videos/upload nếu có
        if (res.status === 404) {
            res = await fetch(`${API_BASE}/videos/upload`, {
                method: 'POST',
                body: formData,
            });
        }

        if (res.status === 401 || res.status === 403) {
            throw new Error('Tính năng quản lý và upload video chỉ dành riêng cho Quản trị viên (Admin). Vui lòng đăng nhập quyền Admin.');
        }

        if (!res.ok) {
            let errorText = '';
            try {
                const err = await res.json();
                errorText = err.errorMessage || err.message || err.title || (err.errors ? Object.values(err.errors).flat().join(', ') : '');
            } catch {
                errorText = await res.text().catch(() => '');
            }
            if (errorText.includes('File size too large') || errorText.includes('104857600')) {
                throw new Error('Dung lượng video vượt quá giới hạn 100 MB của tài khoản Cloudinary Free (Tối đa: 104,857,600 bytes). Vui lòng nén video hoặc chọn file dưới 100 MB.');
            }
            throw new Error(errorText || `Lỗi máy chủ (${res.status}): Không thể tải video lên Cloudinary.`);
        }

        return await res.json();
    },

    /**
     * Tải video từ một đường dẫn URL bên ngoài lên Cloudinary (Dành cho Admin)
     */
    async uploadVideoUrlToCloudinary(videoUrl, folder = null, title = null, description = null, vttEnUrl = null, vttViUrl = null, vttEnText = null, vttViText = null) {
        let res = await fetch(`${API_BASE}/admin/videos/upload-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: videoUrl, folder, title, description, vttEnUrl, vttViUrl, vttEnText, vttViText }),
        });

        if (res.status === 404) {
            res = await fetch(`${API_BASE}/videos/upload-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: videoUrl, folder, title, description, vttEnUrl, vttViUrl, vttEnText, vttViText }),
            });
        }

        if (res.status === 401 || res.status === 403) {
            throw new Error('Tính năng quản lý video chỉ dành cho Quản trị viên (Admin).');
        }

        if (!res.ok) {
            let errorText = '';
            try {
                const err = await res.json();
                errorText = err.errorMessage || err.message || err.title || (err.errors ? Object.values(err.errors).flat().join(', ') : '');
            } catch {
                errorText = await res.text().catch(() => '');
            }
            throw new Error(errorText || `Lỗi máy chủ (${res.status}): Không thể tải video từ URL.`);
        }

        return await res.json();
    },

    /**
     * Đính kèm hoặc cập nhật phụ đề VTT tiếng Anh / tiếng Việt (File hoặc Text) cho video đã tồn tại (Admin)
     */
    async attachVideoSubtitles(publicId, { vttEnFile = null, vttViFile = null, vttEnText = null, vttViText = null, vttEnUrl = null, vttViUrl = null, folder = null } = {}) {
        const formData = new FormData();
        if (vttEnFile) formData.append('vttEn', vttEnFile);
        if (vttViFile) formData.append('vttVi', vttViFile);
        if (vttEnText !== null && vttEnText !== undefined) formData.append('vttEnText', vttEnText);
        if (vttViText !== null && vttViText !== undefined) formData.append('vttViText', vttViText);
        if (vttEnUrl !== null && vttEnUrl !== undefined) formData.append('vttEnUrl', vttEnUrl);
        if (vttViUrl !== null && vttViUrl !== undefined) formData.append('vttViUrl', vttViUrl);
        if (folder) formData.append('folder', folder);
        formData.append('videoPublicId', publicId);

        const res = await fetch(`${API_BASE}/admin/videos/subtitles`, {
            method: 'POST',
            body: formData,
        });

        if (res.status === 401 || res.status === 403) {
            throw new Error('Tính năng đính kèm phụ đề chỉ dành cho Quản trị viên (Admin).');
        }

        if (!res.ok) {
            let errorText = '';
            try {
                const err = await res.json();
                errorText = err.errorMessage || err.message || err.title;
            } catch {
                errorText = await res.text().catch(() => '');
            }
            throw new Error(errorText || `Không thể cập nhật phụ đề video (${res.status})`);
        }

        return await res.json();
    },

    /**
     * Xóa video khỏi Cloudinary và Cơ sở dữ liệu theo publicId hoặc ID (Dành cho Admin)
     */
    async deleteCloudinaryVideo(publicId, id = null) {
        // 1. Ưu tiên gọi POST /api/admin/videos/delete (gửi qua body JSON để tránh lỗi encoding slash / trên URL)
        let res = await fetch(`${API_BASE}/admin/videos/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId, id }),
        });

        // 2. Fallback sang DELETE với query param
        if (res.status === 404 || res.status === 405) {
            res = await fetch(`${API_BASE}/admin/videos?publicId=${encodeURIComponent(publicId)}`, {
                method: 'DELETE',
            });
        }

        // 3. Fallback sang DELETE đường dẫn path
        if (res.status === 404) {
            res = await fetch(`${API_BASE}/admin/videos/${encodeURIComponent(publicId)}`, {
                method: 'DELETE',
            });
        }

        // 4. Fallback sang /api/videos/delete nếu cần
        if (res.status === 404) {
            res = await fetch(`${API_BASE}/videos/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId, id }),
            });
        }

        if (res.status === 401 || res.status === 403) {
            throw new Error('Bạn không có quyền xóa video. Yêu cầu quyền Quản trị viên (Admin).');
        }

        if (!res.ok) {
            let errorText = '';
            try {
                const err = await res.json();
                errorText = err.errorMessage || err.message || err.title;
            } catch {
                errorText = await res.text().catch(() => '');
            }
            throw new Error(errorText || `Lỗi máy chủ (${res.status}): Không thể xóa video.`);
        }

        const data = await res.json();
        if (data && data.success === false && !data.dbDeleted && !data.cloudinaryDeleted) {
            throw new Error(data.message || data.errorMessage || 'Không thể xóa video khỏi cơ sở dữ liệu.');
        }

        return data;
    },
};
