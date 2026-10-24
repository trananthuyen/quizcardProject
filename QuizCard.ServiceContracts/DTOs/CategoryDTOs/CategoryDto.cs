namespace QuizCard.ServiceContracts.DTOs.CategoryDTOs;

/// <summary>
/// Data Transfer Object (DTO) chứa thông tin phân loại bộ thẻ gửi về cho giao diện Frontend.
/// Bao gồm số lượng bộ thẻ đang thuộc phân loại này (DeckCount).
/// </summary>
public record CategoryDto
(
    Guid Id,
    string Name,
    string? Description,
    string Icon,
    string Color,
    int DeckCount,
    DateTime CreatedAt
);
