namespace QuizCard.Entities;

/// <summary>
/// Đại diện cho một thẻ nhớ Flashcard đơn lẻ.
/// Mỗi thẻ bao gồm 3 thông tin cốt lõi: Thuật ngữ (Mặt trước), Định nghĩa (Mặt sau), và Ví dụ minh họa.
/// </summary>
public class Card
{
    /// <summary>
    /// Khóa chính định danh duy nhất cho từng thẻ Flashcard.
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Khóa ngoại (Foreign Key) liên kết thẻ này với Bộ thẻ (Deck) sở hữu nó.
    /// </summary>
    public Guid DeckId { get; set; }

    /// <summary>
    /// Navigation property: Đối tượng Bộ thẻ cha chứa thẻ này.
    /// </summary>
    public Deck? Deck { get; set; }

    /// <summary>
    /// Thuật ngữ, từ vựng hoặc câu hỏi cần ghi nhớ (Hiển thị ở mặt trước của Flashcard).
    /// </summary>
    public string Term { get; set; } = string.Empty;

    /// <summary>
    /// Định nghĩa, giải nghĩa hoặc đáp án trả lời (Hiển thị ở mặt sau của Flashcard).
    /// </summary>
    public string Definition { get; set; } = string.Empty;

    /// <summary>
    /// Ví dụ ngữ cảnh minh họa cách áp dụng thuật ngữ/từ vựng vào thực tế (Tùy chọn).
    /// </summary>
    public string? Example { get; set; }

    /// <summary>
    /// Thời điểm tạo thẻ nhớ (UTC).
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Thời điểm cập nhật nội dung thẻ gần nhất (nếu có).
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property: Dữ liệu theo dõi tiến trình học tập, trí nhớ và lịch ôn tập của riêng thẻ này.
    /// Quan hệ 1 - 1 với thực thể StudyProgress.
    /// </summary>
    public StudyProgress? StudyProgress { get; set; }
}

