using System.ComponentModel.DataAnnotations;
using QuizCard.Services.Models;

namespace QuizCard.Services.DTOs;

/// <summary>
/// DTO chứa thông tin tiến độ học của một thẻ Flashcard trả về cho Frontend.
/// </summary>
/// <param name="Status">Trạng thái: 0 (Chưa học), 1 (Đang học), 2 (Đã thuộc).</param>
/// <param name="CorrectCount">Số lần đã nhớ đúng.</param>
/// <param name="IncorrectCount">Số lần đã nhớ sai.</param>
/// <param name="ConsecutiveCorrect">Số lần nhớ đúng liên tiếp hiện tại (đạt 3/3 là thuộc).</param>
/// <param name="NextReviewAt">Thời điểm cần ôn tập tiếp theo.</param>
/// <param name="LastReviewedAt">Thời điểm ôn tập lần gần nhất.</param>
public record StudyProgressDto(
    StudyStatus Status,
    int CorrectCount,
    int IncorrectCount,
    int ConsecutiveCorrect,
    DateTime? NextReviewAt,
    DateTime? LastReviewedAt
);

/// <summary>
/// DTO chứa đầy đủ thông tin của một thẻ Flashcard (kèm tiến độ học nếu có) để hiển thị trên giao diện.
/// </summary>
/// <param name="Id">Mã định danh duy nhất của thẻ.</param>
/// <param name="DeckId">Mã bộ thẻ cha sở hữu thẻ này.</param>
/// <param name="Term">Thuật ngữ / Từ vựng / Câu hỏi (mặt trước).</param>
/// <param name="Definition">Định nghĩa / Giải nghĩa / Đáp án (mặt sau).</param>
/// <param name="Example">Ví dụ minh họa ngữ cảnh áp dụng.</param>
/// <param name="CreatedAt">Thời điểm tạo thẻ.</param>
/// <param name="Progress">Tiến độ ghi nhớ của thẻ.</param>
public record CardDto(
    Guid Id,
    Guid DeckId,
    string Term,
    string Definition,
    string? Example,
    DateTime CreatedAt,
    StudyProgressDto? Progress
);

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
