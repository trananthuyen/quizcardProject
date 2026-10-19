/**
 * Component CardManager: Quản lý danh sách Thẻ Flashcard thuộc một bộ thẻ (Card Management).
 * Cung cấp các tính năng:
 * 1. Hiển thị thông tin tiêu đề, mô tả của bộ thẻ hiện tại và nút quay lại trang chủ.
 * 2. Thêm thẻ đơn lẻ qua Modal (Thuật ngữ, Định nghĩa, Ví dụ).
 * 3. Chỉnh sửa và Xóa thẻ flashcard.
 * 4. Tạo hàng loạt thẻ từ chuỗi văn bản (Bulk String Import) với tính năng tự động nhận diện
 *    dấu phân cách (- , : , \t , |) và bảng xem trước thời gian thực (Real-time Preview).
 * 5. Tìm kiếm thẻ theo từ khóa (Term, Definition, Example).
 * 6. Lọc thẻ theo trạng thái ghi nhớ: Tất cả, Chưa học, Đang học, Đã thuộc.
 * 7. Điều hướng trực tiếp sang "Bắt Đầu Học Thẻ" (Study Mode) hoặc "Luyện Trắc Nghiệm" (Quiz Mode).
 */

import React, { useState, useMemo } from 'react';
import { StudyStatus, type Card, type Deck } from '../types';
import { 
  ArrowLeft, Plus, Search, Edit2, Trash2, Play, CheckCircle2, 
  Clock, AlertCircle, FileText, Sparkles, Check, HelpCircle
} from 'lucide-react';

interface CardManagerProps {
  deck: Deck;                                                                                                   // Thông tin bộ thẻ đang xem
  cards: Card[];                                                                                               // Danh sách thẻ con của bộ
  loading: boolean;                                                                                            // Trạng thái đang tải dữ liệu thẻ
  onBack: () => void;                                                                                          // Callback quay lại trang chủ
  onStartStudy: () => void;                                                                                    // Callback bắt đầu học lật thẻ
  onStartQuiz: () => void;                                                                                     // Callback bắt đầu thi trắc nghiệm
  onCreateCard: (deckId: string, data: { term: string; definition: string; example?: string }) => Promise<void>; // Callback thêm 1 thẻ lẻ
  onBatchCreateCards: (deckId: string, cards: Array<{ term: string; definition: string; example?: string }>) => Promise<void>; // Callback thêm hàng loạt thẻ
  onUpdateCard: (id: string, data: { term: string; definition: string; example?: string }) => Promise<void>;   // Callback sửa thẻ
  onDeleteCard: (id: string) => Promise<void>;                                                                 // Callback xóa thẻ
}

