import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Layers,
  FileQuestion,
  Search,
  X,
  RotateCw,
  Eye,
  Trash2,
  Globe,
  Lock,
  Calendar,
  Sparkles,
  Server,
  Folder,
  ArrowUpDown,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../api';
import './AdminUsersManagement.css';

export const AdminUsersManagement = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDecks: 0,
    totalCards: 0,
    totalSystemDecks: 0,
    totalSystemCards: 0,
    activeUsersCount: 0,
    averageDecksPerUser: 0,
    averageCardsPerDeck: 0,
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('decks_desc');

  // Modal xem chi tiết các bộ thẻ của tài khoản
  const [selectedUser, setSelectedUser] = useState(null); // null hoặc { id, fullName, email... }
  const [isSystemModal, setIsSystemModal] = useState(false);
  const [userDecks, setUserDecks] = useState([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Tải thống kê KPI tổng quan
  const loadStats = useCallback(async () => {
    try {
      const data = await api.getAdminUsersOverview();
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Lỗi tải thống kê admin:', err);
    }
  }, []);

  // Tải danh sách người dùng kèm thống kê số decks & cards
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getAdminUsersList({
        search: debouncedSearch,
        sort,
      });
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sort]);

  // Load lại khi component mount hoặc khi bộ lọc/sort thay đổi
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Mở modal xem danh sách các bộ thẻ của một người dùng
  const handleOpenUserDecks = async (user) => {
    setSelectedUser(user);
    setIsSystemModal(false);
    setLoadingDecks(true);
    setUserDecks([]);
    try {
      const decks = await api.getAdminUserDecks(user.id);
      setUserDecks(decks || []);
    } catch (err) {
      console.error('Lỗi tải bộ thẻ của người dùng:', err);
      setUserDecks([]);
    } finally {
      setLoadingDecks(false);
    }
  };

  // Mở modal xem danh sách các bộ thẻ mẫu của hệ thống (UserId == null)
  const handleOpenSystemDecks = async () => {
    setSelectedUser({
      fullName: 'Hệ Thống / Bộ Thẻ Mẫu',
      email: 'system@quizcard.local',
      role: 'System',
    });
    setIsSystemModal(true);
    setLoadingDecks(true);
    setUserDecks([]);
    try {
      const decks = await api.getAdminSystemDecks();
      setUserDecks(decks || []);
    } catch (err) {
      console.error('Lỗi tải bộ thẻ hệ thống:', err);
      setUserDecks([]);
    } finally {
      setLoadingDecks(false);
    }
  };

  // Đóng modal
  const handleCloseModal = () => {
    setSelectedUser(null);
    setIsSystemModal(false);
    setUserDecks([]);
  };

  // Admin xóa một bộ thẻ vi phạm nội dung
  const handleDeleteDeck = async (deck) => {
    if (!window.confirm(`XÁC NHẬN: Bạn có chắc chắn muốn xóa bộ thẻ "${deck.title}" (gồm ${deck.totalCards} cards) khỏi cơ sở dữ liệu?`)) {
      return;
    }

    try {
      await api.deleteAdminUserDeck(deck.id);
      setUserDecks((prev) => prev.filter((d) => d.id !== deck.id));
      // Tải lại thống kê và danh sách người dùng để số liệu cập nhật tức thì
      loadStats();
      loadUsers();
    } catch (err) {
      alert(err.message || 'Không thể xóa bộ thẻ');
    }
  };

  return (
    <div className="aum-container">
      {/* 1. KHỐI THỐNG KÊ TỔNG QUAN (KPI CARDS) */}
      <div className="aum-stats-grid">
        {/* Tổng số người dùng */}
        <div className="aum-stat-card">
          <div className="aum-stat-icon aum-icon-blue">
            <Users size={26} />
          </div>
          <div className="aum-stat-content">
            <span className="aum-stat-label">Tổng Tài Khoản</span>
            <span className="aum-stat-value">
              {stats.totalUsers.toLocaleString('vi-VN')}
            </span>
            <span className="aum-stat-hint">
              {stats.activeUsersCount} tài khoản đã tạo bộ thẻ
            </span>
          </div>
        </div>

        {/* Tổng số bộ thẻ */}
        <div className="aum-stat-card">
          <div className="aum-stat-icon aum-icon-indigo">
            <Layers size={26} />
          </div>
          <div className="aum-stat-content">
            <span className="aum-stat-label">Tổng Bộ Thẻ (Decks)</span>
            <span className="aum-stat-value">
              {stats.totalDecks.toLocaleString('vi-VN')}
            </span>
            <span className="aum-stat-hint">
              Trung bình {stats.averageDecksPerUser} bộ thẻ / người dùng
            </span>
          </div>
        </div>

        {/* Tổng số thẻ Flashcards */}
        <div className="aum-stat-card">
          <div className="aum-stat-icon aum-icon-emerald">
            <FileQuestion size={26} />
          </div>
          <div className="aum-stat-content">
            <span className="aum-stat-label">Tổng Thẻ (Cards)</span>
            <span className="aum-stat-value">
              {stats.totalCards.toLocaleString('vi-VN')}
            </span>
            <span className="aum-stat-hint">
              Trung bình {stats.averageCardsPerDeck} thẻ / bộ thẻ
            </span>
          </div>
        </div>

        {/* Bộ thẻ Mẫu Hệ thống */}
        <div className="aum-stat-card">
          <div className="aum-stat-icon aum-icon-amber">
            <Server size={26} />
          </div>
          <div className="aum-stat-content">
            <span className="aum-stat-label">Bộ Thẻ Hệ Thống</span>
            <span className="aum-stat-value">
              {stats.totalSystemDecks.toLocaleString('vi-VN')}
            </span>
            <span className="aum-stat-hint">
              Chứa {stats.totalSystemCards} cards mẫu ban đầu
            </span>
          </div>
        </div>
      </div>

      {/* 2. THANH CÔNG CỤ TÌM KIẾM, SẮP XẾP & NÚT TIỆN ÍCH */}
      <div className="aum-toolbar">
        <div className="aum-search-wrap">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            className="aum-search-input"
            placeholder="Tìm theo tên hiển thị, email hoặc username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="aum-search-clear"
              onClick={() => setSearch('')}
              title="Xóa tìm kiếm"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="aum-filters-right">
          <select
            className="aum-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            title="Sắp xếp danh sách người dùng"
          >
            <option value="decks_desc">Sắp xếp: Nhiều Decks nhất ↓</option>
            <option value="decks_asc">Sắp xếp: Ít Decks nhất ↑</option>
            <option value="cards_desc">Sắp xếp: Nhiều Flashcards nhất ↓</option>
            <option value="cards_asc">Sắp xếp: Ít Flashcards nhất ↑</option>
            <option value="date_desc">Sắp xếp: Mới tham gia nhất ↓</option>
            <option value="date_asc">Sắp xếp: Tham gia cũ nhất ↑</option>
            <option value="name_asc">Sắp xếp: Tên A → Z</option>
          </select>

          <button
            type="button"
            className="aum-btn-action aum-btn-system"
            onClick={handleOpenSystemDecks}
            title="Xem danh sách bộ thẻ mặc định của hệ thống"
          >
            <Server size={14} />
            <span>Bộ thẻ hệ thống ({stats.totalSystemDecks})</span>
          </button>

          <button
            type="button"
            className="aum-btn-action"
            onClick={() => {
              loadStats();
              loadUsers();
            }}
            title="Tải lại dữ liệu"
          >
            <RotateCw size={14} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 3. BẢNG DANH SÁCH TÀI KHOẢN & SỐ LƯỢNG DECKS, CARDS */}
      <div className="aum-table-card">
        <div className="aum-table-header-title">
          <h3 className="aum-table-title">
            <Users size={17} color="#0d99ff" />
            <span>Danh Sách Tài Khoản Người Dùng &amp; Thống Kê Sáng Tạo</span>
          </h3>
          <span className="aum-count-badge">
            Hiển thị {users.length} tài khoản
          </span>
        </div>

        <div className="aum-table-wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div className="dl-loading-spinner" style={{ margin: '0 auto 12px auto' }} />
              <span>Đang tải thống kê người dùng...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="aum-empty-state">
              <Users size={40} className="aum-empty-icon" />
              <h4>Không tìm thấy người dùng nào</h4>
              <p>Thử tìm với từ khóa khác hoặc xóa bộ lọc tìm kiếm.</p>
            </div>
          ) : (
            <table className="aum-table">
              <thead>
                <tr>
                  <th>Tài Khoản / Người Dùng</th>
                  <th>Vai Trò &amp; Nguồn</th>
                  <th>Ngày Tham Gia</th>
                  <th>Số Bộ Thẻ (Decks)</th>
                  <th>Tổng Thẻ (Cards)</th>
                  <th>Tạo Lần Cuối</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const initial = (u.fullName || u.userName || 'U')
                    .replace(/[^a-zA-Z0-9À-ỹ]/g, '')
                    .charAt(0)
                    .toUpperCase() || 'U';

                  const isAdmin = u.role?.toLowerCase().includes('admin');

                  return (
                    <tr key={u.id}>
                      {/* Cột 1: Thông tin người dùng */}
                      <td>
                        <div className="aum-user-cell">
                          <div className="aum-avatar">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.fullName} />
                            ) : (
                              <span>{initial}</span>
                            )}
                          </div>
                          <div className="aum-user-meta">
                            <div className="aum-user-name-row">
                              <span className="aum-user-fullname">{u.fullName}</span>
                              {isAdmin && (
                                <span className="aum-badge-role aum-role-admin">Admin</span>
                              )}
                            </div>
                            <span className="aum-user-email">
                              {u.email || `@${u.userName}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Vai trò & Nguồn xác thực */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className={`aum-badge-role ${isAdmin ? 'aum-role-admin' : 'aum-role-user'}`} style={{ width: 'fit-content' }}>
                            {u.role || 'User'}
                          </span>
                          <span className="aum-badge-provider" style={{ width: 'fit-content' }}>
                            {u.provider || 'Local'}
                          </span>
                        </div>
                      </td>

                      {/* Cột 3: Ngày tham gia */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#64748b' }}>
                          <Calendar size={13} />
                          <span>
                            {new Date(u.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Cột 4: Số lượng bộ thẻ đã tạo */}
                      <td>
                        <div>
                          <span className="aum-metric-pill aum-pill-decks">
                            <Layers size={13} />
                            <span>{u.totalDecks} Decks</span>
                          </span>
                          {u.totalDecks > 0 && (
                            <div className="aum-deck-split">
                              <span className="aum-split-pub">
                                {u.publicDecks} công khai
                              </span>
                              <span>•</span>
                              <span className="aum-split-priv">
                                {u.privateDecks} riêng tư
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột 5: Tổng số thẻ Flashcards */}
                      <td>
                        <span className="aum-metric-pill aum-pill-cards">
                          <FileQuestion size={13} />
                          <span>{u.totalCards} Cards</span>
                        </span>
                      </td>

                      {/* Cột 6: Thời điểm tạo deck gần nhất */}
                      <td style={{ fontSize: '12.5px', color: '#64748b' }}>
                        {u.lastDeckCreatedAt ? (
                          new Date(u.lastDeckCreatedAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>Chưa có</span>
                        )}
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="aum-btn-view-decks"
                          onClick={() => handleOpenUserDecks(u)}
                          title="Xem danh sách chi tiết các bộ thẻ của tài khoản này"
                        >
                          <Eye size={13} />
                          <span>Xem Decks ({u.totalDecks})</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. MODAL CHI TIẾT DANH SÁCH BỘ THẺ CỦA USER ĐƯỢC CHỌN */}
      {selectedUser && (
        <div className="aum-modal-backdrop" onClick={handleCloseModal}>
          <div
            className="aum-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="aum-modal-header">
              <div className="aum-modal-user-info">
                <div>
                  <h3 className="aum-modal-title">
                    {isSystemModal
                      ? 'Danh Sách Bộ Thẻ Mẫu Hệ Thống'
                      : `Bộ Thẻ Của: ${selectedUser.fullName || selectedUser.userName}`}
                  </h3>
                  <p className="aum-modal-subtitle">
                    {selectedUser.email || `@${selectedUser.userName || 'system'}`} •{' '}
                    <strong>{userDecks.length} bộ thẻ</strong> tổng cộng
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="aum-modal-close"
                onClick={handleCloseModal}
                title="Đóng modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nội dung Modal */}
            <div className="aum-modal-body">
              {loadingDecks ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <div className="dl-loading-spinner" style={{ margin: '0 auto 12px auto' }} />
                  <span>Đang tải danh sách bộ thẻ...</span>
                </div>
              ) : userDecks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <Layers size={36} style={{ color: '#cbd5e1', margin: '0 auto 10px auto' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Tài khoản này chưa tạo bộ thẻ nào</p>
                </div>
              ) : (
                userDecks.map((deck) => (
                  <div key={deck.id} className="aum-deck-item">
                    <div className="aum-deck-main">
                      <div className="aum-deck-title-row">
                        <h4 className="aum-deck-title">{deck.title}</h4>
                        <span
                          className={`aum-deck-vis-badge ${
                            deck.isPublic !== false
                              ? 'aum-deck-vis-pub'
                              : 'aum-deck-vis-priv'
                          }`}
                        >
                          {deck.isPublic !== false ? (
                            <>
                              <Globe size={11} />
                              <span>Công khai</span>
                            </>
                          ) : (
                            <>
                              <Lock size={11} />
                              <span>Riêng tư</span>
                            </>
                          )}
                        </span>
                      </div>

                      {deck.description && (
                        <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                          {deck.description}
                        </p>
                      )}

                      <div className="aum-deck-meta">
                        <span>📁 {deck.folder || 'Chung'}</span>
                        {deck.tag && (
                          <span className="aum-deck-tag">
                            #{deck.tag.replace(/,/g, ' #')}
                          </span>
                        )}
                        <span>
                          🕒{' '}
                          {new Date(deck.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="aum-deck-right">
                      <span className="aum-deck-cards-count">
                        {deck.totalCards} Cards
                      </span>

                      <button
                        type="button"
                        className="aum-btn-delete-deck"
                        onClick={() => handleDeleteDeck(deck)}
                        title="Xóa bộ thẻ này khỏi cơ sở dữ liệu"
                      >
                        <Trash2 size={13} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

