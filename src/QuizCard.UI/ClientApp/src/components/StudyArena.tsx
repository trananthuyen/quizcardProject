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

import React, { useState, useEffect, useCallback } from 'react';
import { StudyStatus, type Deck, type StudyCard, type AnswerResponse } from '../types';
import { api } from '../api';
import confetti from 'canvas-confetti';
import {
  ArrowLeft, RotateCw, Check, X, Volume2, Trophy,
  RotateCcw, Sparkles, CheckCircle2, Clock, AlertCircle, HelpCircle,
  ExternalLink
} from 'lucide-react';
import { playTts, stopTts } from '../utils/tts';

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
      <div style={{ maxWidth: '800px', margin: '80px auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '16px' }}>Đang chuẩn bị bộ thẻ học tập...</p>
      </div>
    );
  }

  // Giao diện khi bộ thẻ chưa có thẻ nào
  if (queue.length === 0 && !sessionCompleted) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Không có thẻ nào trong bộ này</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Hãy thêm các thẻ flashcard trước khi bắt đầu học.</p>
        <button
          onClick={onGoToCards}
          style={{
            backgroundColor: 'var(--primary)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 700,
          }}
        >
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
      <div style={{ maxWidth: '640px', margin: '40px auto', padding: '20px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06)',
        }}>
          {/* Cúp vàng chúc mừng */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Trophy size={42} />
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            Chúc Mừng Bạn Đã Hoàn Thành!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '32px' }}>
            Bạn đã hoàn tất phiên ôn tập cho bộ thẻ <strong>"{deck.title}"</strong>.
          </p>

          {/* Lưới thống kê kết quả phiên học */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{initialCount}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>Thẻ đã ôn</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>{masteredInSession}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>Đã thuộc mới</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--warning-dark)' }}>{accuracy}%</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>Độ chính xác</div>
            </div>
          </div>

          {/* Các nút hành động: Ôn lại, Thi trắc nghiệm, Về danh sách */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={loadCards}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                boxShadow: '0 4px 14px var(--primary-glow)',
              }}
            >
              <RotateCcw size={16} />
              <span>Ôn Lại Bộ Này</span>
            </button>

            {onGoToQuiz && (
              <button
                onClick={onGoToQuiz}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#e0f2fe',
                  border: '1px solid #bae6fd',
                  color: '#0284c7',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                <HelpCircle size={16} />
                <span>Luyện Trắc Nghiệm</span>
              </button>
            )}

            <button
              onClick={onExit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
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
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Thanh tiêu đề trên cùng: Nút Thoát, Tên bộ thẻ, Nút chuyển Trắc nghiệm, Số thẻ còn lại */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={onExit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '14px',
            fontWeight: 600,
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
          }}
        >
          <ArrowLeft size={16} />
          <span>Thoát phiên học</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
            {deck.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onGoToQuiz && (
            <button
              onClick={onGoToQuiz}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#0284c7',
                fontSize: '12px',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#e0f2fe',
                border: '1px solid #bae6fd',
              }}
              title="Chuyển sang chế độ trắc nghiệm"
            >
              <HelpCircle size={14} />
              <span>Trắc nghiệm</span>
            </button>
          )}

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-main)',
          }}>
            Còn lại: {queue.length} thẻ
          </div>
        </div>
      </div>

      {/* Thanh tiến độ học tập (Progress Bar) */}
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: '#e2e8f0',
        borderRadius: '9999px',
        marginBottom: '28px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(100, Math.max(5, ((initialCount - queue.length) / (initialCount || 1)) * 100))}%`,
          height: '100%',
          backgroundColor: 'var(--primary)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Thông tin trạng thái thẻ và Đèn LED báo chuỗi đúng 3/3 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '680px',
        margin: '0 auto 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Độ thuộc ({currentCard.consecutiveCorrect}/3):
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: step <= currentCard.consecutiveCorrect ? 'var(--success)' : '#e2e8f0',
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Thông báo phản hồi kết quả trả lời */}
      {feedback && (
        <div style={{
          maxWidth: '680px',
          margin: '0 auto 12px',
          padding: '10px 16px',
          borderRadius: '10px',
          backgroundColor: feedback.isMastered ? 'var(--success-light)' : feedback.requiresRepeatInSession ? 'var(--danger-light)' : 'var(--primary-light)',
          color: feedback.isMastered ? 'var(--success-dark)' : feedback.requiresRepeatInSession ? 'var(--danger-dark)' : 'var(--primary)',
          fontSize: '13px',
          fontWeight: 600,
          textAlign: 'center',
          animation: 'fadeIn 0.2s',
        }}>
          {feedback.feedbackMessage}
        </div>
      )}

      {/* THẺ FLASHCARD 3D (FLIP CARD SCENE) */}
      <div className="flip-card-scene" onClick={handleFlip}>
        <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
          {/* MẶT TRƯỚC: Thuật ngữ / Từ vựng / Câu hỏi */}
          <div className="flip-card-front">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px' }}>
                  THUẬT NGỮ
                </span>

                {/* Nút Tra cứu từ điển Cambridge */}
                <button
                  type="button"
                  onClick={handleOpenCambridge}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#0369a1',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e0f2fe';
                    e.currentTarget.style.color = '#0284c7';
                    e.currentTarget.style.borderColor = '#7dd3fc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                    e.currentTarget.style.color = '#0369a1';
                    e.currentTarget.style.borderColor = '#bae6fd';
                  }}
                  title={`Tra cứu "${currentCard.term}" trên Từ điển Cambridge (Anh - Việt)`}
                >
                  <ExternalLink size={12} />
                  <span>Tra từ điển Cambridge</span>
                </button>
              </div>

              <button
                onClick={(e) => handleSpeak(currentCard.term, e, 'en')}
                style={{ color: 'var(--text-muted)', padding: '6px' }}
                title="Phát âm chuẩn AI (Google TTS)"
              >
                <Volume2 size={20} />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 800,
                color: 'var(--text-main)',
                textAlign: 'center',
                lineHeight: 1.4,
              }}>
                {currentCard.term}
              </h2>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 500,
            }}>
              <RotateCw size={14} />
              <span>Bấm vào thẻ hoặc nhấn <strong>Space</strong> để lật xem đáp án</span>
            </div>
          </div>

          {/* MẶT SAU: Định nghĩa & Ví dụ minh họa */}
          <div className="flip-card-back">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success-dark)', letterSpacing: '1px' }}>
                ĐỊNH NGHĨA & VÍ DỤ
              </span>
              <button
                onClick={(e) => handleSpeak(currentCard.definition, e, 'auto')}
                style={{ color: 'var(--text-muted)', padding: '6px' }}
                title="Phát âm định nghĩa (Google TTS)"
              >
                <Volume2 size={20} />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
              <p style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-main)',
                textAlign: 'center',
                lineHeight: 1.6,
                marginBottom: currentCard.example ? '16px' : '0',
              }}>
                {currentCard.definition}
              </p>

              {currentCard.example && (
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px dashed var(--border)',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  maxWidth: '90%',
                  textAlign: 'center',
                }}>
                  💡 Ví dụ: {currentCard.example}
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 500,
            }}>
              <Sparkles size={14} color="var(--warning-dark)" />
              <span>Hãy tự đánh giá mức độ ghi nhớ của bạn bên dưới</span>
            </div>
          </div>
        </div>
      </div>

      {/* CÁC NÚT ĐÁNH GIÁ KẾT QUẢ HỌC (Active khi thẻ đã lật) */}
      <div style={{
        maxWidth: '680px',
        margin: '24px auto 0',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
      }}>
        {/* Nút 1: Chưa Nhớ / Sai */}
        <button
          onClick={() => handleAnswer(false)}
          disabled={!isFlipped || isAnswering}
          style={{
            padding: '16px',
            borderRadius: '14px',
            backgroundColor: isFlipped ? '#fff' : '#f1f5f9',
            border: isFlipped ? '2px solid var(--danger)' : '2px solid #e2e8f0',
            color: isFlipped ? 'var(--danger)' : '#94a3b8',
            fontWeight: 700,
            fontSize: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            cursor: isFlipped ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (isFlipped) e.currentTarget.style.backgroundColor = 'var(--danger-light)';
          }}
          onMouseLeave={(e) => {
            if (isFlipped) e.currentTarget.style.backgroundColor = '#fff';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <X size={20} strokeWidth={3} />
            <span>Chưa Nhớ / Sai</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.8 }}>
            (Phím 1 hoặc ← | Lặp lại ở cuối)
          </span>
        </button>

        {/* Nút 2: Nhớ Đúng / Thuộc */}
        <button
          onClick={() => handleAnswer(true)}
          disabled={!isFlipped || isAnswering}
          style={{
            padding: '16px',
            borderRadius: '14px',
            backgroundColor: isFlipped ? 'var(--success)' : '#f1f5f9',
            color: isFlipped ? '#ffffff' : '#94a3b8',
            border: '2px solid transparent',
            fontWeight: 700,
            fontSize: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            cursor: isFlipped ? 'pointer' : 'not-allowed',
            boxShadow: isFlipped ? '0 4px 14px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (isFlipped) e.currentTarget.style.backgroundColor = '#059669';
          }}
          onMouseLeave={(e) => {
            if (isFlipped) e.currentTarget.style.backgroundColor = 'var(--success)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={20} strokeWidth={3} />
            <span>Nhớ Đúng / Thuộc</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.9 }}>
            (Phím 2 hoặc → | Tích lũy chuỗi đúng)
          </span>
        </button>
      </div>

      {/* Hướng dẫn phím tắt */}
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        💡 Phím tắt nhanh: <strong>[Space]</strong> lật thẻ • <strong>[1]</strong> Chưa nhớ • <strong>[2]</strong> Đã nhớ đúng
      </div>
    </div>
  );
};