export const CardManager: React.FC<CardManagerProps> = ({
  deck,
  cards,
  loading,
  onBack,
  onStartStudy,
  onStartQuiz,
  onCreateCard,
  onBatchCreateCards,
  onUpdateCard,
  onDeleteCard,
}) => {
  // ==========================================================================
  // STATE CHO MODAL THÊM / SỬA THẺ LẺ
  // ==========================================================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');

  // ==========================================================================
  // STATE CHO MODAL NHẬP HÀNG LOẠT TỪ CHUỖI VĂN BẢN (BULK IMPORT)
  // ==========================================================================
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchText, setBatchText] = useState('');
  // Ký tự phân cách: 'AUTO' (tự nhận diện), '-' (gạch ngang), ':' (hai chấm), '\t' (Tab), '|' (gạch đứng)
  const [delimiter, setDelimiter] = useState<'AUTO' | '-' | ':' | '\t' | '|'>('AUTO');
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  // ==========================================================================
  // STATE CHO TÌM KIẾM, LỌC & SUBMIT
  // ==========================================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StudyStatus>('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Mở modal thêm một thẻ mới
   */
  const openCreateModal = () => {
    setEditingCard(null);
    setTerm('');
    setDefinition('');
    setExample('');
    setError(null);
    setIsModalOpen(true);
  };

  /**
   * Mở modal nhập hàng loạt từ chuỗi văn bản
   */
  const openBatchModal = () => {
    setBatchText('');
    setDelimiter('AUTO');
    setBatchError(null);
    setIsBatchModalOpen(true);
  };

  /**
   * Mở modal chỉnh sửa một thẻ hiện có
   */
  const openEditModal = (card: Card) => {
    setEditingCard(card);
    setTerm(card.term);
    setDefinition(card.definition);
    setExample(card.example || '');
    setError(null);
    setIsModalOpen(true);
  };

  /**
   * Submit form lưu thẻ lẻ (Tạo mới hoặc Cập nhật)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) {
      setError('Vui lòng nhập cả Thuật ngữ và Định nghĩa');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      if (editingCard) {
        await onUpdateCard(editingCard.id, { term, definition, example });
      } else {
        await onCreateCard(deck.id, { term, definition, example });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi lưu thẻ');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Thuật toán phân tích chuỗi văn bản thô (Parser):
   * Tự động tách từng dòng và nhận diện các trường Thuật ngữ, Định nghĩa, Ví dụ.
   * Chạy lại tự động mỗi khi nội dung ô textarea (batchText) hoặc ký tự phân cách (delimiter) thay đổi.
   */
  const parsedCards = useMemo(() => {
    if (!batchText.trim()) return [];

    // Tách văn bản thành mảng các dòng
    const lines = batchText.split(/\r?\n/);
    const result: Array<{ term: string; definition: string; example?: string }> = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      // Bỏ qua dòng trống hoặc dòng ghi chú bắt đầu bằng # hoặc //
      if (!line || line.startsWith('#') || line.startsWith('//')) continue;

      let parts: string[] = [];

      // Logic nhận diện ký tự phân cách
      if (delimiter === 'AUTO') {
        if (line.includes('\t')) {
          parts = line.split('\t'); // Phím Tab từ Excel/Google Sheets
        } else if (line.includes(' - ')) {
          parts = line.split(' - ');
        } else if (line.includes(' : ')) {
          parts = line.split(' : ');
        } else if (line.includes(' | ')) {
          parts = line.split(' | ');
        } else if (line.includes('-')) {
          parts = line.split('-');
        } else if (line.includes(':')) {
          parts = line.split(':');
        } else if (line.includes('|')) {
          parts = line.split('|');
        }
      } else if (delimiter === '\t') {
        parts = line.split('\t');
      } else {
        parts = line.split(delimiter);
      }

      // Mỗi dòng phải có tối thiểu 2 phần: Thuật ngữ và Định nghĩa
      if (parts.length >= 2) {
        const parsedTerm = parts[0].trim();
        const parsedDef = parts[1].trim();
        // Phần thứ 3 trở đi (nếu có) được coi là Ví dụ minh họa
        const parsedEx = parts.slice(2).join(' - ').trim();

        if (parsedTerm && parsedDef) {
          result.push({
            term: parsedTerm,
            definition: parsedDef,
            example: parsedEx || undefined,
          });
        }
      }
    }

    return result;
  }, [batchText, delimiter]);

  /**
   * Submit tạo danh sách thẻ đã nhận diện được từ chuỗi
   */
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedCards.length === 0) {
      setBatchError('Không tìm thấy thẻ hợp lệ nào từ chuỗi nhập vào. Vui lòng kiểm tra định dạng phân cách.');
      return;
    }

    try {
      setBatchSubmitting(true);
      setBatchError(null);
      await onBatchCreateCards(deck.id, parsedCards);
      setIsBatchModalOpen(false);
    } catch (err: any) {
      setBatchError(err.message || 'Có lỗi xảy ra khi thêm danh sách thẻ');
    } finally {
      setBatchSubmitting(false);
    }
  };

  /**
   * Tiện ích dán chuỗi mẫu chuẩn để người dùng hình dung cách hoạt động
   */
  const handleInsertSample = () => {
    const sample = `React - Thư viện JavaScript mã nguồn mở để xây dựng giao diện người dùng - Sử dụng Components và Virtual DOM
TypeScript - Siêu tập ngôn ngữ (superset) của JavaScript bổ sung hệ thống kiểu tĩnh - Giúp phát hiện lỗi tại thời điểm biên dịch
REST API - Kiểu kiến trúc truyền tải dữ liệu phổ biến qua giao thức HTTP - Thường trao đổi dữ liệu định dạng JSON
Docker - Nền tảng ảo hóa mức hệ điều hành thông qua các containers - Giúp đóng gói ứng dụng chạy nhất quán mọi nơi`;
    setBatchText(sample);
    setDelimiter('AUTO');
  };

  /**
   * Xóa thẻ đơn lẻ có xác nhận
   */
  const handleDelete = async (card: Card) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa thẻ "${card.term}"?`)) {
      try {
        await onDeleteCard(card.id);
      } catch (err: any) {
        alert(err.message || 'Không thể xóa thẻ');
      }
    }
  };

  /**
   * Lọc danh sách thẻ theo thanh tìm kiếm và bộ lọc trạng thái (All, Chưa học, Đang học, Đã thuộc)
   */
  const filteredCards = cards.filter((card) => {
    const matchesSearch = 
      card.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.example && card.example.toLowerCase().includes(searchTerm.toLowerCase()));

    const currentStatus = card.progress?.status ?? StudyStatus.NotStarted;
    const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  /**
   * Hàm hiển thị huy hiệu trạng thái của thẻ
   */
  const getStatusBadge = (status?: StudyStatus) => {
    switch (status) {
      case StudyStatus.Mastered:
        return <span className="badge badge-mastered"><CheckCircle2 size={12} /> Đã thuộc</span>;
      case StudyStatus.Learning:
        return <span className="badge badge-learning"><Clock size={12} /> Đang học</span>;
      default:
        return <span className="badge badge-notstarted"><AlertCircle size={12} /> Chưa học</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Nút quay lại danh sách bộ thẻ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '14px',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          <ArrowLeft size={16} />
          <span>Quay lại danh sách bộ thẻ</span>
        </button>
      </div>

      {/* Khung thông tin tổng quan của Bộ thẻ */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '28px',
        marginBottom: '28px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '12px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
            }}>
              Bộ thẻ
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {cards.length} thẻ tổng cộng
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            {deck.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '650px' }}>
            {deck.description || 'Chưa có mô tả cho bộ thẻ này.'}
          </p>
        </div>

        {/* Thanh công cụ hành động: Tạo từ chuỗi, Thêm lẻ, Học thẻ, Thi trắc nghiệm */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Nút Tạo thẻ từ chuỗi văn bản */}
          <button
            onClick={openBatchModal}
            title="Tạo nhanh nhiều thẻ bằng cách dán chuỗi văn bản"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid #c7d2fe',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '14px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-light)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            <FileText size={18} />
            <span>Tạo Từ Chuỗi Văn Bản</span>
          </button>

          {/* Nút Thêm thẻ lẻ */}
          <button
            onClick={openCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              fontWeight: 700,
              fontSize: '14px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            <Plus size={18} />
            <span>Thêm Thẻ Lẻ</span>
          </button>

          {/* Nút Bắt Đầu Học Thẻ (Lật thẻ) */}
          <button
            onClick={onStartStudy}
            disabled={cards.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '10px',
              backgroundColor: cards.length === 0 ? '#cbd5e1' : 'var(--primary)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              cursor: cards.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: cards.length === 0 ? 'none' : '0 4px 12px var(--primary-glow)',
            }}
            onMouseEnter={(e) => {
              if (cards.length > 0) e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
            }}
            onMouseLeave={(e) => {
              if (cards.length > 0) e.currentTarget.style.backgroundColor = 'var(--primary)';
            }}
          >
            <Play size={18} fill="#ffffff" />
            <span>Bắt Đầu Học Thẻ</span>
          </button>

          {/* Nút Luyện Trắc Nghiệm */}
          <button
            onClick={onStartQuiz}
            disabled={cards.length < 2}
            title={cards.length < 2 ? 'Cần tối thiểu 2 thẻ để thi trắc nghiệm' : 'Luyện thi trắc nghiệm A, B, C, D'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '10px',
              backgroundColor: cards.length < 2 ? '#f1f5f9' : '#e0f2fe',
              color: cards.length < 2 ? '#94a3b8' : '#0284c7',
              border: cards.length < 2 ? '1px solid #e2e8f0' : '1px solid #bae6fd',
              fontWeight: 700,
              fontSize: '14px',
              cursor: cards.length < 2 ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (cards.length >= 2) e.currentTarget.style.backgroundColor = '#bae6fd';
            }}
            onMouseLeave={(e) => {
              if (cards.length >= 2) e.currentTarget.style.backgroundColor = '#e0f2fe';
            }}
          >
            <HelpCircle size={18} />
            <span>Luyện Trắc Nghiệm</span>
          </button>
        </div>
      </div>

      {/* Thanh Lọc theo trạng thái và Tìm kiếm từ khóa */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
      }}>
        {/* Bộ lọc trạng thái: Tất cả, Chưa học, Đang học, Đã thuộc */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setStatusFilter('ALL')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: statusFilter === 'ALL' ? 'var(--primary)' : '#ffffff',
              color: statusFilter === 'ALL' ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${statusFilter === 'ALL' ? 'var(--primary)' : 'var(--border)'}`,
            }}
          >
            Tất cả ({cards.length})
          </button>
          <button
            onClick={() => setStatusFilter(StudyStatus.NotStarted)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: statusFilter === StudyStatus.NotStarted ? 'var(--text-main)' : '#ffffff',
              color: statusFilter === StudyStatus.NotStarted ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${statusFilter === StudyStatus.NotStarted ? 'var(--text-main)' : 'var(--border)'}`,
            }}
          >
            Chưa học ({cards.filter(c => (c.progress?.status ?? StudyStatus.NotStarted) === StudyStatus.NotStarted).length})
          </button>
          <button
            onClick={() => setStatusFilter(StudyStatus.Learning)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: statusFilter === StudyStatus.Learning ? 'var(--warning-dark)' : '#ffffff',
              color: statusFilter === StudyStatus.Learning ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${statusFilter === StudyStatus.Learning ? 'var(--warning-dark)' : 'var(--border)'}`,
            }}
          >
            Đang học ({cards.filter(c => c.progress?.status === StudyStatus.Learning).length})
          </button>
          <button
            onClick={() => setStatusFilter(StudyStatus.Mastered)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: statusFilter === StudyStatus.Mastered ? 'var(--success-dark)' : '#ffffff',
              color: statusFilter === StudyStatus.Mastered ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${statusFilter === StudyStatus.Mastered ? 'var(--success-dark)' : 'var(--border)'}`,
            }}
          >
            Đã thuộc ({cards.filter(c => c.progress?.status === StudyStatus.Mastered).length})
          </button>
        </div>

        {/* Ô nhập tìm kiếm */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="Tìm theo thuật ngữ, định nghĩa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Danh sách các thẻ Flashcard */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Đang tải danh sách flashcard...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '48px 20px',
          textAlign: 'center',
          border: '1px solid var(--border)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
            {cards.length === 0 
              ? 'Bộ thẻ này chưa có flashcard nào. Bạn có thể thêm lẻ hoặc dán chuỗi văn bản để tạo hàng loạt!'
              : 'Không tìm thấy thẻ nào phù hợp với bộ lọc hiện tại.'}
          </p>
          {cards.length === 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={openBatchModal}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileText size={16} />
                <span>Nhập nhanh từ chuỗi</span>
              </button>
              <button
                onClick={openCreateModal}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Thêm thẻ lẻ
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredCards.map((card, index) => (
            <div
              key={card.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '20px 24px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                display: 'grid',
                gridTemplateColumns: '40px 1.5fr 2fr auto',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              {/* Số thứ tự thẻ */}
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>
                #{index + 1}
              </span>

              {/* Thuật ngữ (Mặt trước) */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px' }}>
                  Thuật ngữ
                </span>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {card.term}
                </h4>
              </div>

              {/* Định nghĩa & Ví dụ (Mặt sau) */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                  Định nghĩa & Ví dụ
                </span>
                <p style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '2px' }}>
                  {card.definition}
                </p>
                {card.example && (
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    marginTop: '4px',
                    backgroundColor: '#f8fafc',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    display: 'inline-block',
                  }}>
                    💡 Ví dụ: {card.example}
                  </p>
                )}
              </div>

              {/* Trạng thái học và Nút Sửa/Xóa thẻ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  {getStatusBadge(card.progress?.status)}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Đúng: {card.progress?.correctCount ?? 0} | Sai: {card.progress?.incorrectCount ?? 0}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    title="Chỉnh sửa thẻ"
                    onClick={() => openEditModal(card)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      color: 'var(--text-muted)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    title="Xóa thẻ"
                    onClick={() => handleDelete(card)}
                    style={{
                      padding: '8px',
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
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: TẠO THẺ HÀNG LOẠT TỪ CHUỖI VĂN BẢN (BULK STRING IMPORT)       */}
      {/* ===================================================================== */}
      {isBatchModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBatchModalOpen(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={22} color="var(--primary)" />
                  <span>Tạo Thẻ Hàng Loạt Từ Chuỗi Văn Bản</span>
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Dán chuỗi danh sách các thuật ngữ, định nghĩa và ví dụ để tạo nhanh hàng chục thẻ cùng lúc.
                </p>
              </div>

              {/* Nút dán mẫu thử nghiệm */}
              <button
                type="button"
                onClick={handleInsertSample}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                <Sparkles size={14} />
                <span>Dán dữ liệu mẫu</span>
              </button>
            </div>

            {/* Hướng dẫn cấu trúc & Menu chọn dấu phân cách */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                <strong>Cấu trúc mỗi dòng:</strong> <code>Thuật ngữ [dấu phân cách] Định nghĩa [dấu phân cách] Ví dụ</code>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Ký tự phân cách:</span>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value as any)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: '#fff',
                    outline: 'none',
                  }}
                >
                  <option value="AUTO">Tự động nhận diện</option>
                  <option value="-">Dấu gạch ngang ( - )</option>
                  <option value=":">Dấu hai chấm ( : )</option>
                  <option value="&#9;">Phím Tab (Excel / Sheets)</option>
                  <option value="|">Dấu gạch đứng ( | )</option>
                </select>
              </div>
            </div>

            {/* Báo lỗi nếu có */}
            {batchError && (
              <div style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger-dark)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {batchError}
              </div>
            )}

            <form onSubmit={handleBatchSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Ô textarea nhập chuỗi */}
              <div style={{ marginBottom: '14px', flex: '1 1 auto' }}>
                <textarea
                  rows={8}
                  placeholder={`Ví dụ:\nCat - Con mèo - A black cat\nDog - Con chó - A friendly dog\nSun - Mặt trời`}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  style={{
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    width: '100%',
                    height: '180px',
                  }}
                  autoFocus
                />
              </div>

              {/* Bảng xem trước kết quả bóc tách dữ liệu theo thời gian thực (Real-time Preview) */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                maxHeight: '160px',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Xem trước kết quả nhận diện ({parsedCards.length} thẻ):
                  </span>
                  {parsedCards.length > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--success-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> Hợp lệ
                    </span>
                  )}
                </div>

                {parsedCards.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Chưa có thẻ nào được nhận diện. Hãy nhập chuỗi văn bản theo định dạng vào ô trên.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {parsedCards.map((c, i) => (
                      <div 
                        key={i} 
                        style={{
                          fontSize: '12px',
                          display: 'grid',
                          gridTemplateColumns: '24px 140px 1fr 1fr',
                          gap: '8px',
                          padding: '4px 6px',
                          backgroundColor: i % 2 === 0 ? '#f8fafc' : '#ffffff',
                          borderRadius: '6px',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>#{i + 1}</span>
                        <strong style={{ color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.term}
                        </strong>
                        <span style={{ color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.definition}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.example || '(Không có ví dụ)'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nút Hủy và Nút Lưu hàng loạt */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
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
                  disabled={batchSubmitting || parsedCards.length === 0}
                  style={{
                    backgroundColor: parsedCards.length === 0 ? '#cbd5e1' : 'var(--primary)',
                    color: '#fff',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: parsedCards.length === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: parsedCards.length === 0 ? 'none' : '0 2px 8px var(--primary-glow)',
                  }}
                >
                  {batchSubmitting ? 'Đang tạo thẻ...' : `Tạo ${parsedCards.length} thẻ ngay`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: THÊM HOẶC CHỈNH SỬA THẺ LẺ                                   */}
      {/* ===================================================================== */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
              {editingCard ? 'Chỉnh Sửa Thẻ Flashcard' : 'Thêm Thẻ Flashcard Mới'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Nhập thuật ngữ, định nghĩa và ví dụ trực quan để ghi nhớ sâu hơn
            </p>

            {error && (
              <div style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger-dark)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Thuật ngữ */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Thuật ngữ / Từ vựng / Câu hỏi <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Asynchronous Programming"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Định nghĩa */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Định nghĩa / Giải thích / Đáp án <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Kỹ thuật lập trình cho phép các tác vụ thực thi độc lập mà không chặn luồng chính (Main Thread)..."
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                />
              </div>

              {/* Ví dụ */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Ví dụ minh họa (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Sử dụng từ khóa async/await trong C# hoặc JavaScript để gọi API không bị giật lag giao diện..."
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                />
              </div>

              {/* Nút bấm */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  disabled={submitting}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {submitting ? 'Đang lưu...' : editingCard ? 'Cập nhật' : 'Thêm thẻ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
