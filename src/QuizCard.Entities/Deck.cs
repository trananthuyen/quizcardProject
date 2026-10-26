namespace QuizCard.Entities;

/// <summary>
/// Đại diện cho một "Bộ thẻ" hoặc "Dự án học tập" (Deck / Project).
/// Mỗi bộ thẻ sẽ chứa một danh sách các thẻ Flashcard con thuộc cùng một chủ đề (ví dụ: Tiếng Anh, Lập trình C#, v.v.).
/// </summary>
public class Deck
{
    /// <summary>
    /// Khóa chính (Primary Key) định danh duy nhất cho bộ thẻ. Dùng kiểu Guid để tránh trùng lặp.
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// ID tài khoản người dùng tạo và sở hữu bộ thẻ (ApplicationUser.Id).
    /// Null nếu là bộ thẻ mẫu hệ thống hoặc bộ thẻ công cộng.
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Tiêu đề hoặc tên của bộ thẻ (Bắt buộc, tối đa 200 ký tự).
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Mô tả chi tiết về bộ thẻ, mục tiêu học tập hoặc ghi chú (Tùy chọn).
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Phân loại / Thể loại của bộ thẻ (ví dụ: "Lập trình", "Tiếng Anh", "Khoa học", v.v.).
    /// Mặc định là "Chung" nếu người dùng không chỉ định.
    /// </summary>
    public string Category { get; set; } = "Chung";

    /// <summary>
    /// Thời điểm tạo bộ thẻ (tính theo chuẩn UTC để đồng bộ trên mọi múi giờ).
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Thời điểm cập nhật thông tin bộ thẻ lần gần nhất (nếu có chỉnh sửa).
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property: Danh sách các thẻ Flashcard con thuộc về bộ thẻ này.
    /// Khi một Deck bị xóa, toàn bộ Cards bên trong cũng tự động bị xóa theo (Cascade Delete).
    /// </summary>
    public ICollection<Card> Cards { get; set; } = new List<Card>();
}
