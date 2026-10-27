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
import { api } from '../api';
import confetti from 'canvas-confetti';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy, HelpCircle, Volume2, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { playTts, stopTts } from '../utils/tts';
import './QuizArena.css';
export const QuizArena = ({ deck, onExit, onGoToStudy, onGoToCards, currentUser = null }) => {
    // Danh sách các thẻ flashcard tải về từ backend
    const [cards, setCards] = useState([]);
    // Trạng thái đang tải dữ liệu từ API
    const [loading, setLoading] = useState(true);
    // Chế độ trắc nghiệm người dùng đã chọn
    const [questionMode, setQuestionMode] = useState('TERM_TO_DEF');
    // ==========================================
    // HÀNG ĐỢI VÀ TIẾN ĐỘ CÂU HỎI TRẮC NGHIỆM
    // ==========================================
    // Danh sách các câu hỏi trắc nghiệm trong phiên
    const [questions, setQuestions] = useState([]);
    // Vị trí (chỉ số) câu hỏi hiện tại đang hiển thị (0-indexed)
    const [currentIndex, setCurrentIndex] = useState(0);
    // Lựa chọn mà người dùng đã bấm chọn (chuỗi đáp án)
    const [selectedOption, setSelectedOption] = useState(null);
    // Cờ báo hiệu người dùng đã trả lời câu hỏi hiện tại chưa
    const [isAnswered, setIsAnswered] = useState(false);
    // Phản hồi thuật toán SRS từ backend sau khi gửi đáp án (trạng thái mới, ngày ôn tập tới)
    const [feedback, setFeedback] = useState(null);
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
    const [incorrectList, setIncorrectList] = useState([]);
    /**
     * shuffleArray: Hàm tiện ích xáo trộn mảng ngẫu nhiên (Thuật toán Fisher-Yates)
     * Giúp xáo trộn thứ tự câu hỏi và thứ tự các đáp án A, B, C, D không bị trùng lặp.
     */
    const shuffleArray = (arr) => {
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
    const generateQuestions = useCallback((cardList, mode) => {
        // Nếu có ít hơn 2 thẻ thì không thể tạo phương án nhiễu
        if (cardList.length < 2)
            return [];
        const generated = cardList.map((card) => {
            // Xác định dạng câu hỏi
            let type = 'TERM_TO_DEF';
            if (mode === 'DEF_TO_TERM') {
                type = 'DEF_TO_TERM';
            }
            else if (mode === 'MIXED') {
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
            const cardList = await api.getStudySessionCards(deck.id, false, currentUser?.id);
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
        }
        catch (err) {
            alert(err.message || 'Không thể tải thẻ cho bài trắc nghiệm');
        }
        finally {
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
    const handleSpeak = (text, e) => {
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
    const handleSelectOption = async (option) => {
        if (isAnswered || !currentQ)
            return;
        setSelectedOption(option);
        setIsAnswered(true);
        setTotalAttempts((prev) => prev + 1);
        const isCorrect = option === currentQ.correctAnswer;
        if (isCorrect) {
            // Nếu trả lời đúng ngay lần đầu xuất hiện của thẻ này
            if (!incorrectList.some((item) => item.cardId === currentQ.cardId)) {
                setFirstAttemptCorrect((prev) => prev + 1);
            }
        }
        else {
            // Nếu trả lời sai, thêm vào danh sách sai để ghi nhớ và ôn lại
            if (!incorrectList.some((item) => item.cardId === currentQ.cardId)) {
                setIncorrectList((prev) => [...prev, currentQ]);
            }
        }
        try {
            // Gọi API gửi kết quả trả lời lên máy chủ
            const res = await api.answerCard(currentQ.cardId, isCorrect, currentUser?.id);
            setFeedback(res);
        }
        catch (err) {
            console.error(err);
        }
    };
    /**
     * handleNextQuestion: Chuyển sang câu hỏi tiếp theo
     * 1. Nếu câu hiện tại bị trả lời sai, câu đó sẽ được đưa lại vào cuối hàng đợi câu hỏi để làm lại.
     * 2. Nếu đã hoàn thành hết danh sách, kích hoạt màn hình chúc mừng và bắn pháo hoa confetti.
     */
    const handleNextQuestion = () => {
        if (!currentQ)
            return;
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
        }
        else {
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
        const handleKeyDown = (e) => {
            if (quizFinished || loading || !currentQ)
                return;
            if (!isAnswered) {
                // Ánh xạ phím bấm sang chỉ số đáp án
                const keyMap = {
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
            }
            else {
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
        return (<div className="qa-loading-container">
        <p className="qa-loading-text">Đang chuẩn bị đề thi trắc nghiệm...</p>
      </div>);
    }
    // Trường hợp bộ thẻ có ít hơn 2 thẻ flashcard (không đủ để sinh các phương án trắc nghiệm)
    if (cards.length < 2) {
        return (<div className="qa-empty-card">
        <div className="qa-warning-circle">
          <HelpCircle size={32}/>
        </div>
        <h2 className="qa-empty-title">
          Cần tối thiểu 2 thẻ flashcard
        </h2>
        <p className="qa-empty-desc">
          Bộ thẻ hiện tại có {cards.length} thẻ. Để tạo các phương án lựa chọn trắc nghiệm A, B, C, D, bộ thẻ cần có từ 2 thẻ trở lên.
        </p>
        <button onClick={onGoToCards} className="qa-empty-btn">
          Thêm thẻ vào bộ này
        </button>
      </div>);
    }
    // Giao diện khi đã hoàn thành toàn bộ bài kiểm tra trắc nghiệm
    if (quizFinished) {
        const initialTotal = cards.length;
        // Tỷ lệ phần trăm đúng ngay lần đầu tiên
        const accuracy = initialTotal > 0 ? Math.round((firstAttemptCorrect / initialTotal) * 100) : 100;
        let gradeMessage = 'Xuất sắc! Bạn đã làm chủ kiến thức này! 🎉';
        if (accuracy < 60) {
            gradeMessage = 'Hãy xem lại thẻ flashcard để củng cố thêm nhé! 💪';
        }
        else if (accuracy < 85) {
            gradeMessage = 'Khá tốt! Bạn đã nắm được phần lớn kiến thức! 👏';
        }
        return (<div className="qa-finished-wrapper">
        <div className="qa-finished-card">
          {/* Cúp vinh danh */}
          <div className="qa-trophy-circle">
            <Trophy size={42}/>
          </div>

          <h2 className="qa-finished-title">
            Hoàn Thành Bài Trắc Nghiệm!
          </h2>
          <p className="qa-finished-subtitle">
            {gradeMessage}
          </p>

          {/* Lưới thống kê kết quả */}
          <div className="qa-stats-grid">
            <div className="qa-stat-box">
              <div className="qa-stat-num primary">{accuracy}%</div>
              <div className="qa-stat-label">Độ chính xác</div>
            </div>

            <div className="qa-stat-box">
              <div className="qa-stat-num success">{firstAttemptCorrect}/{initialTotal}</div>
              <div className="qa-stat-label">Đúng lần đầu</div>
            </div>

            <div className="qa-stat-box">
              <div className="qa-stat-num warning">{totalAttempts}</div>
              <div className="qa-stat-label">Lượt trả lời</div>
            </div>
          </div>

          {/* Khối ôn tập các câu từng làm sai */}
          {incorrectList.length > 0 && (<div className="qa-incorrect-card">
              <h4 className="qa-incorrect-title">
                Các câu bạn từng trả lời sai (đã được ôn lại):
              </h4>
              <ul className="qa-incorrect-list">
                {incorrectList.map((item, i) => (<li key={i} className="qa-incorrect-item">
                    <strong>• {item.term}:</strong> <span>{item.definition}</span>
                  </li>))}
              </ul>
            </div>)}

          {/* Các nút hành động sau khi hoàn thành */}
          <div className="qa-finished-actions">
            <button onClick={loadCards} className="qa-btn-restart">
              <RotateCcw size={16}/>
              <span>Thi Lại Bài Này</span>
            </button>

            <button onClick={onGoToStudy} className="qa-btn-study">
              <BookOpen size={16}/>
              <span>Học Lật Thẻ (Flashcard)</span>
            </button>

            <button onClick={onExit} className="qa-btn-exit-finish">
              <ArrowLeft size={16}/>
              <span>Về danh sách bộ thẻ</span>
            </button>
          </div>
        </div>
      </div>);
    }
    // Danh sách các chữ cái định danh phương án A, B, C, D
    const optionLetters = ['A', 'B', 'C', 'D'];
    const progressPercent = Math.min(100, ((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100);
    return (<div className="qa-container">
      {/* Thanh điều hướng và lựa chọn chế độ thi */}
      <div className="qa-top-nav">
        <button onClick={onExit} className="qa-btn-exit">
          <ArrowLeft size={16}/>
          <span>Thoát trắc nghiệm</span>
        </button>

        <div className="qa-title-center">
          <span className="qa-title-deck">
            {deck.title}
          </span>
          <div className="qa-title-sub">
            Luyện tập trắc nghiệm
          </div>
        </div>

        {/* Menu chọn chế độ câu hỏi */}
        <select value={questionMode} onChange={(e) => {
            const newMode = e.target.value;
            setQuestionMode(newMode);
            const newQ = generateQuestions(cards, newMode);
            setQuestions(newQ);
            setCurrentIndex(0);
            setSelectedOption(null);
            setIsAnswered(false);
            setFeedback(null);
        }} disabled={isAnswered} className="qa-mode-select">
          <option value="TERM_TO_DEF">Thuật ngữ → Định nghĩa</option>
          <option value="DEF_TO_TERM">Định nghĩa → Thuật ngữ</option>
          <option value="MIXED">Trộn lẫn ngẫu nhiên</option>
        </select>
      </div>

      {/* Thanh tiến trình hoàn thành bài thi */}
      <div className="qa-progress-info">
        <span className="qa-progress-current">
          Câu hỏi {currentIndex + 1} / {questions.length}
        </span>
        <span className="qa-progress-correct">
          Đúng lần đầu: {firstAttemptCorrect}
        </span>
      </div>

      <div className="qa-progress-track">
        <div className="qa-progress-fill" style={{ width: `${progressPercent}%` }}/>
      </div>

      {/* Khung hiển thị nội dung câu hỏi */}
      {currentQ && (<div className="qa-question-card">
          <div className="qa-prompt-header">
            <span className={`qa-question-tag ${currentQ.questionType === 'TERM_TO_DEF' ? 'term-to-def' : 'def-to-term'}`}>
              {currentQ.questionType === 'TERM_TO_DEF' ? 'Chọn định nghĩa đúng' : 'Chọn thuật ngữ tương ứng'}
            </span>

            {/* Nút phát âm đề bài */}
            <button onClick={() => handleSpeak(currentQ.prompt)} className="qa-btn-speak" title="Phát âm">
              <Volume2 size={18}/>
              <span>Đọc</span>
            </button>
          </div>

          <h3 className="qa-prompt-text">
            {currentQ.prompt}
          </h3>

          {/* Huy hiệu thông báo trạng thái SRS cập nhật từ backend */}
          {feedback && (<div className={`qa-srs-feedback ${selectedOption === currentQ.correctAnswer ? 'correct' : 'incorrect'}`}>
              <Sparkles size={14}/>
              <span>{feedback.feedbackMessage}</span>
            </div>)}
        </div>)}

      {/* Lưới 4 phương án lựa chọn trắc nghiệm (A, B, C, D) */}
      {currentQ && (<div className="qa-options-container">
          {currentQ.options.map((option, idx) => {
                const letter = optionLetters[idx] || `${idx + 1}`;
                const isSelected = selectedOption === option;
                const isCorrect = option === currentQ.correctAnswer;
                let optionClass = 'qa-option-btn';
                let letterClass = 'qa-option-letter';
                if (isAnswered) {
                    if (isCorrect) {
                        optionClass += ' correct';
                        letterClass += ' correct';
                    }
                    else if (isSelected && !isCorrect) {
                        optionClass += ' incorrect';
                        letterClass += ' incorrect';
                    }
                    else {
                        optionClass += ' unselected';
                    }
                }
                if (isSelected) {
                    optionClass += ' selected';
                }
                return (<button key={idx} onClick={() => handleSelectOption(option)} disabled={isAnswered} className={optionClass}>
                <div className="qa-option-inner">
                  {/* Nhãn chữ cái A, B, C, D */}
                  <span className={letterClass}>
                    {letter}
                  </span>

                  {/* Nội dung phương án */}
                  <span className={`qa-option-text ${isSelected || (isAnswered && isCorrect) ? 'selected-or-correct' : ''}`}>
                    {option}
                  </span>
                </div>

                {/* Biểu tượng trạng thái Đúng/Sai sau khi người học đã chọn */}
                {isAnswered && isCorrect && (<CheckCircle2 size={22} color="var(--success)" className="qa-option-status-icon"/>)}
                {isAnswered && isSelected && !isCorrect && (<XCircle size={22} color="var(--danger)" className="qa-option-status-icon"/>)}
              </button>);
            })}
        </div>)}

      {/* Khối giải thích kiến thức và nút "Tiếp tục" sau khi đã trả lời */}
      {isAnswered && currentQ && (<div className="qa-explanation-card">
          <div>
            <div className="qa-explanation-title">
              💡 GHI NHỚ THUẬT NGỮ:
            </div>
            <div className="qa-explanation-text">
              <strong>{currentQ.term}</strong>: {currentQ.definition}
            </div>
            {currentQ.example && (<div className="qa-explanation-example">
                Ví dụ: {currentQ.example}
              </div>)}
          </div>

          <button onClick={handleNextQuestion} className="qa-btn-continue">
            <span>Tiếp tục</span>
            <ChevronRight size={18}/>
          </button>
        </div>)}

      {/* Dòng hướng dẫn phím tắt */}
      <div className="qa-shortcuts-hint">
        💡 Phím tắt nhanh: <strong>[1, 2, 3, 4]</strong> hoặc <strong>[A, B, C, D]</strong> để chọn đáp án • <strong>[Enter]</strong> hoặc <strong>[Space]</strong> sang câu tiếp theo
      </div>
    </div>);
};
