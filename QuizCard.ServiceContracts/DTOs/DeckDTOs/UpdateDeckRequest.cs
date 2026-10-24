using System.ComponentModel.DataAnnotations;

namespace QuizCard.ServiceContracts.DTOs.DeckDTOs;

/// <summary>
/// DTO chứa thông tin yêu cầu chỉnh sửa bộ thẻ đã tồn tại.
/// </summary>
/// <param name="Title">Tên mới của bộ thẻ.</param>
/// <param name="Description">Mô tả mới của bộ thẻ.</param>
/// <param name="Category">Phân loại mới của bộ thẻ.</param>
public record UpdateDeckRequest(
    [Required(ErrorMessage = "Tiêu đề bộ thẻ không được để trống")]
    [MaxLength(200, ErrorMessage = "Tiêu đề không được vượt quá 200 ký tự")]
    string Title,
    [MaxLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự")]
    string? Description,
    [MaxLength(100, ErrorMessage = "Phân loại không được vượt quá 100 ký tự")]
    string? Category
);

