namespace QuizCard.ServiceContracts.DTOs.TrashDTOs;

/// <summary>
/// DTO chứa thông tin Bộ thẻ đã bị xóa tạm thời trong Thùng rác (Trash).
/// Kèm tính toán số ngày và số giờ còn lại trước khi tự động bị xóa vĩnh viễn (hạn 5 ngày).
/// </summary>
public record DeletedDeckDto(
    Guid Id,
    Guid? UserId,
    string Title,
    string? Description,
    string Folder,
    string? Tag,
    bool IsPublic,
    DateTime OriginalCreatedAt,
    DateTime DeletedAt,
    int TotalCards,
    int DaysRemaining,
    int HoursRemaining,
    List<DeletedCardDto>? Cards = null
);

