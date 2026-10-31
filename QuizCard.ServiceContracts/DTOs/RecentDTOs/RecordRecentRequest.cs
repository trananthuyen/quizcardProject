namespace QuizCard.ServiceContracts.DTOs.RecentDTOs;

/// <summary>
/// DTO gửi lên để ghi nhận hoặc cập nhật lịch sử xem/học bộ thẻ.
/// </summary>
public record RecordRecentRequest(
    Guid DeckId,
    Guid? UserId = null,
    string? ActionType = "VIEW"
);

