/**
 * File API Client: Tập trung toàn bộ các hàm gọi HTTP request tới Backend ASP.NET Core.
 * Sử dụng Fetch API tiêu chuẩn của trình duyệt kèm kiểm tra mã lỗi HTTP (res.ok) và phân tích JSON.
 */

import type { Deck, Card, StudyCard, AnswerResponse, DeckStudyStats, Category } from './types';

// Đường dẫn gốc của API (được Vite proxy sang http://localhost:5030 khi phát triển,
// hoặc gọi trực tiếp cùng host khi chạy sản phẩm)
const API_BASE = '/api';

export const api = {
  // ==========================================================================
  // NHÓM 1: CÁC HÀM QUẢN LÝ BỘ THẺ (DECK MANAGEMENT)
  // ==========================================================================

  /**
   * Gọi GET /api/decks để lấy danh sách toàn bộ bộ thẻ kèm số lượng thẻ theo trạng thái.
   * Hỗ trợ lọc theo thể loại: /api/decks?category=...
   */
  async getDecks(category?: string): Promise<Deck[]> {
    const url = category ? `${API_BASE}/decks?category=${encodeURIComponent(category)}` : `${API_BASE}/decks`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Không thể tải danh sách bộ thẻ');
    return res.json();
  },

  /**
   * Gọi GET /api/decks/{id} để lấy thông tin chi tiết một bộ thẻ.
   */
  async getDeck(id: string): Promise<Deck> {
    const res = await fetch(`${API_BASE}/decks/${id}`);
    if (!res.ok) throw new Error('Không thể tải thông tin bộ thẻ');
    return res.json();
  },

  /**
   * Gọi POST /api/decks để tạo bộ thẻ mới kèm phân loại category.
   */
  async createDeck(data: { title: string; description?: string; category?: string }): Promise<Deck> {
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
  async updateDeck(id: string, data: { title: string; description?: string; category?: string }): Promise<Deck> {
    const res = await fetch(`${API_BASE}/decks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Không thể cập nhật bộ thẻ');
    return res.json();
  },

  /**
   * Gọi DELETE /api/decks/{id} để xóa vĩnh viễn một bộ thẻ.
   */
  async deleteDeck(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/decks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Không thể xóa bộ thẻ');
  },

  // ==========================================================================
  // NHÓM 2: CÁC HÀM QUẢN LÝ THẺ FLASHCARD (CARD MANAGEMENT)
  // ==========================================================================

  /**
   * Gọi GET /api/decks/{deckId}/cards để lấy tất cả thẻ trong bộ.
   */
  async getCards(deckId: string): Promise<Card[]> {
    const res = await fetch(`${API_BASE}/decks/${deckId}/cards`);
    if (!res.ok) throw new Error('Không thể tải danh sách thẻ');
    return res.json();
  },

  /**
   * Gọi POST /api/decks/{deckId}/cards để thêm một thẻ Flashcard đơn lẻ.
   */
  async createCard(deckId: string, data: { term: string; definition: string; example?: string }): Promise<Card> {
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
   * Gọi POST /api/decks/{deckId}/cards/batch để thêm hàng loạt thẻ từ chuỗi văn bản (Bulk Import).
   */
  async createCardsBatch(deckId: string, cards: Array<{ term: string; definition: string; example?: string }>): Promise<Card[]> {
    const res = await fetch(`${API_BASE}/decks/${deckId}/cards/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cards),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Không thể tạo danh sách thẻ');
    }
    return res.json();
  },

  /**
   * Gọi PUT /api/cards/{id} để cập nhật thông tin thẻ.
   */
  async updateCard(id: string, data: { term: string; definition: string; example?: string }): Promise<Card> {
    const res = await fetch(`${API_BASE}/cards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Không thể cập nhật thẻ');
    return res.json();
  },

  /**
   * Gọi DELETE /api/cards/{id} để xóa thẻ.
   */
  async deleteCard(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/cards/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Không thể xóa thẻ');
  },

  // ==========================================================================
  // NHÓM 3: CÁC HÀM PHỤC VỤ PHIÊN HỌC & TRẮC NGHIỆM (STUDY & QUIZ MODE)
  // ==========================================================================

  /**
   * Gọi GET /api/study/{deckId}/stats để lấy số liệu thống kê tiến độ ôn tập.
   */
  async getStudyStats(deckId: string): Promise<DeckStudyStats> {
    const res = await fetch(`${API_BASE}/study/${deckId}/stats`);
    if (!res.ok) throw new Error('Không thể tải thống kê học tập');
    return res.json();
  },

  /**
   * Gọi GET /api/study/{deckId}/cards để lấy danh sách thẻ cho phiên học hoặc bài thi trắc nghiệm.
   * @param dueOnly Nếu true chỉ lấy thẻ đến hạn ôn; nếu false lấy toàn bộ thẻ trong bộ.
   */
  async getStudySessionCards(deckId: string, dueOnly = false): Promise<StudyCard[]> {
    const res = await fetch(`${API_BASE}/study/${deckId}/cards?dueOnly=${dueOnly}`);
    if (!res.ok) throw new Error('Không thể tải danh sách thẻ cần học');
    return res.json();
  },

  /**
   * Gọi POST /api/study/cards/{cardId}/answer để gửi kết quả người dùng trả lời (Đúng hoặc Sai).
   * Backend sẽ chạy thuật toán Spaced Repetition và cập nhật trạng thái thẻ.
   */
  async answerCard(cardId: string, isCorrect: boolean): Promise<AnswerResponse> {
    const res = await fetch(`${API_BASE}/study/cards/${cardId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCorrect }),
    });
    if (!res.ok) throw new Error('Không thể gửi kết quả học tập');
    return res.json();
  },

  /**
   * Gọi POST /api/study/{deckId}/reset để đặt lại tiến độ học tập của bộ thẻ về 0.
   */
  async resetDeckProgress(deckId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/study/${deckId}/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Không thể đặt lại tiến độ');
  },

  // ==========================================================================
  // NHÓM 4: CÁC HÀM QUẢN LÝ PHÂN LOẠI (CATEGORY MANAGEMENT)
  // ==========================================================================

  /**
   * Gọi GET /api/categories để lấy danh sách toàn bộ các phân loại kèm số lượng bộ thẻ.
   */
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Không thể tải danh sách phân loại');
    return res.json();
  },

  /**
   * Gọi POST /api/categories để tạo mới một phân loại bộ thẻ.
   */
  async createCategory(data: { name: string; description?: string; icon?: string; color?: string }): Promise<Category> {
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
  async updateCategory(id: string, data: { name: string; description?: string; icon?: string; color?: string }): Promise<Category> {
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
  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Không thể xóa phân loại');
  },
};
