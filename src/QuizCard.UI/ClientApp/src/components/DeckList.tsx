/**
 * Component DeckList: Quản lý danh sách Bộ thẻ và Phân loại bộ thẻ
 * =============================================================================
 * Cung cấp đầy đủ các tính năng:
 * 1. Quản lý và Tạo mới Phân loại bộ thẻ (Category Management):
 *    - Tạo phân loại mới với Tên, Biểu tượng Emoji (💻, 🇬🇧, 🇯🇵, 🔬, 📚...), Màu sắc và Mô tả.
 *    - Xóa phân loại (tự động chuyển các bộ thẻ liên quan về phân loại "Chung").
 * 2. Lọc bộ thẻ theo Phân loại đã tạo và theo Tiến độ học (Đã học, Chưa học).
 * 3. Tìm kiếm nhanh bộ thẻ theo tên, mô tả hoặc phân loại.
 * 4. Hiển thị danh sách các bộ thẻ dạng lưới kèm thanh tiến độ ghi nhớ (Mastered %).
 * 5. Modal Tạo / Sửa bộ thẻ kèm chọn phân loại trực quan hoặc tạo ngay phân loại mới.
 * 6. Xóa bộ thẻ (Cascade delete các thẻ con).
 * 7. Các nút điều hướng nhanh: "Lật thẻ" (Study Mode), "Trắc nghiệm" (Quiz Mode), và "Quản lý danh sách thẻ".
 */

import React, { useState, useMemo, useEffect } from 'react';
import type { Deck, Category } from '../types';
import { 
  Plus, BookOpen, Edit2, Trash2, CheckCircle2, Clock, AlertCircle, 
  Play, HelpCircle, Search, Tag, Check, X, FolderPlus
} from 'lucide-react';

interface DeckListProps {
  /** Danh sách bộ thẻ từ App */
  decks: Deck[];
  /** Danh sách các phân loại đã tạo từ App */
  categories: Category[];
  /** Trạng thái đang tải dữ liệu từ máy chủ */
  loading: boolean;
  /** Callback tạo bộ thẻ mới */
  onCreateDeck: (data: { title: string; description?: string; category?: string }) => Promise<void>;
  /** Callback cập nhật thông tin bộ thẻ */
  onUpdateDeck: (id: string, data: { title: string; description?: string; category?: string }) => Promise<void>;
  /** Callback xóa bộ thẻ */
  onDeleteDeck: (id: string) => Promise<void>;
  /** Callback tạo phân loại mới */
  onCreateCategory: (data: { name: string; description?: string; icon?: string; color?: string }) => Promise<Category>;
  /** Callback cập nhật phân loại */
  onUpdateCategory: (id: string, data: { name: string; description?: string; icon?: string; color?: string }) => Promise<Category>;
  /** Callback xóa phân loại */
  onDeleteCategory: (id: string) => Promise<void>;
  /** Callback mở chế độ lật thẻ 3D */
  onSelectDeckForStudy: (deck: Deck) => void;
  /** Callback mở chế độ thi trắc nghiệm */
  onSelectDeckForQuiz: (deck: Deck) => void;
  /** Callback mở màn hình quản lý thẻ */
  onSelectDeckForCards: (deck: Deck) => void;
}

// Bảng biểu tượng Emoji gợi ý chọn nhanh cho phân loại
const SUGGESTED_ICONS = ['💻', '🇬🇧', '🇯🇵', '🔬', '📚', '🎨', '🎵', '💼', '🧠', '📐', '⚽', '🌟', '💊', '📁'];

