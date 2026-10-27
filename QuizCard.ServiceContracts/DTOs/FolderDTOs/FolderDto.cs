namespace QuizCard.ServiceContracts.DTOs.FolderDTOs;

/// <summary>
/// Data Transfer Object (DTO) chứa thông tin Thư mục (Folder) gửi về cho giao diện Frontend.
/// Bao gồm số lượng bộ thẻ đang trực thuộc thư mục này (DeckCount).
/// </summary>
public record FolderDto
(
    Guid Id,
    string Name,
    string? Description,
    string Icon,
    string Color,
    int DeckCount,
    DateTime CreatedAt,
    Guid? UserId = null
);

