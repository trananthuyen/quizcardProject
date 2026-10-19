/**
 * File định nghĩa các kiểu dữ liệu TypeScript (TypeScript Interfaces & Types)
 * dùng chung cho toàn bộ giao diện Frontend, ánh xạ chính xác với các Model / DTO của Backend.
 */

/**
 * Trạng thái học tập của một thẻ Flashcard:
 * - 0 (NotStarted): Chưa học, thẻ mới tạo.
 * - 1 (Learning): Đang học, đang rèn luyện trí nhớ.
 * - 2 (Mastered): Đã thuộc, đúng 3 lần liên tiếp trở lên.
 */
export const StudyStatus = {
  NotStarted: 0,
  Learning: 1,
  Mastered: 2,
} as const;

export type StudyStatus = (typeof StudyStatus)[keyof typeof StudyStatus];

/**
 * Tiến độ ghi nhớ của một thẻ Flashcard cụ thể.
 */
export interface StudyProgress {
  status: StudyStatus;          // Trạng thái (Chưa học / Đang học / Đã thuộc)
  correctCount: number;         // Tổng số lần trả lời đúng
  incorrectCount: number;       // Tổng số lần trả lời sai
  consecutiveCorrect: number;   // Số lần trả lời đúng liên tiếp (đạt 3 là Mastered)
  nextReviewAt?: string;        // Thời điểm ôn tập tiếp theo (chuỗi ISO datetime)
  lastReviewedAt?: string;      // Thời điểm ôn tập gần nhất
}

/**
 * Đối tượng Bộ thẻ / Dự án (Deck).
 */
export interface Deck {
  id: string;                   // Mã định danh duy nhất (Guid)
  title: string;                // Tên bộ thẻ
  description?: string;         // Mô tả bộ thẻ
  category: string;             // Phân loại / Thể loại bộ thẻ (Lập trình, Tiếng Anh, v.v.)
  createdAt: string;            // Ngày tạo
  totalCards: number;           // Tổng số thẻ có trong bộ
  masteredCards: number;        // Số thẻ đã thuộc
  learningCards: number;        // Số thẻ đang học
  notStartedCards: number;      // Số thẻ chưa học
}

/**
 * Đối tượng Phân loại bộ thẻ (Category).
 */
export interface Category {
  id: string;                   // Mã định danh duy nhất
  name: string;                 // Tên phân loại (ví dụ: Lập trình, Tiếng Anh, Toán học...)
  description?: string;         // Mô tả chi tiết phân loại
  icon: string;                 // Biểu tượng đại diện (emoji)
  color: string;                // Mã màu nhận diện
  deckCount: number;            // Số lượng bộ thẻ thuộc phân loại này
  createdAt: string;            // Ngày tạo
}

/**
 * Đối tượng Thẻ nhớ Flashcard hiển thị trong danh sách quản lý thẻ.
 */
export interface Card {
  id: string;                   // Mã thẻ
  deckId: string;               // Mã bộ thẻ chứa thẻ này
  term: string;                 // Thuật ngữ / Từ vựng / Câu hỏi
  definition: string;           // Định nghĩa / Giải thích / Đáp án
  example?: string;             // Ví dụ minh họa ngữ cảnh
  createdAt: string;            // Ngày tạo
  progress?: StudyProgress;     // Dữ liệu tiến độ học tập kèm theo
}

/**
 * Đối tượng Thẻ nhớ được nạp vào phiên học (Study Mode) hoặc bài trắc nghiệm (Quiz Mode).
 */
export interface StudyCard {
  cardId: string;               // Mã thẻ
  deckId: string;               // Mã bộ thẻ
  term: string;                 // Thuật ngữ
  definition: string;           // Định nghĩa
  example?: string;             // Ví dụ
  status: StudyStatus;          // Trạng thái học hiện tại
  correctCount: number;         // Số lần đúng
  incorrectCount: number;       // Số lần sai
  consecutiveCorrect: number;   // Chuỗi đúng liên tiếp (0 - 3)
  nextReviewAt?: string;        // Thời điểm ôn tập tiếp theo
}

/**
 * Kết quả trả về từ Backend sau khi người dùng trả lời thẻ (bấm Đúng hoặc Sai).
 */
export interface AnswerResponse {
  cardId: string;                   // Mã thẻ vừa trả lời
  status: StudyStatus;              // Trạng thái mới
  correctCount: number;             // Tổng số lần đúng mới
  incorrectCount: number;           // Tổng số lần sai mới
  consecutiveCorrect: number;       // Chuỗi đúng liên tiếp mới
  nextReviewAt?: string;            // Thời điểm ôn tập mới
  isMastered: boolean;              // True nếu thẻ vừa được thăng cấp lên Đã thuộc
  requiresRepeatInSession: boolean; // True nếu trả lời sai và cần lặp lại ở cuối phiên
  feedbackMessage: string;          // Lời nhắn phản hồi tương ứng
}

/**
 * Thống kê tổng hợp số lượng thẻ cho màn hình ôn tập.
 */
export interface DeckStudyStats {
  deckId: string;
  deckTitle: string;
  totalCards: number;
  dueCards: number;
  notStartedCards: number;
  learningCards: number;
  masteredCards: number;
}
