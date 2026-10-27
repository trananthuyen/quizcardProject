namespace QuizCard.ServiceContracts.DTOs.DeckDTOs;

/// <summary>
/// Data Transfer Object (DTO) chứa thông tin đầy đủ của một bộ thẻ kèm thư mục, thẻ tag và số liệu thống kê tiến độ học.
/// Dùng để gửi dữ liệu từ backend trả về cho giao diện người dùng (Frontend).
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
    bool IsPublic = true
);
