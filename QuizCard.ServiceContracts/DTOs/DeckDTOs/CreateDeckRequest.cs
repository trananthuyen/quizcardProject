using System.ComponentModel.DataAnnotations;

namespace QuizCard.ServiceContracts.DTOs.DeckDTOs;

/// <summary>
/// DTO chứa thông tin yêu cầu tạo một bộ thẻ mới từ người dùng.
/// </summary>
/// <param name="Title">Tên bộ thẻ (Bắt buộc nhập, tối đa 200 ký tự).</param>
/// <param name="Description">Mô tả bộ thẻ (Tùy chọn, tối đa 1000 ký tự).</param>
/// <param name="Category">Phân loại bộ thẻ (Tùy chọn, tối đa 100 ký tự, mặc định "Chung").</param>
public record CreateDeckRequest(
    [Required(ErrorMessage = "Tiêu đề bộ thẻ không được để trống")]
        [MaxLength(200, ErrorMessage = "Tiêu đề không được vượt quá 200 ký tự")]
        string Title,

    [MaxLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự")]
        string? Description,

    [MaxLength(100, ErrorMessage = "Phân loại không được vượt quá 100 ký tự")]
        string? Category
);

