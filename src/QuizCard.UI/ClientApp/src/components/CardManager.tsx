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
  Plus, Search, Edit2, Trash2, Play, CheckCircle2, 
  Clock, AlertCircle, FileText, Sparkles, Check, HelpCircle
} from 'lucide-react';

import "./CardManager.css"

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
    <div className="cm-page">

      {/* Khung thông tin tổng quan của Bộ thẻ */}
      <div className="cm-deck-info">
        <div>
          <div className="cm-deck-meta">
            <span className="cm-deck-label">Bộ thẻ</span>
            <span className="cm-deck-count">{cards.length} thẻ tổng cộng</span>
          </div>
          <h1 className="cm-deck-title">{deck.title}</h1>
          <p className="cm-deck-description">
            {deck.description || 'Chưa có mô tả cho bộ thẻ này.'}
          </p>
        </div>

        {/* Thanh công cụ hành động: Tạo từ chuỗi, Thêm lẻ, Học thẻ, Thi trắc nghiệm */}
        <div className="cm-action-bar">
          {/* Nút Tạo thẻ từ chuỗi văn bản */}
          <button
            onClick={openBatchModal}
            title="Tạo nhanh nhiều thẻ bằng cách dán chuỗi văn bản"
            className="cm-btn-batch"
          >
            <FileText size={18} />
            <span>Tạo Từ Chuỗi Văn Bản</span>
          </button>

          {/* Nút Thêm thẻ lẻ */}
          <button onClick={openCreateModal} className="cm-btn-add">
            <Plus size={18} />
            <span>Thêm Thẻ Lẻ</span>
          </button>

          {/* Nút Bắt Đầu Học Thẻ (Lật thẻ) */}
          <button
            onClick={onStartStudy}
            disabled={cards.length === 0}
            className="cm-btn-study"
          >
            <Play size={18} fill="#ffffff" />
            <span>Bắt Đầu Học Thẻ</span>
          </button>

          {/* Nút Luyện Trắc Nghiệm */}
          <button
            onClick={onStartQuiz}
            disabled={cards.length < 2}
            title={cards.length < 2 ? 'Cần tối thiểu 2 thẻ để thi trắc nghiệm' : 'Luyện thi trắc nghiệm A, B, C, D'}
            className="cm-btn-quiz"
          >
            <HelpCircle size={18} />
            <span>Luyện Trắc Nghiệm</span>
          </button>
        </div>
      </div>

      {/* Thanh Lọc theo trạng thái và Tìm kiếm từ khóa */}
      <div className="cm-filter-bar">
        {/* Bộ lọc trạng thái: Tất cả, Chưa học, Đang học, Đã thuộc */}
        <div className="cm-filter-group">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`cm-filter-btn ${statusFilter === 'ALL' ? 'active-all' : ''}`}
          >
            Tất cả ({cards.length})
          </button>
          <button
            onClick={() => setStatusFilter(StudyStatus.NotStarted)}
            className={`cm-filter-btn ${statusFilter === StudyStatus.NotStarted ? 'active-notstarted' : ''}`}
          >
            Chưa học ({cards.filter(c => (c.progress?.status ?? StudyStatus.NotStarted) === StudyStatus.NotStarted).length})
          </button>
          <button
            onClick={() => setStatusFilter(StudyStatus.Learning)}
            className={`cm-filter-btn ${statusFilter === StudyStatus.Learning ? 'active-learning' : ''}`}
          >
            Đang học ({cards.filter(c => c.progress?.status === StudyStatus.Learning).length})
          </button>
          <button
            onClick={() => setStatusFilter(StudyStatus.Mastered)}
            className={`cm-filter-btn ${statusFilter === StudyStatus.Mastered ? 'active-mastered' : ''}`}
          >
            Đã thuộc ({cards.filter(c => c.progress?.status === StudyStatus.Mastered).length})
          </button>
        </div>

        {/* Ô nhập tìm kiếm */}
        <div className="cm-search-wrapper">
          <Search size={16} color="var(--text-muted)" className="cm-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo thuật ngữ, định nghĩa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cm-search-input"
          />
        </div>
      </div>

      {/* Danh sách các thẻ Flashcard */}
      {loading ? (
        <div className="cm-loading">
          <p>Đang tải danh sách flashcard...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="cm-empty">
          <p className="cm-empty-text">
            {cards.length === 0
              ? 'Bộ thẻ này chưa có flashcard nào. Bạn có thể thêm lẻ hoặc dán chuỗi văn bản để tạo hàng loạt!'
              : 'Không tìm thấy thẻ nào phù hợp với bộ lọc hiện tại.'}
          </p>
          {cards.length === 0 && (
            <div className="cm-empty-actions">
              <button onClick={openBatchModal} className="cm-btn-empty-batch">
                <FileText size={16} />
                <span>Nhập nhanh từ chuỗi</span>
              </button>
              <button onClick={openCreateModal} className="cm-btn-empty-add">
                Thêm thẻ lẻ
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="cm-card-list">
          {filteredCards.map((card, index) => (
            <div key={card.id} className="cm-card-item">
              {/* Số thứ tự thẻ */}
              <span className="cm-card-index">#{index + 1}</span>

              {/* Thuật ngữ (Mặt trước) */}
              <div>
                <span className="cm-card-field-label primary">Thuật ngữ</span>
                <h4 className="cm-card-term">{card.term}</h4>
              </div>

              {/* Định nghĩa & Ví dụ (Mặt sau) */}
              <div>
                <span className="cm-card-field-label muted">Định nghĩa &amp; Ví dụ</span>
                <p className="cm-card-definition">{card.definition}</p>
                {card.example && (
                  <p className="cm-card-example">💡 Ví dụ: {card.example}</p>
                )}
              </div>

              {/* Trạng thái học và Nút Sửa/Xóa thẻ */}
              <div className="cm-card-actions">
                <div className="cm-card-status">
                  {getStatusBadge(card.progress?.status)}
                  <div className="cm-card-score">
                    Đúng: {card.progress?.correctCount ?? 0} | Sai: {card.progress?.incorrectCount ?? 0}
                  </div>
                </div>

                <div className="cm-card-btns">
                  <button
                    title="Chỉnh sửa thẻ"
                    onClick={() => openEditModal(card)}
                    className="cm-btn-edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    title="Xóa thẻ"
                    onClick={() => handleDelete(card)}
                    className="cm-btn-delete"
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
            className="modal-content cm-modal-batch"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="cm-modal-header">
              <div>
                <h2 className="cm-modal-title">
                  <FileText size={22} color="var(--primary)" />
                  <span>Tạo Thẻ Hàng Loạt Từ Chuỗi Văn Bản</span>
                </h2>
                <p className="cm-modal-subtitle">
                  Dán chuỗi danh sách các thuật ngữ, định nghĩa và ví dụ để tạo nhanh hàng chục thẻ cùng lúc.
                </p>
              </div>

              {/* Nút dán mẫu thử nghiệm */}
              <button type="button" onClick={handleInsertSample} className="cm-btn-sample">
                <Sparkles size={14} />
                <span>Dán dữ liệu mẫu</span>
              </button>
            </div>

            {/* Hướng dẫn cấu trúc & Menu chọn dấu phân cách */}
            <div className="cm-guide-bar">
              <div className="cm-guide-text">
                <strong>Cấu trúc mỗi dòng:</strong> <code>Thuật ngữ [dấu phân cách] Định nghĩa [dấu phân cách] Ví dụ</code>
              </div>

              <div className="cm-delimiter-row">
                <span className="cm-delimiter-label">Ký tự phân cách:</span>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value as any)}
                  className="cm-delimiter-select"
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
            {batchError && <div className="cm-error-box">{batchError}</div>}

            <form onSubmit={handleBatchSubmit} className="cm-batch-form">
              {/* Ô textarea nhập chuỗi */}
              <div className="cm-batch-textarea-wrapper">
                <textarea
                  rows={8}
                  placeholder={`Ví dụ:\nCat - Con mèo - A black cat\nDog - Con chó - A friendly dog\nSun - Mặt trời`}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  className="cm-batch-textarea"
                  autoFocus
                />
              </div>

              {/* Bảng xem trước kết quả bóc tách dữ liệu theo thời gian thực (Real-time Preview) */}
              <div className="cm-preview-box">
                <div className="cm-preview-header">
                  <span className="cm-preview-title">
                    Xem trước kết quả nhận diện ({parsedCards.length} thẻ):
                  </span>
                  {parsedCards.length > 0 && (
                    <span className="cm-preview-valid">
                      <Check size={12} /> Hợp lệ
                    </span>
                  )}
                </div>

                {parsedCards.length === 0 ? (
                  <p className="cm-preview-empty">
                    Chưa có thẻ nào được nhận diện. Hãy nhập chuỗi văn bản theo định dạng vào ô trên.
                  </p>
                ) : (
                  <div className="cm-preview-list">
                    {parsedCards.map((c, i) => (
                      <div key={i} className={`cm-preview-row ${i % 2 === 0 ? 'even' : 'odd'}`}>
                        <span className="cm-preview-num">#{i + 1}</span>
                        <strong className="cm-preview-term">{c.term}</strong>
                        <span className="cm-preview-def">{c.definition}</span>
                        <span className="cm-preview-ex">{c.example || '(Không có ví dụ)'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nút Hủy và Nút Lưu hàng loạt */}
              <div className="cm-modal-footer">
                <button type="button" onClick={() => setIsBatchModalOpen(false)} className="cm-btn-cancel">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={batchSubmitting || parsedCards.length === 0}
                  className="cm-btn-submit"
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
            <h2 className="cm-single-title">
              {editingCard ? 'Chỉnh Sửa Thẻ Flashcard' : 'Thêm Thẻ Flashcard Mới'}
            </h2>
            <p className="cm-single-subtitle">
              Nhập thuật ngữ, định nghĩa và ví dụ trực quan để ghi nhớ sâu hơn
            </p>

            {error && <div className="cm-error-box">{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Thuật ngữ */}
              <div className="cm-form-field">
                <label className="cm-form-label">
                  Thuật ngữ / Từ vựng / Câu hỏi <span className="cm-required">*</span>
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
              <div className="cm-form-field">
                <label className="cm-form-label">
                  Định nghĩa / Giải thích / Đáp án <span className="cm-required">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Kỹ thuật lập trình cho phép các tác vụ thực thi độc lập mà không chặn luồng chính (Main Thread)..."
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                />
              </div>

              {/* Ví dụ */}
              <div className="cm-form-field-last">
                <label className="cm-form-label">Ví dụ minh họa (tùy chọn)</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Sử dụng từ khóa async/await trong C# hoặc JavaScript để gọi API không bị giật lag giao diện..."
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                />
              </div>

              {/* Nút bấm */}
              <div className="cm-modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="cm-btn-cancel">
                  Hủy
                </button>
                <button type="submit" disabled={submitting} className="cm-btn-submit-single">
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