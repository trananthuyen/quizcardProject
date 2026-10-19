/**
 * QuizArena.tsx
 * =============================================================================
 * GIAO DIỆN TRẮC NGHIỆM ĐÁP ÁN (QUIZ MODE)
 * =============================================================================
 * File này đảm nhiệm toàn bộ trải nghiệm ôn tập kiến thức dưới hình thức câu hỏi trắc nghiệm 4 đáp án (A, B, C, D):
 * 1. Tự động sinh câu hỏi từ kho thẻ flashcard trong bộ thẻ (chọn câu trả lời đúng và 3 phương án nhiễu ngẫu nhiên).
 * 2. Hỗ trợ 3 chế độ câu hỏi linh hoạt:
 *    - Thuật ngữ → Chọn định nghĩa đúng
 *    - Định nghĩa → Đoán thuật ngữ tương ứng
 *    - Trộn lẫn ngẫu nhiên (Mixed mode)
 * 3. Hỗ trợ phím tắt bàn phím (1-4, A-D để chọn đáp án, Enter/Space để chuyển câu tiếp theo).
 * 4. Phát âm giọng đọc (Text-To-Speech) cho câu hỏi.
 * 5. Lặp lại câu sai: Các câu trả lời sai sẽ được tự động xếp vào cuối lượt thi để làm lại đến khi nắm vững.
 * 6. Bảng tổng kết kết quả thi với hiệu ứng pháo hoa ăn mừng (Confetti) và danh sách xem lại câu sai.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StudyStatus, type Deck, type StudyCard, type AnswerResponse } from '../types';
import { api } from '../api';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy, 
  HelpCircle, Volume2, Sparkles, BookOpen, ChevronRight
} from 'lucide-react';
import { playTts, stopTts } from '../utils/tts';

/**
 * QuizArenaProps: Các thuộc tính (props) truyền từ component cha (App.tsx)
 */
interface QuizArenaProps {
  /** Thông tin bộ thẻ đang làm trắc nghiệm */
  deck: Deck;
  /** Hàm callback khi người dùng bấm nút quay lại danh sách bộ thẻ */
  onExit: () => void;
  /** Hàm callback chuyển sang chế độ lật thẻ 3D (Study Mode) */
  onGoToStudy: () => void;
  /** Hàm callback chuyển sang màn hình quản lý danh sách thẻ */
  onGoToCards: () => void;
}

/**
 * QuestionMode: Định dạng câu hỏi kiểm tra
 * - 'TERM_TO_DEF': Đề bài là Thuật ngữ, 4 lựa chọn là các Định nghĩa
 * - 'DEF_TO_TERM': Đề bài là Định nghĩa, 4 lựa chọn là các Thuật ngữ
 * - 'MIXED': Trộn ngẫu nhiên cả hai dạng câu hỏi trên
 */
type QuestionMode = 'TERM_TO_DEF' | 'DEF_TO_TERM' | 'MIXED';

/**
 * QuizQuestion: Cấu trúc một câu hỏi trắc nghiệm đã được biên soạn
 */
interface QuizQuestion {
  /** Mã định danh của thẻ flashcard gốc */
  cardId: string;
  /** Nội dung đề bài hiển thị cho người học */
  prompt: string;
  /** Dạng câu hỏi của câu này */
  questionType: 'TERM_TO_DEF' | 'DEF_TO_TERM';
  /** Chuỗi đáp án đúng */
  correctAnswer: string;
  /** Danh sách 4 phương án lựa chọn đã được xáo trộn thứ tự (A, B, C, D) */
  options: string[];
  /** Thuật ngữ gốc của thẻ */
  term: string;
  /** Định nghĩa gốc của thẻ */
  definition: string;
  /** Câu ví dụ minh họa (nếu có) */
  example?: string;
  /** Trạng thái học tập ban đầu của thẻ (New, Learning, Mastered) */
  originalStatus: StudyStatus;
}

