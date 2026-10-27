namespace QuizCard.ServiceContracts.DTOs.TrashDTOs;

/// <summary>
/// DTO chứa thông tin Thẻ flashcard đã bị xóa tạm thời trong Thùng rác.
/// </summary>
public record DeletedCardDto(
    Guid Id,
    Guid? DeletedDeckId,
    Guid? ActiveDeckId,
    string Term,
    string Definition,
    string? Example,
    DateTime OriginalCreatedAt,
    DateTime DeletedAt,
    int DaysRemaining
);

