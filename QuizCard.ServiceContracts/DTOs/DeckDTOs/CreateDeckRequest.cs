using System.ComponentModel.DataAnnotations;

namespace QuizCard.ServiceContracts.DTOs.DeckDTOs;

/// <summary>
/// DTO chứa thông tin yêu cầu tạo một bộ thẻ mới từ người dùng.
/// </summary>
public record CreateDeckRequest(
    [Required(ErrorMessage = "Tiêu đề bộ thẻ không được để trống")]
    [MaxLength(200, ErrorMessage = "Tiêu đề không được vượt quá 200 ký tự")]
    string Title,

    [MaxLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự")]
    string? Description = null,

    [MaxLength(100, ErrorMessage = "Tên thư mục không được vượt quá 100 ký tự")]
    string? Folder = null,

    [MaxLength(500, ErrorMessage = "Thẻ tag không được vượt quá 500 ký tự")]
    string? Tag = null,

    Guid? UserId = null,

    bool? IsPublic = true
);
