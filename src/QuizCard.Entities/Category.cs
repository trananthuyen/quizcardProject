namespace QuizCard.Entities;

/// <summary>
/// Đại diện cho một "Phân loại / Danh mục" của Bộ thẻ (Deck Category).
/// Ví dụ: "Lập trình", "Tiếng Anh", "Khoa học", "Y khoa", "Lịch sử"...
/// Giúp người học quản lý, gom nhóm và lọc các bộ thẻ theo từng chủ đề mong muốn.
/// </summary>
public class Category
{
    /// <summary>
    /// Khóa chính định danh duy nhất cho phân loại.
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Tên phân loại (Bắt buộc, ví dụ: "Lập trình", "Tiếng Anh", tối đa 100 ký tự).
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Mô tả chi tiết về phân loại này (Tùy chọn).
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Biểu tượng đại diện (Emoji hoặc icon name, ví dụ: 💻, 🇬🇧, 🔬, 📚, 📁).
    /// Mặc định là 📁 nếu không chọn.
    /// </summary>
    public string Icon { get; set; } = "📁";

    /// <summary>
    /// Mã màu đại diện nhận diện phân loại (dạng HEX, ví dụ: #3b82f6, #10b981).
    /// </summary>
    public string Color { get; set; } = "#3b82f6";

    /// <summary>
    /// Thời điểm tạo phân loại.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

