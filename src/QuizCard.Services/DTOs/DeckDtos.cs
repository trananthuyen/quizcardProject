using System.ComponentModel.DataAnnotations;

namespace QuizCard.Services.DTOs;

/// <summary>
/// Data Transfer Object (DTO) chứa thông tin đầy đủ của một bộ thẻ kèm phân loại và số liệu thống kê tiến độ học.
/// Dùng để gửi dữ liệu từ backend trả về cho giao diện người dùng (Frontend).
/// </summary>
/// <param name="Id">Mã định danh của bộ thẻ.</param>
/// <param name="Title">Tên bộ thẻ.</param>
/// <param name="Description">Mô tả chi tiết.</param>
/// <param name="Category">Phân loại / Thể loại của bộ thẻ (ví dụ: Lập trình, Tiếng Anh, v.v.).</param>
/// <param name="CreatedAt">Thời điểm tạo.</param>
/// <param name="TotalCards">Tổng số lượng thẻ trong bộ.</param>
/// <param name="MasteredCards">Số lượng thẻ đã thuộc (Mastered).</param>
/// <param name="LearningCards">Số lượng thẻ đang học (Learning).</param>
/// <param name="NotStartedCards">Số lượng thẻ chưa học (NotStarted).</param>
public record DeckDto(
    Guid Id,
    string Title,
    string? Description,
    string Category,
    DateTime CreatedAt,
    int TotalCards,
    int MasteredCards,
    int LearningCards,
    int NotStartedCards
);

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
