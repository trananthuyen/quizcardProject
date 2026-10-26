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
};
