using System.ComponentModel.DataAnnotations.Schema;

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
    /// Thư mục chứa bộ thẻ này (mục đích để người sở hữu dễ quản lý các decks).
    /// Mặc định là "Chung" nếu người dùng không chỉ định.
    /// </summary>
    public string Folder { get; set; } = "Chung";

    /// <summary>
    /// Thẻ nhãn phân loại nội dung bộ thẻ (ví dụ: "english, toeic, ielts", "csharp, backend").
    /// Dùng để phân loại deck là gì và hỗ trợ tìm kiếm/lọc nhanh.
    /// </summary>
    public string? Tag { get; set; }

    /// <summary>
    /// Cho biết bộ thẻ có được chia sẻ công khai lên Community để mọi người cùng nhìn thấy và học tập hay không.
    /// True: Công khai trên Community; False: Riêng tư (chỉ người tạo nhìn thấy).
    /// </summary>
    public bool IsPublic { get; set; } = true;

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
