using QuizCard.Entities;

namespace QuizCard.ServiceContracts.DTOs.StudyDTOs;

/// <summary>
/// DTO chứa thông tin thẻ được phục vụ trong một phiên học hoặc bài thi trắc nghiệm (Study / Quiz Mode).
/// </summary>
/// <param name="CardId">Mã thẻ.</param>
/// <param name="DeckId">Mã bộ thẻ.</param>
/// <param name="Term">Thuật ngữ câu hỏi.</param>
/// <param name="Definition">Định nghĩa đáp án.</param>
/// <param name="Example">Ví dụ minh họa ngữ cảnh.</param>
/// <param name="Status">Trạng thái học hiện tại của thẻ.</param>
/// <param name="CorrectCount">Số lần đã nhớ đúng.</param>
/// <param name="IncorrectCount">Số lần đã nhớ sai.</param>
/// <param name="ConsecutiveCorrect">Chuỗi đúng liên tiếp hiện tại.</param>
/// <param name="NextReviewAt">Thời điểm ôn tập tiếp theo.</param>
public record StudyCardDto(
    Guid CardId,
    Guid DeckId,
    string Term,
    string Definition,
    string? Example,
    StudyStatus Status,
    int CorrectCount,
    int IncorrectCount,
    int ConsecutiveCorrect,
    DateTime? NextReviewAt
);
