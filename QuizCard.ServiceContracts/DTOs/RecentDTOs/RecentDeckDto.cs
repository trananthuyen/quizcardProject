namespace QuizCard.ServiceContracts.DTOs.RecentDTOs;

/// <summary>
/// DTO trả về thông tin bộ thẻ trong danh sách gần đây (Recents).
/// </summary>
public record RecentDeckDto(
    Guid Id,
    Guid DeckId,
    string Title,
    string? Description,
    string Folder,
    string? Tag,
    bool IsPublic,
    int TotalCards,
    string ActionType,
    DateTime LastAccessedAt,
    Guid? CreatorUserId,
    string? CreatorName = null
);

