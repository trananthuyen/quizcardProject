namespace QuizCard.Entities;

/// <summary>
/// Đại diện cho một "Thư mục" chứa các Bộ thẻ (Deck Folder).
/// Giúp người sở hữu dễ dàng quản lý, gom nhóm và tổ chức các bộ thẻ theo từng thư mục/dự án mong muốn.
/// </summary>
public class Folder
{
    /// <summary>
    /// Khóa chính định danh duy nhất cho thư mục.
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// ID tài khoản người dùng tạo và sở hữu thư mục (ApplicationUser.Id).
    /// Null nếu là thư mục mặc định của hệ thống.
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Tên thư mục (Bắt buộc, ví dụ: "Tiếng Anh", "Lập trình", "Dự án tốt nghiệp", tối đa 100 ký tự).
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Mô tả chi tiết về thư mục này (Tùy chọn).
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Biểu tượng đại diện (Emoji hoặc icon name, ví dụ: 📁, 💻, 🇬🇧, 🔬, 📚).
    /// Mặc định là 📁 nếu không chọn.
    /// </summary>
    public string Icon { get; set; } = "📁";

    /// <summary>
    /// Mã màu đại diện nhận diện thư mục (dạng HEX, ví dụ: #3b82f6, #10b981).
    /// </summary>
    public string Color { get; set; } = "#3b82f6";

    /// <summary>
    /// Thời điểm tạo thư mục.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

