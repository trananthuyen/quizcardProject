/**
 * File API Client: Tập trung toàn bộ các hàm gọi HTTP request tới Backend ASP.NET Core.
 * Sử dụng Fetch API tiêu chuẩn của trình duyệt kèm kiểm tra mã lỗi HTTP (res.ok) và phân tích JSON.
 */
// Đường dẫn gốc của API (được Vite proxy sang http://localhost:5030 khi phát triển,
// hoặc gọi trực tiếp cùng host khi chạy sản phẩm)
const API_BASE = '/api';
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
    // ==========================================================================
    // NHÓM 1: CÁC HÀM QUẢN LÝ BỘ THẺ (DECK MANAGEMENT)
    // ==========================================================================
    /**
     * 1. Gọi GET /api/decks/community để lấy tất cả bộ thẻ hiển thị ở Community.
     * Hỗ trợ lọc theo thể loại: /api/decks/community?category=...
     */
    async getCommunityDecks(category) {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        const url = params.toString() ? `${API_BASE}/decks/community?${params.toString()}` : `${API_BASE}/decks/community`;
        const res = await fetch(url);
        if (!res.ok)
            throw new Error('Không thể tải danh sách bộ thẻ cộng đồng');
        return res.json();
    },
    /**
     * 2. Gọi GET /api/decks/my-resources để lấy tất cả bộ thẻ của người dùng tại My Resources.
     * Hỗ trợ lọc theo userId và thể loại: /api/decks/my-resources?userId=...&category=...
     */
    async getMyResourcesDecks(userId, category) {
        if (!userId) return [];
        const params = new URLSearchParams();
        params.append('userId', userId);
        if (category) params.append('category', category);
        const res = await fetch(`${API_BASE}/decks/my-resources?${params.toString()}`);
        if (!res.ok)
            throw new Error('Không thể tải danh sách bộ thẻ của bạn');
        return res.json();
    },
    /**
     * Gọi GET /api/decks để lấy danh sách toàn bộ bộ thẻ kèm số lượng thẻ theo trạng thái.
     * Hỗ trợ lọc theo thể loại: /api/decks?category=...
     */
    async getDecks(category, userId) {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (userId) params.append('userId', userId);
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
     * Gọi POST /api/decks để tạo bộ thẻ mới kèm phân loại category.
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
    async updateDeck(id, data) {
        const res = await fetch(`${API_BASE}/decks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok)
            throw new Error('Không thể cập nhật bộ thẻ');
        return res.json();
    },
    /**
     * Gọi DELETE /api/decks/{id} để xóa vĩnh viễn một bộ thẻ.
     */
    async deleteDeck(id) {
        const res = await fetch(`${API_BASE}/decks/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok)
            throw new Error('Không thể xóa bộ thẻ');
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
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể thêm thẻ mới');
        }
        return res.json();
    },
    /**
     * Gọi POST /api/decks/{deckId}/cards/bulk để tạo hàng loạt thẻ từ chuỗi văn bản parse được.
     */
    async createCardsBatch(deckId, cards) {
        const res = await fetch(`${API_BASE}/decks/${deckId}/cards/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cards),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể nhập danh sách thẻ');
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
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể cập nhật thẻ');
        }
        return res.json();
    },
    /**
     * Gọi DELETE /api/cards/{id} để xóa thẻ.
     */
    async deleteCard(id) {
        const res = await fetch(`${API_BASE}/cards/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok)
            throw new Error('Không thể xóa thẻ');
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
    async getStudySessionCards(deckId, dueOnly = false) {
        const res = await fetch(`${API_BASE}/study/${deckId}/cards?dueOnly=${dueOnly}`);
        if (!res.ok)
            throw new Error('Không thể tải danh sách thẻ cần học');
        return res.json();
    },
    /**
     * Alias tương thích getStudyCards
     */
    async getStudyCards(deckId, dueOnly = false) {
        return this.getStudySessionCards(deckId, dueOnly);
    },
    /**
     * Gọi GET /api/study/{deckId}/quiz để lấy danh sách câu hỏi trắc nghiệm ngẫu nhiên.
     * Mỗi câu hỏi có 4 lựa chọn và đáp án đúng.
     */
    async getQuizCards(deckId) {
        const res = await fetch(`${API_BASE}/study/${deckId}/quiz`);
        if (!res.ok)
            throw new Error('Không thể tải câu hỏi trắc nghiệm');
        return res.json();
    },
    /**
     * Gọi POST /api/study/cards/{cardId}/answer để gửi kết quả người dùng trả lời (Đúng hoặc Sai).
     * Backend sẽ chạy thuật toán Spaced Repetition và cập nhật trạng thái thẻ.
     */
    async answerCard(cardId, isCorrect) {
        const res = await fetch(`${API_BASE}/study/cards/${cardId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isCorrect }),
        });
        if (!res.ok)
            throw new Error('Không thể gửi kết quả học tập');
        return res.json();
    },
    /**
     * Gọi POST /api/study/{deckId}/reset để đặt lại tiến độ học tập của bộ thẻ về 0.
     */
    async resetDeckProgress(deckId) {
        const res = await fetch(`${API_BASE}/study/${deckId}/reset`, {
            method: 'POST',
        });
        if (!res.ok)
            throw new Error('Không thể đặt lại tiến độ');
    },
    // ==========================================================================
    // NHÓM 4: CÁC HÀM QUẢN LÝ PHÂN LOẠI (CATEGORY MANAGEMENT)
    // ==========================================================================
    /**
     * Gọi GET /api/categories?userId=... để lấy danh sách các phân loại kèm số lượng bộ thẻ.
     */
    async getCategories(userId) {
        const url = userId ? `${API_BASE}/categories?userId=${encodeURIComponent(userId)}` : `${API_BASE}/categories`;
        const res = await fetch(url);
        if (!res.ok)
            throw new Error('Không thể tải danh sách phân loại');
        return res.json();
    },
    /**
     * Gọi POST /api/categories để tạo mới một phân loại bộ thẻ.
     */
    async createCategory(data) {
        const res = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể tạo phân loại mới');
        }
        return res.json();
    },
    /**
     * Gọi PUT /api/categories/{id} để chỉnh sửa thông tin phân loại.
     */
    async updateCategory(id, data) {
        const res = await fetch(`${API_BASE}/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Không thể cập nhật phân loại');
        }
        return res.json();
    },
    /**
     * Gọi DELETE /api/categories/{id} để xóa một phân loại bộ thẻ.
     */
    async deleteCategory(id) {
        const res = await fetch(`${API_BASE}/categories/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok)
            throw new Error('Không thể xóa phân loại');
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
};