// Bảng màu gợi ý chọn nhanh cho phân loại
const SUGGESTED_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#64748b'];

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  categories,
  loading,
  onCreateDeck,
  onUpdateDeck,
  onDeleteDeck,
  onCreateCategory,
  onDeleteCategory,
  onSelectDeckForStudy,
  onSelectDeckForQuiz,
  onSelectDeckForCards,
}) => {
  // ==========================================
  // TRẠNG THÁI BỘ LỌC VÀ TÌM KIẾM
  // ==========================================
  // Bộ lọc đang chọn: 'ALL' | 'STUDIED' | 'NOT_STARTED' | Tên Category cụ thể
  // Tự động khôi phục từ localStorage khi người dùng refresh F5
  const [selectedFilter, setSelectedFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('quizcard_selected_filter') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  // Lưu trạng thái bộ lọc vào localStorage mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('quizcard_selected_filter', selectedFilter);
    } catch {}
  }, [selectedFilter]);

  // Từ khóa tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');

  // ==========================================
  // TRẠNG THÁI MODAL TẠO / SỬA BỘ THẺ
  // ==========================================
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Chung');
  const [submittingDeck, setSubmittingDeck] = useState(false);
  const [deckError, setDeckError] = useState<string | null>(null);

  // ==========================================
  // TRẠNG THÁI MODAL QUẢN LÝ / TẠO PHÂN LOẠI
  // ==========================================
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('💻');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  /**
   * Danh sách tên phân loại duy nhất gộp giữa bảng categories và các bộ thẻ hiện có
   */
  const allCategoryNames = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => set.add(c.name.trim()));
    decks.forEach((d) => {
      if (d.category && d.category.trim()) set.add(d.category.trim());
    });
    if (!set.has('Chung')) set.add('Chung');
    return Array.from(set);
  }, [categories, decks]);

  /**
   * Tính toán số lượng bộ thẻ cho từng bộ lọc:
   * - Tất cả
   * - Đã học (có ít nhất 1 thẻ đang học hoặc đã thuộc)
   * - Chưa học (chưa có thẻ nào được học)
   */
  const filterCounts = useMemo(() => {
    const total = decks.length;
    const studied = decks.filter((d) => (d.masteredCards + d.learningCards) > 0).length;
    const notStarted = decks.filter((d) => (d.masteredCards + d.learningCards) === 0).length;

    const categoryCounts: Record<string, number> = {};
    decks.forEach((d) => {
      const cat = d.category?.trim() || 'Chung';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return { total, studied, notStarted, categoryCounts };
  }, [decks]);

  /**
   * Sắp xếp các phân loại bộ thẻ được tạo ra từ người dùng theo số lượng bộ thẻ giảm dần
   * (nhiều bộ thẻ nhất xếp trước, hiển thị từ trái sang phải).
   * Nếu có cùng số lượng thì sắp xếp theo bảng chữ cái tiếng Việt.
   * Lưu ý: Chỉ sắp xếp các phân loại của người dùng, các tab hệ thống ("Tất cả", "Đã học", "Chưa học")
   * được giữ cố định ở đầu và cuối.
   */
  const sortedCategoryNames = useMemo(() => {
    return [...allCategoryNames].sort((a, b) => {
      const countA = filterCounts.categoryCounts[a] || 0;
      const countB = filterCounts.categoryCounts[b] || 0;
      if (countB !== countA) {
        return countB - countA; // Số lượng nhiều hơn nằm bên trái
      }
      return a.localeCompare(b, 'vi');
    });
  }, [allCategoryNames, filterCounts.categoryCounts]);

  /**
   * Lọc danh sách bộ thẻ hiển thị dựa theo bộ lọc và từ khóa tìm kiếm
   */
  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      // 1. Kiểm tra điều kiện phân loại
      if (selectedFilter === 'STUDIED') {
        const isStudied = (deck.masteredCards + deck.learningCards) > 0;
        if (!isStudied) return false;
      } else if (selectedFilter === 'NOT_STARTED') {
        const isNotStarted = (deck.masteredCards + deck.learningCards) === 0;
        if (!isNotStarted) return false;
      } else if (selectedFilter !== 'ALL') {
        if (deck.category?.toLowerCase() !== selectedFilter.toLowerCase()) {
          return false;
        }
      }

      // 2. Kiểm tra điều kiện tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = deck.title.toLowerCase().includes(q);
        const matchDesc = deck.description?.toLowerCase().includes(q) || false;
        const matchCat = deck.category?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [decks, selectedFilter, searchQuery]);

  /**
   * Mở modal Tạo Bộ Thẻ Mới
   */
  const openCreateDeckModal = () => {
    setEditingDeck(null);
    setTitle('');
    setDescription('');
    // Nếu đang lọc theo 1 category cụ thể, chọn luôn category đó
    if (selectedFilter !== 'ALL' && selectedFilter !== 'STUDIED' && selectedFilter !== 'NOT_STARTED') {
      setCategory(selectedFilter);
    } else {
      setCategory(categories[0]?.name || 'Lập trình');
    }
    setDeckError(null);
    setIsDeckModalOpen(true);
  };

  /**
   * Mở modal Chỉnh Sửa Bộ Thẻ
   */
  const openEditDeckModal = (deck: Deck, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDeck(deck);
    setTitle(deck.title);
    setDescription(deck.description || '');
    setCategory(deck.category || 'Chung');
    setDeckError(null);
    setIsDeckModalOpen(true);
  };

  /**
   * Submit form Tạo hoặc Sửa Bộ Thẻ
   */
  const handleSubmitDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setDeckError('Vui lòng nhập tên bộ thẻ');
      return;
    }

    try {
      setSubmittingDeck(true);
      setDeckError(null);
      const cat = category.trim() || 'Chung';
      if (editingDeck) {
        await onUpdateDeck(editingDeck.id, { title, description, category: cat });
      } else {
        await onCreateDeck({ title, description, category: cat });
      }
      setIsDeckModalOpen(false);
    } catch (err: any) {
      setDeckError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setSubmittingDeck(false);
    }
  };

  /**
   * Submit form Tạo Phân Loại Mới
   */
  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCategoryError('Vui lòng nhập tên phân loại');
      return;
    }

    try {
      setSubmittingCategory(true);
      setCategoryError(null);
      const created = await onCreateCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
        icon: newCatIcon,
        color: newCatColor,
      });

      // Reset form
      setNewCatName('');
      setNewCatDesc('');
      // Chọn luôn phân loại vừa tạo
      setCategory(created.name);
    } catch (err: any) {
      setCategoryError(err.message || 'Không thể tạo phân loại');
    } finally {
      setSubmittingCategory(false);
    }
  };

  /**
   * Xóa phân loại
   */
  const handleDeleteCategoryClick = async (cat: Category) => {
    if (cat.name === 'Chung') {
      alert('Không thể xóa phân loại mặc định "Chung"');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa phân loại "${cat.name}"? Các bộ thẻ thuộc phân loại này sẽ tự động chuyển về "Chung".`)) {
      try {
        await onDeleteCategory(cat.id);
        if (selectedFilter.toLowerCase() === cat.name.toLowerCase()) {
          setSelectedFilter('ALL');
        }
      } catch (err: any) {
        alert(err.message || 'Không thể xóa phân loại');
      }
    }
  };

  /**
   * Xóa bộ thẻ
   */
  const handleDeleteDeck = async (deck: Deck, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ thẻ "${deck.title}" cùng toàn bộ thẻ bên trong không?`)) {
      try {
        await onDeleteDeck(deck.id);
      } catch (err: any) {
        alert(err.message || 'Không thể xóa bộ thẻ');
      }
    }
  };

  /**
   * Tìm icon và màu sắc của một phân loại
   */
  const getCategoryMeta = (catName?: string) => {
    const name = catName?.trim() || 'Chung';
    const found = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found) {
      return { icon: found.icon || '📁', color: found.color || '#3b82f6', name: found.name };
    }
    if (name.toLowerCase() === 'lập trình') return { icon: '💻', color: '#2563eb', name: 'Lập trình' };
    if (name.toLowerCase() === 'tiếng anh') return { icon: '🇬🇧', color: '#7c3aed', name: 'Tiếng Anh' };
    if (name.toLowerCase() === 'khoa học') return { icon: '🔬', color: '#059669', name: 'Khoa học' };
    return { icon: '📁', color: '#64748b', name };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Tiêu đề trang & Các nút hành động chính */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Bộ Thẻ Học Tập
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>
            Phân loại theo chủ đề, quản lý các bộ flashcard và theo dõi tiến độ ghi nhớ
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Nút 1: Mở Modal Quản Lý & Tạo Phân Loại */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              color: 'var(--text-main)',
              border: '1px solid var(--border)',
              padding: '12px 18px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            <FolderPlus size={18} color="var(--primary)" />
            <span>Tạo Phân Loại Mới</span>
          </button>

          {/* Nút 2: Mở Modal Tạo Bộ Thẻ */}
          <button
            onClick={openCreateDeckModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 4px 14px var(--primary-glow)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
          >
            <Plus size={18} />
            <span>Tạo Bộ Thẻ Mới</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* THANH TÌM KIẾM VÀ CÁC TAB PHÂN LOẠI (FILTER PILLS) */}
      {/* ==================================================================== */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '18px 20px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        marginBottom: '28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        {/* Ô Tìm Kiếm Nhanh */}
        <div style={{
          position: 'relative',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
          <input
            type="text"
            placeholder="Tìm kiếm bộ thẻ theo tên, mô tả hoặc phân loại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 38px 10px 42px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#f8fafc',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                color: 'var(--text-muted)',
                padding: '4px',
              }}
              title="Xóa tìm kiếm"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Các nút Tab Phân Loại (Filter Pills) */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Tag size={14} />
              <span>Phân loại bộ thẻ:</span>
            </div>

            <button
              onClick={() => setIsCategoryModalOpen(true)}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--primary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Plus size={14} />
              <span>Thêm phân loại mới</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {/* Tab: Tất cả */}
            <button
              onClick={() => setSelectedFilter('ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: selectedFilter === 'ALL' ? 700 : 500,
                backgroundColor: selectedFilter === 'ALL' ? 'var(--primary)' : '#f1f5f9',
                color: selectedFilter === 'ALL' ? '#ffffff' : 'var(--text-main)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span>🌟 Tất cả</span>
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '10px',
                backgroundColor: selectedFilter === 'ALL' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
              }}>
                {filterCounts.total}
              </span>
            </button>

            {/* Các Tab theo Phân loại người dùng tạo (đã sắp xếp giảm dần theo số lượng bộ thẻ từ trái sang phải) */}
            {sortedCategoryNames.map((catName) => {
              const meta = getCategoryMeta(catName);
              const count = filterCounts.categoryCounts[catName] || 0;
              const isSelected = selectedFilter.toLowerCase() === catName.toLowerCase();

              return (
                <button
                  key={catName}
                  onClick={() => setSelectedFilter(catName)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? meta.color : '#f1f5f9',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{meta.icon} {catName}</span>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Tab: Bộ thẻ Đã học */}
            <button
              onClick={() => setSelectedFilter('STUDIED')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: selectedFilter === 'STUDIED' ? 700 : 500,
                backgroundColor: selectedFilter === 'STUDIED' ? 'var(--success)' : '#ecfdf5',
                color: selectedFilter === 'STUDIED' ? '#ffffff' : '#047857',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span>✅ Đã học</span>
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '10px',
                backgroundColor: selectedFilter === 'STUDIED' ? 'rgba(255,255,255,0.25)' : '#d1fae5',
              }}>
                {filterCounts.studied}
              </span>
            </button>

            {/* Tab: Bộ thẻ Chưa học */}
            <button
              onClick={() => setSelectedFilter('NOT_STARTED')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: selectedFilter === 'NOT_STARTED' ? 700 : 500,
                backgroundColor: selectedFilter === 'NOT_STARTED' ? 'var(--warning-dark)' : '#fefce8',
                color: selectedFilter === 'NOT_STARTED' ? '#ffffff' : '#a16207',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span>🆕 Chưa học</span>
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '10px',
                backgroundColor: selectedFilter === 'NOT_STARTED' ? 'rgba(255,255,255,0.25)' : '#fef08a',
              }}>
                {filterCounts.notStarted}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Hiển thị trạng thái đang tải */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Đang tải danh sách bộ thẻ...</p>
        </div>
      )}

      {/* Hiển thị khi kho chưa có bất kỳ bộ thẻ nào */}
      {!loading && decks.length === 0 && (
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center',
          border: '2px dashed var(--border)',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <BookOpen size={30} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Chưa có bộ thẻ nào</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
            Hãy tạo bộ thẻ đầu tiên của bạn để bắt đầu phân loại theo chủ đề và ôn tập thông minh!
          </p>
          <button
            onClick={openCreateDeckModal}
            style={{
              backgroundColor: 'var(--primary)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Tạo bộ thẻ ngay
          </button>
        </div>
      )}

      {/* Hiển thị khi có bộ thẻ nhưng bộ lọc hoặc tìm kiếm không khớp kết quả nào */}
      {!loading && decks.length > 0 && filteredDecks.length === 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '50px 20px',
          textAlign: 'center',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Search size={26} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>Không tìm thấy bộ thẻ phù hợp</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '18px' }}>
            Không có bộ thẻ nào khớp với bộ lọc &quot;{selectedFilter === 'STUDIED' ? 'Đã học' : selectedFilter === 'NOT_STARTED' ? 'Chưa học' : selectedFilter}&quot;
            {searchQuery ? ` và từ khóa "${searchQuery}"` : ''}.
          </p>
          <button
            onClick={() => {
              setSelectedFilter('ALL');
              setSearchQuery('');
            }}
            style={{
              backgroundColor: '#f1f5f9',
              color: 'var(--text-main)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              border: '1px solid var(--border)',
            }}
          >
            Xóa bộ lọc để xem tất cả ({decks.length})
          </button>
        </div>
      )}

      {/* Lưới danh sách các bộ thẻ (Deck Grid) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '24px',
      }}>
        {filteredDecks.map((deck) => {
          const masteredPercent = deck.totalCards > 0 
            ? Math.round((deck.masteredCards / deck.totalCards) * 100) 
            : 0;

          const meta = getCategoryMeta(deck.category);

          return (
            <div
              key={deck.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div>
                {/* Thanh tiêu đề nhỏ trên cùng: Phân loại, số lượng thẻ và nút Sửa/Xóa */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Huy hiệu Phân loại (Category Badge) */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: `${meta.color}15`,
                      color: meta.color,
                      border: `1px solid ${meta.color}30`,
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}>
                      <span>{meta.icon}</span>
                      <span>{deck.category || 'Chung'}</span>
                    </span>

                    {/* Huy hiệu số lượng thẻ */}
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      backgroundColor: 'var(--primary-light)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}>
                      {deck.totalCards} thẻ
                    </span>
                  </div>

                  {/* Nút Sửa & Xóa bộ thẻ */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      title="Sửa bộ thẻ"
                      onClick={(e) => openEditDeckModal(deck, e)}
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        color: 'var(--text-muted)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      title="Xóa bộ thẻ"
                      onClick={(e) => handleDeleteDeck(deck, e)}
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        color: 'var(--danger)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Tên và Mô tả bộ thẻ */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '8px',
                  lineHeight: 1.4,
                }}>
                  {deck.title}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  minHeight: '40px',
                  marginBottom: '20px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {deck.description || 'Chưa có mô tả cho bộ thẻ này.'}
                </p>

                {/* Thanh tiến độ trực quan (Progress Bar) */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Mức độ thuộc</span>
                    <span style={{ fontWeight: 700, color: 'var(--success-dark)' }}>{masteredPercent}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    display: 'flex',
                  }}>
                    {/* Đoạn xanh lá: Tỷ lệ thẻ đã thuộc */}
                    <div style={{
                      width: `${(deck.masteredCards / (deck.totalCards || 1)) * 100}%`,
                      backgroundColor: 'var(--success)',
                      transition: 'width 0.4s ease',
                    }} />
                    {/* Đoạn vàng: Tỷ lệ thẻ đang học */}
                    <div style={{
                      width: `${(deck.learningCards / (deck.totalCards || 1)) * 100}%`,
                      backgroundColor: 'var(--warning)',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>

                {/* Các huy hiệu số đếm chi tiết (Badges) */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <span className="badge badge-mastered" title="Đã thuộc bài">
                    <CheckCircle2 size={12} /> {deck.masteredCards} đã thuộc
                  </span>
                  <span className="badge badge-learning" title="Đang học">
                    <Clock size={12} /> {deck.learningCards} đang học
                  </span>
                  <span className="badge badge-notstarted" title="Chưa học">
                    <AlertCircle size={12} /> {deck.notStartedCards} chưa học
                  </span>
                </div>
              </div>

              {/* Các nút hành động chính của bộ thẻ: Lật thẻ, Trắc nghiệm, Quản lý thẻ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* Nút 1: Chế độ Học Lật Thẻ 3D */}
                  <button
                    onClick={() => onSelectDeckForStudy(deck)}
                    disabled={deck.totalCards === 0}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#ffffff',
                      backgroundColor: deck.totalCards === 0 ? '#cbd5e1' : 'var(--primary)',
                      cursor: deck.totalCards === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: deck.totalCards === 0 ? 'none' : '0 2px 8px var(--primary-glow)',
                    }}
                    onMouseEnter={(e) => {
                      if (deck.totalCards > 0) e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (deck.totalCards > 0) e.currentTarget.style.backgroundColor = 'var(--primary)';
                    }}
                  >
                    <Play size={14} fill="#ffffff" />
                    <span>Lật thẻ</span>
                  </button>

                  {/* Nút 2: Chế độ Luyện Thi Trắc Nghiệm */}
                  <button
                    onClick={() => onSelectDeckForQuiz(deck)}
                    disabled={deck.totalCards < 2}
                    title={deck.totalCards < 2 ? 'Cần tối thiểu 2 thẻ để thi trắc nghiệm' : 'Luyện thi trắc nghiệm A, B, C, D'}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: deck.totalCards < 2 ? '#94a3b8' : '#0284c7',
                      backgroundColor: deck.totalCards < 2 ? '#f1f5f9' : '#e0f2fe',
                      border: deck.totalCards < 2 ? '1px solid #e2e8f0' : '1px solid #bae6fd',
                      cursor: deck.totalCards < 2 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                    onMouseEnter={(e) => {
                      if (deck.totalCards >= 2) e.currentTarget.style.backgroundColor = '#bae6fd';
                    }}
                    onMouseLeave={(e) => {
                      if (deck.totalCards >= 2) e.currentTarget.style.backgroundColor = '#e0f2fe';
                    }}
                  >
                    <HelpCircle size={15} />
                    <span>Trắc nghiệm</span>
                  </button>
                </div>

                {/* Nút 3: Vào màn hình chi tiết quản lý thẻ */}
                <button
                  onClick={() => onSelectDeckForCards(deck)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <BookOpen size={14} />
                  <span>Quản lý danh sách thẻ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: TẠO MỚI HOẶC CHỈNH SỬA BỘ THẺ */}
      {/* ==================================================================== */}
      {isDeckModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeckModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
              {editingDeck ? 'Chỉnh Sửa Bộ Thẻ' : 'Tạo Bộ Thẻ Mới'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {editingDeck ? 'Cập nhật tiêu đề, mô tả và phân loại bộ thẻ' : 'Nhập thông tin bộ thẻ flashcard và chọn phân loại chủ đề'}
            </p>

            {deckError && (
              <div style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger-dark)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {deckError}
              </div>
            )}

            <form onSubmit={handleSubmitDeck}>
              {/* Tên bộ thẻ */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Tên bộ thẻ <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Từ vựng IELTS chủ đề Environment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Phân loại bộ thẻ (Chọn từ danh sách đã tạo hoặc nhập mới) */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>
                    Phân loại / Chủ đề
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    style={{
                      fontSize: '12px',
                      color: 'var(--primary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={13} />
                    <span>Tạo phân loại mới</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Ví dụ: Lập trình, Tiếng Anh, Khoa học..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />

                {/* Danh sách các phân loại đã có để chọn nhanh (ưu tiên phân loại có nhiều bộ thẻ) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gợi ý:</span>
                  {sortedCategoryNames.map((catName) => {
                    const meta = getCategoryMeta(catName);
                    const isSelected = category.trim().toLowerCase() === catName.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={catName}
                        onClick={() => setCategory(catName)}
                        style={{
                          fontSize: '12px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? `${meta.color}20` : '#f1f5f9',
                          color: isSelected ? meta.color : 'var(--text-main)',
                          border: isSelected ? `1.5px solid ${meta.color}` : '1px solid var(--border)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 500,
                        }}
                      >
                        <span>{meta.icon}</span>
                        <span>{catName}</span>
                        {isSelected && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mô tả bộ thẻ */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả mục tiêu học tập, nguồn tài liệu hoặc ghi chú..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Các nút Lưu / Hủy */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsDeckModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingDeck}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {submittingDeck ? 'Đang lưu...' : editingDeck ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: QUẢN LÝ VÀ TẠO PHÂN LOẠI BỘ THẺ */}
      {/* ==================================================================== */}
      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Quản Lý Phân Loại Bộ Thẻ
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Tạo phân loại mới (ví dụ: Lập trình, Tiếng Anh, Toán học...) để dễ dàng quản lý
                </p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: '8px' }}
              >
                <X size={18} />
              </button>
            </div>

            {categoryError && (
              <div style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger-dark)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {categoryError}
              </div>
            )}

            {/* Form Thêm Phân Loại Mới */}
            <form onSubmit={handleCreateCategorySubmit} style={{
              backgroundColor: '#f8fafc',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              marginBottom: '24px',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>
                ➕ Thêm phân loại mới
              </h3>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Tên phân loại <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tiếng Nhật, Toán Học, Y Khoa, Lịch Sử..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ backgroundColor: '#ffffff' }}
                />
              </div>

              {/* Chọn Biểu Tượng Emoji */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Biểu tượng (Icon): <span style={{ fontSize: '16px', marginLeft: '4px' }}>{newCatIcon}</span>
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {SUGGESTED_ICONS.map((icon) => (
                    <button
                      type="button"
                      key={icon}
                      onClick={() => setNewCatIcon(icon)}
                      style={{
                        fontSize: '16px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        backgroundColor: newCatIcon === icon ? 'var(--primary-light)' : '#ffffff',
                        border: newCatIcon === icon ? '2px solid var(--primary)' : '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn Màu Sắc Nhận Diện */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Màu sắc nhận diện:
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {SUGGESTED_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewCatColor(c)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: newCatColor === c ? '3px solid #0f172a' : '2px solid #ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Mô tả tùy chọn */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Mô tả (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm về mục tiêu phân loại này..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  style={{ backgroundColor: '#ffffff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  {submittingCategory ? 'Đang tạo...' : '+ Tạo Phân Loại'}
                </button>
              </div>
            </form>

            {/* Danh Sách Các Phân Loại Hiện Có */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
                📋 Danh sách phân loại ({categories.length}):
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {categories.map((cat) => {
                  const deckCount = filterCounts.categoryCounts[cat.name] || 0;
                  return (
                    <div
                      key={cat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '18px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `${cat.color}15`,
                          borderRadius: '8px',
                        }}>
                          {cat.icon || '📁'}
                        </span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {cat.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {cat.description || `${deckCount} bộ thẻ`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: '#f1f5f9',
                          color: 'var(--text-muted)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}>
                          {deckCount} bộ thẻ
                        </span>

                        {cat.name !== 'Chung' && (
                          <button
                            title="Xóa phân loại này"
                            onClick={() => handleDeleteCategoryClick(cat)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              color: 'var(--danger)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#f1f5f9',
                  color: 'var(--text-main)',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
