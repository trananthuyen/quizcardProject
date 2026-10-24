namespace QuizCard.ServiceContracts.DTOs.DeckDTOs;

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

