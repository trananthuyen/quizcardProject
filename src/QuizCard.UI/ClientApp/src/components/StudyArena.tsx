/**
 * Component StudyArena: Phòng học Flashcard tương tác 3D (Study Mode).
 * Cung cấp trải nghiệm học tập theo thuật ngữ và phương pháp Lặp lại ngắt quãng (Spaced Repetition):
 * 1. Hiệu ứng xoay lật thẻ 3D 180° (Mặt trước: Thuật ngữ, Mặt sau: Định nghĩa + Ví dụ).
 * 2. Tích hợp tính năng phát âm Text-to-Speech bằng Web Speech API.
 * 3. Đèn LED chỉ báo chuỗi đúng 3 chấm tròn (0/3, 1/3, 2/3, 3/3).
 * 4. Cơ chế thông minh: Khi trả lời sai -> Thẻ được tự động đẩy về cuối hàng đợi (Queue)
 *    để người dùng ôn lại ngay trong phiên học cho đến khi nhớ.
 * 5. Hỗ trợ đầy đủ phím tắt bàn phím:
 *    - [Space]: Lật thẻ
 *    - [1] hoặc [←]: Chưa nhớ / Sai
 *    - [2] hoặc [→]: Nhớ đúng / Thuộc
 * 6. Màn hình kết thúc bắn pháo hoa ăn mừng (Confetti) và thống kê tỷ lệ chính xác.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StudyStatus, type Deck, type StudyCard, type AnswerResponse } from '../types';
import { api } from '../api';
import confetti from 'canvas-confetti';
import {
  ArrowLeft, RotateCw, Check, X, Volume2, Trophy,
  RotateCcw, Sparkles, CheckCircle2, Clock, AlertCircle, HelpCircle,
  ExternalLink
} from 'lucide-react';
import { playTts, stopTts } from '../utils/tts';
import './StudyArena.css';

interface StudyArenaProps {
  deck: Deck;                   // Thông tin bộ thẻ đang học
  onExit: () => void;           // Callback thoát phiên học về trang chủ
  onGoToCards: () => void;      // Callback chuyển sang màn hình danh sách thẻ
  onGoToQuiz?: () => void;      // Callback chuyển nhanh sang chế độ thi trắc nghiệm
}

export const StudyArena: React.FC<StudyArenaProps> = ({ deck, onExit, onGoToCards, onGoToQuiz }) => {
  // Hàng đợi các thẻ cần học trong phiên này (sẽ giảm dần khi trả lời đúng, hoặc nhận thêm thẻ bị sai vào cuối)
  const [queue, setQueue] = useState<StudyCard[]>([]);

  // Tổng số thẻ ban đầu khi bắt đầu phiên (dùng để tính tỷ lệ thanh tiến trình)
  const [initialCount, setInitialCount] = useState(0);

  // Trạng thái đang tải thẻ từ Backend
  const [loading, setLoading] = useState(true);

  // Trạng thái lật thẻ: false = mặt trước (Thuật ngữ), true = mặt sau (Định nghĩa)
  const [isFlipped, setIsFlipped] = useState(false);

  // Trạng thái chặn bấm liên tục khi đang gửi kết quả lên server
  const [isAnswering, setIsAnswering] = useState(false);

  // Dữ liệu phản hồi nhận được từ Backend sau khi trả lời
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null);

  // ==========================================================================
  // THỐNG KÊ PHIÊN HỌC (SESSION STATISTICS)
  // ==========================================================================
  const [sessionCompleted, setSessionCompleted] = useState(false); // Đã học xong toàn bộ thẻ
  const [correctInSession, setCorrectInSession] = useState(0);     // Số lượt trả lời đúng
  const [incorrectInSession, setIncorrectInSession] = useState(0); // Số lượt trả lời sai
  const [masteredInSession, setMasteredInSession] = useState(0);   // Số thẻ thăng cấp lên Đã thuộc

  /**
   * Tải danh sách thẻ cần học từ Backend và khởi tạo phiên học
   */
  const loadCards = useCallback(async () => {
    try {
      setLoading(true);
      const cards = await api.getStudySessionCards(deck.id);
      setQueue(cards);
      setInitialCount(cards.length);
      setSessionCompleted(false);
      setCorrectInSession(0);
      setIncorrectInSession(0);
      setMasteredInSession(0);
      setIsFlipped(false);
      setFeedback(null);
    } catch (err: any) {
      alert(err.message || 'Không thể tải thẻ cho phiên học');
    } finally {
      setLoading(false);
    }
  }, [deck.id]);

  useEffect(() => {
    loadCards();
    return () => {
      stopTts();
    };
  }, [loadCards]);

  // Thẻ hiện tại đang hiển thị trên màn hình (luôn là phần tử đầu tiên của hàng đợi queue)
  const currentCard = queue[0];

  /**
   * Kiểm tra xem bộ thẻ hiện tại có phải là bộ thẻ học tiếng Anh hay không
   * (Dựa vào phân loại Category hoặc tiêu đề Title có chứa 'tiếng anh', 'english', 'ielts', 'toeic'...).
   */
  const isEnglishDeck = useMemo(() => {
    const cat = (deck.category || '').toLowerCase().trim();
    const title = (deck.title || '').toLowerCase().trim();
    const englishKeywords = ['tiếng anh', 'tieng anh', 'english', 'ielts', 'toeic', 'toefl'];
    return englishKeywords.some((kw) => cat.includes(kw) || title.includes(kw));
  }, [deck.category, deck.title]);

  /**
   * Đảo trạng thái lật mặt thẻ (Trước <-> Sau)
   */
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  /**
   * Tiện ích phát âm từ vựng / định nghĩa bằng API bên thứ 3 (Google Neural TTS)
   * Giọng đọc chuẩn bản xứ, tự nhiên, khắc phục giọng máy móc của Windows.
   */
  const handleSpeak = (text: string, e: React.MouseEvent, lang: 'en' | 'vi' | 'auto' = 'auto') => {
    e.stopPropagation(); // Không kích hoạt lật thẻ khi bấm vào nút loa phát âm
    playTts(text, lang);
  };

  /**
   * Mở tab mới tra cứu từ vựng trên Từ điển Cambridge (English-Vietnamese Dictionary)
   * URL format: https://dictionary.cambridge.org/vi/dictionary/english/{từ vựng}
   */
  const handleOpenCambridge = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn sự kiện nổi bọt kích hoạt lật thẻ 3D
    if (!currentCard || !currentCard.term) return;

    // Lấy từ vựng chính, lược bỏ phần chú thích trong ngoặc đơn nếu có (ví dụ "Deadline (hạn chót)" -> "Deadline")
    let word = currentCard.term.trim();
    const bracketIndex = word.indexOf('(');
    if (bracketIndex > 0) {
      word = word.substring(0, bracketIndex).trim();
    }

    // Chuẩn hóa từ vựng thành chữ thường và thay khoảng trắng bằng dấu gạch ngang theo format Cambridge URL
    const cleanWord = encodeURIComponent(word.toLowerCase().replace(/\s+/g, '-'));
    const cambridgeUrl = `https://dictionary.cambridge.org/vi/dictionary/english/${cleanWord}`;

    window.open(cambridgeUrl, '_blank', 'noopener,noreferrer');
  };

  /**
   * Xử lý khi người dùng bấm "Chưa Nhớ / Sai" hoặc "Nhớ Đúng / Thuộc":
   * 1. Gửi kết quả lên server cập nhật Spaced Repetition (api.answerCard).
   * 2. Nếu trả lời Đúng: Tăng điểm số, nếu chuỗi đạt 3/3 -> Thăng cấp Mastered.
   * 3. Nếu trả lời Sai: Tự động ĐẨY THẺ VỀ CUỐI HÀNG ĐỢI (queue) để học lại.
   * 4. Khi hàng đợi rỗng -> Kết thúc phiên học và bắn pháo hoa ăn mừng!
   */
  const handleAnswer = async (isCorrect: boolean) => {
    if (!currentCard || isAnswering) return;

    try {
      setIsAnswering(true);
      const res = await api.answerCard(currentCard.cardId, isCorrect);
      setFeedback(res);

      if (isCorrect) {
        setCorrectInSession((prev) => prev + 1);
        if (res.isMastered) {
          setMasteredInSession((prev) => prev + 1);
        }
      } else {
        setIncorrectInSession((prev) => prev + 1);
      }

      // Tạo độ trễ ngắn 350ms để người dùng kịp nhìn thấy phản hồi trước khi sang thẻ tiếp theo
      setTimeout(() => {
        setIsFlipped(false);
        setFeedback(null);

        setQueue((prevQueue) => {
          const [answered, ...rest] = prevQueue;
          if (res.requiresRepeatInSession) {
            // TRẢ LỜI SAI: Đẩy thẻ về cuối phiên học để người dùng rèn luyện lại
            const repeatedCard: StudyCard = {
              ...answered,
              status: res.status,
              correctCount: res.correctCount,
              incorrectCount: res.incorrectCount,
              consecutiveCorrect: res.consecutiveCorrect,
              nextReviewAt: res.nextReviewAt,
            };
            return [...rest, repeatedCard];
          } else {
            // TRẢ LỜI ĐÚNG: Thẻ được tính là hoàn thành trong phiên này
            if (rest.length === 0) {
              setSessionCompleted(true);
              // Bắn pháo hoa ăn mừng hoàn thành phiên học!
              confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 },
              });
            }
            return rest;
          }
        });

        setIsAnswering(false);
      }, 350);
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi lưu kết quả');
      setIsAnswering(false);
    }
  };

  /**
   * Lắng nghe sự kiện bàn phím (Keyboard Shortcuts):
   * - Space: Lật thẻ
   * - Phím 1 hoặc Mũi tên trái: Chưa nhớ
   * - Phím 2 hoặc Mũi tên phải: Nhớ đúng
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted || loading || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        // Chỉ nhận phím trả lời sau khi thẻ đã được lật xem đáp án
        if (e.key === '1' || e.key === 'ArrowLeft') {
          e.preventDefault();
          handleAnswer(false);
        } else if (e.key === '2' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleAnswer(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, sessionCompleted, loading, currentCard, isAnswering]);

  // Giao diện khi đang tải dữ liệu
  if (loading) {
    return (
      <div className="sa-loading-container">
        <p className="sa-loading-text">Đang chuẩn bị bộ thẻ học tập...</p>
      </div>
    );
  }

  // Giao diện khi bộ thẻ chưa có thẻ nào
  if (queue.length === 0 && !sessionCompleted) {
    return (
      <div className="sa-empty-card">
        <h2 className="sa-empty-title">Không có thẻ nào trong bộ này</h2>
        <p className="sa-empty-text">Hãy thêm các thẻ flashcard trước khi bắt đầu học.</p>
        <button onClick={onGoToCards} className="sa-empty-btn">
          Đến màn hình quản lý thẻ
        </button>
      </div>
    );
  }

  // ==========================================================================
  // GIAO DIỆN HOÀN THÀNH PHIÊN HỌC (SESSION COMPLETED SCREEN)
  // ==========================================================================
  if (sessionCompleted) {
    const totalAnswers = correctInSession + incorrectInSession;
    const accuracy = totalAnswers > 0 ? Math.round((correctInSession / totalAnswers) * 100) : 100;

    return (
      <div className="sa-completed-wrapper">
        <div className="sa-completed-card">
          {/* Cúp vàng chúc mừng */}
          <div className="sa-trophy-circle">
            <Trophy size={42} />
          </div>

          <h2 className="sa-completed-title">
            Chúc Mừng Bạn Đã Hoàn Thành!
          </h2>
          <p className="sa-completed-subtitle">
            Bạn đã hoàn tất phiên ôn tập cho bộ thẻ <strong>"{deck.title}"</strong>.
          </p>

          {/* Lưới thống kê kết quả phiên học */}
          <div className="sa-stats-grid">
            <div className="sa-stat-box">
              <div className="sa-stat-num primary">{initialCount}</div>
              <div className="sa-stat-label">Thẻ đã ôn</div>
            </div>

            <div className="sa-stat-box">
              <div className="sa-stat-num success">{masteredInSession}</div>
              <div className="sa-stat-label">Đã thuộc mới</div>
            </div>

            <div className="sa-stat-box">
              <div className="sa-stat-num warning">{accuracy}%</div>
              <div className="sa-stat-label">Độ chính xác</div>
            </div>
          </div>

          {/* Các nút hành động: Ôn lại, Thi trắc nghiệm, Về danh sách */}
          <div className="sa-completed-actions">
            <button onClick={loadCards} className="sa-btn-restart">
              <RotateCcw size={16} />
              <span>Ôn Lại Bộ Này</span>
            </button>

            {onGoToQuiz && (
              <button onClick={onGoToQuiz} className="sa-btn-quiz-comp">
                <HelpCircle size={16} />
                <span>Luyện Trắc Nghiệm</span>
              </button>
            )}

            <button onClick={onExit} className="sa-btn-exit-comp">
              <ArrowLeft size={16} />
              <span>Về Danh Sách Bộ Thẻ</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // GIAO DIỆN HỌC THẺ CHÍNH (ACTIVE STUDY SCREEN)
  // ==========================================================================
  const progressPercent = Math.min(100, Math.max(5, ((initialCount - queue.length) / (initialCount || 1)) * 100));

  return (
    <div className="sa-container">
      {/* Thanh tiêu đề trên cùng: Nút Thoát, Tên bộ thẻ, Nút chuyển Trắc nghiệm, Số thẻ còn lại */}
      <div className="sa-header-bar">
        <button onClick={onExit} className="sa-btn-exit">
          <ArrowLeft size={16} />
          <span>Thoát phiên học</span>
        </button>

        <div className="sa-header-title">
          <span>{deck.title}</span>
        </div>

        <div className="sa-header-right">
          {onGoToQuiz && (
            <button
              onClick={onGoToQuiz}
              className="sa-btn-switch-quiz"
              title="Chuyển sang chế độ trắc nghiệm"
            >
              <HelpCircle size={14} />
              <span>Trắc nghiệm</span>
            </button>
          )}

          <div className="sa-remaining-badge">
            Còn lại: {queue.length} thẻ
          </div>
        </div>
      </div>

      {/* Thanh tiến độ học tập (Progress Bar) */}
      <div className="sa-progress-track">
        <div className="sa-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Thông tin trạng thái thẻ và Đèn LED báo chuỗi đúng 3/3 */}
      <div className="sa-status-led-row">
        <div className="sa-status-badges">
          {currentCard.status === StudyStatus.Mastered && (
            <span className="badge badge-mastered"><CheckCircle2 size={12} /> Đã thuộc</span>
          )}
          {currentCard.status === StudyStatus.Learning && (
            <span className="badge badge-learning"><Clock size={12} /> Đang học</span>
          )}
          {currentCard.status === StudyStatus.NotStarted && (
            <span className="badge badge-notstarted"><AlertCircle size={12} /> Thẻ mới</span>
          )}
        </div>

        {/* 3 chấm tròn chỉ báo mức độ thuộc (ConsecutiveCorrect / 3) */}
        <div className="sa-led-group">
          <span className="sa-led-label">
            Độ thuộc ({currentCard.consecutiveCorrect}/3):
          </span>
          <div className="sa-led-dots">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`sa-led-dot ${step <= currentCard.consecutiveCorrect ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Thông báo phản hồi kết quả trả lời */}
      {feedback && (
        <div className={`sa-feedback-box ${feedback.isMastered ? 'mastered' : feedback.requiresRepeatInSession ? 'repeat' : 'normal'}`}>
          {feedback.feedbackMessage}
        </div>
      )}

      {/* THẺ FLASHCARD 3D (FLIP CARD SCENE) */}
      <div className="flip-card-scene" onClick={handleFlip}>
        <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
          {/* MẶT TRƯỚC: Thuật ngữ / Từ vựng / Câu hỏi */}
          <div className="flip-card-front">
            <div className="sa-front-top">
              <div className="sa-front-top-left">
                <span className="sa-term-label">
                  THUẬT NGỮ
                </span>

                {/* Nút Tra cứu từ điển Cambridge - Chỉ hiển thị khi bộ thẻ là thẻ học tiếng Anh */}
                {isEnglishDeck && (
                  <button
                    type="button"
                    onClick={handleOpenCambridge}
                    className="sa-btn-cambridge"
                    title={`Tra cứu "${currentCard.term}" trên Từ điển Cambridge (Anh - Việt)`}
                  >
                    <ExternalLink size={12} />
                    <span>Tra từ điển Cambridge</span>
                  </button>
                )}
              </div>

              <button
                onClick={(e) => handleSpeak(currentCard.term, e, 'en')}
                className="sa-btn-speak"
                title="Phát âm chuẩn AI (Google TTS)"
              >
                <Volume2 size={20} />
              </button>
            </div>

            <div className="sa-term-center">
              <h2 className="sa-term-text">
                {currentCard.term}
              </h2>
            </div>

            <div className="sa-flip-hint">
              <RotateCw size={14} />
              <span>Bấm vào thẻ hoặc nhấn <strong>Space</strong> để lật xem đáp án</span>
            </div>
          </div>

          {/* MẶT SAU: Định nghĩa & Ví dụ minh họa */}
          <div className="flip-card-back">
            <div className="sa-back-top">
              <span className="sa-def-label">
                ĐỊNH NGHĨA &amp; VÍ DỤ
              </span>
              <button
                onClick={(e) => handleSpeak(currentCard.definition, e, 'auto')}
                className="sa-btn-speak"
                title="Phát âm định nghĩa (Google TTS)"
              >
                <Volume2 size={20} />
              </button>
            </div>

            <div className="sa-def-center">
              <p className="sa-def-text">
                {currentCard.definition}
              </p>

              {currentCard.example && (
                <div className="sa-example-box">
                  💡 Ví dụ: {currentCard.example}
                </div>
              )}
            </div>

            <div className="sa-rate-hint">
              <Sparkles size={14} color="var(--warning-dark)" />
              <span>Hãy tự đánh giá mức độ ghi nhớ của bạn bên dưới</span>
            </div>
          </div>
        </div>
      </div>

      {/* CÁC NÚT ĐÁNH GIÁ KẾT QUẢ HỌC (Active khi thẻ đã lật) */}
      <div className="sa-actions-grid">
        {/* Nút 1: Chưa Nhớ / Sai */}
        <button
          onClick={() => handleAnswer(false)}
          disabled={!isFlipped || isAnswering}
          className="sa-btn-wrong"
        >
          <div className="sa-btn-row-title">
            <X size={20} strokeWidth={3} />
            <span>Chưa Nhớ / Sai</span>
          </div>
          <span className="sa-btn-subtext">
            (Phím 1 hoặc ← | Lặp lại ở cuối)
          </span>
        </button>

        {/* Nút 2: Nhớ Đúng / Thuộc */}
        <button
          onClick={() => handleAnswer(true)}
          disabled={!isFlipped || isAnswering}
          className="sa-btn-correct"
        >
          <div className="sa-btn-row-title">
            <Check size={20} strokeWidth={3} />
            <span>Nhớ Đúng / Thuộc</span>
          </div>
          <span className="sa-btn-subtext">
            (Phím 2 hoặc → | Tích lũy chuỗi đúng)
          </span>
        </button>
      </div>

      {/* Hướng dẫn phím tắt */}
      <div className="sa-shortcuts-hint">
        💡 Phím tắt nhanh: <strong>[Space]</strong> lật thẻ • <strong>[1]</strong> Chưa nhớ • <strong>[2]</strong> Đã nhớ đúng
      </div>
    </div>
  );
};
