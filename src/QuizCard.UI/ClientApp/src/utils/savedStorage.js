/**
 * savedStorage.js:
 * Quản lý danh sách các bộ thẻ cộng đồng được người dùng lưu lại (Bookmarks).
 * Hỗ trợ lưu trữ theo tài khoản người dùng hoặc khách (guest),
 * phát sự kiện CustomEvent 'quizcard:saved-decks-changed' khi có thay đổi.
 */

const STORAGE_PREFIX = 'quizcard_saved_decks_';

export function getSavedStorageKey(currentUser = null) {
  const userId = currentUser?.id || currentUser?.Id;
  return `${STORAGE_PREFIX}${userId ? String(userId) : 'guest'}`;
}

/**
 * Lấy danh sách toàn bộ các bộ thẻ đã lưu từ LocalStorage
 * @param {object|null} currentUser
 * @returns {Array} danh sách các bộ thẻ đã lưu
 */
export function getSavedDecks(currentUser = null) {
  try {
    const key = getSavedStorageKey(currentUser);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((d) => d && (d.id || d.Id)) : [];
  } catch (err) {
    console.error('Không thể đọc danh sách bộ thẻ đã lưu:', err);
    return [];
  }
}

/**
 * Lấy danh sách ID các bộ thẻ đã lưu dưới dạng Set
 * @param {object|null} currentUser
 * @returns {Set<string>}
 */
export function getSavedDeckIds(currentUser = null) {
  const decks = getSavedDecks(currentUser);
  return new Set(decks.map((d) => String(d?.id || d?.Id)).filter(Boolean));
}

/**
 * Kiểm tra xem một bộ thẻ đã được lưu hay chưa
 * @param {string|number} deckId
 * @param {object|null} currentUser
 * @returns {boolean}
 */
export function isDeckSaved(deckId, currentUser = null) {
  if (!deckId) return false;
  const ids = getSavedDeckIds(currentUser);
  return ids.has(String(deckId));
}

/**
 * Lưu bộ thẻ từ Community vào danh sách đã lưu
 * Đánh dấu cờ `isSaved: true` để phân biệt và ngăn chặn việc chỉnh sửa
 * @param {object} deck
 * @param {object|null} currentUser
 */
export function saveDeck(deck, currentUser = null) {
  if (!deck || (!deck.id && !deck.Id)) return;
  const deckId = deck.id || deck.Id;
  try {
    const key = getSavedStorageKey(currentUser);
    const currentList = getSavedDecks(currentUser);
    const deckIdStr = String(deckId);

    // Kiểm tra xem đã tồn tại chưa
    const exists = currentList.some((d) => String(d?.id || d?.Id) === deckIdStr);
    if (!exists) {
      const savedDeckEntry = {
        ...deck,
        id: deckId,
        isSaved: true,
        savedAt: new Date().toISOString(),
      };
      const updatedList = [savedDeckEntry, ...currentList];
      localStorage.setItem(key, JSON.stringify(updatedList));
      window.dispatchEvent(
        new CustomEvent('quizcard:saved-decks-changed', {
          detail: { action: 'save', deckId, deck: savedDeckEntry },
        })
      );
    }
  } catch (err) {
    console.error('Không thể lưu bộ thẻ:', err);
  }
}

/**
 * Bỏ lưu một bộ thẻ khỏi danh sách đã lưu
 * @param {string|number} deckId
 * @param {object|null} currentUser
 */
export function removeSavedDeck(deckId, currentUser = null) {
  if (!deckId) return;
  try {
    const key = getSavedStorageKey(currentUser);
    const currentList = getSavedDecks(currentUser);
    const deckIdStr = String(deckId);
    const updatedList = currentList.filter((d) => String(d?.id || d?.Id) !== deckIdStr);
    localStorage.setItem(key, JSON.stringify(updatedList));
    window.dispatchEvent(
      new CustomEvent('quizcard:saved-decks-changed', {
        detail: { action: 'unsave', deckId },
      })
    );
  } catch (err) {
    console.error('Không thể bỏ lưu bộ thẻ:', err);
  }
}

/**
 * Chuyển đổi trạng thái lưu / bỏ lưu của một bộ thẻ
 * @param {object} deck
 * @param {object|null} currentUser
 * @returns {boolean} true nếu vừa được lưu, false nếu vừa bị bỏ lưu
 */
export function toggleSaveDeck(deck, currentUser = null) {
  if (!deck || (!deck.id && !deck.Id)) return false;
  const deckId = deck.id || deck.Id;
  if (isDeckSaved(deckId, currentUser)) {
    removeSavedDeck(deckId, currentUser);
    return false;
  } else {
    saveDeck(deck, currentUser);
    return true;
  }
}
