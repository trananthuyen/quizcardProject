using QuizCard.Services.Models;

namespace QuizCard.Services.DTOs;

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

/// <summary>
/// DTO gửi từ người dùng khi đánh giá kết quả một thẻ (Đúng hoặc Sai).
/// </summary>
/// <param name="IsCorrect">True nếu nhớ đúng; False nếu chưa nhớ hoặc chọn sai đáp án.</param>
public record AnswerCardRequest(
    bool IsCorrect
);

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

/// <summary>
/// DTO thống kê nhanh về các thẻ trong bộ phục vụ màn hình ôn tập.
/// </summary>
/// <param name="DeckId">Mã bộ thẻ.</param>
/// <param name="DeckTitle">Tên bộ thẻ.</param>
/// <param name="TotalCards">Tổng số thẻ.</param>
/// <param name="DueCards">Số thẻ đã đến hạn cần ôn tập hôm nay.</param>
/// <param name="NotStartedCards">Số thẻ chưa từng học.</param>
/// <param name="LearningCards">Số thẻ đang trong quá trình học.</param>
/// <param name="MasteredCards">Số thẻ đã thuộc bài.</param>
public record DeckStudyStatsDto(
    Guid DeckId,
    string DeckTitle,
    int TotalCards,
    int DueCards,
    int NotStartedCards,
    int LearningCards,
    int MasteredCards
);
