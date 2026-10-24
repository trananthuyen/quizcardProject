namespace QuizCard.ServiceContracts.DTOs.CardDTOs;
/// <summary>
/// DTO chứa đầy đủ thông tin của một thẻ Flashcard (kèm tiến độ học nếu có) để hiển thị trên giao diện.
/// </summary>
/// <param name="Id">Mã định danh duy nhất của thẻ.</param>
/// <param name="DeckId">Mã bộ thẻ cha sở hữu thẻ này.</param>
/// <param name="Term">Thuật ngữ / Từ vựng / Câu hỏi (mặt trước).</param>
/// <param name="Definition">Định nghĩa / Giải nghĩa / Đáp án (mặt sau).</param>
/// <param name="Example">Ví dụ minh họa ngữ cảnh áp dụng.</param>
/// <param name="CreatedAt">Thời điểm tạo thẻ.</param>
/// <param name="Progress">Tiến độ ghi nhớ của thẻ.</param>
public record CardDto(
    Guid Id,
    Guid DeckId,
    string Term,
    string Definition,
    string? Example,
    DateTime CreatedAt,
    StudyProgressDto? Progress
);

