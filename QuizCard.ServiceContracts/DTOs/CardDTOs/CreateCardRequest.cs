using System.ComponentModel.DataAnnotations;

namespace QuizCard.ServiceContracts.DTOs.CardDTOs;

/// <summary>
/// DTO chứa dữ liệu yêu cầu thêm mới một thẻ Flashcard vào bộ thẻ.
/// </summary>
/// <param name="Term">Thuật ngữ cần nhớ (Bắt buộc nhập, tối đa 500 ký tự).</param>
/// <param name="Definition">Định nghĩa giải thích (Bắt buộc nhập, tối đa 2000 ký tự).</param>
/// <param name="Example">Ví dụ minh họa (Tùy chọn, tối đa 2000 ký tự).</param>
public record CreateCardRequest(
    [Required(ErrorMessage = "Thuật ngữ không được để trống")]
        [MaxLength(500, ErrorMessage = "Thuật ngữ không được vượt quá 500 ký tự")]
        string Term,

    [Required(ErrorMessage = "Định nghĩa không được để trống")]
        [MaxLength(2000, ErrorMessage = "Định nghĩa không được vượt quá 2000 ký tự")]
        string Definition,

    [MaxLength(2000, ErrorMessage = "Ví dụ không được vượt quá 2000 ký tự")]
        string? Example
);


