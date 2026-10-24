using QuizCard.Entities;

namespace QuizCard.ServiceContracts.DTOs.StudyDTOs;

/// <summary>
/// DTO trả về kết quả tính toán của thuật toán sau khi người dùng trả lời thẻ.
/// </summary>
/// <param name="CardId">Mã thẻ vừa trả lời.</param>
/// <param name="Status">Trạng thái mới sau khi cập nhật (NotStarted, Learning, hoặc Mastered).</param>
/// <param name="CorrectCount">Tổng số lần đúng mới.</param>
/// <param name="IncorrectCount">Tổng số lần sai mới.</param>
/// <param name="ConsecutiveCorrect">Chuỗi đúng liên tiếp mới.</param>
/// <param name="NextReviewAt">Thời điểm ôn tập mới được dời theo thuật toán lặp lại ngắt quãng.</param>
/// <param name="IsMastered">True nếu thẻ vừa thăng hạng lên "Đã thuộc" (đạt 3/3 lần đúng liên tiếp).</param>
/// <param name="RequiresRepeatInSession">True nếu thẻ bị trả lời sai và cần được đẩy về cuối phiên để học lại.</param>
/// <param name="FeedbackMessage">Câu thông báo động viên/khen thưởng tương ứng.</param>
public record AnswerCardResponse(
    Guid CardId,
    StudyStatus Status,
    int CorrectCount,
    int IncorrectCount,
    int ConsecutiveCorrect,
    DateTime? NextReviewAt,
    bool IsMastered,
    bool RequiresRepeatInSession,
    string FeedbackMessage
);

