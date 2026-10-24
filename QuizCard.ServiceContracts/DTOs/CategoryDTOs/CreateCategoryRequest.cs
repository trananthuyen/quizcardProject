using System.ComponentModel.DataAnnotations;


namespace QuizCard.ServiceContracts.DTOs.CategoryDTOs;

/// <summary>
/// DTO chứa yêu cầu tạo một phân loại bộ thẻ mới.
/// </summary>
public record CreateCategoryRequest(
    [Required(ErrorMessage = "Tên phân loại không được để trống")]
        [MaxLength(100, ErrorMessage = "Tên phân loại không được vượt quá 100 ký tự")]
        string Name,

    [MaxLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        string? Description = null,

    [MaxLength(50, ErrorMessage = "Biểu tượng không được vượt quá 50 ký tự")]
        string? Icon = null,

    [MaxLength(20, ErrorMessage = "Mã màu không được vượt quá 20 ký tự")]
        string? Color = null
);

