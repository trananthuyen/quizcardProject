import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api';

/**
 * Custom Hook useDeck:
 * Quản lý toàn bộ trạng thái và các thao tác liên quan tới bộ thẻ (Decks):
 * - Danh sách bộ thẻ Community và My Resources
 * - Hợp nhất toàn bộ bộ thẻ (decks)
 * - Tải dữ liệu từ Backend (/api/decks/community, /api/decks/my-resources)
 * - Thao tác CRUD (Create, Update, Delete) bộ thẻ
 * - Trạng thái đóng/mở Modal Tạo / Sửa bộ thẻ
 *
 * @param {object} options
 * @param {object|null} options.currentUser - Thông tin người dùng hiện tại
 * @param {object|null} options.selectedDeck - Bộ thẻ đang được chọn xem/học
 * @param {function} [options.setSelectedDeck] - Cập nhật bộ thẻ đang chọn
 * @param {function} [options.onDeckDeleted] - Callback gọi khi bộ thẻ đang xem bị xóa
 */
export const useDeck = ({ currentUser = null, selectedDeck = null, setSelectedDeck = null, onDeckDeleted = null } = {}) => {
    // Danh sách các bộ thẻ hiển thị ở Community (Cộng đồng)
    const [communityDecks, setCommunityDecks] = useState([]);
    // Danh sách các bộ thẻ thuộc quyền sở hữu của người dùng ở My Resources
    const [myResourcesDecks, setMyResourcesDecks] = useState([]);
    // Trạng thái loading khi tải danh sách bộ thẻ
    const [loadingDecks, setLoadingDecks] = useState(false);

    // Modal tạo / sửa bộ thẻ tập trung
    const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
    const [editingDeck, setEditingDeck] = useState(null);

    // Hợp nhất danh sách bộ thẻ (dùng cho tìm kiếm chi tiết, Folders, khôi phục URL hash)
    const decks = useMemo(() => {
        const map = new Map();
        if (Array.isArray(communityDecks)) {
            communityDecks.forEach((d) => {
                if (d?.id) map.set(d.id, d);
            });
        }
        if (Array.isArray(myResourcesDecks)) {
            myResourcesDecks.forEach((d) => {
                if (d?.id) map.set(d.id, d);
            });
        }
        return Array.from(map.values());
    }, [communityDecks, myResourcesDecks]);

    /**
     * 1. Tải danh sách bộ thẻ hiển thị ở Community (/api/decks/community)
     */
    const loadCommunityDecks = useCallback(async () => {
        try {
            setLoadingDecks(true);
            const data = await api.getCommunityDecks();
            setCommunityDecks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Lỗi khi tải danh sách bộ thẻ cộng đồng:', err);
            setCommunityDecks([]);
        } finally {
            setLoadingDecks(false);
        }
    }, []);

    /**
     * 2. Tải danh sách bộ thẻ của riêng người dùng ở My Resources (/api/decks/my-resources)
     */
    const loadMyResourcesDecks = useCallback(async () => {
        const userId = currentUser?.id || currentUser?.Id;
        if (!userId) {
            setMyResourcesDecks([]);
            return;
        }
        try {
            const data = await api.getMyResourcesDecks(userId);
            setMyResourcesDecks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Lỗi khi tải danh sách bộ thẻ cá nhân:', err);
            setMyResourcesDecks([]);
        }
    }, [currentUser]);

    /**
     * Tải lại cả hai danh sách khi có thay đổi thêm/sửa/xóa bộ thẻ
     */
    const loadDecks = useCallback(async () => {
        await Promise.all([loadCommunityDecks(), loadMyResourcesDecks()]);
    }, [loadCommunityDecks, loadMyResourcesDecks]);

    // Tải danh sách bộ thẻ cộng đồng ngay khi hook mount
    useEffect(() => {
        loadCommunityDecks();
    }, [loadCommunityDecks]);

    // Tự động tải lại danh sách My Resources mỗi khi người dùng đăng nhập / đăng xuất
    useEffect(() => {
        loadMyResourcesDecks();
    }, [loadMyResourcesDecks]);

    /**
     * Tạo mới bộ thẻ (gán kèm userId của người dùng hiện tại nếu có)
     */


    const handleCreateDeck = useCallback(async (data) => {
        const userId = currentUser?.id || currentUser?.Id;

        const created = await api.createDeck({ ...data, userId });
        await loadDecks();
        return created;

    }, [currentUser, loadDecks]);

    /**
     * Cập nhật thông tin bộ thẻ
     */
    const handleUpdateDeck = useCallback(async (id, data) => {
        const userId = currentUser?.id || currentUser?.Id;
        const updated = await api.updateDeck(id, data, userId);
        await loadDecks();
        if (selectedDeck && selectedDeck.id === id && setSelectedDeck) {
            setSelectedDeck({
                ...selectedDeck,
                ...data,
                folder: data.folder || selectedDeck.folder,
                tag: data.tag !== undefined ? data.tag : selectedDeck.tag,
                isPublic: data.isPublic !== undefined ? data.isPublic : selectedDeck.isPublic,
            });
        }
        return updated;
    }, [currentUser, loadDecks, selectedDeck, setSelectedDeck]);

    /**
     * Xóa bộ thẻ
     */
    const handleDeleteDeck = useCallback(async (id) => {
        const userId = currentUser?.id || currentUser?.Id;
        const result = await api.deleteDeck(id, userId);
        await loadDecks();
        if (selectedDeck && selectedDeck.id === id) {
            if (setSelectedDeck) setSelectedDeck(null);
            if (onDeckDeleted) onDeckDeleted();
        }
        return result;
    }, [currentUser, loadDecks, selectedDeck, setSelectedDeck, onDeckDeleted]);

    /**
     * Mở modal tạo mới bộ thẻ
     */
    const handleOpenCreateDeck = useCallback(() => {
        setEditingDeck(null);
        setIsDeckModalOpen(true);
    }, []);

    /**
     * Mở modal chỉnh sửa bộ thẻ
     */
    const handleOpenEditDeck = useCallback((deck) => {
        setEditingDeck(deck);
        setIsDeckModalOpen(true);
    }, []);

    /**
     * Đóng modal tạo / sửa bộ thẻ
     */
    const handleCloseDeckModal = useCallback(() => {
        setIsDeckModalOpen(false);
        setEditingDeck(null);
    }, []);

    return {
        // Danh sách bộ thẻ
        communityDecks,
        myResourcesDecks,
        decks,
        loadingDecks,
        setLoadingDecks,

        // Modal tạo / sửa
        isDeckModalOpen,
        setIsDeckModalOpen,
        editingDeck,
        setEditingDeck,

        // Hàm tải dữ liệu
        loadCommunityDecks,
        loadMyResourcesDecks,
        loadDecks,

        // Thao tác CRUD bộ thẻ
        handleCreateDeck,
        handleUpdateDeck,
        handleDeleteDeck,

        // Điều khiển modal
        handleOpenCreateDeck,
        handleOpenEditDeck,
        handleCloseDeckModal,
    };
};

export const UseDeck = useDeck;
export default useDeck;

