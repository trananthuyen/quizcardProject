using System.ComponentModel.DataAnnotations;

namespace QuizCard.ServiceContracts.DTOs.CardDTOs;

/// <summary>
/// DTO chứa dữ liệu yêu cầu chỉnh sửa nội dung của thẻ Flashcard.
/// </summary>
/// <param name="Term">Thuật ngữ sau khi sửa.</param>
/// <param name="Definition">Định nghĩa sau khi sửa.</param>
/// <param name="Example">Ví dụ minh họa sau khi sửa.</param>
public record UpdateCardRequest(
    [Required(ErrorMessage = "Thuật ngữ không được để trống")]
        [MaxLength(500, ErrorMessage = "Thuật ngữ không được vượt quá 500 ký tự")]
        string Term,

    [Required(ErrorMessage = "Định nghĩa không được để trống")]
        [MaxLength(2000, ErrorMessage = "Định nghĩa không được vượt quá 2000 ký tự")]
        string Definition,

    [MaxLength(2000, ErrorMessage = "Ví dụ không được vượt quá 2000 ký tự")]
         string? Example
);

