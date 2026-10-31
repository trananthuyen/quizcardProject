namespace QuizCard.ServiceContracts.DTOs.DeckDTOs;

/// <summary>
/// Data Transfer Object (DTO) chứa thông tin đầy đủ của một bộ thẻ kèm thư mục, thẻ tag, số liệu thống kê tiến độ học,
/// và thông tin người sở hữu thực tế (AuthorName, AuthorAvatar) lấy từ cơ sở dữ liệu.
/// </summary>
public record DeckDto(
    Guid Id,
    string Title,
    string? Description,
    string Folder,
    DateTime CreatedAt,
    int TotalCards,
    int MasteredCards,
    int LearningCards,
    int NotStartedCards,
    Guid? UserId = null,
    string? Tag = null,
    bool IsPublic = true,
    string? AuthorName = null,
    string? AuthorAvatar = null
);
