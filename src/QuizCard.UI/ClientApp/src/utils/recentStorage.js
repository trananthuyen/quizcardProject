import { api } from '../api';

const LOCAL_STORAGE_KEY = 'quizcard_recent_decks';
const MAX_LOCAL_RECENTS = 50;

/**
 * Lấy danh sách Recents từ LocalStorage cho khách chưa đăng nhập
 */
export function getLocalRecents() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Không thể đọc recents từ LocalStorage:', e);
    return [];
  }
}

/**
 * Lưu danh sách Recents vào LocalStorage
 */
export function saveLocalRecents(recents) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recents.slice(0, MAX_LOCAL_RECENTS)));
  } catch (e) {
    console.error('Không thể lưu recents vào LocalStorage:', e);
  }
}

/**
 * Ghi nhận một bộ thẻ vừa xem, học hoặc thích
 * @param {Object} params
 * @param {Object} params.deck - Đối tượng bộ thẻ
 * @param {string} params.actionType - 'VIEW' | 'STUDY' | 'QUIZ' | 'LIKE'
 * @param {Object|null} params.currentUser - Người dùng hiện tại
 */
export async function recordRecentDeck({ deck, actionType = 'VIEW', currentUser = null }) {
  if (!deck) return;
  const deckId = deck.id || deck.Id;
  if (!deckId) return;

  const currentUserId = currentUser?.id || currentUser?.Id;

  // 1. Nếu đã đăng nhập: lưu vào Database thông qua API
  if (currentUserId) {
    try {
      await api.recordRecent(deckId, actionType, currentUserId);
      window.dispatchEvent(
        new CustomEvent('quizcard:recents-changed', {
          detail: { deckId, actionType: actionType.toUpperCase() },
        })
      );
      return;
    } catch (err) {
      console.warn('Không thể lưu recent vào DB, lưu tạm vào LocalStorage:', err);
    }
  }

  // 2. Nếu chưa đăng nhập (khách): lưu vào LocalStorage
  const localList = getLocalRecents();
  const filtered = localList.filter((item) => String(item.deckId) !== String(deckId));

  const newEntry = {
    id: 'local_' + Date.now(),
    deckId: deckId,
    title: deck.title || deck.Title || 'Bộ thẻ',
    description: deck.description || deck.Description || '',
    folder: deck.folder || deck.Folder || 'Chung',
    tag: deck.tag || deck.Tag || '',
    isPublic: deck.isPublic !== false,
    totalCards: deck.totalCards ?? deck.TotalCards ?? (deck.cards ? deck.cards.length : 0),
    actionType: actionType.toUpperCase(),
    lastAccessedAt: new Date().toISOString(),
    creatorUserId: deck.userId || deck.UserId || null,
    creatorName: deck.authorName || deck.AuthorName || deck.creatorName || null,
  };

  const updatedList = [newEntry, ...filtered];
  saveLocalRecents(updatedList);
  window.dispatchEvent(
    new CustomEvent('quizcard:recents-changed', {
      detail: { deckId, actionType: actionType.toUpperCase() },
    })
  );
}

/**
 * Lấy danh sách Recents tổng hợp:
 * - Nếu người dùng đăng nhập: gọi API từ DB
 * - Nếu là khách: lấy từ LocalStorage
 */
export async function fetchRecents(currentUser = null) {
  const currentUserId = currentUser?.id || currentUser?.Id;

  if (currentUserId) {
    try {
      const dbRecents = await api.getRecents(currentUserId);
      return dbRecents || [];
    } catch (err) {
      console.error('Không thể tải recents từ DB, fallback sang LocalStorage:', err);
    }
  }

  return getLocalRecents();
}

/**
 * Xóa 1 mục khỏi danh sách gần đây
 */
export async function removeRecentItem(recentId, deckId, currentUser = null) {
  const currentUserId = currentUser?.id || currentUser?.Id;

  if (currentUserId && !String(recentId).startsWith('local_')) {
    try {
      await api.deleteRecent(recentId, currentUserId);
    } catch (err) {
      console.error('Lỗi xóa recent DB:', err);
    }
  }

  // Luôn dọn cả LocalStorage nếu có
  const localList = getLocalRecents();
  const updated = localList.filter((item) => item.id !== recentId && item.deckId !== deckId);
  saveLocalRecents(updated);

  window.dispatchEvent(
    new CustomEvent('quizcard:recents-changed', {
      detail: { recentId, deckId, actionType: 'DELETE' },
    })
  );
}

/**
 * Xóa sạch toàn bộ danh sách gần đây
 */
export async function clearRecents(currentUser = null) {
  const currentUserId = currentUser?.id || currentUser?.Id;

  if (currentUserId) {
    try {
      await api.clearAllRecents(currentUserId);
    } catch (err) {
      console.error('Lỗi dọn sạch recents DB:', err);
    }
  }

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {}

  window.dispatchEvent(
    new CustomEvent('quizcard:recents-changed', {
      detail: { actionType: 'CLEAR' },
    })
  );
}

