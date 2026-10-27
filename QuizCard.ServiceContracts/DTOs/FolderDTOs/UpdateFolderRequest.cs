using System.ComponentModel.DataAnnotations;

namespace QuizCard.ServiceContracts.DTOs.FolderDTOs;

/// <summary>
/// DTO chứa thông tin cập nhật Thư mục (Folder).
/// </summary>
public record UpdateFolderRequest(
    [Required(ErrorMessage = "Tên thư mục không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên thư mục không được vượt quá 100 ký tự")]
    string Name,

    [MaxLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
    string? Description = null,

    [MaxLength(50, ErrorMessage = "Biểu tượng không được vượt quá 50 ký tự")]
    string? Icon = null,

    [MaxLength(20, ErrorMessage = "Mã màu không được vượt quá 20 ký tự")]
    string? Color = null
);

