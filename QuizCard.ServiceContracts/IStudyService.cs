using QuizCard.ServiceContracts.DTOs.StudyDTOs;

namespace QuizCard.ServiceContracts;

/// <summary>
/// Giao diện (Interface) định nghĩa các phương thức phục vụ phiên học thẻ (Study Mode)
/// và thuật toán lặp lại ngắt quãng (Spaced Repetition System) theo từng người dùng (UserId).
/// </summary>
public interface IStudyService
{
    /// <summary>
    /// Lấy thống kê chi tiết của một bộ thẻ: tổng số thẻ, số thẻ đến hạn ôn, số thẻ đã thuộc theo người dùng.
    /// </summary>
    Task<DeckStudyStatsDto?> GetStudyStatsAsync(Guid deckId, Guid? userId = null);

    /// <summary>
    /// Lấy danh sách các thẻ để đưa vào phiên học hoặc bài thi trắc nghiệm theo người dùng.
    /// </summary>
    /// <param name="deckId">Mã bộ thẻ.</param>
    /// <param name="dueOnly">Nếu true thì chỉ lấy thẻ đã đến hạn ôn; nếu false thì lấy toàn bộ thẻ để luyện tập tự do.</param>
    /// <param name="userId">Mã người dùng đang học.</param>
    Task<List<StudyCardDto>> GetSessionCardsAsync(Guid deckId, bool dueOnly = false, Guid? userId = null);

    /// <summary>
    /// Ghi nhận kết quả trả lời của người dùng cho một thẻ (Đúng hoặc Sai),
    /// tính toán chuỗi đúng liên tiếp, cập nhật trạng thái thuộc bài (Mastered)
    /// và dời thời điểm ôn tập tiếp theo (NextReviewAt) riêng cho UserId đó.
    /// </summary>
    Task<AnswerCardResponse?> RecordAnswerAsync(Guid cardId, AnswerCardRequest request, Guid? userId = null);

    /// <summary>
    /// Đặt lại tiến trình học tập của toàn bộ thẻ trong một bộ về trạng thái ban đầu (NotStarted) cho UserId chỉ định.
    /// </summary>
    Task<bool> ResetDeckProgressAsync(Guid deckId, Guid? userId = null);
}