export const QuizArena: React.FC<QuizArenaProps> = ({ deck, onExit, onGoToStudy, onGoToCards }) => {
  // Danh sách các thẻ flashcard tải về từ backend
  const [cards, setCards] = useState<StudyCard[]>([]);
  // Trạng thái đang tải dữ liệu từ API
  const [loading, setLoading] = useState(true);
  // Chế độ trắc nghiệm người dùng đã chọn
  const [questionMode, setQuestionMode] = useState<QuestionMode>('TERM_TO_DEF');
  
  // ==========================================
  // HÀNG ĐỢI VÀ TIẾN ĐỘ CÂU HỎI TRẮC NGHIỆM
  // ==========================================
  // Danh sách các câu hỏi trắc nghiệm trong phiên
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  // Vị trí (chỉ số) câu hỏi hiện tại đang hiển thị (0-indexed)
  const [currentIndex, setCurrentIndex] = useState(0);
  // Lựa chọn mà người dùng đã bấm chọn (chuỗi đáp án)
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  // Cờ báo hiệu người dùng đã trả lời câu hỏi hiện tại chưa
  const [isAnswered, setIsAnswered] = useState(false);
  // Phản hồi thuật toán SRS từ backend sau khi gửi đáp án (trạng thái mới, ngày ôn tập tới)
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null);

  // ==========================================
  // BIẾN THỐNG KÊ VÀ KẾT QUẢ PHIÊN THI
  // ==========================================
  // Cờ đánh dấu đã hoàn thành toàn bộ bài kiểm tra trắc nghiệm
  const [quizFinished, setQuizFinished] = useState(false);
  // Số lượng câu người học trả lời đúng ngay trong lần thử đầu tiên
  const [firstAttemptCorrect, setFirstAttemptCorrect] = useState(0);
  // Tổng số lần click chọn đáp án (bao gồm cả các lượt làm lại câu sai)
  const [totalAttempts, setTotalAttempts] = useState(0);
  // Danh sách các câu hỏi mà người dùng đã từng chọn sai (được lưu lại để hiển thị ôn tập cuối bài)
  const [incorrectList, setIncorrectList] = useState<QuizQuestion[]>([]);

  /**
   * shuffleArray: Hàm tiện ích xáo trộn mảng ngẫu nhiên (Thuật toán Fisher-Yates)
   * Giúp xáo trộn thứ tự câu hỏi và thứ tự các đáp án A, B, C, D không bị trùng lặp.
   */
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  /**
   * generateQuestions: Thuật toán tự động sinh câu hỏi trắc nghiệm 4 đáp án từ danh sách thẻ
   * Với mỗi thẻ flashcard:
   * 1. Xác định đáp án đúng dựa vào chế độ câu hỏi (Thuật ngữ -> Định nghĩa hoặc ngược lại).
   * 2. Lấy ngẫu nhiên tối đa 3 phương án nhiễu (distractors) từ các thẻ flashcard khác trong cùng bộ thẻ.
   * 3. Trộn đáp án đúng cùng các phương án nhiễu thành mảng 4 lựa chọn ngẫu nhiên.
   */
  const generateQuestions = useCallback((cardList: StudyCard[], mode: QuestionMode) => {
    // Nếu có ít hơn 2 thẻ thì không thể tạo phương án nhiễu
    if (cardList.length < 2) return [];

    const generated: QuizQuestion[] = cardList.map((card) => {
      // Xác định dạng câu hỏi
      let type: 'TERM_TO_DEF' | 'DEF_TO_TERM' = 'TERM_TO_DEF';
      if (mode === 'DEF_TO_TERM') {
        type = 'DEF_TO_TERM';
      } else if (mode === 'MIXED') {
        type = Math.random() > 0.5 ? 'TERM_TO_DEF' : 'DEF_TO_TERM';
      }

      // Đề bài và đáp án đúng
      const prompt = type === 'TERM_TO_DEF' ? card.term : card.definition;
      const correctAnswer = type === 'TERM_TO_DEF' ? card.definition : card.term;

      // Lấy tối đa 3 phương án sai (nhiễu) từ các thẻ khác
      const otherCards = cardList.filter((c) => c.cardId !== card.cardId);
      const shuffledOthers = shuffleArray(otherCards);
      const distractors = shuffledOthers
        .slice(0, Math.min(3, shuffledOthers.length))
        .map((c) => (type === 'TERM_TO_DEF' ? c.definition : c.term));

      // Trộn đáp án đúng cùng các phương án nhiễu
      const allOptions = shuffleArray([correctAnswer, ...distractors]);

      return {
        cardId: card.cardId,
        prompt,
        questionType: type,
        correctAnswer,
        options: allOptions,
        term: card.term,
        definition: card.definition,
        example: card.example,
        originalStatus: card.status,
      };
    });

    // Trộn ngẫu nhiên thứ tự các câu hỏi trong đề thi
    return shuffleArray(generated);
  }, []);

  /**
   * loadCards: Tải danh sách thẻ flashcard từ backend và khởi tạo đề thi trắc nghiệm
   */
  const loadCards = useCallback(async () => {
    try {
      setLoading(true);
      const cardList = await api.getStudySessionCards(deck.id);
      setCards(cardList);

      if (cardList.length >= 2) {
        const initialQuestions = generateQuestions(cardList, questionMode);
        setQuestions(initialQuestions);
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setFeedback(null);
        setQuizFinished(false);
        setFirstAttemptCorrect(0);
        setTotalAttempts(0);
        setIncorrectList([]);
      }
    } catch (err: any) {
      alert(err.message || 'Không thể tải thẻ cho bài trắc nghiệm');
    } finally {
      setLoading(false);
    }
  }, [deck.id, generateQuestions, questionMode]);

  // Tải danh sách thẻ khi component được render hoặc khi thay đổi bộ thẻ
  useEffect(() => {
    loadCards();
    return () => {
      stopTts();
    };
  }, [loadCards]);

  // Câu hỏi hiện tại đang hiển thị
  const currentQ = questions[currentIndex];

  /**
   * handleSpeak: Phát âm đề bài câu hỏi bằng giọng đọc chuẩn bên thứ 3 (Google Neural TTS)
   */
  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    playTts(text, 'auto');
  };

  /**
   * handleSelectOption: Xử lý khi người dùng bấm chọn một đáp án
   * 1. Khóa không cho chọn tiếp câu này.
   * 2. Kiểm tra xem đáp án có khớp với correctAnswer hay không.
   * 3. Cập nhật thống kê số câu đúng lần đầu và danh sách câu trả lời sai.
   * 4. Gửi kết quả lên backend để cập nhật thuật toán lặp lại ngắt quãng SM-2.
   */
  const handleSelectOption = async (option: string) => {
    if (isAnswered || !currentQ) return;

    setSelectedOption(option);
    setIsAnswered(true);
    setTotalAttempts((prev) => prev + 1);

    const isCorrect = option === currentQ.correctAnswer;

    if (isCorrect) {
      // Nếu trả lời đúng ngay lần đầu xuất hiện của thẻ này
      if (!incorrectList.some((item) => item.cardId === currentQ.cardId)) {
        setFirstAttemptCorrect((prev) => prev + 1);
      }
    } else {
      // Nếu trả lời sai, thêm vào danh sách sai để ghi nhớ và ôn lại
      if (!incorrectList.some((item) => item.cardId === currentQ.cardId)) {
        setIncorrectList((prev) => [...prev, currentQ]);
      }
    }

    try {
      // Gọi API gửi kết quả trả lời lên máy chủ
      const res = await api.answerCard(currentQ.cardId, isCorrect);
      setFeedback(res);
    } catch (err: any) {
      console.error(err);
    }
  };

  /**
   * handleNextQuestion: Chuyển sang câu hỏi tiếp theo
   * 1. Nếu câu hiện tại bị trả lời sai, câu đó sẽ được đưa lại vào cuối hàng đợi câu hỏi để làm lại.
   * 2. Nếu đã hoàn thành hết danh sách, kích hoạt màn hình chúc mừng và bắn pháo hoa confetti.
   */
  const handleNextQuestion = () => {
    if (!currentQ) return;

    const isCorrect = selectedOption === currentQ.correctAnswer;

    // Nếu trả lời sai, thêm lại câu này vào cuối hàng đợi (với đáp án được xáo trộn lại) để làm lại
    if (!isCorrect) {
      setQuestions((prev) => [...prev, { ...currentQ, options: shuffleArray(currentQ.options) }]);
    }

    // Kiểm tra xem đã đi hết danh sách câu hỏi chưa
    if (currentIndex + 1 >= questions.length) {
      // Kết thúc bài kiểm tra
      setQuizFinished(true);
      // Hiệu ứng pháo hoa chúc mừng
      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.6 },
      });
    } else {
      // Chuyển sang câu kế tiếp
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setFeedback(null);
    }
  };

  /**
   * Hook lắng nghe phím tắt bàn phím:
   * - Phím '1', '2', '3', '4' hoặc 'A', 'B', 'C', 'D': Chọn tương ứng đáp án 1, 2, 3, 4.
   * - Phím Enter hoặc Space: Bấm nút "Tiếp tục" để sang câu kế tiếp sau khi đã trả lời.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizFinished || loading || !currentQ) return;

      if (!isAnswered) {
        // Ánh xạ phím bấm sang chỉ số đáp án
        const keyMap: Record<string, number> = {
          '1': 0, 'a': 0, 'A': 0,
          '2': 1, 'b': 1, 'B': 1,
          '3': 2, 'c': 2, 'C': 2,
          '4': 3, 'd': 3, 'D': 3,
        };

        if (e.key in keyMap) {
          const idx = keyMap[e.key];
          if (idx < currentQ.options.length) {
            e.preventDefault();
            handleSelectOption(currentQ.options[idx]);
          }
        }
      } else {
        // Khi đã có đáp án, bấm Enter hoặc Space để sang câu tiếp theo
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, currentQ, quizFinished, loading, selectedOption]);

  // Giao diện khi đang tải dữ liệu
  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '80px auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '16px' }}>Đang chuẩn bị đề thi trắc nghiệm...</p>
      </div>
    );
  }

  // Trường hợp bộ thẻ có ít hơn 2 thẻ flashcard (không đủ để sinh các phương án trắc nghiệm)
  if (cards.length < 2) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '60px auto',
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--warning-light)',
          color: 'var(--warning-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <HelpCircle size={32} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
          Cần tối thiểu 2 thẻ flashcard
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
          Bộ thẻ hiện tại có {cards.length} thẻ. Để tạo các phương án lựa chọn trắc nghiệm A, B, C, D, bộ thẻ cần có từ 2 thẻ trở lên.
        </p>
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
          Thêm thẻ vào bộ này
        </button>
      </div>
    );
  }

  // Giao diện khi đã hoàn thành toàn bộ bài kiểm tra trắc nghiệm
  if (quizFinished) {
    const initialTotal = cards.length;
    // Tỷ lệ phần trăm đúng ngay lần đầu tiên
    const accuracy = initialTotal > 0 ? Math.round((firstAttemptCorrect / initialTotal) * 100) : 100;

    let gradeMessage = 'Xuất sắc! Bạn đã làm chủ kiến thức này! 🎉';
    if (accuracy < 60) {
      gradeMessage = 'Hãy xem lại thẻ flashcard để củng cố thêm nhé! 💪';
    } else if (accuracy < 85) {
      gradeMessage = 'Khá tốt! Bạn đã nắm được phần lớn kiến thức! 👏';
    }

    return (
      <div style={{ maxWidth: '680px', margin: '40px auto', padding: '20px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06)',
        }}>
          {/* Cúp vinh danh */}
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
            Hoàn Thành Bài Trắc Nghiệm!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '28px' }}>
            {gradeMessage}
          </p>

          {/* Lưới thống kê kết quả */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary)' }}>{accuracy}%</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>Độ chính xác</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--success)' }}>{firstAttemptCorrect}/{initialTotal}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>Đúng lần đầu</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--warning-dark)' }}>{totalAttempts}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>Lượt trả lời</div>
            </div>
          </div>

          {/* Khối ôn tập các câu từng làm sai */}
          {incorrectList.length > 0 && (
            <div style={{
              textAlign: 'left',
              backgroundColor: '#fff7ed',
              border: '1px solid #ffedd5',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '32px',
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#9a3412', marginBottom: '8px' }}>
                Các câu bạn từng trả lời sai (đã được ôn lại):
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {incorrectList.map((item, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#7c2d12', display: 'flex', gap: '8px' }}>
                    <strong>• {item.term}:</strong> <span>{item.definition}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Các nút hành động sau khi hoàn thành */}
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
              <span>Thi Lại Bài Này</span>
            </button>

            <button
              onClick={onGoToStudy}
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
              <BookOpen size={16} />
              <span>Học Lật Thẻ (Flashcard)</span>
            </button>

            <button
              onClick={onExit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                padding: '12px 18px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              <ArrowLeft size={16} />
              <span>Về danh sách bộ thẻ</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Danh sách các chữ cái định danh phương án A, B, C, D
  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Thanh điều hướng và lựa chọn chế độ thi */}
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
          <span>Thoát trắc nghiệm</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
            {deck.title}
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Luyện tập trắc nghiệm
          </div>
        </div>

        {/* Menu chọn chế độ câu hỏi */}
        <select
          value={questionMode}
          onChange={(e) => {
            const newMode = e.target.value as QuestionMode;
            setQuestionMode(newMode);
            const newQ = generateQuestions(cards, newMode);
            setQuestions(newQ);
            setCurrentIndex(0);
            setSelectedOption(null);
            setIsAnswered(false);
            setFeedback(null);
          }}
          disabled={isAnswered}
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: '#ffffff',
            color: 'var(--text-main)',
            outline: 'none',
          }}
        >
          <option value="TERM_TO_DEF">Thuật ngữ → Định nghĩa</option>
          <option value="DEF_TO_TERM">Định nghĩa → Thuật ngữ</option>
          <option value="MIXED">Trộn lẫn ngẫu nhiên</option>
        </select>
      </div>

      {/* Thanh tiến trình hoàn thành bài thi */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
        <span style={{ color: 'var(--primary)' }}>
          Câu hỏi {currentIndex + 1} / {questions.length}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          Đúng lần đầu: {firstAttemptCorrect}
        </span>
      </div>

      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: '#e2e8f0',
        borderRadius: '9999px',
        marginBottom: '28px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(100, ((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100)}%`,
          height: '100%',
          backgroundColor: 'var(--primary)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Khung hiển thị nội dung câu hỏi */}
      {currentQ && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          padding: '32px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.04)',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              backgroundColor: currentQ.questionType === 'TERM_TO_DEF' ? 'var(--primary-light)' : '#fef3c7',
              color: currentQ.questionType === 'TERM_TO_DEF' ? 'var(--primary)' : 'var(--warning-dark)',
              padding: '4px 10px',
              borderRadius: '6px',
            }}>
              {currentQ.questionType === 'TERM_TO_DEF' ? 'Chọn định nghĩa đúng' : 'Chọn thuật ngữ tương ứng'}
            </span>

            {/* Nút phát âm đề bài */}
            <button
              onClick={() => handleSpeak(currentQ.prompt)}
              style={{
                color: 'var(--text-muted)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
              }}
              title="Phát âm"
            >
              <Volume2 size={18} />
              <span>Đọc</span>
            </button>
          </div>

          <h3 style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--text-main)',
            lineHeight: 1.4,
            marginBottom: '8px',
          }}>
            {currentQ.prompt}
          </h3>

          {/* Huy hiệu thông báo trạng thái SRS cập nhật từ backend */}
          {feedback && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              marginTop: '6px',
              color: selectedOption === currentQ.correctAnswer ? 'var(--success-dark)' : 'var(--danger-dark)',
            }}>
              <Sparkles size={14} />
              <span>{feedback.feedbackMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Lưới 4 phương án lựa chọn trắc nghiệm (A, B, C, D) */}
      {currentQ && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {currentQ.options.map((option, idx) => {
            const letter = optionLetters[idx] || `${idx + 1}`;
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQ.correctAnswer;

            // Tính toán màu sắc hiển thị dựa trên trạng thái trả lời
            let borderStyle = '1px solid var(--border)';
            let bgStyle = '#ffffff';
            let textColor = 'var(--text-main)';
            let badgeBg = '#f1f5f9';
            let badgeColor = 'var(--text-muted)';

            if (isAnswered) {
              if (isCorrect) {
                // Đáp án đúng: viền xanh lá, nền xanh nhạt
                borderStyle = '2px solid var(--success)';
                bgStyle = 'var(--success-light)';
                textColor = 'var(--success-dark)';
                badgeBg = 'var(--success)';
                badgeColor = '#ffffff';
              } else if (isSelected && !isCorrect) {
                // Đáp án chọn sai: viền đỏ, nền đỏ nhạt
                borderStyle = '2px solid var(--danger)';
                bgStyle = 'var(--danger-light)';
                textColor = 'var(--danger-dark)';
                badgeBg = 'var(--danger)';
                badgeColor = '#ffffff';
              } else {
                // Các phương án khác không được chọn
                bgStyle = '#f8fafc';
                textColor = '#94a3b8';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={isAnswered}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '14px',
                  backgroundColor: bgStyle,
                  border: borderStyle,
                  textAlign: 'left',
                  cursor: isAnswered ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isAnswered) {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAnswered) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  {/* Nhãn chữ cái A, B, C, D */}
                  <span style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}>
                    {letter}
                  </span>

                  {/* Nội dung phương án */}
                  <span style={{
                    fontSize: '15px',
                    fontWeight: isSelected || (isAnswered && isCorrect) ? 700 : 500,
                    color: textColor,
                    lineHeight: 1.5,
                  }}>
                    {option}
                  </span>
                </div>

                {/* Biểu tượng trạng thái Đúng/Sai sau khi người học đã chọn */}
                {isAnswered && isCorrect && (
                  <CheckCircle2 size={22} color="var(--success)" style={{ flexShrink: 0, marginLeft: '12px' }} />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle size={22} color="var(--danger)" style={{ flexShrink: 0, marginLeft: '12px' }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Khối giải thích kiến thức và nút "Tiếp tục" sau khi đã trả lời */}
      {isAnswered && currentQ && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          animation: 'fadeIn 0.2s',
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              💡 GHI NHỚ THUẬT NGỮ:
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 600 }}>
              <strong>{currentQ.term}</strong>: {currentQ.definition}
            </div>
            {currentQ.example && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                Ví dụ: {currentQ.example}
              </div>
            )}
          </div>

          <button
            onClick={handleNextQuestion}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              padding: '12px 22px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px var(--primary-glow)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
          >
            <span>Tiếp tục</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Dòng hướng dẫn phím tắt */}
      <div style={{
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        💡 Phím tắt nhanh: <strong>[1, 2, 3, 4]</strong> hoặc <strong>[A, B, C, D]</strong> để chọn đáp án • <strong>[Enter]</strong> hoặc <strong>[Space]</strong> sang câu tiếp theo
      </div>
    </div>
  );
};
